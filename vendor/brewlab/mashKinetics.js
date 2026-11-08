function activity(tempC, optimum, spread) {
    const d = tempC - optimum;
    const scaled = d < 0 ? d / spread : d / spread * 1.6;
    return Math.exp(-0.5 * scaled * scaled);
}
function decayPerMin(tempC, halfLifeAt65, steepness, shield) {
    const halfLife = halfLifeAt65 * Math.pow(2, -(tempC - 65) / steepness) * shield;
    return Math.LN2 / Math.max(0.05, halfLife);
}
const K = {
    alphaOnStarch: 0.115,
    alphaOnDextrin: 0.085,
    betaOnStarch: 0.02,
    betaOnDextrin: 0.09,
    alphaYield: {
        glucose: 0.08,
        maltose: 0.24,
        maltotriose: 0.14
    },
    limitDextrinFloor: 0.125
};
const BETA = {
    optimum: 63,
    spread: 11,
    halfLifeAt65: 40,
    steepness: 1.67
};
const ALPHA = {
    optimum: 71.5,
    spread: 9.5,
    halfLifeAt65: 120,
    steepness: 6.5
};
const GELATINISATION_C = 58;
const DEAD_C = 82;
const EMPTY = {
    starch: 1,
    dextrins: 0,
    maltotriose: 0,
    maltose: 0,
    glucose: 0
};
export function simulateMash(input) {
    const { steps, thicknessLPerKg, mashPh, diastaticPowerLintner } = input;
    const load = Math.sqrt(Math.max(0, diastaticPowerLintner) / 60);
    const phFactor = Math.exp(-0.5 * Math.pow((mashPh - 5.4) / 0.42, 2));
    const shield = 1 + (3 - Math.min(5, Math.max(1.5, thicknessLPerKg))) * 0.11;
    let s = {
        ...EMPTY
    };
    let alpha = 1;
    let beta = 1;
    const curve = [
        {
            minute: 0,
            tempC: steps[0]?.tempC ?? 0,
            spectrum: s
        }
    ];
    const SUBSTEPS = 6;
    const dt = 1 / SUBSTEPS;
    let minute = 0;
    for (const step of steps){
        const tempC = step.tempC;
        const minutes = Math.max(0, Math.round(step.minutes));
        const gelatinised = tempC >= GELATINISATION_C && tempC <= DEAD_C;
        const aAct = gelatinised ? activity(tempC, ALPHA.optimum, ALPHA.spread) : 0;
        const bAct = gelatinised ? activity(tempC, BETA.optimum, BETA.spread) : 0;
        const aDecay = decayPerMin(tempC, ALPHA.halfLifeAt65, ALPHA.steepness, shield);
        const bDecay = decayPerMin(tempC, BETA.halfLifeAt65, BETA.steepness, shield);
        for(let m = 0; m < minutes; m++){
            for(let k = 0; k < SUBSTEPS; k++){
                const a = alpha * aAct * load * phFactor;
                const b = beta * bAct * load * phFactor;
                const aS = K.alphaOnStarch * a * s.starch;
                const aD = K.alphaOnDextrin * a * Math.max(0, s.dextrins - K.limitDextrinFloor);
                const bS = K.betaOnStarch * b * s.starch;
                const bD = K.betaOnDextrin * b * Math.max(0, s.dextrins - K.limitDextrinFloor);
                const fromStarch = Math.min(s.starch, (aS + bS) * dt);
                const aShare = aS + bS > 0 ? aS / (aS + bS) : 0;
                const aFromStarch = fromStarch * aShare;
                const bFromStarch = fromStarch * (1 - aShare);
                const dextrinEaten = Math.min(Math.max(0, s.dextrins - K.limitDextrinFloor), (aD + bD) * dt);
                const aFromDextrin = aD + bD > 0 ? dextrinEaten * (aD / (aD + bD)) : 0;
                const bFromDextrin = dextrinEaten - aFromDextrin;
                const y = K.alphaYield;
                const alphaSmall = aFromDextrin * (y.glucose + y.maltose + y.maltotriose);
                s = {
                    starch: s.starch - fromStarch,
                    dextrins: s.dextrins + aFromStarch - dextrinEaten + (aFromDextrin - alphaSmall),
                    glucose: s.glucose + aFromDextrin * y.glucose,
                    maltose: s.maltose + bFromStarch + bFromDextrin + aFromDextrin * y.maltose,
                    maltotriose: s.maltotriose + aFromDextrin * y.maltotriose
                };
                alpha *= Math.exp(-aDecay * dt);
                beta *= Math.exp(-bDecay * dt);
            }
            minute++;
            curve.push({
                minute,
                tempC,
                spectrum: s
            });
        }
    }
    const converted = 1 - s.starch;
    const sugars = s.glucose + s.maltose + s.maltotriose;
    const extract = sugars + s.dextrins;
    return {
        spectrum: s,
        conversion: converted,
        attenuationLimit: extract > 0 ? sugars / extract : 0,
        enzymesLeft: {
            alpha,
            beta
        },
        curve
    };
}
