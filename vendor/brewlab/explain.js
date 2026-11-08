import { clamp } from './calculations.js';
import { describeIntensity } from './sensory.js';
import { getFermentable } from './ingredients.js';
export function keyDecisions(ctx, findings) {
    const decisions = [];
    const { recipe, yeast, mash, gravity, hopLoad, sensory, attenuation, water } = ctx;
    const candidates = [];
    candidates.push({
        title: `Mashed at ${mash.effectiveTempC} °C for ${mash.conversionMinutes} minutes`,
        detail: mash.effectiveTempC >= 68 ? `This is the main reason the beer finishes at ${attenuation.fg.toFixed(3)} with ${describeIntensity(sensory.body)} body.` : mash.effectiveTempC <= 64 ? `A cool mash is why the beer attenuated to ${Math.round(attenuation.apparent * 100)}% and finishes dry.` : `A middle-of-the-road mash. The yeast got through ${Math.round(attenuation.apparent * 100)}% of the sugar, and most of what it left is body rather than sweetness.`,
        direction: mash.effectiveTempC > 71 || mash.effectiveTempC < 61 ? -1 : 0,
        weight: Math.abs(mash.effectiveTempC - 66) * 1.4 + 2
    });
    const biggest = [
        ...gravity.grist.entries
    ].sort((a, b)=>b.weightKg - a.weightKg)[0];
    if (biggest) {
        candidates.push({
            title: `${biggest.name} at ${Math.round(biggest.share * 100)}% of the grist`,
            detail: `It supplies ${Math.round(biggest.extractShare * 100)}% of the extract and sets the colour and malt character the rest of the beer is built on.`,
            direction: 0,
            weight: 4
        });
    }
    const speciality = gravity.grist.entries.filter((e)=>e.share > 0.03 && e.fermentableId !== biggest?.fermentableId).sort((a, b)=>b.share - a.share)[0];
    if (speciality) {
        const isBase = getFermentable(speciality.fermentableId)?.category === 'base';
        candidates.push({
            title: `${speciality.name} at ${Math.round(speciality.share * 100)}%`,
            detail: isBase ? 'A second base malt. It changes the malt character more than any number on this page will show, without moving the colour or the strength much at all.' : "Speciality malt is where most of a beer's recognisable flavour comes from, and where most recipes go wrong by adding too much.",
            direction: !isBase && gravity.grist.specialityShare > 0.22 ? -1 : 0,
            weight: isBase ? 3 : speciality.share * 22
        });
    }
    if (hopLoad.dryHopGPerL > 0.5) {
        candidates.push({
            title: `Dry hopped at ${hopLoad.dryHopGPerL.toFixed(1)} g/L`,
            detail: `This is where the ${describeIntensity(sensory.hopAroma)} aroma comes from. Dry hops add no measured IBU, but they do add perceived bite.`,
            direction: hopLoad.dryHopGPerL > 10 ? -1 : 1,
            weight: clamp(hopLoad.dryHopGPerL * 1.3, 0, 9)
        });
    }
    if (ctx.ibu.total > 1) {
        candidates.push({
            title: `${Math.round(ctx.ibu.total)} IBU against ${((gravity.og - 1) * 1000).toFixed(0)} gravity points`,
            detail: `A BU:GU ratio of ${(ctx.ibu.total / Math.max(1, (gravity.og - 1) * 1000)).toFixed(2)} is the single number that best predicts whether a beer tastes balanced.`,
            direction: 0,
            weight: 5
        });
    }
    candidates.push({
        title: `${yeast.name} at ${Math.round(ctx.avgFermentTempC)} °C`,
        detail: sensory.fruitEsters + sensory.phenols > 6 ? `The yeast is doing a lot of the talking here — ${yeast.esterNotes[sensory.fruitEsters >= 5 ? 1 : 0]}${sensory.phenols >= 1.5 && yeast.phenolNotes ? `, and ${yeast.phenolNotes}` : ''}.` : "Fermented in the strain's comfortable range, so the yeast stays in the background and lets the ingredients show.",
        direction: ctx.avgFermentTempC > yeast.tempMaxC || ctx.avgFermentTempC < yeast.tempMinC ? -1 : 1,
        weight: 4 + Math.abs(ctx.avgFermentTempC - yeast.tempIdealC) * 0.6
    });
    if (Math.abs(water.residualAlkalinity) > 60 || water.final.sulfate > 180 || water.final.chloride > 140) {
        candidates.push({
            title: `Water at ${Math.round(water.final.sulfate)} ppm sulfate and ${Math.round(water.final.chloride)} ppm chloride`,
            detail: water.final.sulfate > water.final.chloride * 1.5 ? 'Sulfate dominance sharpens the bitterness and dries the finish.' : water.final.chloride > water.final.sulfate * 1.5 ? 'Chloride dominance rounds the palate and pushes malt forward.' : 'A balanced mineral profile that leans neither way.',
            direction: 0,
            weight: 3.5
        });
    }
    if (recipe.conditioning.days > 30 || recipe.conditioning.days < 7) {
        candidates.push({
            title: `Conditioned ${recipe.conditioning.days} days at ${recipe.conditioning.tempC} °C`,
            detail: recipe.conditioning.days > 30 ? 'Long conditioning smooths alcohol and roast, and costs hop aroma. It suits some beers and quietly ruins others.' : 'Short conditioning keeps hop aroma intact but leaves less time for rough edges to settle.',
            direction: 0,
            weight: 3
        });
    }
    void findings;
    candidates.sort((a, b)=>b.weight - a.weight);
    const seen = new Set();
    for (const c of candidates){
        if (seen.has(c.title)) continue;
        seen.add(c.title);
        decisions.push({
            title: c.title,
            detail: c.detail,
            direction: c.direction
        });
        if (decisions.length >= 6) break;
    }
    return decisions;
}
const IMPROVEMENT_BY_CODE = {
    MASH_TOO_HOT: {
        title: 'Drop the mash a few degrees',
        detail: 'Mashing at 65–66 °C instead will give the yeast more to work with and take two or three points off the final gravity.'
    },
    MASH_TOO_COOL: {
        title: 'Mash warmer, or mash longer',
        detail: 'A rest at 66–67 °C keeps some dextrin in the beer for body. If you want the dryness, give the cool mash 90 minutes so it converts fully.'
    },
    MASH_SHORT: {
        title: 'Give the mash a full hour',
        detail: 'Sixty minutes is the usual figure because that is roughly how long complete conversion takes. An iodine test tells you when it is done.'
    },
    MASH_NO_CONVERSION: {
        title: 'Add a rest between 62 and 70 °C',
        detail: 'Without one the amylase enzymes never get to work, and there is nothing for the yeast to ferment.'
    },
    MASH_PH_HIGH: {
        title: 'Acidify the mash',
        detail: 'A few millilitres of lactic acid, or 1–3% acidulated malt, will bring the estimate into the 5.2–5.5 window.'
    },
    MASH_PH_LOW: {
        title: 'Ease off the acid',
        detail: 'Reduce the lactic acid or acidulated malt. If the grist is dark, some of the acidity is coming from the malt itself.'
    },
    LOW_DIASTATIC_POWER: {
        title: 'Add more base malt',
        detail: 'Keep at least 60% of the grist as pale, pilsner or Maris Otter so there are enough enzymes to convert the rest.'
    },
    SPECIALITY_OVERLOAD: {
        title: 'Cut the crystal malt back',
        detail: 'Try 5–8% of the grist. If you want more colour without more sweetness, use a small amount of a roasted or dehusked malt instead.'
    },
    SUGAR_OVERLOAD: {
        title: 'Use less sugar',
        detail: 'Keep it under 15–20% and let malt carry the gravity, unless you are deliberately building a Belgian strong ale.'
    },
    FERMENTABLE_OVER_MAX: {
        title: 'Reconsider the grist proportions',
        detail: 'At least one ingredient is well past its usual share. That can be the point, but make sure it is a decision rather than an accident.'
    },
    NO_BITTERNESS: {
        title: 'Add a bittering charge',
        detail: 'Even 20 IBU at 60 minutes gives the malt something to push against, and hops protect the beer while it ferments.'
    },
    BITTERNESS_HARSH: {
        title: 'Rebalance bitterness against gravity',
        detail: 'Either cut the bittering addition or raise the malt. Moving bitterness from the boil to the whirlpool keeps the hop character and loses the scrape.'
    },
    CLOYING: {
        title: 'Give the sweetness a counterweight',
        detail: 'More bitterness, a drier mash, a more attenuative yeast, or a little roast. Any of the four will do; doing all four at once will overcorrect.'
    },
    DRY_HOP_EXTREME: {
        title: 'Dry hop less, and in two charges',
        detail: 'Around 6–8 g/L is where aroma stops improving. Splitting it into two shorter charges gives fresher aroma than one long one.'
    },
    DRY_HOP_TOO_LONG: {
        title: 'Shorten the dry hop contact',
        detail: 'Two to three days extracts almost all the aroma. Longer mostly adds grass.'
    },
    SOUR_HOP_CONFLICT: {
        title: 'Drop the bitterness for a sour beer',
        detail: 'Keep it under about 10 IBU so the lactic bacteria can work, and use old or low-alpha hops.'
    },
    DMS_RISK: {
        title: 'Boil harder, chill faster',
        detail: 'A vigorous uncovered boil of at least 75 minutes with pilsner malt, then chill in under 30 minutes.'
    },
    CHILL_SLOW: {
        title: 'Chill faster',
        detail: 'An immersion chiller with cold water, or a plate chiller, gets a normal batch down in 20 minutes. The wort is vulnerable until it is cold.'
    },
    PITCH_HOT: {
        title: 'Cool further before pitching',
        detail: 'Pitch at or just below your target fermentation temperature. The first hours set the ester and fusel profile permanently.'
    },
    FERMENT_TOO_WARM: {
        title: 'Control the fermentation temperature',
        detail: 'Even a tub of water with a frozen bottle in it holds a fermenter steadier than ambient air. The yeast generates its own heat, so it runs warmer than the room.'
    },
    FERMENT_TOO_COLD: {
        title: 'Warm the fermentation up',
        detail: "Bring it into the strain's range so it finishes attenuating and cleans up after itself."
    },
    FUSEL_RISK: {
        title: 'Start cool and let it rise',
        detail: 'Pitch at the low end of the range and allow a few degrees of free rise once fermentation is established. Strong beers need this most.'
    },
    DIACETYL_RISK: {
        title: 'Add a warm rest before packaging',
        detail: 'Two or three days a few degrees warmer at the end of fermentation lets the yeast clean up the diacetyl it made on the way.'
    },
    FERMENT_SHORT: {
        title: 'Leave it on the yeast longer',
        detail: 'Gravity stability over two or three days is the real signal, not a number of days on a calendar.'
    },
    PITCH_UNDER: {
        title: 'Pitch more yeast',
        detail: 'A starter, or simply a second packet, shortens the lag phase and reduces both esters and fusel alcohols.'
    },
    ALCOHOL_TOLERANCE_EXCEEDED: {
        title: 'Choose a stronger strain',
        detail: 'Or lower the gravity. A stalled fermentation at high gravity is difficult to restart.'
    },
    OXIDATION_RISK: {
        title: 'Protect the cold side',
        detail: 'Transfer without splashing, purge the receiving vessel, and store cold. This matters more than almost anything else for hoppy beer.'
    },
    INFECTION_RISK: {
        title: 'Tighten up sanitation and chilling',
        detail: 'Fast chilling and a healthy pitch give your yeast the head start it needs to out-compete everything else.'
    },
    CONDITIONING_SHORT: {
        title: 'Give it more time',
        detail: 'Strong, dark and lager-fermented beers all need weeks rather than days before they show what they are.'
    },
    HOP_AROMA_FADED: {
        title: 'Drink it sooner, and colder',
        detail: 'A hoppy beer is at its best within a few weeks. Storing cold roughly doubles how long the aroma lasts.'
    },
    ASTRINGENCY_RISK: {
        title: 'Watch pH and sparge temperature',
        detail: 'Keep mash pH under 5.6, sparge water under 76 °C, and stop collecting when the runnings drop below about 1.010.'
    },
    WATER_ALKALINE_PALE_BEER: {
        title: 'Soften or acidify the water',
        detail: 'Dilute with distilled or RO water, or add acid. Pale beers need low alkalinity.'
    },
    WATER_MAGNESIUM_HIGH: {
        title: 'Cut the Epsom salt',
        detail: 'Magnesium above 30 ppm tastes metallic. Use gypsum if what you want is sulfate.'
    },
    WATER_SULFATE_EXTREME: {
        title: 'Ease off the gypsum',
        detail: '150–250 ppm sulfate gives a crisp, dry bitterness. Beyond that it turns mineral.'
    },
    CARBONATION_LOW: {
        title: 'Carbonate a little higher',
        detail: 'Around 2.2–2.5 volumes suits most styles and helps the aroma leave the glass.'
    },
    OVER_ATTENUATED_THIN: {
        title: 'Leave something behind',
        detail: 'A warmer mash, a less attenuative yeast, or a small amount of crystal malt will give the beer something to hold on to.'
    }
};
export function improvements(ctx, findings) {
    const out = [];
    const seen = new Set();
    const ordered = [
        ...findings
    ].filter((f)=>f.severity !== 'info');
    for (const finding of ordered){
        const template = IMPROVEMENT_BY_CODE[finding.code];
        if (!template || seen.has(template.title)) continue;
        seen.add(template.title);
        out.push({
            ...template,
            fields: finding.fields
        });
        if (out.length >= 5) break;
    }
    if (out.length === 0) {
        out.push({
            title: 'Nothing needs fixing. Change one thing on purpose.',
            detail: 'The model finds no faults worth reporting, which means this is a good place to experiment. Move the mash two degrees, swap one hop, or shift the fermentation temperature, and see what the beer does.',
            fields: []
        });
    }
    return out;
}
const AGE_WEEKS = [
    0,
    1,
    2,
    4,
    6,
    9,
    13,
    20,
    30,
    52
];
export function ageCurve(ctx, baseQuality) {
    const { sensory, attenuation, yeast, risks } = ctx;
    const maturationRoom = clamp((attenuation.abv - 6) * 2.6, 0, 14) + clamp((sensory.roast - 4) * 1.4, 0, 7) + (yeast.kind === 'lager' ? 6 : 0) + clamp((sensory.alcoholWarmth - 3) * 1.2, 0, 6);
    const maturationTau = 6 + clamp(attenuation.abv - 5, 0, 8);
    const aromaAtRisk = clamp(sensory.hopAroma * 1.5, 0, 14);
    const aromaHalfLifeWeeks = clamp(10 - risks.oxidation * 0.5, 3, 12);
    const oxidationRate = clamp(risks.oxidation * 0.22, 0.05, 2.2);
    let lastNote = '';
    return AGE_WEEKS.map((week)=>{
        const gain = maturationRoom * (1 - Math.exp(-week / maturationTau));
        const aromaLoss = aromaAtRisk * (1 - Math.pow(0.5, week / aromaHalfLifeWeeks));
        const oxidationLoss = oxidationRate * Math.max(0, week - 3) * 0.55;
        const quality = clamp(Math.round(baseQuality + gain - aromaLoss - oxidationLoss), 0, 100);
        let note = '';
        if (week === 0) note = 'Fresh from packaging.';
        else if (aromaLoss > 3 && aromaLoss > gain) note = 'Hop aroma is noticeably quieter.';
        else if (gain > 4 && gain > aromaLoss) note = 'Coming together: alcohol softer, flavours more knitted.';
        else if (oxidationLoss > 4) note = 'Oxidation is starting to show as cardboard or sherry.';
        else if (week >= 30) note = 'Well past its best for most drinkers.';
        if (note && note === lastNote) note = '';
        else if (note) lastNote = note;
        return {
            week,
            quality,
            note
        };
    });
}
export function bestBefore(curve) {
    return curve.reduce((best, point)=>point.quality > best.quality ? point : best, curve[0]);
}
export function verdict(ctx, scores, styles, findings) {
    const closest = styles[0];
    const worst = findings.find((f)=>f.severity === 'severe') ?? findings.find((f)=>f.severity === 'warning') ?? findings.find((f)=>f.severity === 'caution');
    const severe = findings.some((f)=>f.severity === 'severe');
    const headline = scores.overall >= 85 && !severe ? 'A beer worth brewing again' : scores.overall >= 72 && !severe ? 'Sound and enjoyable' : scores.overall >= 58 ? 'Drinkable, with something to fix' : scores.overall >= 42 ? 'Flawed but instructive' : 'This one is a lesson, not a beer';
    const parts = [];
    const aimedAt = ctx.recipe.targetStyleId;
    if (closest && closest.match >= 55) {
        if (!aimedAt) parts.push(`It reads as ${closest.name} at a ${closest.match}% match.`);
        else if (closest.styleId !== aimedAt) parts.push(`As it stands it reads more like ${closest.name.toLowerCase()}.`);
    } else if (closest) {
        parts.push(`Nothing in the style list fits closely; ${closest.name} is the nearest, at ${closest.match}%.`);
    }
    if (worst) {
        parts.push(`The main thing holding it back: ${worst.title.charAt(0).toLowerCase()}${worst.title.slice(1)}.`);
    } else {
        parts.push('Nothing in the fault model has anything to say about it.');
    }
    return {
        headline,
        summary: parts.join(' ')
    };
}
