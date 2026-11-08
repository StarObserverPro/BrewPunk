import { clamp } from './calculations.js';
const WEIGHTS = {
    technical: 0.4,
    coherence: 0.35,
    enjoyment: 0.25
};
const BASELINE = {
    technical: 88,
    coherence: 70,
    enjoyment: 55
};
function build(baseline, contributions) {
    const value = clamp(Math.round(contributions.reduce((sum, c)=>sum + c.delta, baseline)), 0, 100);
    return {
        value,
        positives: contributions.filter((c)=>c.delta > 0).sort((a, b)=>b.delta - a.delta),
        negatives: contributions.filter((c)=>c.delta < 0).sort((a, b)=>a.delta - b.delta)
    };
}
function findingContributions(findings, key) {
    return findings.filter((f)=>typeof f.impact[key] === 'number' && f.impact[key] !== 0).map((f)=>({
            label: f.title,
            detail: f.explanation,
            delta: Math.round(f.impact[key] * 10) / 10
        }));
}
function coherenceContributions(ctx) {
    const out = [];
    const s = ctx.sensory;
    const counter = s.bitterness + s.roast * 0.35 + s.acidity * 0.25;
    const support = s.sweetness + s.body * 0.28 + s.caramel * 0.18;
    const gap = counter - support;
    const buGu = ctx.ibu.total / Math.max(1, (ctx.gravity.og - 1) * 1000);
    if (buGu > 1.1) {
        out.push({
            label: 'Bitterness far beyond what the malt can carry',
            detail: `${Math.round(ctx.ibu.total)} IBU against ${Math.round((ctx.gravity.og - 1) * 1000)} gravity points is a ratio of ${buGu.toFixed(2)}. Past about 1.1 the bitterness is no longer a flavour but a wall, and no amount of body behind it reads as balance.`,
            delta: -clamp((buGu - 1.1) * 40, 0, 28)
        });
    } else if (Math.abs(gap) <= 4 && s.bitterness < 9.5) {
        out.push({
            label: 'The beer is in balance',
            detail: `What cuts (${counter.toFixed(1)}) and what coats (${support.toFixed(1)}) are close enough that neither takes over.`,
            delta: 10
        });
    } else if (gap > 6) {
        out.push({
            label: 'Bitterness outruns the malt',
            detail: `There is ${counter.toFixed(1)} of bitterness, roast and acidity over only ${support.toFixed(1)} of sweetness and body, so the finish arrives bare and stays.`,
            delta: -clamp((gap - 6) * 2.8, 0, 18)
        });
    } else if (gap < -6) {
        out.push({
            label: 'Malt outruns everything that cuts it',
            detail: `Sweetness and body add up to ${support.toFixed(1)} with only ${counter.toFixed(1)} to cut through, which reads as heavy rather than rich.`,
            delta: -clamp((-gap - 6) * 2.8, 0, 18)
        });
    }
    const carry = s.body + s.sweetness * 0.6 + s.malt * 0.3;
    if (s.alcoholWarmth > 3 && s.alcoholWarmth > carry * 0.75) {
        out.push({
            label: 'Alcohol is exposed',
            detail: 'Warmth without body or malt behind it reads as hot and thin rather than strong and rich.',
            delta: -clamp((s.alcoholWarmth - carry * 0.75) * 3, 0, 14)
        });
    } else if (s.alcoholWarmth > 3.5) {
        out.push({
            label: 'Strength is carried well',
            detail: 'There is enough body and malt underneath the alcohol for the strength to feel intentional.',
            delta: 6
        });
    }
    if (s.roast > 5 && s.hopAroma > 6.5) {
        out.push({
            label: 'Roast competes with hop aroma',
            detail: 'Dark roast and bright hop aroma pull in opposite directions. Black IPA makes it work by using dehusked malt and restrained roast.',
            delta: -clamp((Math.min(s.roast, s.hopAroma) - 5) * 2.4, 0, 10)
        });
    }
    if (s.phenols > 5 && s.hopAroma > 6.5) {
        out.push({
            label: 'Spicy phenols compete with hop aroma',
            detail: 'Clove and pepper from the yeast blur citrus and tropical hop character rather than adding to it.',
            delta: -clamp((Math.min(s.phenols, s.hopAroma) - 5) * 2.2, 0, 9)
        });
    }
    if (s.acidity > 5 && s.bitterness > 5.5) {
        out.push({
            label: 'Acidity and bitterness fight',
            detail: 'Sour and bitter stack on the same part of the palate and make each other harsher. Traditional sour beers keep bitterness very low.',
            delta: -clamp((Math.min(s.acidity, s.bitterness) - 5) * 2.6, 0, 11)
        });
    }
    if (s.sweetness > 6.5 && s.crispness > 7) {
        out.push({
            label: 'Sweet and crisp at the same time',
            detail: 'The model finds heavy residual sweetness and a snappy dry finish together, which is a contradiction the palate notices.',
            delta: -6
        });
    }
    const flavourIntensity = s.malt + s.caramel + s.roast + s.hopFlavour + s.hopAroma + s.fruitEsters + s.phenols + s.acidity;
    if (ctx.attenuation.abv > 7 && flavourIntensity < 12) {
        out.push({
            label: 'Strong but empty',
            detail: 'At this strength the beer needs flavour to match. As it stands the alcohol arrives with very little around it.',
            delta: -10
        });
    }
    if (flavourIntensity > 14 && flavourIntensity < 40 && s.bitterness > 1.5) {
        out.push({
            label: 'A clear flavour identity',
            detail: 'Several elements are present and none of them shouts over the others.',
            delta: 8
        });
    }
    if (flavourIntensity >= 40) {
        out.push({
            label: 'Very busy',
            detail: 'A lot of loud components at once. Each one is fine; together they crowd the glass.',
            delta: -clamp((flavourIntensity - 40) * 0.7, 0, 10)
        });
    }
    return out;
}
function enjoymentContributions(ctx, technical, coherence) {
    const out = [];
    const s = ctx.sensory;
    const foundation = (technical - 70) * 0.28 + (coherence - 65) * 0.3;
    out.push({
        label: 'Technical quality and balance',
        detail: `A prediction has to start from whether the beer is sound (${technical}) and whether it hangs together (${coherence}).`,
        delta: Math.round(foundation * 10) / 10
    });
    const expression = s.malt + s.caramel + s.roast + s.hopAroma + s.hopFlavour + s.fruitEsters + s.phenols;
    if (expression < 8) {
        out.push({
            label: 'Not much to say',
            detail: 'Very little malt, hop or yeast character came through. Clean is good; empty is not.',
            delta: -clamp((8 - expression) * 1.6, 0, 12)
        });
    } else if (expression >= 12 && expression <= 30) {
        out.push({
            label: 'Expressive without shouting',
            detail: 'There is plenty to taste and still room to finish the glass.',
            delta: 8
        });
    }
    const drinkability = clamp(8 - Math.abs(s.body - 4.5) - Math.max(0, s.alcoholWarmth - 4) * 1.2, -6, 8);
    out.push({
        label: drinkability > 3 ? 'Easy to keep drinking' : 'Hard work to finish',
        detail: drinkability > 3 ? 'Body and strength land where most drinkers want a second one.' : 'The combination of body and alcohol makes this a beer to sip rather than drink.',
        delta: Math.round(drinkability * 0.9 * 10) / 10
    });
    const descriptors = new Set(ctx.hopLoad.descriptors);
    const fruity = descriptors.has('citrus') || descriptors.has('tropical') || descriptors.has('stone-fruit') || descriptors.has('berry');
    const traditional = descriptors.has('herbal') || descriptors.has('spicy') || descriptors.has('floral') || descriptors.has('earthy');
    if (fruity && s.caramel > 5) {
        out.push({
            label: 'Citrus hops over heavy caramel',
            detail: 'Bright modern hops and deep crystal malt tend to muddy each other. Modern pale ales keep the caramel low for exactly this reason.',
            delta: -6
        });
    }
    if (fruity && s.caramel < 3 && s.hopAroma > 5) {
        out.push({
            label: 'Clean malt lets the hops through',
            detail: 'A restrained malt base is what makes modern hop aroma read as fruit rather than sweetness.',
            delta: 6
        });
    }
    if (traditional && s.malt > 4 && s.hopAroma < 6) {
        out.push({
            label: 'Classic hop and malt pairing',
            detail: 'Noble and English hops were bred alongside these malts, and the combination still works.',
            delta: 5
        });
    }
    if (s.phenols > 4 && s.fruitEsters > 4 && s.crispness > 5) {
        out.push({
            label: 'Belgian character with a dry finish',
            detail: "Spice, fruit and dryness together is one of brewing's most reliable combinations.",
            delta: 6
        });
    }
    if (s.roast > 5 && s.body > 5 && s.sweetness > 2.5) {
        out.push({
            label: 'Roast with something underneath it',
            detail: 'Roasted malt needs body and a little sweetness to keep it from reading as ash.',
            delta: 5
        });
    }
    return out;
}
export function computeScores(ctx, findings) {
    const technicalContribs = [
        {
            label: 'Sound process baseline',
            detail: 'Every beer starts from the assumption that the brewer did the ordinary things correctly. Findings then take points away or add them back.',
            delta: 0
        },
        ...findingContributions(findings, 'technical')
    ];
    const technical = build(BASELINE.technical, technicalContribs);
    const coherenceContribs = [
        ...coherenceContributions(ctx),
        ...findingContributions(findings, 'coherence')
    ];
    const coherence = build(BASELINE.coherence, coherenceContribs);
    const enjoymentContribs = [
        ...enjoymentContributions(ctx, technical.value, coherence.value),
        ...findingContributions(findings, 'enjoyment')
    ];
    const severe = findings.filter((f)=>f.severity === 'severe').length;
    if (severe > 0) {
        const running = enjoymentContribs.reduce((sum, c)=>sum + c.delta, BASELINE.enjoyment);
        const ceiling = 42 - (severe - 1) * 8;
        if (running > ceiling) {
            enjoymentContribs.push({
                label: severe === 1 ? 'A severe fault caps enjoyment' : 'Severe faults cap enjoyment',
                detail: 'Whatever else the beer has going for it, a fault at this level is the thing you taste. Enjoyment cannot climb past it.',
                delta: Math.round((ceiling - running) * 10) / 10
            });
        }
    }
    const enjoyment = build(BASELINE.enjoyment, enjoymentContribs);
    const overall = Math.round(technical.value * WEIGHTS.technical + coherence.value * WEIGHTS.coherence + enjoyment.value * WEIGHTS.enjoyment);
    return {
        technical,
        coherence,
        enjoyment,
        overall
    };
}
export const SCORE_LABELS = {
    technical: 'Technical quality',
    coherence: 'Coherence and balance',
    enjoyment: 'Expected enjoyment'
};
export const SCORE_DESCRIPTIONS = {
    technical: 'How well the process was controlled and how likely the beer is to carry a fault.',
    coherence: 'Whether sweetness, bitterness, alcohol, body, fermentation character and aroma work together.',
    enjoyment: 'A cautious prediction of how much a drinker would enjoy the result. The least certain of the three.'
};
export const SCORE_WEIGHTS = WEIGHTS;
export function scoreBand(value) {
    if (value >= 88) return 'excellent';
    if (value >= 76) return 'very good';
    if (value >= 64) return 'good';
    if (value >= 50) return 'drinkable';
    if (value >= 35) return 'flawed';
    return 'seriously flawed';
}
