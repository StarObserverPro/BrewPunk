import { getFermentable, getHop } from './ingredients.js';
import { clamp } from './calculations.js';
export const FAULT_THRESHOLD = {
    dms: 3.5,
    astringency: 4,
    fusel: 3.5,
    diacetyl: 3.5,
    oxidation: 5,
    infection: 5,
    grassy: 4,
    chlorophenol: 3.5
};
export function computeFindings(ctx) {
    const findings = [];
    const { recipe, yeast, gravity, mash, water, ibu, attenuation, hopLoad, sensory, risks } = ctx;
    const add = (f)=>findings.push(f);
    const mashTemp = mash.effectiveTempC;
    if (mash.conversionMinutes === 0) {
        add({
            code: 'MASH_NO_CONVERSION',
            severity: 'severe',
            title: 'No mash step converts starch',
            explanation: 'None of your mash steps sit between about 60 and 74 °C, where the amylase enzymes work. Without a rest in that window the starch never becomes fermentable sugar.',
            impact: {
                technical: -35,
                coherence: -12
            },
            fields: [
                'mash.steps'
            ]
        });
    } else if (mashTemp > 70.5) {
        add({
            code: 'MASH_TOO_HOT',
            severity: mashTemp > 73 ? 'warning' : 'caution',
            title: `Mash is hot at ${mashTemp} °C`,
            explanation: 'Beta-amylase, the enzyme that makes simple fermentable sugar, denatures quickly above about 70 °C. Alpha-amylase keeps working, but it produces longer dextrins the yeast cannot use. Expect a full-bodied, sweeter beer with a higher finishing gravity than you might want.',
            impact: {
                technical: mashTemp > 73 ? -8 : -3
            },
            fields: [
                'mash.steps'
            ]
        });
    } else if (mashTemp < 62 && mash.conversionMinutes > 0) {
        add({
            code: 'MASH_TOO_COOL',
            severity: mashTemp < 60 ? 'warning' : 'caution',
            title: `Mash is cool at ${mashTemp} °C`,
            explanation: 'A cool mash favours beta-amylase, so the wort ends up very fermentable and the beer finishes thin and dry. Below 61 °C conversion also takes considerably longer than an hour.',
            impact: {
                technical: mashTemp < 60 ? -6 : -2
            },
            fields: [
                'mash.steps'
            ]
        });
    }
    if (mash.conversionMinutes > 0 && mash.conversionMinutes < 40) {
        add({
            code: 'MASH_SHORT',
            severity: 'warning',
            title: `Only ${mash.conversionMinutes} minutes of conversion`,
            explanation: 'Most mashes need 45 to 60 minutes to convert fully, and longer when the mash is cool or thick. Stopping early leaves unconverted starch, which costs efficiency and can leave a starchy haze.',
            impact: {
                technical: -7
            },
            fields: [
                'mash.steps'
            ]
        });
    }
    if (gravity.grist.diastaticShare < 0.5 && gravity.grist.sugarShare < 0.85 && gravity.grist.totalKg > 0) {
        add({
            code: 'LOW_DIASTATIC_POWER',
            severity: 'warning',
            title: 'Not enough enzyme-carrying malt',
            explanation: `Only ${Math.round(gravity.grist.diastaticShare * 100)}% of this grist can convert starch. Crystal, roasted and flaked ingredients bring starch or sugar but no enzymes, so they rely on the base malt to do the work for them. Below about half the grist, conversion becomes unreliable.`,
            impact: {
                technical: -10
            },
            fields: [
                'fermentables'
            ]
        });
    }
    if (water.mashPh > 5.7) {
        add({
            code: 'MASH_PH_HIGH',
            severity: water.mashPh > 5.9 ? 'warning' : 'caution',
            title: `Estimated mash pH is high at ${water.mashPh}`,
            explanation: water.residualAlkalinity > 30 ? 'Above roughly 5.6 the mash extracts more tannin from the grain husks, conversion slows and the finished beer tends to taste dull and drying. Alkaline water is the cause here: add lactic acid or acidulated malt, or start from softer water.' : 'Above roughly 5.6 the mash extracts more tannin from the grain husks, conversion slows and the finished beer tends to taste dull and drying. A pale grist lands here on its own, whatever the water — there is too little dark malt to bring the pH down and nothing in soft water to help. Changing water will not fix it; a few millilitres of lactic acid or 2–3% acidulated malt will.',
            impact: {
                technical: water.mashPh > 5.9 ? -10 : -4
            },
            fields: [
                'water'
            ]
        });
    } else if (water.mashPh < 5.15) {
        add({
            code: 'MASH_PH_LOW',
            severity: water.mashPh < 4.95 ? 'warning' : 'caution',
            title: `Estimated mash pH is low at ${water.mashPh}`,
            explanation: 'Too much acid thins the beer out and can make it taste sharp and empty. It also slows the enzymes, which reduces efficiency. Back off the acid, or the acidulated malt, or use water with more alkalinity.',
            impact: {
                technical: water.mashPh < 4.95 ? -9 : -3
            },
            fields: [
                'water'
            ]
        });
    } else {
        add({
            code: 'MASH_PH_GOOD',
            severity: 'info',
            title: `Mash pH lands at about ${water.mashPh}`,
            explanation: 'That is inside the 5.2–5.6 window where enzymes work well, husk tannins stay put and the finished beer tastes bright rather than dull. Remember this is an estimate from a simplified model, not a measurement.',
            impact: {
                technical: 2
            },
            fields: [
                'water'
            ]
        });
    }
    const { calcium, sulfate, chloride, magnesium, sodium } = water.final;
    const deliberatelySoft = recipe.water.profileId === 'soft-pilsner';
    if (calcium < 40 && gravity.grist.totalKg > 0 && !deliberatelySoft) {
        add({
            code: 'WATER_LOW_CALCIUM',
            severity: 'caution',
            title: `Only ${Math.round(calcium)} ppm calcium`,
            explanation: 'Calcium helps enzymes work, drops mash pH, encourages yeast to flocculate and helps protein settle out. Most brewers aim for 50–150 ppm. Very soft water is traditional for Czech pilsner, but everything else benefits from some.',
            impact: {
                technical: -3
            },
            fields: [
                'water.salts'
            ]
        });
    }
    if (magnesium > 40) {
        add({
            code: 'WATER_MAGNESIUM_HIGH',
            severity: 'warning',
            title: `Magnesium is high at ${Math.round(magnesium)} ppm`,
            explanation: 'Magnesium above roughly 30–40 ppm tastes metallic and sour, and it works as a laxative. Yeast only needs a few ppm, and the malt already supplies that.',
            impact: {
                technical: -6,
                enjoyment: -5
            },
            fields: [
                'water.salts'
            ]
        });
    }
    if (sodium > 150) {
        add({
            code: 'WATER_SODIUM_HIGH',
            severity: 'warning',
            title: `Sodium is high at ${Math.round(sodium)} ppm`,
            explanation: 'A little sodium rounds the palate, but above about 150 ppm the beer starts to taste salty, especially alongside sulfate.',
            impact: {
                technical: -5,
                enjoyment: -4
            },
            fields: [
                'water.salts'
            ]
        });
    }
    if (sulfate > 400) {
        add({
            code: 'WATER_SULFATE_EXTREME',
            severity: 'warning',
            title: `Sulfate is extreme at ${Math.round(sulfate)} ppm`,
            explanation: 'Sulfate sharpens and dries bitterness, which is why Burton water suits pale ales. Past roughly 350–400 ppm it stops being crisp and turns mineral and harsh, with a lingering sulfury edge.',
            impact: {
                technical: -5,
                enjoyment: -6
            },
            fields: [
                'water.salts'
            ]
        });
    }
    if (chloride > 250) {
        add({
            code: 'WATER_CHLORIDE_HIGH',
            severity: 'caution',
            title: `Chloride is high at ${Math.round(chloride)} ppm`,
            explanation: 'Chloride fills out the palate and lifts malt sweetness, but too much makes the beer taste heavy, slightly salty and indistinct.',
            impact: {
                technical: -3,
                enjoyment: -3
            },
            fields: [
                'water.salts'
            ]
        });
    }
    if (water.residualAlkalinity > 120 && sensory.roast < 3) {
        add({
            code: 'WATER_ALKALINE_PALE_BEER',
            severity: 'warning',
            title: 'Alkaline water under a pale grist',
            explanation: `Residual alkalinity of ${Math.round(water.residualAlkalinity)} ppm needs dark, acidic malt to balance it. A pale beer brewed on this water mashes too high and tastes coarse. Dublin brewed stout on water like this for a reason.`,
            impact: {
                technical: -6
            },
            fields: [
                'water'
            ]
        });
    }
    if (sensory.roast > 5 && water.residualAlkalinity < -20) {
        add({
            code: 'WATER_SOFT_DARK_BEER',
            severity: 'info',
            title: 'Very soft water under a dark grist',
            explanation: 'Roasted malt is acidic, so on very soft water the mash can end up below the ideal pH window and the roast reads sharp rather than smooth. A little baking soda or chalk brings it back.',
            impact: {},
            fields: [
                'water'
            ]
        });
    }
    const totalKg = gravity.grist.totalKg;
    for (const addition of recipe.fermentables){
        const f = getFermentable(addition.fermentableId);
        if (!f || totalKg <= 0 || addition.weightKg <= 0) continue;
        const share = addition.weightKg / totalKg;
        if (share > f.maxShare) {
            const over = share / f.maxShare;
            add({
                code: 'FERMENTABLE_OVER_MAX',
                severity: over > 1.6 ? 'warning' : 'caution',
                title: `${f.name} at ${Math.round(share * 100)}% of the grist`,
                explanation: `${f.name} is usually kept below about ${Math.round(f.maxShare * 100)}%. ${f.note} Going further is allowed, and occasionally interesting, but it is a deliberate choice rather than an accident.`,
                impact: {
                    technical: -clamp((over - 1) * 8, 0, 10),
                    coherence: -clamp((over - 1) * 6, 0, 8)
                },
                fields: [
                    'fermentables'
                ]
            });
        }
    }
    if (gravity.grist.specialityShare > 0.25) {
        add({
            code: 'SPECIALITY_OVERLOAD',
            severity: 'warning',
            title: `Speciality malt makes up ${Math.round(gravity.grist.specialityShare * 100)}% of the grist`,
            explanation: 'Crystal and other stewed malts carry unfermentable sugar. Past roughly a quarter of the grist they stack up into a sticky, raisin-like sweetness that no amount of bitterness balances, and the beer starts to taste like a caramel sauce rather than a beer.',
            impact: {
                technical: -6,
                coherence: -10,
                enjoyment: -8
            },
            fields: [
                'fermentables'
            ]
        });
    }
    if (gravity.grist.sugarShare > 0.25) {
        add({
            code: 'SUGAR_OVERLOAD',
            severity: 'caution',
            title: `Simple sugar is ${Math.round(gravity.grist.sugarShare * 100)}% of the grist`,
            explanation: 'Sugar ferments almost completely, so a large share thins the body and can leave a cidery, solvent edge. Belgian brewers rarely go beyond about 20%, and they are using it deliberately to keep a strong beer drinkable.',
            impact: {
                technical: -4,
                coherence: -6
            },
            fields: [
                'fermentables'
            ]
        });
    }
    const buGu = gravity.og > 1 ? ibu.total / ((gravity.og - 1) * 1000) : 0;
    if (ibu.total < 5 && gravity.grist.roastShare < 0.03 && yeast.souring < 3) {
        add({
            code: 'NO_BITTERNESS',
            severity: 'warning',
            title: 'Almost no bitterness',
            explanation: 'With fewer than about 5 IBU there is nothing to balance the malt sweetness, and hops also contribute antimicrobial protection. The beer will taste like sweet wort unless something else — roast, acidity — provides contrast.',
            impact: {
                coherence: -12,
                enjoyment: -10
            },
            fields: [
                'hops'
            ]
        });
    }
    if (buGu > 1.35 && sensory.sweetness < 4) {
        add({
            code: 'BITTERNESS_HARSH',
            severity: buGu > 1.8 ? 'warning' : 'caution',
            title: `Bitterness runs well ahead of the malt (BU:GU ${buGu.toFixed(2)})`,
            explanation: 'Bitterness is judged against the sweetness it has to cut through. At this ratio there is not enough malt underneath, so the bitterness arrives bare and lingers as a scrape rather than a balance.',
            impact: {
                coherence: -clamp((buGu - 1.35) * 22, 0, 18),
                enjoyment: -clamp((buGu - 1.35) * 16, 0, 14)
            },
            fields: [
                'hops',
                'fermentables'
            ]
        });
    }
    if (hopLoad.bitternessQuality > 0.98 && ibu.total > 45) {
        add({
            code: 'BITTERNESS_QUALITY_COARSE',
            severity: 'caution',
            title: 'Bittering hops are on the coarse side',
            explanation: 'High cohumulone hops give a bitterness that is sharper and less rounded. It suits a big resinous IPA and fights a delicate beer. Swapping the bittering charge for a clean high-alpha hop keeps the IBU and softens the edge.',
            impact: {
                enjoyment: -3
            },
            fields: [
                'hops'
            ]
        });
    }
    if (sensory.sweetness > 6.5 && buGu < 0.45 && gravity.grist.roastShare < 0.05) {
        add({
            code: 'CLOYING',
            severity: 'warning',
            title: 'Sweet without anything to cut it',
            explanation: `The beer finishes at ${attenuation.fg.toFixed(3)} with only ${Math.round(ibu.total)} IBU behind it. Residual sweetness needs a counterweight — bitterness, roast, acidity or carbonation. Without one, the second mouthful is harder work than the first.`,
            impact: {
                coherence: -14,
                enjoyment: -12
            },
            fields: [
                'hops',
                'mash.steps',
                'fermentables'
            ]
        });
    }
    if (hopLoad.dryHopGPerL > 10) {
        add({
            code: 'DRY_HOP_EXTREME',
            severity: 'warning',
            title: `Dry hopping at ${hopLoad.dryHopGPerL.toFixed(1)} g/L`,
            explanation: 'Aroma extraction saturates somewhere around 8 g/L. Beyond that you mostly add vegetal and grassy character, strip carbonation through hop creep, and risk a harsh polyphenol bite. More hops stop buying more aroma.',
            impact: {
                technical: -5,
                enjoyment: -6
            },
            fields: [
                'hops.dryHop'
            ]
        });
    }
    if (hopLoad.maxDryHopDays > 7) {
        add({
            code: 'DRY_HOP_TOO_LONG',
            severity: 'caution',
            title: `Dry hop contact of ${hopLoad.maxDryHopDays} days`,
            explanation: 'Most of the aroma is extracted within two or three days. Leaving hops in for a week or more adds chlorophyll and tannin — the grassy, tea-like character of over-steeped hops — without adding aroma.',
            impact: {
                enjoyment: -4
            },
            fields: [
                'hops.dryHop'
            ]
        });
    }
    if (yeast.souring >= 4 && ibu.total > 15) {
        add({
            code: 'SOUR_HOP_CONFLICT',
            severity: 'warning',
            title: 'Hops fight the souring culture',
            explanation: 'Lactobacillus is inhibited by hop compounds: above roughly 10–15 IBU souring slows badly or stops. Traditional sour beers use aged, low-alpha hops for exactly this reason.',
            impact: {
                technical: -8,
                coherence: -8
            },
            fields: [
                'hops',
                'fermentation.yeastId'
            ]
        });
    }
    const boilOff = ctx.boilOffFraction;
    if (boilOff < 0.02 && recipe.boilTimeMin >= 30) {
        add({
            code: 'BOILOFF_IMPLAUSIBLE_LOW',
            severity: 'caution',
            title: 'Almost no evaporation during the boil',
            explanation: `Losing only ${Math.round(boilOff * 100)}% over ${recipe.boilTimeMin} minutes implies a lid on the kettle or a very gentle simmer. A vigorous open boil drives off around 10% an hour, and that is what removes DMS and drives the reactions that give wort its depth.`,
            impact: {
                technical: -3
            },
            fields: [
                'preBoilVolumeL',
                'batchVolumeL'
            ]
        });
    }
    if (boilOff > 0.35) {
        add({
            code: 'BOILOFF_IMPLAUSIBLE_HIGH',
            severity: 'caution',
            title: `Evaporating ${Math.round(boilOff * 100)}% of the kettle`,
            explanation: 'That is a lot of water to lose. It is achievable with a very hard boil in a wide kettle, but it also darkens the wort and can leave a scorched, caramelised note in a beer that was meant to be pale.',
            impact: {
                technical: -2
            },
            fields: [
                'preBoilVolumeL',
                'batchVolumeL'
            ]
        });
    }
    if (risks.dms > FAULT_THRESHOLD.dms) {
        add({
            code: 'DMS_RISK',
            severity: risks.dms > 6 ? 'warning' : 'caution',
            title: 'Risk of cooked-corn DMS',
            explanation: 'Pilsner malt carries a precursor that turns into dimethyl sulfide during the boil. A vigorous, uncovered boil of 75–90 minutes drives it off, and fast chilling stops it re-forming. A short boil or a slow chill leaves it in the beer, where it tastes of sweetcorn or cooked vegetables.',
            impact: {
                technical: -clamp(risks.dms * 1.4, 0, 12),
                enjoyment: -clamp(risks.dms, 0, 8)
            },
            fields: [
                'boilTimeMin',
                'chill.minutes'
            ]
        });
    }
    if (recipe.chill.minutes > 45) {
        add({
            code: 'CHILL_SLOW',
            severity: recipe.chill.minutes > 90 ? 'warning' : 'caution',
            title: `Chilling takes ${recipe.chill.minutes} minutes`,
            explanation: 'Between about 60 °C and pitching temperature the wort is warm, sugary and unprotected. A slow chill widens that window for wild yeast and bacteria, keeps producing DMS, and gives a hazier beer because the cold break never forms sharply.',
            impact: {
                technical: -clamp((recipe.chill.minutes - 45) / 12, 0, 10)
            },
            fields: [
                'chill.minutes'
            ]
        });
    }
    if (recipe.chill.pitchTempC > yeast.tempMaxC + 2) {
        add({
            code: 'PITCH_HOT',
            severity: recipe.chill.pitchTempC > yeast.tempMaxC + 6 ? 'warning' : 'caution',
            title: `Pitching at ${recipe.chill.pitchTempC} °C`,
            explanation: `${yeast.name} tops out near ${yeast.tempMaxC} °C. The first twelve hours set the ester and fusel profile for the whole batch, so pitching hot leaves a hot, solventy character that no amount of conditioning removes. Pitch at or below your target fermentation temperature and let it rise.`,
            impact: {
                technical: -8,
                enjoyment: -6
            },
            fields: [
                'chill.pitchTempC'
            ]
        });
    }
    if (risks.astringency > FAULT_THRESHOLD.astringency) {
        add({
            code: 'ASTRINGENCY_RISK',
            severity: risks.astringency > 6.5 ? 'warning' : 'caution',
            title: 'Risk of husk astringency',
            explanation: 'Tannins from grain husks come out when the pH is high, the sparge is long and hot, or the grist carries a lot of roasted grain. They do not taste bitter so much as drying and puckering, like over-brewed tea.',
            impact: {
                technical: -clamp(risks.astringency, 0, 10),
                enjoyment: -clamp(risks.astringency * 0.8, 0, 8)
            },
            fields: [
                'water',
                'fermentables'
            ]
        });
    }
    if (ctx.avgFermentTempC > yeast.tempMaxC) {
        add({
            code: 'FERMENT_TOO_WARM',
            severity: ctx.avgFermentTempC > yeast.tempMaxC + 4 ? 'warning' : 'caution',
            title: `Fermenting at ${Math.round(ctx.avgFermentTempC)} °C, above the strain's range`,
            explanation: `${yeast.name} is happy between ${yeast.tempMinC} and ${yeast.tempMaxC} °C. Warmer than that, yeast produces more esters and, more importantly, fusel alcohols: the hot, solvent, headache-inducing end of the alcohol family.`,
            impact: {
                technical: -clamp((ctx.avgFermentTempC - yeast.tempMaxC) * 2.5, 0, 14)
            },
            fields: [
                'fermentation.steps'
            ]
        });
    }
    if (ctx.avgFermentTempC < yeast.tempMinC) {
        add({
            code: 'FERMENT_TOO_COLD',
            severity: ctx.avgFermentTempC < yeast.tempMinC - 4 ? 'warning' : 'caution',
            title: `Fermenting at ${Math.round(ctx.avgFermentTempC)} °C, below the strain's range`,
            explanation: `${yeast.name} works down to about ${yeast.tempMinC} °C. Colder than that it ferments sluggishly or gives up early, leaving the beer sweet, under-attenuated and full of the diacetyl it never came back to clean up.`,
            impact: {
                technical: -clamp((yeast.tempMinC - ctx.avgFermentTempC) * 2.5, 0, 16)
            },
            fields: [
                'fermentation.steps'
            ]
        });
    }
    if (risks.fusel > FAULT_THRESHOLD.fusel) {
        add({
            code: 'FUSEL_RISK',
            severity: risks.fusel > 6 ? 'severe' : 'warning',
            title: 'Hot alcohol likely',
            explanation: 'Warm fermentation on a strong wort pushes yeast into making higher alcohols. They read as solvent, nail polish or a burn at the back of the throat, and they are one of the few flaws that genuinely does not age out.',
            impact: {
                technical: -clamp(risks.fusel * 1.6, 0, 18),
                enjoyment: -clamp(risks.fusel * 1.5, 0, 16)
            },
            fields: [
                'fermentation.steps',
                'chill.pitchTempC'
            ]
        });
    }
    if (risks.diacetyl > FAULT_THRESHOLD.diacetyl) {
        add({
            code: 'DIACETYL_RISK',
            severity: risks.diacetyl > 6 ? 'warning' : 'caution',
            title: 'Risk of buttery diacetyl',
            explanation: 'Yeast produces diacetyl early in fermentation and reabsorbs it at the end, provided it is still active and warm enough. Crashing or packaging too soon locks it in, where it tastes of butter, butterscotch or slick popcorn. A two or three day rest a few degrees warmer at the end fixes it.',
            impact: {
                technical: -clamp(risks.diacetyl * 1.6, 0, 15),
                enjoyment: -clamp(risks.diacetyl * 1.2, 0, 12)
            },
            fields: [
                'fermentation.steps'
            ]
        });
    }
    if (ctx.totalFermentDays < (yeast.kind === 'lager' ? 12 : 6)) {
        add({
            code: 'FERMENT_SHORT',
            severity: 'warning',
            title: `Only ${ctx.totalFermentDays} days of fermentation`,
            explanation: yeast.kind === 'lager' ? 'Lager fermentation is slow by design. Two weeks is a realistic minimum before the yeast has finished attenuating and cleaning up after itself.' : 'Primary fermentation may look finished after three days, but the yeast spends the days afterwards reabsorbing diacetyl and acetaldehyde. Packaging early keeps both in the glass.',
            impact: {
                technical: -10
            },
            fields: [
                'fermentation.steps'
            ]
        });
    }
    if (recipe.fermentation.pitchRate === 'under') {
        add({
            code: 'PITCH_UNDER',
            severity: 'caution',
            title: 'Underpitched',
            explanation: 'Too little yeast means a long lag phase, more growth-phase esters, more fusel alcohol and a greater chance of stalling. High-gravity worts are the least forgiving: they need more yeast, not less.',
            impact: {
                technical: -5
            },
            fields: [
                'fermentation.pitchRate'
            ]
        });
    }
    if (attenuation.kinetics.stalled === 'alcohol') {
        add({
            code: 'ALCOHOL_TOLERANCE_EXCEEDED',
            severity: 'warning',
            title: `Stalled at ${attenuation.abv.toFixed(1)}% ABV, this strain's limit`,
            explanation: `${yeast.name} is reliable up to roughly ${(yeast.alcoholTolerance * 100).toFixed(0)}% ABV. This wort carried more sugar than that, so the yeast slowed to a stop with the rest of it still in the beer — which is why it finished at ${attenuation.fg.toFixed(3)} and tastes sweet rather than strong.`,
            impact: {
                technical: -10
            },
            fields: [
                'fermentation.yeastId',
                'fermentables'
            ]
        });
    }
    if (attenuation.apparent > 0.92 && sensory.body < 2) {
        add({
            code: 'OVER_ATTENUATED_THIN',
            severity: 'caution',
            title: 'Very dry and very thin',
            explanation: `Apparent attenuation of ${Math.round(attenuation.apparent * 100)}% leaves almost nothing behind. Dryness is a virtue in a saison or a dry stout, where hop, phenol or roast character fills the gap. With nothing filling it, the beer reads as watery.`,
            impact: {
                coherence: -6,
                enjoyment: -5
            },
            fields: [
                'mash.steps',
                'fermentables'
            ]
        });
    }
    if (risks.oxidation > FAULT_THRESHOLD.oxidation) {
        add({
            code: 'OXIDATION_RISK',
            severity: risks.oxidation > 7 ? 'warning' : 'caution',
            title: 'Oxidation risk on the cold side',
            explanation: 'After fermentation, oxygen is the enemy. It turns hop aroma into wet cardboard and dulls pale malt into sherry and toffee within weeks. Splashing during transfer, warm storage and heavy dry hopping all speed it up.',
            impact: {
                technical: -clamp((risks.oxidation - 4) * 2.2, 0, 14),
                enjoyment: -clamp((risks.oxidation - 4) * 2, 0, 12)
            },
            fields: [
                'chill.transferQuality',
                'conditioning'
            ]
        });
    }
    if (risks.infection > FAULT_THRESHOLD.infection) {
        add({
            code: 'INFECTION_RISK',
            severity: risks.infection > 7 ? 'warning' : 'caution',
            title: 'Contamination risk',
            explanation: (recipe.chill.sanitation ?? 'no-rinse') === 'rinse' ? 'Wort is an ideal growth medium for almost anything, and a rinse under the tap leaves whatever the last batch left on the fermenter. This is the step most first brews go wrong on. A no-rinse sanitiser takes two minutes and removes most of the risk.' : 'Wort is an ideal growth medium for almost anything. Slow chilling, hot pitching and careless transfers all give wild yeast and bacteria a head start before your yeast takes over. The result is usually a slow souring or a stubborn haze weeks later.',
            impact: {
                technical: -clamp((risks.infection - 4) * 2, 0, 12)
            },
            fields: [
                'chill'
            ]
        });
    }
    if (risks.chlorophenol > FAULT_THRESHOLD.chlorophenol) {
        add({
            code: 'CHLOROPHENOL',
            severity: 'caution',
            title: 'A medicinal note from the bleach',
            explanation: 'Bleach kills everything, and then it has to be rinsed off with water that is not sterile. A trace left on the kit meets the phenols in the beer and makes chlorophenol, which tastes of plastic and antiseptic at a few parts per billion. Rinse three times with hot water, or use a no-rinse sanitiser and skip the problem.',
            impact: {
                technical: -4,
                enjoyment: -3
            },
            fields: [
                'chill.sanitation'
            ]
        });
    }
    const needsAge = (attenuation.abv > 8 ? 1 : 0) + (sensory.roast > 5 ? 1 : 0) + (yeast.kind === 'lager' ? 1 : 0);
    if (needsAge > 0 && recipe.conditioning.days < 14 * needsAge) {
        add({
            code: 'CONDITIONING_SHORT',
            severity: 'caution',
            title: 'Needs longer to come together',
            explanation: yeast.kind === 'lager' ? 'Lagering is not a formality. Weeks at low temperature let sulfur blow off, protein and yeast drop out and the malt profile knit together. Three to six weeks is normal, longer for a strong one.' : 'Strong and dark beers arrive at packaging tasting sharp and disjointed. Time lets the alcohol soften and the roast and caramel notes merge into something rounder.',
            impact: {
                coherence: -6,
                enjoyment: -5
            },
            fields: [
                'conditioning.days'
            ]
        });
    }
    const fadeRisk = recipe.conditioning.days > 45 && hopLoad.dryHopGPerL + hopLoad.whirlpoolGPerL > 2.5;
    if (fadeRisk) {
        add({
            code: 'HOP_AROMA_FADED',
            severity: 'warning',
            title: 'Hop aroma will have faded',
            explanation: `Hop aroma compounds are volatile and unstable. After ${recipe.conditioning.days} days at ${recipe.conditioning.tempC} °C, a beer built around late hops has lost much of what made it worth brewing. Ageing does not improve a hoppy beer; it only takes from it.`,
            impact: {
                enjoyment: -clamp((recipe.conditioning.days - 45) / 10, 0, 12)
            },
            fields: [
                'conditioning.days',
                'hops'
            ]
        });
    }
    if (recipe.conditioning.co2Volumes > 3.2) {
        add({
            code: 'CARBONATION_HIGH',
            severity: 'caution',
            title: `Carbonated to ${recipe.conditioning.co2Volumes.toFixed(1)} volumes`,
            explanation: 'That is champagne territory. It works in a saison or a hefeweizen, where the foam is part of the experience, but it also scrubs aroma out of the glass and makes bitterness taste sharper. Standard bottles are not rated for much more.',
            impact: {},
            fields: [
                'conditioning.co2Volumes'
            ]
        });
    }
    if (recipe.conditioning.co2Volumes < 1.5) {
        add({
            code: 'CARBONATION_LOW',
            severity: 'caution',
            title: `Only ${recipe.conditioning.co2Volumes.toFixed(1)} volumes of CO₂`,
            explanation: 'Cask ale sits around 1.2–1.7 volumes and is served fresh and cool for exactly that reason. At this level anything bottled will taste flat and heavy, and the aroma will struggle to leave the glass.',
            impact: {
                enjoyment: -3
            },
            fields: [
                'conditioning.co2Volumes'
            ]
        });
    }
    if (risks.oxidation < 2 && hopLoad.dryHopGPerL > 1.5) {
        add({
            code: 'COLD_SIDE_CAREFUL',
            severity: 'info',
            title: 'Careful cold-side handling',
            explanation: 'A closed transfer protects exactly what a hoppy beer is made of. This is the single biggest difference between homebrewed IPA that tastes like the brewery version and one that tastes like cardboard after a fortnight.',
            impact: {
                technical: 4,
                enjoyment: 3
            },
            fields: [
                'chill.transferQuality'
            ]
        });
    }
    if (yeast.kind === 'lager' && recipe.fermentation.steps.some((s, i)=>i > 0 && s.tempC >= recipe.fermentation.steps[0].tempC + 3 && s.days >= 2)) {
        add({
            code: 'DIACETYL_REST_PRESENT',
            severity: 'info',
            title: 'Diacetyl rest included',
            explanation: 'Raising the temperature for a few days at the end of fermentation keeps the yeast active long enough to reabsorb the diacetyl it made on the way up. It is the difference between a clean lager and a buttery one.',
            impact: {
                technical: 4
            },
            fields: [
                'fermentation.steps'
            ]
        });
    }
    if (gravity.grist.entries.length >= 2 && gravity.grist.entries.length <= 4 && recipe.hops.length <= 4 && findings.filter((f)=>f.severity !== 'info').length === 0) {
        add({
            code: 'SIMPLE_AND_CLEAN',
            severity: 'info',
            title: 'A simple grist, well executed',
            explanation: 'Few ingredients and no process flaws. Most of the best beers in the world are built this way: the restraint is what lets each component be tasted.',
            impact: {
                coherence: 4,
                enjoyment: 3
            },
            fields: []
        });
    }
    const severityRank = {
        severe: 0,
        warning: 1,
        caution: 2,
        info: 3
    };
    findings.sort((a, b)=>severityRank[a.severity] - severityRank[b.severity]);
    return findings;
}
export function hopNames(ctx) {
    const seen = new Set();
    const names = [];
    for (const addition of ctx.recipe.hops){
        const hop = getHop(addition.hopId);
        if (hop && !seen.has(hop.id)) {
            seen.add(hop.id);
            names.push(hop.name);
        }
    }
    return names;
}
