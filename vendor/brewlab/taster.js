import { getHop } from './ingredients.js';
import { FAULT_THRESHOLD } from './faults.js';
const HOP_SMELL = {
    citrus: [
        'grapefruit',
        'orange peel'
    ],
    tropical: [
        'mango',
        'passionfruit'
    ],
    'stone-fruit': [
        'peach',
        'apricot'
    ],
    berry: [
        'dark berries',
        'blackcurrant'
    ],
    floral: [
        'flowers',
        'something almost perfumed'
    ],
    spicy: [
        'pepper',
        'dried spice'
    ],
    herbal: [
        'green herbs',
        'tea leaves'
    ],
    resin: [
        'resin',
        'sap'
    ],
    pine: [
        'pine needles',
        'sawn wood'
    ],
    earthy: [
        'soil',
        'old wood'
    ],
    grassy: [
        'cut grass',
        'hay'
    ],
    dank: [
        'something dank',
        'green stems'
    ]
};
const FAULT_SMELL = [
    {
        key: 'diacetyl',
        text: 'butter, or butterscotch'
    },
    {
        key: 'dms',
        text: 'cooked sweetcorn'
    },
    {
        key: 'oxidation',
        text: 'wet cardboard, and a stale sherry note under it'
    },
    {
        key: 'fusel',
        text: 'a hot, solvent edge'
    },
    {
        key: 'grassy',
        text: 'cut grass and green tea'
    },
    {
        key: 'infection',
        text: 'a sourness nobody asked for'
    },
    {
        key: 'chlorophenol',
        text: 'a medicinal, plastic note, like a swimming pool'
    }
];
function smokeShare(ctx) {
    const total = ctx.recipe.fermentables.reduce((sum, f)=>sum + Math.max(0, f.weightKg), 0);
    if (total <= 0) return 0;
    const smoked = ctx.recipe.fermentables.filter((f)=>f.fermentableId.includes('smoked')).reduce((sum, f)=>sum + Math.max(0, f.weightKg), 0);
    return smoked / total;
}
function list(items) {
    if (items.length <= 1) return items[0] ?? '';
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}
function capitalise(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}
function pour(ctx, appearance) {
    const srm = appearance.srm;
    const colour = srm < 3 ? 'pale straw' : srm < 6 ? 'gold' : srm < 9 ? 'deep gold' : srm < 13 ? 'amber' : srm < 17 ? 'copper' : srm < 24 ? 'brown' : srm < 32 ? 'very dark brown' : 'black, with a red edge where the light gets through';
    const clarity = appearance.haze < 0.15 ? 'brilliantly clear' : appearance.haze < 0.35 ? 'with a slight haze' : appearance.haze < 0.6 ? 'properly hazy' : 'opaque';
    const foam = srm >= 28 ? 'brown' : srm >= 15 ? 'tan' : 'white';
    const head = appearance.head < 0.45 ? `a thin ${foam} head that gives up almost at once` : appearance.head < 0.62 ? `a modest ${foam} collar` : appearance.head < 0.72 ? `a good finger of ${foam} foam` : `a thick ${foam} head that sits there and does not move`;
    const co2 = ctx.recipe.conditioning.co2Volumes;
    const fizz = co2 < 1.8 ? ' Barely a bubble rising — this is a flat pint.' : co2 > 3.2 ? ' The bubbles come up hard enough to sting.' : '';
    return `It pours ${colour}, ${clarity}, under ${head}.${fizz}`;
}
function nose(ctx) {
    const s = ctx.sensory;
    const clauses = [];
    if (s.hopAroma >= 1.5) {
        const late = ctx.recipe.hops.filter((h)=>h.use !== 'boil' || h.time <= 20).filter((h)=>h.grams > 0).sort((a, b)=>b.grams - a.grams).map((h)=>getHop(h.hopId)?.name).filter((name)=>Boolean(name));
        const named = [
            ...new Set(late)
        ].slice(0, 2);
        const tags = ctx.hopLoad.descriptors.filter((tag)=>tag in HOP_SMELL);
        const smells = [
            ...HOP_SMELL[tags[0]] ?? [],
            ...tags[1] ? [
                HOP_SMELL[tags[1]][0]
            ] : []
        ].slice(0, 3);
        const strength = s.hopAroma >= 7 ? 'You can smell it before it reaches the table' : s.hopAroma >= 4.5 ? 'The hops arrive first' : 'There is some hop character there, quietly';
        const body = named.length ? `${strength} — ${list(named)}${smells.length ? `, so ${list(smells)}` : ''}.` : `${strength}${smells.length ? `: ${list(smells)}` : ''}.`;
        clauses.push({
            weight: s.hopAroma,
            text: body
        });
    }
    if (s.fruitEsters >= 1.5) {
        const loud = s.fruitEsters >= 5;
        const word = ctx.yeast.esterNotes[loud ? 1 : 0];
        clauses.push({
            weight: s.fruitEsters,
            text: loud ? `The yeast is not hiding: ${word}.` : `Underneath, ${word} from the yeast.`
        });
    }
    const smoke = smokeShare(ctx);
    if (smoke >= 0.03) {
        clauses.push({
            weight: 6 + smoke * 4,
            text: smoke >= 0.6 ? 'And smoke — not a hint of it, a campfire, sitting on top of everything else.' : smoke >= 0.25 ? 'Beechwood smoke over the top of it, unmistakable and impossible to ignore.' : 'A wisp of woodsmoke behind it, more savoury than smoky.'
        });
    } else if (s.phenols >= 1.5 && ctx.yeast.phenolNotes) {
        clauses.push({
            weight: s.phenols,
            text: s.phenols >= 5 ? `Over all of it, ${ctx.yeast.phenolNotes}.` : `A thread of ${ctx.yeast.phenolNotes}.`
        });
    }
    if (s.roast >= 3) {
        clauses.push({
            weight: s.roast,
            text: s.roast >= 6 ? 'Coffee and dark chocolate off the roasted grain.' : 'A little coffee from the roast.'
        });
    } else if (s.caramel >= 3) {
        clauses.push({
            weight: s.caramel,
            text: 'Toffee and baked bread from the malt.'
        });
    } else if (s.malt >= 4) {
        clauses.push({
            weight: s.malt,
            text: 'Bread crust and a little honey from the malt.'
        });
    }
    if (s.alcoholWarmth >= 5) {
        clauses.push({
            weight: s.alcoholWarmth,
            text: 'The alcohol is on the nose too, warming.'
        });
    }
    const faults = FAULT_SMELL.filter((f)=>ctx.risks[f.key] > FAULT_THRESHOLD[f.key]).sort((a, b)=>ctx.risks[b.key] - ctx.risks[a.key]).map((f)=>f.text);
    if (clauses.length === 0 && faults.length === 0) {
        return 'Very little. A faint bread note if you go looking for it, and nothing else — this is a beer that gives you nothing until it is in your mouth.';
    }
    clauses.sort((a, b)=>b.weight - a.weight);
    const said = clauses.slice(0, 3).map((c, i)=>i === 0 ? c.text : c.text.replace('The hops arrive first', 'The hops are there too'));
    if (faults.length) {
        const named = list(faults.slice(0, 3));
        const more = faults.length > 3 ? ', and that is only where I stopped listing' : '';
        said.push(said.length ? `And then the thing you cannot un-smell: ${named}${more}.` : `Not much of the beer, and then the thing you cannot un-smell: ${named}${more}.`);
    }
    return said.join(' ');
}
function firstSip(ctx) {
    const s = ctx.sensory;
    const body = s.body < 3 ? 'thin, almost watery' : s.body < 5 ? 'light' : s.body < 7 ? 'medium-bodied' : 'thick, and it coats the mouth';
    const front = s.sweetness < 2 ? 'bone dry from the first moment' : s.sweetness < 4 ? 'only just sweet' : s.sweetness < 6.5 ? 'sweet up front' : 'sweet enough that it is the first thing you notice';
    const carbonation = ctx.recipe.conditioning.co2Volumes > 3 ? ' The carbonation scrubs at it.' : ctx.recipe.conditioning.co2Volumes < 1.8 ? ' With so little carbonation it sits flat on the tongue.' : '';
    const snap = s.crispness >= 7 ? ' It snaps, and it is gone.' : s.crispness <= 1.5 && s.body >= 6 ? ' Nothing cuts it; it just sits there.' : '';
    return `${capitalise(body)}, and ${front}.${carbonation}${snap}`;
}
function middle(ctx) {
    const s = ctx.sensory;
    const clauses = [];
    if (s.roast >= 2.5) {
        clauses.push({
            weight: s.roast,
            text: s.roast >= 6 ? 'Roast takes over — espresso, burnt toast, a bitterness of its own that has nothing to do with hops.' : 'Roast comes through dry and slightly ashy.'
        });
    }
    if (s.caramel >= 2.5) {
        clauses.push({
            weight: s.caramel,
            text: s.caramel >= 6 ? 'Caramel underneath it, heavy enough to be sticky.' : 'A caramel note running under it.'
        });
    }
    if (s.hopFlavour >= 3) {
        clauses.push({
            weight: s.hopFlavour,
            text: s.hopFlavour >= 6.5 ? 'Hop flavour fills it completely, closer to juice than to beer.' : 'Hop flavour arrives behind the malt, green and a little sharp.'
        });
    }
    if (s.acidity >= 3) {
        clauses.push({
            weight: s.acidity,
            text: s.acidity >= 6 ? 'A real acidity cuts through, tart enough to make you salivate.' : 'A faint tartness keeps it lively.'
        });
    }
    const smoke = smokeShare(ctx);
    if (smoke >= 0.03) {
        clauses.push({
            weight: 7 + smoke * 4,
            text: smoke >= 0.25 ? 'The smoke has not gone anywhere, and by now it tastes of cured meat as much as of wood.' : 'The smoke turns savoury here, more ham than bonfire.'
        });
    } else if (s.phenols >= 4 && ctx.yeast.phenolNotes) {
        clauses.push({
            weight: s.phenols,
            text: 'That spice carries right through.'
        });
    }
    if (s.fruitEsters >= 6) {
        clauses.push({
            weight: s.fruitEsters - 1,
            text: 'The fruit from the yeast has not let go.'
        });
    }
    if (s.malt >= 5 && s.roast < 2.5 && s.caramel < 2.5) {
        clauses.push({
            weight: s.malt,
            text: 'It is mostly malt through here: bread, a little honey.'
        });
    }
    if (clauses.length === 0) {
        return 'Not much happens. It goes from the front of the mouth to the back without stopping to say anything.';
    }
    clauses.sort((a, b)=>b.weight - a.weight);
    return clauses.slice(0, 2).map((c)=>c.text).join(' ');
}
function finish(ctx) {
    const s = ctx.sensory;
    const fg = ctx.attenuation.fg;
    const parts = [];
    const bitterness = s.bitterness < 2 ? 'There is almost no bitterness to speak of' : s.bitterness < 4 ? 'A gentle bitterness closes it' : s.bitterness < 6.5 ? 'The bitterness lands cleanly and holds' : s.bitterness < 8.5 ? 'The bitterness is firm and lasts' : 'The bitterness is enormous and refuses to let go';
    const harsh = ctx.hopLoad.bitternessQuality > 0.95 && s.bitterness >= 5 ? ', and it has a coarse edge to it' : '';
    parts.push(`${bitterness}${harsh}.`);
    if (fg > 1.018 && s.sweetness >= 5) {
        parts.push('It finishes sweet and heavy, and the last mouthful is harder work than the first.');
    } else if (fg < 1.008) {
        parts.push('It finishes bone dry, which makes you want the next mouthful straight away.');
    }
    if (ctx.risks.astringency > FAULT_THRESHOLD.astringency) {
        parts.push('A drying grip stays behind, like tea left in the pot.');
    }
    if (s.alcoholWarmth >= 5) {
        parts.push(s.alcoholWarmth >= 7.5 ? 'The alcohol burns all the way down and stays warm in the chest.' : 'A warmth from the alcohol follows it down.');
    }
    return parts.join(' ');
}
function closing(ctx, scores) {
    const technical = scores.technical.value;
    const enjoyment = scores.enjoyment.value;
    const s = ctx.sensory;
    const worstFault = FAULT_SMELL.reduce((worst, f)=>Math.max(worst, ctx.risks[f.key] - FAULT_THRESHOLD[f.key]), -Infinity);
    const clean = worstFault < 0;
    const quiet = s.hopAroma < 1.5 && s.fruitEsters < 1.5 && s.roast < 2.5 && s.caramel < 2.5 && s.hopFlavour < 3 && s.acidity < 3 && s.bitterness < 4 && s.malt < 4 && smokeShare(ctx) < 0.03;
    if (technical < 45) {
        return {
            another: 'no',
            closing: 'I would not finish this glass. Whatever was intended, something went wrong on the way, and it is in every mouthful.'
        };
    }
    if (worstFault >= 2.5) {
        return {
            another: 'no',
            closing: 'One of those is enough to stop me, and this has more than one. There is a beer underneath it somewhere, but I would not go looking for it in this glass.'
        };
    }
    if (clean && technical >= 62 && (quiet || enjoyment < 50)) {
        return {
            another: 'maybe',
            closing: 'There is nothing wrong with it. I finished the glass and could not tell you much about it afterwards, which is its own kind of problem — it is a beer that has been made carefully and decided nothing.'
        };
    }
    if (technical < 62 && enjoyment >= 68) {
        return {
            another: 'yes',
            closing: 'It is not clean, and I kept drinking it anyway. Fix the rough edges and this is something worth brewing on purpose.'
        };
    }
    if (enjoyment >= 78 && technical >= 72) {
        const why = s.bitterness >= 5 && s.hopAroma >= 5 ? 'The hops are doing exactly what you asked them to.' : s.roast >= 5 ? 'The roast is judged well enough to drink a pint of, which is harder than it sounds.' : 'It balances, and it stays balanced down the glass.';
        return {
            another: 'yes',
            closing: `${why} I would pour another, and I would brew it again.`
        };
    }
    if (!clean && enjoyment >= 55) {
        return {
            another: 'maybe',
            closing: 'I would drink it, and I would notice the flaw every time I picked the glass up. It is a good beer with something wrong with it, which is more frustrating than a bad one.'
        };
    }
    if (enjoyment >= 60) {
        return {
            another: 'yes',
            closing: 'A good pint. Not one I would take apart looking for faults, and I would happily have a second.'
        };
    }
    return {
        another: 'maybe',
        closing: clean ? 'Drinkable, and no more than that. One would be enough, and I would reach for something else after it.' : 'Drinkable, if you are not paying attention. The fault is the first thing I would fix, and it would be a different beer afterwards.'
    };
}
export function tastingNote(ctx, scores, appearance) {
    const end = closing(ctx, scores);
    return {
        passages: [
            {
                phase: 'The pour',
                text: pour(ctx, appearance)
            },
            {
                phase: 'The nose',
                text: nose(ctx)
            },
            {
                phase: 'First sip',
                text: firstSip(ctx)
            },
            {
                phase: 'Through the middle',
                text: middle(ctx)
            },
            {
                phase: 'The finish',
                text: finish(ctx)
            }
        ],
        closing: end.closing,
        another: end.another
    };
}
