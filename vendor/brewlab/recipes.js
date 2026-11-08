import { EMPTY_SALTS } from './water.js';
let seq = 0;
export function newId(prefix = 'x') {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
    }
    seq += 1;
    return `${prefix}-${seq.toString(36)}`;
}
export const ferm = (fermentableId, weightKg)=>({
        id: newId('f'),
        fermentableId,
        weightKg
    });
export const boilHop = (hopId, grams, time)=>({
        id: newId('h'),
        hopId,
        use: 'boil',
        grams,
        time
    });
export const whirlpoolHop = (hopId, grams, time, tempC = 80)=>({
        id: newId('h'),
        hopId,
        use: 'whirlpool',
        grams,
        time,
        tempC
    });
export const dryHop = (hopId, grams, days, day = 5)=>({
        id: newId('h'),
        hopId,
        use: 'dryHop',
        grams,
        time: days,
        day
    });
export const step = (kind, tempC, minutes)=>({
        id: newId('m'),
        kind,
        tempC,
        minutes
    });
export const fermStep = (label, tempC, days)=>({
        id: newId('s'),
        label,
        tempC,
        days
    });
export const salts = (partial = {})=>({
        ...EMPTY_SALTS,
        ...partial
    });
export function newHopAddition(use, hopId, existing = 0) {
    if (use === 'boil') {
        const minutes = [
            60,
            15,
            5,
            0
        ][Math.min(existing, 3)];
        const grams = existing === 0 ? 20 : 30;
        return boilHop(hopId, grams, minutes);
    }
    if (use === 'whirlpool') return whirlpoolHop(hopId, 30, 20, 80);
    return dryHop(hopId, 40, 3, 5);
}
const housePaleAle = ()=>({
        name: 'House pale ale',
        batchVolumeL: 20,
        preBoilVolumeL: 26,
        boilTimeMin: 60,
        efficiencyPct: 72,
        water: {
            profileId: 'balanced',
            salts: salts({
                gypsum: 4,
                calciumChloride: 3
            }),
            lacticAcidMl: 4
        },
        fermentables: [
            ferm('pale-ale', 4.4),
            ferm('munich-light', 0.4),
            ferm('crystal-light', 0.25)
        ],
        mash: {
            steps: [
                step('alpha', 66, 60),
                step('mashout', 76, 10)
            ],
            thicknessLPerKg: 3
        },
        hops: [
            boilHop('magnum', 15, 60),
            boilHop('cascade', 22, 10),
            whirlpoolHop('centennial', 30, 20, 80),
            dryHop('citra', 35, 3, 5)
        ],
        fermentation: {
            yeastId: 'american-ale',
            pitchRate: 'standard',
            steps: [
                fermStep('Primary', 19, 10),
                fermStep('Finish', 21, 4)
            ],
            coldCrash: true
        },
        chill: {
            minutes: 25,
            pitchTempC: 18,
            transferQuality: 'normal'
        },
        conditioning: {
            days: 14,
            tempC: 6,
            co2Volumes: 2.4
        },
        notes: 'A balanced, hop-forward pale ale. A good place to start changing one thing at a time.'
    });
const czechLager = ()=>({
        name: 'Soft Czech lager',
        batchVolumeL: 20,
        preBoilVolumeL: 27,
        boilTimeMin: 90,
        efficiencyPct: 72,
        water: {
            profileId: 'soft-pilsner',
            salts: salts({
                calciumChloride: 2
            }),
            lacticAcidMl: 3
        },
        fermentables: [
            ferm('pilsner', 4.1),
            ferm('munich-light', 0.45),
            ferm('crystal-light', 0.15)
        ],
        mash: {
            steps: [
                step('beta', 63, 30),
                step('alpha', 72, 30),
                step('mashout', 76, 10)
            ],
            thicknessLPerKg: 2.8
        },
        hops: [
            boilHop('saaz', 55, 60),
            boilHop('saaz', 30, 20),
            whirlpoolHop('saaz', 25, 15, 78)
        ],
        fermentation: {
            yeastId: 'czech-lager',
            pitchRate: 'over',
            steps: [
                fermStep('Primary', 11, 14),
                fermStep('Diacetyl rest', 16, 3)
            ],
            coldCrash: true
        },
        chill: {
            minutes: 20,
            pitchTempC: 10,
            transferQuality: 'closed'
        },
        conditioning: {
            days: 42,
            tempC: 2,
            co2Volumes: 2.5
        },
        notes: 'Decoction-style depth from a step mash, very soft water and a long, cold lagering.'
    });
const westCoastIpa = ()=>({
        name: 'West coast IPA',
        batchVolumeL: 20,
        preBoilVolumeL: 27,
        boilTimeMin: 60,
        efficiencyPct: 70,
        water: {
            profileId: 'hop-forward',
            salts: salts({
                gypsum: 6
            }),
            lacticAcidMl: 6
        },
        fermentables: [
            ferm('pale-ale', 5.5),
            ferm('vienna', 0.3),
            ferm('brewing-sugar', 0.3)
        ],
        mash: {
            steps: [
                step('alpha', 65, 60),
                step('mashout', 76, 10)
            ],
            thicknessLPerKg: 3
        },
        hops: [
            boilHop('magnum', 14, 60),
            boilHop('chinook', 20, 15),
            whirlpoolHop('simcoe', 45, 20, 80),
            whirlpoolHop('centennial', 45, 20, 80),
            dryHop('simcoe', 50, 3, 6),
            dryHop('citra', 50, 3, 6)
        ],
        fermentation: {
            yeastId: 'american-ale',
            pitchRate: 'standard',
            steps: [
                fermStep('Primary', 19, 8),
                fermStep('Finish', 21, 5)
            ],
            coldCrash: true
        },
        chill: {
            minutes: 20,
            pitchTempC: 18,
            transferQuality: 'closed'
        },
        conditioning: {
            days: 10,
            tempC: 4,
            co2Volumes: 2.4
        },
        notes: 'Dry, resinous and bitter, with the malt kept deliberately out of the way.'
    });
const hazyIpa = ()=>({
        name: 'Hazy IPA',
        batchVolumeL: 20,
        preBoilVolumeL: 26,
        boilTimeMin: 60,
        efficiencyPct: 68,
        water: {
            profileId: 'malt-forward',
            salts: salts({
                calciumChloride: 6,
                gypsum: 1
            }),
            lacticAcidMl: 5
        },
        fermentables: [
            ferm('pale-ale', 4.2),
            ferm('wheat-malt', 1),
            ferm('flaked-oats', 0.8)
        ],
        mash: {
            steps: [
                step('alpha', 67, 60),
                step('mashout', 76, 10)
            ],
            thicknessLPerKg: 3.2
        },
        hops: [
            boilHop('magnum', 6, 60),
            whirlpoolHop('citra', 60, 25, 78),
            whirlpoolHop('mosaic', 60, 25, 78),
            dryHop('citra', 60, 3, 3),
            dryHop('mosaic', 60, 3, 6)
        ],
        fermentation: {
            yeastId: 'neipa-ale',
            pitchRate: 'standard',
            steps: [
                fermStep('Primary', 20, 7),
                fermStep('Finish', 21, 5)
            ],
            coldCrash: false
        },
        chill: {
            minutes: 20,
            pitchTempC: 19,
            transferQuality: 'closed'
        },
        conditioning: {
            days: 7,
            tempC: 3,
            co2Volumes: 2.3
        },
        notes: 'Soft water, oats for body and almost all the hops after the boil.'
    });
const dryStout = ()=>({
        name: 'Dry Irish stout',
        batchVolumeL: 20,
        preBoilVolumeL: 25,
        boilTimeMin: 60,
        efficiencyPct: 70,
        water: {
            profileId: 'dark-alkaline',
            salts: salts({
                gypsum: 2
            }),
            lacticAcidMl: 2
        },
        fermentables: [
            ferm('pale-ale', 3.4),
            ferm('flaked-oats', 0.3),
            ferm('roasted-barley', 0.4)
        ],
        mash: {
            steps: [
                step('alpha', 67, 60),
                step('mashout', 76, 10)
            ],
            thicknessLPerKg: 3
        },
        hops: [
            boilHop('target', 22, 60),
            boilHop('ekg', 15, 15)
        ],
        fermentation: {
            yeastId: 'irish-ale',
            pitchRate: 'standard',
            steps: [
                fermStep('Primary', 19, 9),
                fermStep('Finish', 20, 4)
            ],
            coldCrash: true
        },
        chill: {
            minutes: 25,
            pitchTempC: 18,
            transferQuality: 'normal'
        },
        conditioning: {
            days: 14,
            tempC: 8,
            co2Volumes: 2
        },
        notes: 'Roasted barley does most of the work: colour, coffee bitterness and a dry finish.'
    });
const imperialStout = ()=>({
        name: 'Imperial stout',
        batchVolumeL: 19,
        preBoilVolumeL: 28,
        boilTimeMin: 90,
        efficiencyPct: 62,
        water: {
            profileId: 'dark-alkaline',
            salts: salts({
                calciumChloride: 3
            }),
            lacticAcidMl: 2
        },
        fermentables: [
            ferm('maris-otter', 8.2),
            ferm('munich-dark', 0.8),
            ferm('crystal-medium', 0.5),
            ferm('chocolate', 0.5),
            ferm('roasted-barley', 0.35),
            ferm('flaked-oats', 0.5)
        ],
        mash: {
            steps: [
                step('alpha', 67, 75),
                step('mashout', 76, 10)
            ],
            thicknessLPerKg: 2.8
        },
        hops: [
            boilHop('magnum', 35, 60),
            boilHop('ekg', 25, 20)
        ],
        fermentation: {
            yeastId: 'american-ale',
            pitchRate: 'over',
            steps: [
                fermStep('Primary', 19, 10),
                fermStep('Free rise', 22, 10)
            ],
            coldCrash: false
        },
        chill: {
            minutes: 30,
            pitchTempC: 18,
            transferQuality: 'closed'
        },
        conditioning: {
            days: 120,
            tempC: 12,
            co2Volumes: 2.1
        },
        notes: 'Built to improve for a year. Big pitch, long boil, long maturation.'
    });
const saison = ()=>({
        name: 'Dry farmhouse saison',
        batchVolumeL: 20,
        preBoilVolumeL: 26,
        boilTimeMin: 75,
        efficiencyPct: 72,
        water: {
            profileId: 'balanced',
            salts: salts({
                gypsum: 3
            }),
            lacticAcidMl: 4
        },
        fermentables: [
            ferm('pilsner', 4),
            ferm('wheat-malt', 0.6),
            ferm('brewing-sugar', 0.35)
        ],
        mash: {
            steps: [
                step('beta', 63, 60),
                step('mashout', 76, 10)
            ],
            thicknessLPerKg: 3
        },
        hops: [
            boilHop('magnum', 8, 60),
            boilHop('styrian-goldings', 25, 15),
            whirlpoolHop('saaz', 25, 15, 80)
        ],
        fermentation: {
            yeastId: 'saison',
            pitchRate: 'standard',
            steps: [
                fermStep('Primary', 24, 5),
                fermStep('Free rise', 29, 12)
            ],
            coldCrash: false
        },
        chill: {
            minutes: 25,
            pitchTempC: 22,
            transferQuality: 'normal'
        },
        conditioning: {
            days: 21,
            tempC: 12,
            co2Volumes: 3
        },
        notes: 'A cool mash, a little sugar and a deliberately hot fermentation. Saison yeast likes it.'
    });
const hefeweizen = ()=>({
        name: 'Bavarian hefeweizen',
        batchVolumeL: 20,
        preBoilVolumeL: 26,
        boilTimeMin: 75,
        efficiencyPct: 70,
        water: {
            profileId: 'soft-pilsner',
            salts: salts({
                calciumChloride: 2
            }),
            lacticAcidMl: 3
        },
        fermentables: [
            ferm('wheat-malt', 2.4),
            ferm('pilsner', 2.1)
        ],
        mash: {
            steps: [
                step('acid', 44, 15),
                step('beta', 64, 30),
                step('alpha', 71, 25),
                step('mashout', 76, 10)
            ],
            thicknessLPerKg: 3.5
        },
        hops: [
            boilHop('hallertau-mf', 18, 60)
        ],
        fermentation: {
            yeastId: 'hefeweizen',
            pitchRate: 'standard',
            steps: [
                fermStep('Primary', 19, 8),
                fermStep('Finish', 20, 4)
            ],
            coldCrash: false
        },
        chill: {
            minutes: 25,
            pitchTempC: 17,
            transferQuality: 'normal'
        },
        conditioning: {
            days: 10,
            tempC: 5,
            co2Volumes: 3.1
        },
        notes: 'The ferulic acid rest at 44–46 °C is optional; this one leans on the yeast and a warm finish.'
    });
const englishBitter = ()=>({
        name: 'Best bitter',
        batchVolumeL: 20,
        preBoilVolumeL: 25,
        boilTimeMin: 60,
        efficiencyPct: 74,
        water: {
            profileId: 'hop-forward',
            salts: salts({
                gypsum: 3
            }),
            lacticAcidMl: 4
        },
        fermentables: [
            ferm('maris-otter', 3.5),
            ferm('crystal-medium', 0.35),
            ferm('crystal-dark', 0.08),
            ferm('brewing-sugar', 0.15)
        ],
        mash: {
            steps: [
                step('alpha', 67, 60),
                step('mashout', 76, 10)
            ],
            thicknessLPerKg: 2.6
        },
        hops: [
            boilHop('challenger', 22, 60),
            boilHop('ekg', 20, 15),
            boilHop('ekg', 15, 2)
        ],
        fermentation: {
            yeastId: 'english-ale',
            pitchRate: 'standard',
            steps: [
                fermStep('Primary', 19, 7),
                fermStep('Finish', 20, 4)
            ],
            coldCrash: true
        },
        chill: {
            minutes: 25,
            pitchTempC: 18,
            transferQuality: 'normal'
        },
        conditioning: {
            days: 10,
            tempC: 11,
            co2Volumes: 1.8
        },
        notes: 'Low carbonation, high drinkability. English brewers use sugar here to dry the finish.'
    });
const dubbel = ()=>({
        name: 'Abbey dubbel',
        batchVolumeL: 20,
        preBoilVolumeL: 27,
        boilTimeMin: 90,
        efficiencyPct: 70,
        water: {
            profileId: 'balanced',
            salts: salts({
                calciumChloride: 3
            }),
            lacticAcidMl: 4
        },
        fermentables: [
            ferm('pilsner', 4.8),
            ferm('munich-light', 0.6),
            ferm('special-b', 0.25),
            ferm('candi-dark', 0.5)
        ],
        mash: {
            steps: [
                step('beta', 64, 30),
                step('alpha', 70, 30),
                step('mashout', 76, 10)
            ],
            thicknessLPerKg: 3
        },
        hops: [
            boilHop('magnum', 9, 60),
            boilHop('styrian-goldings', 20, 20)
        ],
        fermentation: {
            yeastId: 'belgian-abbey',
            pitchRate: 'standard',
            steps: [
                fermStep('Primary', 19, 4),
                fermStep('Free rise', 24, 10)
            ],
            coldCrash: false
        },
        chill: {
            minutes: 25,
            pitchTempC: 18,
            transferQuality: 'normal'
        },
        conditioning: {
            days: 42,
            tempC: 14,
            co2Volumes: 2.8
        },
        notes: 'Dark candi sugar gives raisin and rum depth that ferments away rather than sweetening.'
    });
const marzen = ()=>({
        name: 'Märzen',
        batchVolumeL: 20,
        preBoilVolumeL: 27,
        boilTimeMin: 90,
        efficiencyPct: 72,
        water: {
            profileId: 'balanced',
            salts: salts({
                calciumChloride: 2
            }),
            lacticAcidMl: 4
        },
        fermentables: [
            ferm('vienna', 2.8),
            ferm('munich-light', 2),
            ferm('pilsner', 0.8),
            ferm('melanoidin', 0.15)
        ],
        mash: {
            steps: [
                step('beta', 63, 25),
                step('alpha', 71, 35),
                step('mashout', 76, 10)
            ],
            thicknessLPerKg: 2.8
        },
        hops: [
            boilHop('perle', 20, 60),
            boilHop('hallertau-mf', 15, 20)
        ],
        fermentation: {
            yeastId: 'german-lager',
            pitchRate: 'over',
            steps: [
                fermStep('Primary', 11, 14),
                fermStep('Diacetyl rest', 16, 3)
            ],
            coldCrash: true
        },
        chill: {
            minutes: 20,
            pitchTempC: 10,
            transferQuality: 'closed'
        },
        conditioning: {
            days: 45,
            tempC: 2,
            co2Volumes: 2.5
        },
        notes: 'Toasty and elegant. Vienna and Munich do the work; the hops only keep it honest.'
    });
const milkStout = ()=>({
        name: 'Milk stout',
        batchVolumeL: 20,
        preBoilVolumeL: 25,
        boilTimeMin: 60,
        efficiencyPct: 70,
        water: {
            profileId: 'malt-forward',
            salts: salts({
                calciumChloride: 3
            }),
            lacticAcidMl: 0
        },
        fermentables: [
            ferm('pale-ale', 4),
            ferm('flaked-oats', 0.4),
            ferm('crystal-medium', 0.3),
            ferm('chocolate', 0.3),
            ferm('lactose', 0.45)
        ],
        mash: {
            steps: [
                step('alpha', 68, 60),
                step('mashout', 76, 10)
            ],
            thicknessLPerKg: 3
        },
        hops: [
            boilHop('ekg', 30, 60),
            boilHop('fuggle', 15, 15)
        ],
        fermentation: {
            yeastId: 'english-ale',
            pitchRate: 'standard',
            steps: [
                fermStep('Primary', 19, 8),
                fermStep('Finish', 20, 4)
            ],
            coldCrash: true
        },
        chill: {
            minutes: 25,
            pitchTempC: 18,
            transferQuality: 'normal'
        },
        conditioning: {
            days: 21,
            tempC: 8,
            co2Volumes: 2.1
        },
        notes: 'Lactose is unfermentable, so every gram stays in the glass as sweetness and body.'
    });
const rauchbier = ()=>({
        name: 'Rauchbier',
        batchVolumeL: 20,
        preBoilVolumeL: 27,
        boilTimeMin: 90,
        efficiencyPct: 72,
        water: {
            profileId: 'balanced',
            salts: salts({
                calciumChloride: 2
            }),
            lacticAcidMl: 4
        },
        fermentables: [
            ferm('smoked-malt', 3.2),
            ferm('munich-light', 1.4),
            ferm('pilsner', 0.6),
            ferm('crystal-light', 0.2)
        ],
        mash: {
            steps: [
                step('alpha', 67, 60),
                step('mashout', 76, 10)
            ],
            thicknessLPerKg: 2.8
        },
        hops: [
            boilHop('spalt-select', 34, 60),
            boilHop('hallertau-mf', 15, 15)
        ],
        fermentation: {
            yeastId: 'german-lager',
            pitchRate: 'over',
            steps: [
                fermStep('Primary', 11, 14),
                fermStep('Diacetyl rest', 16, 3)
            ],
            coldCrash: true
        },
        chill: {
            minutes: 20,
            pitchTempC: 10,
            transferQuality: 'closed'
        },
        conditioning: {
            days: 42,
            tempC: 3,
            co2Volumes: 2.4
        },
        notes: 'A märzen brewed on beechwood-smoked malt. Half the grist is enough to be unmistakable.'
    });
const flawedBrownAle = ()=>({
        name: 'Something went wrong here',
        batchVolumeL: 20,
        preBoilVolumeL: 22,
        boilTimeMin: 30,
        efficiencyPct: 72,
        water: {
            profileId: 'dark-alkaline',
            salts: salts({
                epsom: 6
            }),
            lacticAcidMl: 0
        },
        fermentables: [
            ferm('pilsner', 2.6),
            ferm('crystal-dark', 1.1),
            ferm('crystal-medium', 0.9),
            ferm('black-malt', 0.3)
        ],
        mash: {
            steps: [
                step('alpha', 72, 30)
            ],
            thicknessLPerKg: 4.8
        },
        hops: [
            boilHop('columbus', 8, 60),
            dryHop('columbus', 90, 12, 2)
        ],
        fermentation: {
            yeastId: 'american-ale',
            pitchRate: 'under',
            steps: [
                fermStep('Primary', 27, 4)
            ],
            coldCrash: false
        },
        chill: {
            minutes: 120,
            pitchTempC: 30,
            transferQuality: 'careless'
        },
        conditioning: {
            days: 3,
            tempC: 20,
            co2Volumes: 1.2
        },
        notes: 'Every stage has at least one problem. Find them and fix them.'
    });
const oversweetStout = ()=>({
        name: 'Stout that lost its way',
        batchVolumeL: 20,
        preBoilVolumeL: 25,
        boilTimeMin: 60,
        efficiencyPct: 70,
        water: {
            profileId: 'malt-forward',
            salts: salts({
                calciumChloride: 5
            }),
            lacticAcidMl: 2
        },
        fermentables: [
            ferm('pale-ale', 3.8),
            ferm('crystal-dark', 0.7),
            ferm('crystal-medium', 0.6),
            ferm('chocolate', 0.25),
            ferm('lactose', 0.6)
        ],
        mash: {
            steps: [
                step('alpha', 71, 60),
                step('mashout', 76, 10)
            ],
            thicknessLPerKg: 3
        },
        hops: [
            boilHop('fuggle', 12, 60)
        ],
        fermentation: {
            yeastId: 'english-ale',
            pitchRate: 'standard',
            steps: [
                fermStep('Primary', 19, 10),
                fermStep('Finish', 20, 4)
            ],
            coldCrash: true
        },
        chill: {
            minutes: 25,
            pitchTempC: 18,
            transferQuality: 'normal'
        },
        conditioning: {
            days: 21,
            tempC: 8,
            co2Volumes: 2
        },
        notes: 'Hot mash, three sweet malts, lactose on top and barely any hops. Fix it without losing the roast.'
    });
export const EXAMPLES = [
    {
        id: 'house-pale-ale',
        name: 'House pale ale',
        tagline: 'Balanced, hoppy, forgiving',
        family: 'pale ale',
        build: housePaleAle
    },
    {
        id: 'west-coast-ipa',
        name: 'West coast IPA',
        tagline: 'Dry, resinous, bitter',
        family: 'ipa',
        build: westCoastIpa
    },
    {
        id: 'hazy-ipa',
        name: 'Hazy IPA',
        tagline: 'Soft, juicy, aroma first',
        family: 'ipa',
        build: hazyIpa
    },
    {
        id: 'english-bitter',
        name: 'Best bitter',
        tagline: 'Session strength, full flavour',
        family: 'pale ale',
        build: englishBitter
    },
    {
        id: 'czech-lager',
        name: 'Soft Czech lager',
        tagline: 'Step mash, soft water, patience',
        family: 'lager',
        build: czechLager
    },
    {
        id: 'marzen',
        name: 'Märzen',
        tagline: 'Toasty and elegant',
        family: 'lager',
        build: marzen
    },
    {
        id: 'dry-stout',
        name: 'Dry Irish stout',
        tagline: 'Coffee-dry and light on its feet',
        family: 'dark',
        build: dryStout
    },
    {
        id: 'milk-stout',
        name: 'Milk stout',
        tagline: 'Sweet, soft and slow',
        family: 'dark',
        build: milkStout
    },
    {
        id: 'imperial-stout',
        name: 'Imperial stout',
        tagline: 'Built to age for a year',
        family: 'strong',
        build: imperialStout
    },
    {
        id: 'saison',
        name: 'Dry farmhouse saison',
        tagline: 'Peppery and bone dry',
        family: 'belgian',
        build: saison
    },
    {
        id: 'dubbel',
        name: 'Abbey dubbel',
        tagline: 'Raisin, rum and restraint',
        family: 'belgian',
        build: dubbel
    },
    {
        id: 'hefeweizen',
        name: 'Bavarian hefeweizen',
        tagline: 'Banana, clove and foam',
        family: 'wheat',
        build: hefeweizen
    },
    {
        id: 'rauchbier',
        name: 'Rauchbier',
        tagline: 'Beechwood smoke over märzen',
        family: 'sour & smoked',
        build: rauchbier
    },
    {
        id: 'oversweet-stout',
        name: 'Stout that lost its way',
        tagline: 'Too sweet to finish',
        family: 'repair',
        build: oversweetStout
    },
    {
        id: 'flawed-brown',
        name: 'Something went wrong here',
        tagline: 'A recipe to repair',
        family: 'repair',
        build: flawedBrownAle
    }
];
export const EXAMPLE_BY_ID = new Map(EXAMPLES.map((e)=>[
        e.id,
        e
    ]));
export function buildExample(id) {
    return EXAMPLE_BY_ID.get(id)?.build();
}
export function defaultRecipe() {
    return housePaleAle();
}
export function emptyRecipe() {
    return {
        name: 'New brew',
        batchVolumeL: 20,
        preBoilVolumeL: 26,
        boilTimeMin: 60,
        efficiencyPct: 72,
        water: {
            profileId: '',
            salts: salts(),
            lacticAcidMl: 0
        },
        fermentables: [],
        mash: {
            steps: [
                step('alpha', 66, 60),
                step('mashout', 76, 10)
            ],
            thicknessLPerKg: 3
        },
        hops: [],
        fermentation: {
            yeastId: '',
            pitchRate: 'standard',
            steps: [
                fermStep('Primary', 19, 14)
            ],
            coldCrash: true
        },
        chill: {
            minutes: 25,
            pitchTempC: 18,
            transferQuality: 'normal',
            sanitation: 'no-rinse'
        },
        conditioning: {
            days: 14,
            tempC: 8,
            co2Volumes: 2.4,
            packaging: 'bottles',
            carbonationTempC: 20
        }
    };
}
export const DEFAULTS = emptyRecipe();
