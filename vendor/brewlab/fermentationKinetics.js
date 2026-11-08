function tempResponse(tempC, yeast) {
    const d = tempC - yeast.tempIdealC;
    const q10 = Math.pow(2, d / 10);
    const cold = tempC < yeast.tempMinC ? Math.exp((tempC - yeast.tempMinC) / 3.5) : 1;
    const hot = tempC > yeast.tempMaxC + 4 ? 0.85 : 1;
    return Math.max(0, q10 * cold * hot);
}
function pitchSize(rate) {
    if (rate === 'under') return 0.45;
    if (rate === 'over') return 1.8;
    return 1;
}
function maltotrioseAbility(yeast) {
    return clamp01((yeast.attenuation - 0.62) / 0.26);
}
function dextrinaseRate(yeast) {
    if (yeast.souring > 0) return 0.006;
    if (yeast.attenuation >= 0.86) return 0.0045;
    return 0;
}
function clamp01(n) {
    return Math.max(0, Math.min(1, n));
}
const FLOC_RATE = {
    low: 0.02,
    medium: 0.06,
    high: 0.14
};
const K = {
    growth: 0.115,
    capacityPerPoint: 0.078,
    uptake: {
        glucose: 0.145,
        maltose: 0.1,
        maltotriose: 0.055
    },
    repressionK: 4.5,
    monodK: 1.6,
    esterPerGrowth: 0.345,
    fuselPerGrowth: 0.5,
    diacetylPerGrowth: 5.5,
    diacetylUptake: 0.035
};
export function simulateFermentation(input) {
    const { ogPoints, spectrum, yeast, pitchRate, steps, coldCrash } = input;
    const extract = spectrum.glucose + spectrum.maltose + spectrum.maltotriose + spectrum.dextrins;
    const scale = extract > 0 ? ogPoints / extract : 0;
    let g1 = spectrum.glucose * scale;
    let g2 = spectrum.maltose * scale;
    const g3Total = spectrum.maltotriose * scale;
    const g3Usable = g3Total * maltotrioseAbility(yeast);
    let g3 = g3Usable;
    let dextrins = spectrum.dextrins * scale + (g3Total - g3Usable);
    const dex = dextrinaseRate(yeast);
    let x = pitchSize(pitchRate);
    const pitched = x;
    const capacity = Math.max(x, ogPoints * K.capacityPerPoint);
    let budget = Math.max(0, capacity - pitched);
    let abv = 0;
    let esters = 0;
    let fusels = 0;
    let diacetyl = 0;
    let peak = x;
    let totalGrowth = 0;
    const curve = [];
    let hour = 0;
    let day = 0;
    const record = (tempC)=>{
        curve.push({
            day,
            tempC,
            points: g1 + g2 + g3 + dextrins,
            suspended: x,
            abv,
            diacetyl
        });
    };
    record(steps[0]?.tempC ?? yeast.tempIdealC);
    for (const step of steps){
        const tempC = step.tempC;
        const days = Math.max(0, Math.round(step.days));
        const rate = tempResponse(tempC, yeast) * (step.rateFactor ?? 1);
        const flocBase = FLOC_RATE[yeast.flocculation];
        for(let d = 0; d < days; d++){
            for(let h = 0; h < 24; h++){
                const sugar = g1 + g2 + g3;
                const inhibition = clamp01(1 - Math.pow(abv / 100 / yeast.alcoholTolerance, 3));
                const growth = Math.min(budget, K.growth * rate * x * clamp01(budget / capacity) * clamp01(sugar / 6) * inhibition);
                budget -= growth;
                x += growth;
                totalGrowth += growth;
                peak = Math.max(peak, x);
                const gravityStress = 1 + Math.max(0, ogPoints - 50) / 90;
                const warmth = Math.pow(2, (tempC - yeast.tempIdealC) / 9);
                esters += growth * K.esterPerGrowth * yeast.esterBase * Math.pow(warmth, yeast.tempSensitivity) * gravityStress;
                fusels += growth * K.fuselPerGrowth * Math.pow(warmth, 1.4 + yeast.tempSensitivity * 0.5) * gravityStress;
                diacetyl += growth * K.diacetylPerGrowth;
                const repress = K.repressionK / (K.repressionK + g1);
                const take = (amount, k, gate)=>Math.min(amount, k * x * rate * inhibition * gate * (amount / (K.monodK + amount)));
                const d1 = take(g1, K.uptake.glucose, 1);
                const d2 = take(g2, K.uptake.maltose, repress);
                const d3 = take(g3, K.uptake.maltotriose, repress * (K.repressionK / (K.repressionK + g2)) * maltotrioseAbility(yeast));
                const dDex = dex > 0 ? Math.min(dextrins, dex * x * rate * inhibition) : 0;
                dextrins -= dDex;
                g1 -= d1;
                g2 -= d2;
                g3 -= d3;
                abv += (d1 + d2 + d3 + dDex) * 0.001 * 131.25;
                diacetyl = Math.max(0, diacetyl - K.diacetylUptake * x * rate);
                const settling = flocBase * (1 + clamp01(1 - sugar / 8) * 2.2) * (rate < 0.4 ? 1.6 : 1);
                x = Math.max(0.02, x - x * settling * 0.04);
                hour++;
            }
            day++;
            record(tempC);
        }
    }
    if (coldCrash) {
        x = 0.02;
        record(steps.at(-1)?.tempC ?? yeast.tempIdealC);
    }
    const left = g1 + g2 + g3;
    const apparent = ogPoints > 0 ? clamp01(1 - (left + dextrins) / ogPoints) : 0;
    const stalled = whyStalled({
        left,
        yeast,
        x,
        abv,
        hours: hour,
        lastTempC: steps.at(-1)?.tempC ?? yeast.tempIdealC
    });
    return {
        apparent,
        abv,
        remaining: {
            glucose: g1,
            maltose: g2,
            maltotriose: g3,
            dextrins
        },
        esters: Math.min(10, esters),
        fusels: Math.min(10, fusels),
        diacetyl: Math.min(10, diacetyl),
        peakSuspended: peak,
        growthFactor: pitched > 0 ? totalGrowth / pitched : 0,
        stalled,
        curve
    };
}
function whyStalled(args) {
    const { left, yeast, x, abv, hours, lastTempC } = args;
    if (left < 2.5) return false;
    if (abv / 100 > yeast.alcoholTolerance * 0.95) return 'alcohol';
    if (lastTempC < yeast.tempMinC - 1) return 'cold';
    if (x < 0.12 && yeast.flocculation === 'high') return 'flocculated';
    if (hours < 24 * 5) return 'time';
    return 'flocculated';
}
