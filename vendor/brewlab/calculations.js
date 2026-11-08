import { simulateMash } from './mashKinetics.js';
import { simulateFermentation } from './fermentationKinetics.js';
import { getFermentable, getHop } from './ingredients.js';
export const POINTS_PER_KG_PER_L = 386;
const MCU_METRIC = 8.3454;
export const sgToPoints = (sg)=>(sg - 1) * 1000;
export const pointsToSg = (points)=>1 + points / 1000;
export const ebcToSrm = (ebc)=>ebc / 1.97;
export const srmToEbc = (srm)=>srm * 1.97;
export const srmToLovibond = (srm)=>(srm + 0.76) / 1.3546;
export const ebcToLovibond = (ebc)=>srmToLovibond(ebcToSrm(ebc));
export function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(max, Math.max(min, value));
}
export function saturate(value, halfPoint, ceiling = 10) {
    if (value <= 0) return 0;
    return ceiling * value / (value + halfPoint);
}
export function computeGrist(recipe, efficiency, volumeL) {
    const volume = Math.max(0.5, volumeL);
    const entries = [];
    let totalKg = 0;
    let grainKg = 0;
    let sugarKg = 0;
    let diastaticKg = 0;
    let specialityKg = 0;
    let roastKg = 0;
    let mcuSum = 0;
    let pointsSum = 0;
    let fermentableWeightedPoints = 0;
    for (const addition of recipe.fermentables){
        const f = getFermentable(addition.fermentableId);
        if (!f) continue;
        const kg = Math.max(0, addition.weightKg);
        if (kg <= 0) continue;
        const isSugar = f.category === 'sugar';
        const eff = isSugar ? 1 : efficiency;
        const points = f.potential * kg * POINTS_PER_KG_PER_L * eff / volume;
        totalKg += kg;
        if (isSugar) sugarKg += kg;
        else grainKg += kg;
        if (f.diastatic) diastaticKg += kg;
        if (f.category === 'speciality') specialityKg += kg;
        if (f.category === 'roast') roastKg += kg;
        mcuSum += ebcToLovibond(f.colourEbc) * kg;
        pointsSum += points;
        fermentableWeightedPoints += points * f.fermentability;
        entries.push({
            fermentableId: f.id,
            name: f.name,
            weightKg: kg,
            share: 0,
            points,
            extractShare: 0
        });
    }
    for (const entry of entries){
        entry.share = totalKg > 0 ? entry.weightKg / totalKg : 0;
        entry.extractShare = pointsSum > 0 ? entry.points / pointsSum : 0;
    }
    return {
        entries,
        totalKg,
        grainKg,
        sugarKg,
        diastaticShare: totalKg > 0 ? diastaticKg / totalKg : 0,
        specialityShare: totalKg > 0 ? specialityKg / totalKg : 0,
        roastShare: totalKg > 0 ? roastKg / totalKg : 0,
        sugarShare: totalKg > 0 ? sugarKg / totalKg : 0,
        fermentability: pointsSum > 0 ? fermentableWeightedPoints / pointsSum : 1,
        colourMcu: mcuSum * MCU_METRIC / volume
    };
}
export function moreySrm(mcu) {
    if (mcu <= 0) return 0;
    return 1.4922 * Math.pow(mcu, 0.6859);
}
function betaActivity(tempC) {
    if (tempC < 55 || tempC > 72) return 0;
    return clamp(1 - Math.abs(tempC - 63) / 9, 0, 1);
}
function alphaActivity(tempC) {
    if (tempC < 60 || tempC > 78) return 0;
    return clamp(1 - Math.abs(tempC - 70) / 10, 0, 1);
}
export function computeMashProfile(mash, inputs = {}) {
    const landed = mash.landedTempC;
    let replaced = false;
    const steps = mash.steps.filter((s)=>s.minutes > 0).map((s)=>{
        if (landed !== undefined && !replaced && s.tempC >= 58 && s.tempC <= 74) {
            replaced = true;
            return {
                ...s,
                tempC: landed
            };
        }
        return s;
    });
    const conversionSteps = steps.filter((s)=>s.tempC >= 58 && s.tempC <= 74);
    const conversionMinutes = conversionSteps.reduce((sum, s)=>sum + s.minutes, 0);
    const weightedTemp = conversionMinutes > 0 ? conversionSteps.reduce((sum, s)=>sum + s.tempC * s.minutes, 0) / conversionMinutes : 66;
    const hasProteinRest = steps.some((s)=>s.tempC >= 46 && s.tempC <= 57 && s.minutes >= 10);
    const hasBetaRest = steps.some((s)=>s.tempC >= 58 && s.tempC <= 66 && s.minutes >= 20 && betaActivity(s.tempC) > 0.4);
    const hasAlphaRest = steps.some((s)=>s.tempC >= 67 && s.tempC <= 74 && s.minutes >= 15 && alphaActivity(s.tempC) > 0.4);
    const hasMashOut = steps.some((s)=>s.tempC >= 75);
    const notes = [];
    const kinetics = simulateMash({
        steps,
        thicknessLPerKg: mash.thicknessLPerKg,
        mashPh: inputs.mashPh ?? 5.4,
        diastaticPowerLintner: inputs.diastaticPowerLintner ?? 60
    });
    const fermentabilityFactor = clamp(kinetics.attenuationLimit / 0.8, 0.7, 1.2);
    let efficiencyFactor = clamp(0.35 + kinetics.conversion * 0.65, 0.35, 1);
    if (kinetics.conversion < 0.97 && conversionMinutes > 0) {
        notes.push(`Conversion reached ${Math.round(kinetics.conversion * 100)}%, so some starch never became sugar.`);
    }
    if (conversionMinutes === 0) {
        notes.push('No step sits in the conversion range, so almost nothing converts.');
    }
    if (hasBetaRest && hasAlphaRest) {
        notes.push('Beta-amylase clips maltose off chain ends and alpha-amylase makes more of those ends by cutting chains in the middle. A rest for each works the two in turn.');
    }
    const thickness = clamp(mash.thicknessLPerKg, 1.2, 6);
    if (thickness < 2.2) {
        efficiencyFactor *= 0.96;
        notes.push('A very thick mash protects the enzymes from the heat but is harder to stir and to rinse.');
    }
    let bodyFactor = clamp(1 + (weightedTemp - 66) * 0.035, 0.8, 1.25);
    let foamFactor = 1;
    if (hasProteinRest) {
        bodyFactor *= 0.94;
        foamFactor *= 0.88;
        notes.push('A protein rest breaks down the proteins that build body and foam. Modern malt rarely needs one.');
    }
    if (hasMashOut) {
        efficiencyFactor *= 1.02;
        notes.push('The short hot rest at the end stops the enzymes, so what the bar shows is what goes to the kettle.');
    }
    return {
        effectiveTempC: Math.round(weightedTemp * 10) / 10,
        kinetics,
        conversionMinutes,
        hasProteinRest,
        hasBetaRest,
        hasAlphaRest,
        hasMashOut,
        fermentabilityFactor,
        bodyFactor,
        efficiencyFactor,
        foamFactor,
        notes
    };
}
export function computeGravity(recipe, mashProfile) {
    const batch = Math.max(0.5, recipe.batchVolumeL);
    const preBoil = Math.max(batch, recipe.preBoilVolumeL);
    const notes = [];
    const base = clamp(recipe.efficiencyPct / 100, 0.3, 0.95);
    let efficiency = base * mashProfile.efficiencyFactor;
    const provisional = computeGrist(recipe, efficiency, batch);
    const provisionalPoints = provisional.entries.reduce((sum, e)=>sum + e.points, 0);
    if (provisionalPoints > 65) {
        const excess = (provisionalPoints - 65) / 100;
        efficiency *= clamp(1 - excess * 0.55, 0.72, 1);
        notes.push('Big grain bills rinse less completely, so efficiency drops as gravity climbs.');
    }
    if (provisional.diastaticShare < 0.5 && provisional.sugarShare < 0.9) {
        const shortfall = (0.5 - provisional.diastaticShare) / 0.5;
        efficiency *= clamp(1 - shortfall * 0.35, 0.6, 1);
        notes.push('There is not much enzyme-carrying malt in this grist, so conversion is incomplete.');
    }
    const grist = computeGrist(recipe, efficiency, batch);
    const points = grist.entries.reduce((sum, e)=>sum + e.points, 0);
    const og = pointsToSg(points);
    const preBoilPoints = points * batch / preBoil;
    return {
        og,
        preBoilGravity: pointsToSg(preBoilPoints),
        boilGravity: pointsToSg((points + preBoilPoints) / 2),
        effectiveEfficiency: efficiency,
        grist,
        efficiencyNotes: notes
    };
}
export function tinsethBigness(boilGravity) {
    return 1.65 * Math.pow(0.000125, boilGravity - 1);
}
export function tinsethTimeFactor(minutes) {
    return (1 - Math.exp(-0.04 * Math.max(0, minutes))) / 4.15;
}
export function whirlpoolUtilisation(boilGravity, tempC, minutes) {
    const tempTerm = Math.pow(clamp((tempC - 60) / 40, 0, 1), 1.7);
    if (tempTerm <= 0) return 0;
    const effectiveMinutes = Math.min(minutes, 45);
    return tinsethBigness(boilGravity) * tinsethTimeFactor(effectiveMinutes) * tempTerm * 0.55;
}
export function computeIbu(recipe, boilGravity) {
    const volume = Math.max(0.5, recipe.batchVolumeL);
    const bigness = tinsethBigness(boilGravity);
    const contributions = [];
    let total = 0;
    for (const addition of recipe.hops){
        const hop = getHop(addition.hopId);
        if (!hop || addition.grams <= 0) continue;
        let utilisation;
        if (addition.use === 'boil') {
            const minutes = clamp(addition.time, 0, recipe.boilTimeMin);
            utilisation = bigness * tinsethTimeFactor(minutes);
        } else if (addition.use === 'whirlpool') {
            utilisation = whirlpoolUtilisation(boilGravity, addition.tempC ?? 80, addition.time);
        } else {
            utilisation = 0;
        }
        const ibu = addition.grams * 1000 * (hop.alphaAcid / 100) * utilisation / volume;
        if (ibu > 0) {
            total += ibu;
            contributions.push({
                additionId: addition.id,
                hopId: hop.id,
                hopName: hop.name,
                use: addition.use,
                ibu,
                utilisation
            });
        }
    }
    contributions.sort((a, b)=>b.ibu - a.ibu);
    return {
        total,
        contributions
    };
}
export function pitchRateFactor(rate) {
    if (rate === 'under') return 0.94;
    if (rate === 'over') return 1.02;
    return 1;
}
export function fermentationHealthFactor(yeast, avgTempC) {
    if (avgTempC < yeast.tempMinC) {
        const below = yeast.tempMinC - avgTempC;
        return clamp(1 - below * 0.035, 0.62, 1);
    }
    if (avgTempC > yeast.tempMaxC) {
        const above = avgTempC - yeast.tempMaxC;
        return clamp(1 + above * 0.004, 1, 1.03);
    }
    return 1;
}
export function computeAttenuation(og, yeast, grist, mash, pitchRate, steps, coldCrash) {
    const ogPoints = Math.max(0, sgToPoints(og));
    const gristFactor = clamp(grist.fermentability, 0.5, 1.25);
    const spectrum = bendSpectrum(mash.kinetics.spectrum, gristFactor);
    const kinetics = simulateFermentation({
        ogPoints,
        spectrum,
        yeast,
        pitchRate,
        steps,
        coldCrash
    });
    const apparent = clamp(kinetics.apparent, 0.15, 0.96);
    const fgPoints = ogPoints * (1 - apparent);
    const fg = pointsToSg(fgPoints);
    const abv = clamp((og - fg) * 131.25, 0, 30);
    const factors = [
        {
            label: `Mash at ${mash.effectiveTempC} °C`,
            factor: round3(mash.kinetics.attenuationLimit / 0.83)
        },
        {
            label: 'Grist composition',
            factor: round3(gristFactor)
        }
    ];
    if (pitchRate !== 'standard') {
        factors.push({
            label: 'Pitch rate',
            factor: round3(1 - (kinetics.growthFactor - 2.9) * 0.012)
        });
    }
    if (kinetics.stalled) {
        factors.push({
            label: STALL_LABEL[kinetics.stalled],
            factor: round3(apparent / 0.8)
        });
    }
    return {
        apparent,
        kinetics,
        fg,
        abv,
        factors,
        stalled: kinetics.stalled !== false
    };
}
const STALL_LABEL = {
    cold: 'Stopped by the cold',
    flocculated: 'Yeast dropped out early',
    alcohol: 'Alcohol tolerance reached',
    time: 'Fermentation cut short'
};
function round3(n) {
    return Math.round(n * 1000) / 1000;
}
function bendSpectrum(spectrum, gristFactor) {
    if (gristFactor >= 1) return spectrum;
    const shift = 1 - gristFactor;
    const moved = {
        glucose: spectrum.glucose * shift,
        maltose: spectrum.maltose * shift,
        maltotriose: spectrum.maltotriose * shift
    };
    return {
        starch: spectrum.starch,
        glucose: spectrum.glucose - moved.glucose,
        maltose: spectrum.maltose - moved.maltose,
        maltotriose: spectrum.maltotriose - moved.maltotriose,
        dextrins: spectrum.dextrins + moved.glucose + moved.maltose + moved.maltotriose
    };
}
export function kcalPer330(og, fg) {
    const abw = (og - fg) * 131.25 * 0.795 / 100;
    const realExtract = 0.1808 * sgToPoints(og) * 0.1 + 0.8192 * sgToPoints(fg) * 0.1;
    const calories = (6.9 * abw * 100 + 4 * (realExtract - 0.1)) * fg * 3.3;
    return Math.max(0, Math.round(calories));
}
export function averageFermentationTemp(steps) {
    const totalDays = steps.reduce((sum, s)=>sum + Math.max(0, s.days), 0);
    if (totalDays <= 0) return 20;
    return steps.reduce((sum, s)=>sum + s.tempC * Math.max(0, s.days), 0) / totalDays;
}
export function strikeTempC(targetTempC, thicknessLPerKg, grainTempC = 20) {
    const ratio = Math.max(0.5, thicknessLPerKg);
    return targetTempC + 0.41 / ratio * (targetTempC - grainTempC);
}
