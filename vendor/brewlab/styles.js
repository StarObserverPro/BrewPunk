const r = (min, max)=>({
        min,
        max
    });
export const STYLES = [
    {
        id: 'pale-lager',
        hopCharacter: 'classic',
        name: 'Pale lager',
        family: 'lager',
        og: r(1.042, 1.05),
        fg: r(1.008, 1.012),
        abv: r(4.2, 5.6),
        ibu: r(8, 25),
        ebc: r(4, 12),
        sensory: {
            phenols: r(0, 2),
            crispness: r(5, 9),
            bitterness: r(1.5, 4),
            malt: r(1.5, 4),
            hopAroma: r(0, 3),
            fruitEsters: r(0, 2)
        },
        blurb: 'Clean, pale and undemanding. Nowhere to hide a flaw.'
    },
    {
        id: 'czech-pilsner',
        hopCharacter: 'classic',
        name: 'Czech pilsner',
        family: 'lager',
        og: r(1.044, 1.056),
        fg: r(1.013, 1.017),
        abv: r(4.2, 5.8),
        ibu: r(30, 45),
        ebc: r(7, 13),
        sensory: {
            phenols: r(0, 2),
            hopAroma: r(1, 4),
            malt: r(3.5, 6.5),
            bitterness: r(3.5, 6),
            body: r(3.5, 6),
            crispness: r(4, 7),
            hopFlavour: r(2.5, 5.5),
            fruitEsters: r(0, 2)
        },
        blurb: 'Rich bready malt, soft water and a long, rounded Saaz bitterness.'
    },
    {
        id: 'german-pils',
        hopCharacter: 'classic',
        name: 'German pils',
        family: 'lager',
        og: r(1.044, 1.05),
        fg: r(1.008, 1.013),
        abv: r(4.4, 5.2),
        ibu: r(22, 40),
        ebc: r(4, 10),
        sensory: {
            phenols: r(0, 2),
            hopAroma: r(1, 4),
            crispness: r(6, 10),
            bitterness: r(3.5, 6.5),
            malt: r(2, 4.5),
            hopFlavour: r(2, 5),
            fruitEsters: r(0, 1.5)
        },
        blurb: 'Drier and sharper than its Czech cousin, with a snappy finish.'
    },
    {
        id: 'dark-lager',
        hopCharacter: 'classic',
        name: 'Dark lager',
        family: 'lager',
        og: r(1.044, 1.056),
        fg: r(1.008, 1.016),
        abv: r(4.2, 5.6),
        ibu: r(15, 30),
        ebc: r(28, 60),
        sensory: {
            phenols: r(0, 2),
            hopAroma: r(0, 2.5),
            roast: r(2, 4.5),
            malt: r(3.5, 6.5),
            crispness: r(4, 7.5),
            sweetness: r(1.5, 4),
            fruitEsters: r(0, 2)
        },
        blurb: 'Chocolate and bread crust over a lager-clean finish.'
    },
    {
        id: 'marzen',
        hopCharacter: 'classic',
        name: 'Märzen',
        family: 'lager',
        og: r(1.054, 1.062),
        fg: r(1.01, 1.014),
        abv: r(5.6, 6.5),
        ibu: r(18, 26),
        ebc: r(16, 33),
        sensory: {
            phenols: r(0, 2),
            hopAroma: r(0, 2.5),
            malt: r(5, 8),
            caramel: r(1.5, 4),
            crispness: r(3.5, 6.5),
            bitterness: r(2, 4),
            fruitEsters: r(0, 2)
        },
        blurb: 'Toasted, elegant and deceptively drinkable.'
    },
    {
        id: 'bock',
        hopCharacter: 'classic',
        name: 'Bock',
        family: 'lager',
        og: r(1.064, 1.075),
        fg: r(1.013, 1.02),
        abv: r(6.3, 7.4),
        ibu: r(20, 28),
        ebc: r(28, 45),
        sensory: {
            phenols: r(0, 2),
            hopAroma: r(0, 2),
            malt: r(6, 9),
            caramel: r(2.5, 5),
            body: r(5, 8),
            bitterness: r(2, 4.5),
            fruitEsters: r(0, 2.5)
        },
        blurb: 'Deep, bready and warming, with the hops firmly in the background.'
    },
    {
        id: 'kolsch',
        hopCharacter: 'classic',
        name: 'Kölsch',
        family: 'lager',
        og: r(1.044, 1.05),
        fg: r(1.007, 1.011),
        abv: r(4.4, 5.2),
        ibu: r(18, 30),
        ebc: r(7, 10),
        sensory: {
            phenols: r(0, 2),
            hopAroma: r(0, 2.5),
            crispness: r(5.5, 9),
            fruitEsters: r(1, 3.5),
            malt: r(2, 4.5),
            bitterness: r(2.5, 5)
        },
        blurb: 'Delicate, faintly fruity and impossible to fake.'
    },
    {
        id: 'british-bitter',
        hopCharacter: 'classic',
        name: 'British bitter',
        family: 'pale ale',
        og: r(1.04, 1.05),
        fg: r(1.008, 1.014),
        abv: r(3.6, 4.8),
        ibu: r(25, 40),
        ebc: r(16, 30),
        sensory: {
            phenols: r(0, 2),
            hopAroma: r(1, 4.5),
            malt: r(4, 7),
            caramel: r(2, 4.5),
            bitterness: r(3.5, 6),
            fruitEsters: r(2, 5),
            hopFlavour: r(2, 5)
        },
        blurb: 'Session strength with more flavour than it has any right to.'
    },
    {
        id: 'pale-ale',
        hopCharacter: 'modern',
        name: 'American pale ale',
        family: 'pale ale',
        og: r(1.045, 1.06),
        fg: r(1.01, 1.015),
        abv: r(4.5, 6.2),
        ibu: r(30, 50),
        ebc: r(10, 22),
        sensory: {
            phenols: r(0, 2),
            bitterness: r(4, 6.5),
            hopAroma: r(4, 8),
            hopFlavour: r(4, 7.5),
            malt: r(2.5, 5)
        },
        blurb: 'Citrus and pine over a clean malt base. The gateway craft beer.'
    },
    {
        id: 'amber-ale',
        hopCharacter: 'modern',
        name: 'Amber ale',
        family: 'amber & brown',
        og: r(1.045, 1.06),
        fg: r(1.01, 1.016),
        abv: r(4.5, 6.2),
        ibu: r(25, 40),
        ebc: r(22, 35),
        sensory: {
            phenols: r(0, 2),
            hopAroma: r(2, 5.5),
            caramel: r(3.5, 6.5),
            malt: r(4, 7),
            bitterness: r(3, 5.5),
            hopFlavour: r(2.5, 5.5)
        },
        blurb: 'Caramel malt and moderate hops in comfortable balance.'
    },
    {
        id: 'scottish-export',
        hopCharacter: 'classic',
        name: 'Scottish export',
        family: 'amber & brown',
        og: r(1.04, 1.06),
        fg: r(1.01, 1.016),
        abv: r(3.9, 6),
        ibu: r(15, 30),
        ebc: r(26, 44),
        sensory: {
            phenols: r(0, 2),
            malt: r(5, 8),
            caramel: r(3, 6),
            bitterness: r(1.5, 4),
            body: r(4, 7),
            hopAroma: r(0, 2)
        },
        blurb: 'Malt-forward, softly caramelised and barely hopped.'
    },
    {
        id: 'brown-ale',
        hopCharacter: 'classic',
        name: 'Brown ale',
        family: 'amber & brown',
        og: r(1.045, 1.06),
        fg: r(1.01, 1.016),
        abv: r(4.3, 6.2),
        ibu: r(20, 32),
        ebc: r(35, 70),
        sensory: {
            phenols: r(0, 2),
            hopAroma: r(0, 3),
            malt: r(4.5, 7.5),
            caramel: r(3.5, 6.5),
            roast: r(1.5, 4),
            bitterness: r(2.5, 5)
        },
        blurb: 'Nutty, gently roasty and often overlooked.'
    },
    {
        id: 'english-ipa',
        hopCharacter: 'classic',
        name: 'English IPA',
        family: 'ipa',
        og: r(1.05, 1.072),
        fg: r(1.01, 1.018),
        abv: r(5, 7.5),
        ibu: r(40, 60),
        ebc: r(12, 28),
        sensory: {
            phenols: r(0, 2),
            hopAroma: r(3, 6.5),
            bitterness: r(5, 7.5),
            malt: r(3.5, 6),
            hopFlavour: r(3.5, 6.5),
            fruitEsters: r(2.5, 5.5)
        },
        blurb: 'Earthy, marmalade-tinged bitterness on a biscuit malt base.'
    },
    {
        id: 'session-ipa',
        hopCharacter: 'modern',
        name: 'Session IPA',
        family: 'ipa',
        og: r(1.036, 1.048),
        fg: r(1.006, 1.012),
        abv: r(3.2, 5),
        ibu: r(30, 55),
        ebc: r(6, 16),
        sensory: {
            phenols: r(0, 2),
            hopAroma: r(5, 9),
            bitterness: r(4.5, 7),
            body: r(1.5, 4),
            malt: r(1, 3.5)
        },
        blurb: 'All the aroma of an IPA at half the strength.'
    },
    {
        id: 'ipa',
        hopCharacter: 'modern',
        name: 'American IPA',
        family: 'ipa',
        og: r(1.056, 1.07),
        fg: r(1.008, 1.014),
        abv: r(5.5, 7.5),
        ibu: r(40, 70),
        ebc: r(12, 28),
        sensory: {
            phenols: r(0, 2),
            bitterness: r(5.5, 8),
            hopAroma: r(6, 10),
            hopFlavour: r(5.5, 9),
            malt: r(2, 4.5)
        },
        blurb: 'Bitter, aromatic and unapologetic.'
    },
    {
        id: 'neipa',
        hopCharacter: 'modern',
        name: 'Hazy IPA',
        family: 'ipa',
        og: r(1.06, 1.085),
        fg: r(1.01, 1.018),
        abv: r(6, 9),
        ibu: r(20, 55),
        ebc: r(8, 18),
        sensory: {
            phenols: r(0, 2),
            hopAroma: r(7, 10),
            bitterness: r(2.5, 5.5),
            body: r(5, 8.5),
            sweetness: r(3, 6),
            fruitEsters: r(3.5, 7)
        },
        blurb: 'Soft, juicy and opaque. Aroma over bitterness, deliberately.'
    },
    {
        id: 'double-ipa',
        hopCharacter: 'modern',
        name: 'Double IPA',
        family: 'ipa',
        og: r(1.065, 1.09),
        fg: r(1.008, 1.018),
        abv: r(7.5, 10.5),
        ibu: r(55, 100),
        ebc: r(12, 30),
        sensory: {
            phenols: r(0, 2),
            bitterness: r(6.5, 9.5),
            hopAroma: r(6.5, 10),
            alcoholWarmth: r(3, 6.5),
            malt: r(2, 5)
        },
        blurb: 'Everything an IPA does, turned up until it nearly breaks.'
    },
    {
        id: 'porter',
        hopCharacter: 'classic',
        name: 'Porter',
        family: 'dark',
        og: r(1.048, 1.065),
        fg: r(1.012, 1.018),
        abv: r(4.8, 6.5),
        ibu: r(25, 45),
        ebc: r(45, 80),
        sensory: {
            phenols: r(0, 2),
            hopAroma: r(0, 3),
            roast: r(4, 7),
            caramel: r(2.5, 5.5),
            malt: r(4, 7),
            body: r(4.5, 7.5),
            bitterness: r(3.5, 6)
        },
        blurb: 'Chocolate and coffee without the charred edge of a stout.'
    },
    {
        id: 'dry-stout',
        hopCharacter: 'classic',
        name: 'Dry stout',
        family: 'dark',
        og: r(1.036, 1.05),
        fg: r(1.007, 1.011),
        abv: r(3.8, 5),
        ibu: r(25, 45),
        ebc: r(50, 80),
        sensory: {
            phenols: r(0, 2),
            hopAroma: r(0, 3),
            roast: r(6, 9),
            bitterness: r(5, 7.5),
            body: r(3, 5.5),
            sweetness: r(0, 2.5),
            crispness: r(4, 7)
        },
        blurb: 'Coffee-dry, sharply roasted, and lighter than it looks.'
    },
    {
        id: 'sweet-stout',
        hopCharacter: 'classic',
        name: 'Sweet stout',
        family: 'dark',
        og: r(1.044, 1.06),
        fg: r(1.014, 1.026),
        abv: r(4, 6),
        ibu: r(20, 40),
        ebc: r(50, 80),
        sensory: {
            phenols: r(0, 2),
            hopAroma: r(0, 2.5),
            sweetness: r(5, 8.5),
            roast: r(4, 7),
            body: r(5.5, 8.5),
            bitterness: r(2.5, 5)
        },
        blurb: 'Lactose-sweetened and soft, built for slow drinking.'
    },
    {
        id: 'imperial-stout',
        name: 'Imperial stout',
        family: 'strong',
        og: r(1.075, 1.115),
        fg: r(1.018, 1.032),
        abv: r(8, 12),
        ibu: r(50, 90),
        ebc: r(60, 100),
        sensory: {
            phenols: r(0, 2),
            hopAroma: r(0, 4),
            roast: r(6.5, 9.5),
            body: r(7, 10),
            alcoholWarmth: r(4.5, 8),
            bitterness: r(5, 8),
            sweetness: r(3, 6.5)
        },
        blurb: 'Viscous, roasted and warming. Built to age.'
    },
    {
        id: 'barleywine',
        name: 'Barleywine',
        family: 'strong',
        og: r(1.08, 1.12),
        fg: r(1.016, 1.032),
        abv: r(8, 12),
        ibu: r(35, 70),
        ebc: r(20, 45),
        sensory: {
            phenols: r(0, 2),
            hopAroma: r(0, 4),
            caramel: r(5, 8.5),
            alcoholWarmth: r(5, 8.5),
            body: r(6.5, 9.5),
            malt: r(6, 9),
            sweetness: r(3.5, 7)
        },
        blurb: 'Toffee, dried fruit and heat. A beer that keeps changing for years.'
    },
    {
        id: 'hefeweizen',
        hopCharacter: 'classic',
        name: 'Hefeweizen',
        family: 'wheat',
        og: r(1.044, 1.054),
        fg: r(1.008, 1.014),
        abv: r(4.3, 5.8),
        ibu: r(8, 16),
        ebc: r(4, 12),
        sensory: {
            fruitEsters: r(5, 9),
            phenols: r(4, 8),
            bitterness: r(0.5, 3),
            body: r(4, 7),
            hopAroma: r(0, 2)
        },
        blurb: 'Banana and clove, with a fluffy wheat body underneath.'
    },
    {
        id: 'witbier',
        hopCharacter: 'classic',
        name: 'Witbier',
        family: 'wheat',
        og: r(1.044, 1.054),
        fg: r(1.008, 1.012),
        abv: r(4.5, 5.6),
        ibu: r(8, 20),
        ebc: r(4, 8),
        sensory: {
            fruitEsters: r(1, 4),
            hopAroma: r(0, 2.5),
            phenols: r(2.5, 5.5),
            crispness: r(4.5, 7.5),
            body: r(3.5, 6),
            bitterness: r(1, 3.5),
            acidity: r(1, 3.5)
        },
        blurb: 'Pale, hazy and lightly spiced. Refreshment first.'
    },
    {
        id: 'dubbel',
        hopCharacter: 'classic',
        name: 'Dubbel',
        family: 'belgian',
        og: r(1.062, 1.078),
        fg: r(1.008, 1.018),
        abv: r(6, 7.8),
        ibu: r(15, 25),
        ebc: r(20, 40),
        sensory: {
            hopAroma: r(0, 2.5),
            caramel: r(4, 7.5),
            fruitEsters: r(5, 8.5),
            phenols: r(2, 5),
            malt: r(4.5, 7.5),
            bitterness: r(1.5, 4)
        },
        blurb: 'Raisin, rum and dark bread, and dry despite all of it.'
    },
    {
        id: 'tripel',
        hopCharacter: 'classic',
        name: 'Tripel',
        family: 'belgian',
        og: r(1.075, 1.088),
        fg: r(1.006, 1.014),
        abv: r(7.5, 9.5),
        ibu: r(20, 40),
        ebc: r(9, 14),
        sensory: {
            hopAroma: r(0, 3),
            fruitEsters: r(5.5, 9),
            phenols: r(3.5, 7),
            crispness: r(4.5, 8),
            alcoholWarmth: r(3, 6),
            sweetness: r(1.5, 4.5)
        },
        blurb: 'Pale, strong and dangerously dry. Sugar is the secret.'
    },
    {
        id: 'saison',
        hopCharacter: 'classic',
        name: 'Saison',
        family: 'belgian',
        og: r(1.048, 1.065),
        fg: r(1.002, 1.009),
        abv: r(5, 7.5),
        ibu: r(20, 38),
        ebc: r(10, 28),
        sensory: {
            hopAroma: r(0, 4),
            phenols: r(4, 8),
            crispness: r(6.5, 10),
            fruitEsters: r(4, 7.5),
            body: r(1, 3.5),
            sweetness: r(0, 2)
        },
        blurb: 'Peppery, bone dry and endlessly drinkable.'
    },
    {
        id: 'rauchbier',
        hopCharacter: 'classic',
        name: 'Rauchbier',
        family: 'sour & smoked',
        og: r(1.05, 1.06),
        fg: r(1.012, 1.016),
        abv: r(4.8, 6),
        ibu: r(20, 30),
        ebc: r(24, 44),
        sensory: {
            hopAroma: r(0, 2.5),
            phenols: r(5, 9),
            malt: r(4.5, 7.5),
            bitterness: r(2.5, 4.5),
            caramel: r(1.5, 4)
        },
        blurb: 'Beechwood smoke over a märzen. Divisive, and worth trying.'
    },
    {
        id: 'sour-wild',
        name: 'Sour / wild ale',
        family: 'sour & smoked',
        og: r(1.038, 1.065),
        fg: r(1.002, 1.01),
        abv: r(3.5, 7),
        ibu: r(2, 12),
        ebc: r(6, 30),
        requiresSouring: true,
        sensory: {
            hopAroma: r(0, 3),
            acidity: r(5, 9.5),
            bitterness: r(0, 2.5),
            crispness: r(6, 10),
            phenols: r(2, 6),
            sweetness: r(0, 2.5)
        },
        blurb: 'Tart, dry and complex. Time and culture do the work.'
    }
];
export const STYLE_BY_ID = new Map(STYLES.map((s)=>[
        s.id,
        s
    ]));
export function getStyle(id) {
    return STYLE_BY_ID.get(id);
}
export const STYLE_FAMILIES = [
    ...new Set(STYLES.map((s)=>s.family))
];
