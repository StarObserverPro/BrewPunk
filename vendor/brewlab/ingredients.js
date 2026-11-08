export const FERMENTABLES = [
    {
        id: 'pilsner',
        name: 'Pilsner malt',
        category: 'base',
        potential: 0.81,
        colourEbc: 3.5,
        maxShare: 1,
        diastatic: true,
        diastaticPowerLintner: 110,
        fermentability: 1,
        sensory: {
            malt: 3,
            crispness: 2
        },
        blurb: 'The palest, cleanest base malt there is: faintly honeyed, and it gets out of the way of everything else. What most European lagers are built on.',
        note: 'Kilned gently, so it keeps a high enzyme load and a delicate, slightly grainy sweetness. Rich in the precursor that turns into DMS, which is why pilsner malt likes a vigorous, uncovered 90 minute boil.'
    },
    {
        id: 'pale-ale',
        name: 'Pale ale malt',
        category: 'base',
        potential: 0.8,
        colourEbc: 6,
        maxShare: 1,
        diastatic: true,
        diastaticPowerLintner: 60,
        fermentability: 1,
        sensory: {
            malt: 3.5
        },
        blurb: 'Dried a little harder than pilsner malt, so it tastes of bread rather than honey. Forgiving, dependable, and the base of most ales.',
        note: 'The default base malt for ales. Plenty of diastatic power to convert itself and a reasonable load of adjuncts alongside it.'
    },
    {
        id: 'maris-otter',
        name: 'Maris Otter',
        category: 'base',
        potential: 0.81,
        colourEbc: 6.5,
        maxShare: 1,
        diastatic: true,
        diastaticPowerLintner: 45,
        fermentability: 0.99,
        sensory: {
            malt: 4.5,
            caramel: 0.5
        },
        blurb: 'An English barley variety with a nutty, biscuity depth that plain pale malt does not have. The base of a proper bitter.',
        note: 'A heritage barley variety kept alive by brewers rather than farmers. It gives more malt character than its colour suggests, which is why so many British bitters use nothing else.'
    },
    {
        id: 'vienna',
        name: 'Vienna malt',
        category: 'base',
        potential: 0.8,
        colourEbc: 8,
        maxShare: 0.9,
        diastatic: true,
        diastaticPowerLintner: 50,
        fermentability: 0.99,
        sensory: {
            malt: 5,
            caramel: 0.5
        },
        blurb: 'Toasted lightly, so it brings a warm golden colour and a hint of toast without any sweetness. Can be the whole base of a beer.',
        note: 'Kilned a little hotter than pale malt. Fine as 100% of a grist when you want a malt-forward beer that still finishes clean.'
    },
    {
        id: 'munich-light',
        name: 'Munich malt (light)',
        category: 'base',
        potential: 0.79,
        colourEbc: 15,
        maxShare: 0.7,
        diastatic: true,
        diastaticPowerLintner: 40,
        fermentability: 0.97,
        sensory: {
            malt: 6.5,
            caramel: 1
        },
        blurb: 'Toasted further than Vienna: deep bready flavour and a faint crust. Used as a share of the base to make a beer taste more of malt.',
        note: 'Retains just enough enzymes to convert itself. Use it as a base for märzen and bock, or as 10–20% of a pale grist to add malt depth without sweetness.'
    },
    {
        id: 'munich-dark',
        name: 'Munich malt (dark)',
        category: 'base',
        potential: 0.78,
        colourEbc: 30,
        maxShare: 0.5,
        diastatic: true,
        diastaticPowerLintner: 25,
        fermentability: 0.95,
        sensory: {
            malt: 8,
            caramel: 2
        },
        blurb: 'Darker still — rich toasted crust and an amber colour. A little goes a long way toward a malty, autumnal beer.',
        note: 'Low diastatic power, so it usually needs a pale base alongside it above about half the grist.'
    },
    {
        id: 'wheat-malt',
        name: 'Wheat malt',
        category: 'base',
        potential: 0.81,
        colourEbc: 4,
        maxShare: 0.7,
        diastatic: true,
        diastaticPowerLintner: 160,
        fermentability: 0.99,
        sensory: {
            malt: 2.5,
            body: 1.5
        },
        blurb: 'Wheat instead of barley. Its protein builds a dense, lasting foam and a soft haze; half a wheat beer is made of it.',
        note: 'Husk-free, so a large share makes the mash sticky and slow to run off. Rice hulls help above roughly 50%.'
    },
    {
        id: 'rye-malt',
        name: 'Rye malt',
        category: 'base',
        potential: 0.78,
        colourEbc: 7,
        maxShare: 0.35,
        diastatic: true,
        diastaticPowerLintner: 90,
        fermentability: 0.98,
        sensory: {
            malt: 3,
            body: 2,
            crispness: 1
        },
        blurb: 'Rye instead of barley: peppery, dry, and it gives the beer a slick, oily feel in the mouth. Sticky in the tun.',
        note: 'Extremely gummy in the mash. Rewarding in small amounts, and a genuine lautering hazard above a third of the grist.'
    },
    {
        id: 'smoked-malt',
        name: 'Smoked malt (beech)',
        category: 'base',
        potential: 0.79,
        colourEbc: 6,
        maxShare: 0.6,
        diastatic: true,
        diastaticPowerLintner: 55,
        fermentability: 0.99,
        sensory: {
            malt: 3,
            phenols: 9.5
        },
        blurb: 'Barley dried over a beechwood fire, so it tastes of smoke. A handful reads as savoury; half the grist is a campfire.',
        note: 'Traditional rauchbier uses 50–100%. At 5–10% it reads as savoury complexity rather than smoke.'
    },
    {
        id: 'flaked-oats',
        name: 'Flaked oats',
        category: 'adjunct',
        potential: 0.75,
        colourEbc: 2,
        maxShare: 0.3,
        diastatic: false,
        diastaticPowerLintner: 0,
        fermentability: 0.92,
        sensory: {
            body: 3.5,
            sweetness: 0.5
        },
        blurb: 'Rolled oats, as in porridge. No flavour to speak of, but a silky, full body and a soft haze — the secret of hazy IPAs and oatmeal stouts.',
        note: 'The beta-glucans that make oat beers feel creamy also make the mash gluey. 10–20% is the usual sweet spot.'
    },
    {
        id: 'flaked-wheat',
        name: 'Flaked wheat',
        category: 'adjunct',
        potential: 0.77,
        colourEbc: 3,
        maxShare: 0.4,
        diastatic: false,
        diastaticPowerLintner: 0,
        fermentability: 0.97,
        sensory: {
            body: 1.5
        },
        blurb: 'Rolled wheat, unmalted. Builds foam and a lasting haze, and tastes of very little on its own.',
        note: 'Unmalted, so it contributes no enzymes. Common in witbier and modern hazy IPA.'
    },
    {
        id: 'crystal-light',
        name: 'Crystal malt (light, 40 EBC)',
        category: 'speciality',
        potential: 0.75,
        colourEbc: 40,
        maxShare: 0.2,
        diastatic: false,
        diastaticPowerLintner: 0,
        fermentability: 0.75,
        sensory: {
            caramel: 3,
            sweetness: 1.5,
            body: 1
        },
        blurb: 'Malt that was stewed while wet so its sugar caramelised inside the grain. Light toffee and a golden glow; the yeast cannot eat much of it, so it sweetens as well as colours.',
        note: 'Stewed while still wet so the starch converts inside the husk, then kilned. The sugars it carries are largely unfermentable, which is why crystal malt sweetens as well as colours.'
    },
    {
        id: 'crystal-medium',
        name: 'Crystal malt (medium, 120 EBC)',
        category: 'speciality',
        potential: 0.74,
        colourEbc: 120,
        maxShare: 0.15,
        diastatic: false,
        diastaticPowerLintner: 0,
        fermentability: 0.7,
        sensory: {
            caramel: 5,
            sweetness: 2.5,
            body: 1.5
        },
        blurb: 'The same, stewed darker: caramel, dried fruit and a copper colour. Sweetens the beer and gives it body. Ten percent is plenty.',
        note: 'The traditional backbone of English bitters and American amber ales. Above roughly 12% it starts to taste sticky.'
    },
    {
        id: 'crystal-dark',
        name: 'Crystal malt (dark, 240 EBC)',
        category: 'speciality',
        potential: 0.72,
        colourEbc: 240,
        maxShare: 0.1,
        diastatic: false,
        diastaticPowerLintner: 0,
        fermentability: 0.65,
        sensory: {
            caramel: 6,
            sweetness: 2.5,
            roast: 1,
            body: 1.5
        },
        blurb: 'Stewed darker again: burnt sugar, raisin and the beginnings of roast. Strong stuff — a few percent is enough to notice.',
        note: 'Powerful. Beyond about 8% of the grist, dark crystal reads as cough syrup rather than caramel.'
    },
    {
        id: 'special-b',
        name: 'Special B',
        category: 'speciality',
        potential: 0.72,
        colourEbc: 300,
        maxShare: 0.08,
        diastatic: false,
        diastaticPowerLintner: 0,
        fermentability: 0.7,
        sensory: {
            caramel: 6,
            sweetness: 2,
            roast: 1.5
        },
        blurb: 'The darkest of the caramelised malts: raisin, plum and dark rum. The taste of Belgian abbey beers, and unmistakable.',
        note: 'A deeply stewed crystal malt. Two to five percent is usually plenty in a dubbel.'
    },
    {
        id: 'biscuit',
        name: 'Biscuit malt',
        category: 'speciality',
        potential: 0.77,
        colourEbc: 45,
        maxShare: 0.15,
        diastatic: false,
        diastaticPowerLintner: 0,
        fermentability: 0.98,
        sensory: {
            malt: 4,
            caramel: 0.5
        },
        blurb: 'Toasted like a digestive biscuit — bread crust and biscuit with no added sweetness. Used in small amounts for a toasty note.',
        note: 'Roasted rather than stewed, so it adds flavour and colour without the residual sugar of crystal malt.'
    },
    {
        id: 'aromatic',
        name: 'Aromatic malt',
        category: 'speciality',
        potential: 0.77,
        colourEbc: 50,
        maxShare: 0.15,
        diastatic: false,
        diastaticPowerLintner: 25,
        fermentability: 0.97,
        sensory: {
            malt: 6
        },
        blurb: 'Munich malt taken further, for a concentrated malt smell. A little makes a beer smell more of malt than it tastes.',
        note: 'A few percent lifts malt aroma noticeably. Large amounts turn muddy.'
    },
    {
        id: 'melanoidin',
        name: 'Melanoidin malt',
        category: 'speciality',
        potential: 0.76,
        colourEbc: 60,
        maxShare: 0.1,
        diastatic: false,
        diastaticPowerLintner: 20,
        fermentability: 0.96,
        sensory: {
            malt: 5,
            caramel: 1.5
        },
        blurb: 'Toasted to build the deep, bready flavour and red colour that long, old-fashioned boiling of the mash used to give. A shortcut to that.',
        note: 'Rich in Maillard products that a long decoction mash would otherwise create.'
    },
    {
        id: 'pale-chocolate',
        name: 'Pale chocolate malt',
        category: 'roast',
        potential: 0.71,
        colourEbc: 450,
        maxShare: 0.12,
        diastatic: false,
        diastaticPowerLintner: 0,
        fermentability: 0.9,
        sensory: {
            roast: 4,
            malt: 1
        },
        blurb: 'Roasted gently: cocoa and coffee-with-cream without any harsh edge. The soft way to make a porter dark.',
        note: 'Gentler than standard chocolate malt. Useful when you want colour and cocoa but not ash.'
    },
    {
        id: 'chocolate',
        name: 'Chocolate malt',
        category: 'roast',
        potential: 0.7,
        colourEbc: 700,
        maxShare: 0.1,
        diastatic: false,
        diastaticPowerLintner: 0,
        fermentability: 0.9,
        sensory: {
            roast: 6,
            caramel: 0.5
        },
        blurb: "Roasted hard: dark cocoa, espresso, and a deep brown colour. The backbone of a porter's flavour.",
        note: 'The backbone of porters. Five percent already reads clearly as roast.'
    },
    {
        id: 'carafa-special',
        name: 'Carafa Special III',
        category: 'roast',
        potential: 0.7,
        colourEbc: 1100,
        maxShare: 0.1,
        diastatic: false,
        diastaticPowerLintner: 0,
        fermentability: 0.9,
        sensory: {
            roast: 5
        },
        blurb: 'Roasted with the husk removed first, so it colours a beer black without the sharp, drying bitterness that roasting the husk gives. Colour without the bite.',
        note: 'The husk carries most of the harsh, tannic character of roasted grain. Removing it lets you reach black colour with a smooth palate.'
    },
    {
        id: 'roasted-barley',
        name: 'Roasted barley',
        category: 'roast',
        potential: 0.68,
        colourEbc: 1200,
        maxShare: 0.1,
        diastatic: false,
        diastaticPowerLintner: 0,
        fermentability: 0.9,
        sensory: {
            roast: 8,
            bitterness: 1.5,
            crispness: 1
        },
        blurb: 'Unmalted barley roasted until it is nearly black: dry coffee bitterness and a tan head. What makes Irish stout taste of Irish stout.',
        note: 'Unmalted and roasted hard. It contributes real bitterness alongside the hops, which is why dry stouts need less alpha acid than their flavour suggests.'
    },
    {
        id: 'black-malt',
        name: 'Black malt',
        category: 'roast',
        potential: 0.68,
        colourEbc: 1300,
        maxShare: 0.07,
        diastatic: false,
        diastaticPowerLintner: 0,
        fermentability: 0.9,
        sensory: {
            roast: 8,
            bitterness: 1,
            crispness: 1.5
        },
        blurb: 'Malt roasted to the edge of burnt: sharp, ashy and jet black. For colour more than for flavour, and very little is needed.',
        note: 'Mostly used in small amounts for colour adjustment. Above a few percent it turns acrid.'
    },
    {
        id: 'acidulated',
        name: 'Acidulated malt',
        category: 'speciality',
        potential: 0.79,
        colourEbc: 4,
        maxShare: 0.06,
        diastatic: false,
        diastaticPowerLintner: 0,
        fermentability: 1,
        sensory: {
            acidity: 1.5,
            crispness: 1
        },
        blurb: "Ordinary pale malt with a coating of lactic acid. It does not add flavour; it brings the mash's acidity down, which the enzymes want.",
        note: 'Roughly 1% of the grist drops mash pH by about 0.1. A clean way to acidify without touching a bottle of acid.'
    },
    {
        id: 'brewing-sugar',
        name: 'Brewing sugar (dextrose)',
        category: 'sugar',
        potential: 1,
        colourEbc: 0,
        maxShare: 0.2,
        diastatic: false,
        diastaticPowerLintner: 0,
        fermentability: 1.35,
        sensory: {
            crispness: 1.5,
            alcoholWarmth: 0.5
        },
        blurb: 'Plain sugar (dextrose). The yeast eats all of it, so it adds alcohol without adding any body — it makes a beer thinner and stronger.',
        note: 'Belgian brewers use sugar to reach high strength while keeping the beer drinkable. Above roughly 20% the beer starts to taste thin and cidery.'
    },
    {
        id: 'candi-dark',
        name: 'Dark candi sugar',
        category: 'sugar',
        potential: 0.78,
        colourEbc: 300,
        maxShare: 0.2,
        diastatic: false,
        diastaticPowerLintner: 0,
        fermentability: 1.25,
        sensory: {
            caramel: 3,
            malt: 1,
            alcoholWarmth: 0.5
        },
        blurb: 'Belgian caramelised sugar syrup: dried fruit, toffee and rum, and the yeast still eats nearly all of it. Alcohol and flavour without body.',
        note: 'The trick behind dubbels: dark, complex flavour that ferments almost completely away, leaving depth without sweetness.'
    },
    {
        id: 'lactose',
        name: 'Lactose',
        category: 'sugar',
        potential: 0.75,
        colourEbc: 2,
        maxShare: 0.12,
        diastatic: false,
        diastaticPowerLintner: 0,
        fermentability: 0,
        sensory: {
            sweetness: 5,
            body: 2
        },
        blurb: 'Milk sugar. Brewing yeast cannot eat it at all, so every gram stays in the beer as sweetness and body. What makes a milk stout sweet.',
        note: 'Everything you add stays in the glass as sweetness and body. Use it deliberately, and remember it raises FG without raising ABV.'
    },
    {
        id: 'honey-malt',
        name: 'Honey malt',
        category: 'speciality',
        potential: 0.76,
        colourEbc: 50,
        maxShare: 0.1,
        diastatic: false,
        diastaticPowerLintner: 0,
        fermentability: 0.8,
        sensory: {
            sweetness: 2.5,
            malt: 3,
            caramel: 1.5
        },
        blurb: 'A malt with an intense honeyed sweetness. A little in a pale beer is lovely; more than a little is cloying.',
        note: 'Distinctive and easy to overdo. Three to five percent is usually enough to notice.'
    }
];
export const FERMENTABLE_BY_ID = new Map(FERMENTABLES.map((f)=>[
        f.id,
        f
    ]));
export function getFermentable(id) {
    return FERMENTABLE_BY_ID.get(id);
}
export const HOPS = [
    {
        id: 'hallertau-mf',
        name: 'Hallertau Mittelfrüh',
        origin: 'German',
        alphaAcid: 4,
        aromaIntensity: 0.8,
        bitternessQuality: 0.8,
        tags: [
            'floral',
            'herbal',
            'spicy'
        ],
        blurb: 'The classic German hop: soft, flowery and slightly herbal, with a gentle bitterness. Ideal for a lager.'
    },
    {
        id: 'tettnanger',
        name: 'Tettnanger',
        origin: 'German',
        alphaAcid: 4.5,
        aromaIntensity: 0.8,
        bitternessQuality: 0.8,
        tags: [
            'spicy',
            'herbal',
            'floral'
        ],
        blurb: 'A delicate German hop, a little peppery and a touch brighter than Hallertau. Lagers and wheat beers.'
    },
    {
        id: 'spalt-select',
        name: 'Spalt Select',
        origin: 'German',
        alphaAcid: 4.5,
        aromaIntensity: 0.75,
        bitternessQuality: 0.8,
        tags: [
            'floral',
            'spicy',
            'herbal'
        ],
        blurb: 'Refined and restrained: the hop for a pilsner or an altbier that wants its bitterness to stay in the background.'
    },
    {
        id: 'hersbrucker',
        name: 'Hersbrucker',
        origin: 'German',
        alphaAcid: 3.5,
        aromaIntensity: 0.75,
        bitternessQuality: 0.8,
        tags: [
            'floral',
            'herbal',
            'earthy'
        ],
        blurb: 'Gentle hay and wildflower. The quiet hop in many German lagers.'
    },
    {
        id: 'saphir',
        name: 'Saphir',
        origin: 'German',
        alphaAcid: 3.5,
        aromaIntensity: 0.9,
        bitternessQuality: 0.75,
        tags: [
            'citrus',
            'floral',
            'herbal'
        ],
        blurb: 'A modern German hop with a tangerine brightness the older ones lack, and still soft enough for a lager.'
    },
    {
        id: 'perle',
        name: 'Perle',
        origin: 'German',
        alphaAcid: 8,
        aromaIntensity: 0.85,
        bitternessQuality: 0.85,
        tags: [
            'spicy',
            'floral',
            'herbal'
        ],
        blurb: 'A clean bittering hop with a minty, green edge. Bitterness first, aroma second.'
    },
    {
        id: 'magnum',
        name: 'Magnum',
        origin: 'German',
        alphaAcid: 13,
        aromaIntensity: 0.4,
        bitternessQuality: 0.6,
        tags: [
            'herbal',
            'earthy'
        ],
        blurb: 'Almost no aroma at all. Chosen for a smooth bitterness that gets out of the way — the workhorse for the early kettle charge.'
    },
    {
        id: 'herkules',
        name: 'Herkules',
        origin: 'German',
        alphaAcid: 16,
        aromaIntensity: 0.5,
        bitternessQuality: 0.75,
        tags: [
            'resin',
            'spicy',
            'earthy'
        ],
        blurb: 'A strong bittering hop with a faint earthy, resinous undertone. A little goes a long way.'
    },
    {
        id: 'saaz',
        name: 'Saaz',
        origin: 'Czech',
        alphaAcid: 3.5,
        aromaIntensity: 0.8,
        bitternessQuality: 0.7,
        tags: [
            'spicy',
            'herbal',
            'earthy'
        ],
        blurb: 'Soft, hay-like and spicy. The smell of a Czech pilsner, and gentle enough to use in quantity.'
    },
    {
        id: 'styrian-goldings',
        name: 'Styrian Goldings',
        origin: 'Slovenian',
        alphaAcid: 4.5,
        aromaIntensity: 0.85,
        bitternessQuality: 0.75,
        tags: [
            'earthy',
            'floral',
            'herbal'
        ],
        blurb: 'Elegant and slightly lemony, related to the English Fuggle but brighter. Traditional in Belgian and English ales.'
    },
    {
        id: 'strisselspalt',
        name: 'Strisselspalt',
        origin: 'French',
        alphaAcid: 3.5,
        aromaIntensity: 0.75,
        bitternessQuality: 0.75,
        tags: [
            'floral',
            'herbal',
            'citrus'
        ],
        blurb: 'The French hop from Alsace: pear and blossom, light and pretty. Lagers and Belgian styles.'
    },
    {
        id: 'ekg',
        name: 'East Kent Goldings',
        origin: 'English',
        alphaAcid: 5.5,
        aromaIntensity: 0.85,
        bitternessQuality: 0.7,
        tags: [
            'floral',
            'earthy',
            'herbal'
        ],
        blurb: 'East Kent Goldings, the classic English aroma hop: honeyed, faintly of lavender, and deeply traditional. Bitters and pale ales.'
    },
    {
        id: 'fuggle',
        name: 'Fuggle',
        origin: 'English',
        alphaAcid: 4.5,
        aromaIntensity: 0.8,
        bitternessQuality: 0.7,
        tags: [
            'earthy',
            'herbal',
            'floral'
        ],
        blurb: 'Earthy, like a woodland floor, with a little mint. With Goldings it is the other half of English brewing.'
    },
    {
        id: 'challenger',
        name: 'Challenger',
        origin: 'English',
        alphaAcid: 7.5,
        aromaIntensity: 0.85,
        bitternessQuality: 0.75,
        tags: [
            'spicy',
            'floral',
            'citrus'
        ],
        blurb: 'An English all-rounder: clean bitterness early, a marmalade note when added late.'
    },
    {
        id: 'target',
        name: 'Target',
        origin: 'English',
        alphaAcid: 11,
        aromaIntensity: 0.8,
        bitternessQuality: 0.95,
        tags: [
            'resin',
            'earthy',
            'herbal'
        ],
        blurb: 'Assertive and sage-like: bitterness with shoulders. The English bittering hop.'
    },
    {
        id: 'bramling-cross',
        name: 'Bramling Cross',
        origin: 'English',
        alphaAcid: 6,
        aromaIntensity: 0.9,
        bitternessQuality: 0.75,
        tags: [
            'berry',
            'spicy',
            'earthy'
        ],
        blurb: 'Blackcurrant and lemon — an English hop that tastes like a modern American one. Good in a dark beer.'
    },
    {
        id: 'first-gold',
        name: 'First Gold',
        origin: 'English',
        alphaAcid: 7.5,
        aromaIntensity: 0.85,
        bitternessQuality: 0.75,
        tags: [
            'citrus',
            'floral',
            'spicy'
        ],
        blurb: 'Orange peel and a hint of apricot over an English base. A gentle way into fruitier hopping.'
    },
    {
        id: 'cascade',
        name: 'Cascade',
        origin: 'American',
        alphaAcid: 5.5,
        aromaIntensity: 1,
        bitternessQuality: 0.8,
        tags: [
            'citrus',
            'floral'
        ],
        blurb: 'Grapefruit and flowers. The hop that started American craft brewing, and still the easiest one to like.'
    },
    {
        id: 'centennial',
        name: 'Centennial',
        origin: 'American',
        alphaAcid: 10,
        aromaIntensity: 1.05,
        bitternessQuality: 0.85,
        tags: [
            'citrus',
            'floral',
            'resin'
        ],
        blurb: 'Lemon and pine, stronger than Cascade in every way. Sometimes called super Cascade.'
    },
    {
        id: 'chinook',
        name: 'Chinook',
        origin: 'American',
        alphaAcid: 13,
        aromaIntensity: 1.05,
        bitternessQuality: 1.05,
        tags: [
            'pine',
            'resin',
            'citrus'
        ],
        blurb: 'Pine forest and grapefruit pith with a firm, assertive bitterness. The old-school IPA hop.'
    },
    {
        id: 'columbus',
        name: 'Columbus',
        origin: 'American',
        alphaAcid: 15,
        aromaIntensity: 1.1,
        bitternessQuality: 1,
        tags: [
            'dank',
            'resin',
            'earthy'
        ],
        blurb: 'Pungent, oily and herbal — the smell people mean by dank. Loud, and it makes a strong bittering hop too.'
    },
    {
        id: 'simcoe',
        name: 'Simcoe',
        origin: 'American',
        alphaAcid: 13,
        aromaIntensity: 1.15,
        bitternessQuality: 0.9,
        tags: [
            'pine',
            'berry',
            'tropical'
        ],
        blurb: 'Pine and passionfruit at the same time, with a savoury edge. The signature of many modern IPAs.'
    },
    {
        id: 'citra',
        name: 'Citra',
        origin: 'American',
        alphaAcid: 12,
        aromaIntensity: 1.3,
        bitternessQuality: 0.8,
        tags: [
            'citrus',
            'tropical',
            'stone-fruit'
        ],
        blurb: 'Mango, lime and grapefruit, loud in the best way. The most popular hop in the world, and you can taste why.'
    },
    {
        id: 'mosaic',
        name: 'Mosaic',
        origin: 'American',
        alphaAcid: 12.5,
        aromaIntensity: 1.3,
        bitternessQuality: 0.85,
        tags: [
            'tropical',
            'berry',
            'dank'
        ],
        blurb: 'Blueberry and mango over an earthy, resinous base. Complex, and made for late additions.'
    },
    {
        id: 'amarillo',
        name: 'Amarillo',
        origin: 'American',
        alphaAcid: 9,
        aromaIntensity: 1.15,
        bitternessQuality: 0.8,
        tags: [
            'citrus',
            'stone-fruit',
            'floral'
        ],
        blurb: 'Orange, apricot and blossom. Soft and fruity; hard to overdo.'
    },
    {
        id: 'willamette',
        name: 'Willamette',
        origin: 'American',
        alphaAcid: 5,
        aromaIntensity: 0.8,
        bitternessQuality: 0.7,
        tags: [
            'floral',
            'earthy',
            'herbal'
        ],
        blurb: 'The American cousin of Fuggle: mild, earthy and a little fruity. Porters and brown ales.'
    },
    {
        id: 'el-dorado',
        name: 'El Dorado',
        origin: 'American',
        alphaAcid: 14,
        aromaIntensity: 1.2,
        bitternessQuality: 0.8,
        tags: [
            'tropical',
            'stone-fruit',
            'citrus'
        ],
        blurb: 'Pear drop, watermelon and candied pineapple. Sweet-smelling, almost like boiled sweets.'
    },
    {
        id: 'sorachi-ace',
        name: 'Sorachi Ace',
        origin: 'Japanese',
        alphaAcid: 13,
        aromaIntensity: 1.2,
        bitternessQuality: 0.85,
        tags: [
            'citrus',
            'herbal'
        ],
        blurb: 'Lemon zest and fresh dill. People love it or hate it, and nobody forgets it.'
    },
    {
        id: 'nelson-sauvin',
        name: 'Nelson Sauvin',
        origin: 'New Zealand',
        alphaAcid: 12,
        aromaIntensity: 1.25,
        bitternessQuality: 0.9,
        tags: [
            'tropical',
            'stone-fruit',
            'resin'
        ],
        blurb: 'Gooseberry and white wine — named for the Sauvignon Blanc grape it smells like. A New Zealand original.'
    },
    {
        id: 'motueka',
        name: 'Motueka',
        origin: 'New Zealand',
        alphaAcid: 7,
        aromaIntensity: 1.1,
        bitternessQuality: 0.75,
        tags: [
            'citrus',
            'tropical',
            'herbal'
        ],
        blurb: "Lime and lemongrass over a soft, lager-friendly base. New Zealand's answer to Saaz."
    },
    {
        id: 'riwaka',
        name: 'Riwaka',
        origin: 'New Zealand',
        alphaAcid: 5.5,
        aromaIntensity: 1.25,
        bitternessQuality: 0.75,
        tags: [
            'citrus',
            'tropical',
            'stone-fruit'
        ],
        blurb: 'Intense grapefruit and passionfruit from a hop that is not especially bitter. All about the smell.'
    },
    {
        id: 'galaxy',
        name: 'Galaxy',
        origin: 'Australian',
        alphaAcid: 14,
        aromaIntensity: 1.35,
        bitternessQuality: 0.9,
        tags: [
            'tropical',
            'citrus',
            'stone-fruit'
        ],
        blurb: "Passionfruit and peach at full volume. Australia's loudest hop, and a favourite in hazy IPAs."
    },
    {
        id: 'vic-secret',
        name: 'Vic Secret',
        origin: 'Australian',
        alphaAcid: 17,
        aromaIntensity: 1.2,
        bitternessQuality: 0.9,
        tags: [
            'tropical',
            'pine',
            'stone-fruit'
        ],
        blurb: 'Pineapple and pine needles, with real bittering power behind them.'
    },
    {
        id: 'ella',
        name: 'Ella',
        origin: 'Australian',
        alphaAcid: 14,
        aromaIntensity: 1.05,
        bitternessQuality: 0.85,
        tags: [
            'floral',
            'spicy',
            'stone-fruit'
        ],
        blurb: 'Aniseed and grapefruit when used generously; delicate and floral when restrained.'
    }
];
export const HOP_BY_ID = new Map(HOPS.map((h)=>[
        h.id,
        h
    ]));
export function getHop(id) {
    return HOP_BY_ID.get(id);
}
export const YEASTS = [
    {
        id: 'american-ale',
        name: 'Clean American ale',
        kind: 'ale',
        attenuation: 0.78,
        tempMinC: 15,
        tempMaxC: 22,
        tempIdealC: 19,
        flocculation: 'medium',
        esterBase: 1.2,
        phenolBase: 0,
        tempSensitivity: 0.5,
        souring: 0,
        alcoholTolerance: 0.11,
        esterNotes: [
            'a clean, almost neutral fruitiness',
            'a light note of pear'
        ],
        blurb: 'Neutral and dependable: it makes alcohol and very little else, so the malt and the hops do the talking. The safe choice for a pale ale or an IPA.',
        note: 'The default choice for American pale ales and IPAs. Its neutrality is the point: almost nothing it produces distracts from the hops.'
    },
    {
        id: 'english-ale',
        name: 'English ale',
        kind: 'ale',
        attenuation: 0.7,
        tempMinC: 16,
        tempMaxC: 22,
        tempIdealC: 19,
        flocculation: 'high',
        esterBase: 4,
        phenolBase: 0,
        tempSensitivity: 0.8,
        souring: 0,
        alcoholTolerance: 0.1,
        esterNotes: [
            'a soft orchard-fruit note',
            'pear drops and orange marmalade'
        ],
        blurb: 'Fruity and a little sweet, and it leaves some body behind. Drops clear quickly. The taste of an English bitter.',
        note: 'Low attenuation leaves body and sweetness behind, which is exactly what a bitter needs. High flocculation can stall if the beer is left cold and undisturbed.'
    },
    {
        id: 'irish-ale',
        name: 'Irish ale',
        kind: 'ale',
        attenuation: 0.73,
        tempMinC: 17,
        tempMaxC: 22,
        tempIdealC: 19,
        flocculation: 'medium',
        esterBase: 2.2,
        phenolBase: 0,
        tempSensitivity: 0.6,
        souring: 0,
        alcoholTolerance: 0.11,
        esterNotes: [
            'a faint dark-fruit note',
            'plum and a touch of raisin'
        ],
        blurb: 'Slightly fruity with a dry, mineral finish that stands up to roasted grain. Built for stout.',
        note: 'Built for stout: it tolerates roast bitterness and finishes crisply without stripping the malt.'
    },
    {
        id: 'neipa-ale',
        name: 'Hazy IPA ale',
        kind: 'ale',
        attenuation: 0.75,
        tempMinC: 18,
        tempMaxC: 23,
        tempIdealC: 20,
        flocculation: 'low',
        esterBase: 5,
        phenolBase: 0,
        tempSensitivity: 0.9,
        souring: 0,
        alcoholTolerance: 0.11,
        esterNotes: [
            'a quiet stone-fruit note',
            'peach and apricot'
        ],
        blurb: 'Peach-and-apricot fruitiness, and it stays in suspension so the beer keeps a soft, permanent haze. Made for hazy IPAs.',
        note: 'Low flocculation keeps yeast in suspension, which is part of why hazy IPAs stay hazy. Its esters are chosen to echo tropical hop aroma rather than compete with it.'
    },
    {
        id: 'belgian-abbey',
        name: 'Belgian abbey',
        kind: 'ale',
        attenuation: 0.8,
        tempMinC: 18,
        tempMaxC: 26,
        tempIdealC: 21,
        flocculation: 'medium',
        esterBase: 6,
        phenolBase: 3,
        tempSensitivity: 1.1,
        souring: 0,
        alcoholTolerance: 0.13,
        esterNotes: [
            'a gentle banana note',
            'banana, pear and something candied'
        ],
        phenolNotes: 'clove and a dusting of pepper',
        blurb: 'Banana, pear and a warm, peppery spice. Ferments strong beers happily. The character of Belgian abbey ales.',
        note: 'Traditionally allowed to free-rise during fermentation. That rising temperature is what builds the ester ladder of a dubbel or tripel.'
    },
    {
        id: 'saison',
        name: 'Saison',
        kind: 'ale',
        attenuation: 0.88,
        tempMinC: 20,
        tempMaxC: 32,
        tempIdealC: 26,
        flocculation: 'low',
        esterBase: 6,
        phenolBase: 5,
        tempSensitivity: 0.85,
        souring: 0.5,
        alcoholTolerance: 0.13,
        esterNotes: [
            'a light note of citrus peel',
            'pear, citrus peel and a spirity lift'
        ],
        phenolNotes: 'white pepper',
        blurb: 'Eats almost every last bit of sugar, so the beer finishes bone dry, with pepper and citrus peel from the yeast. Likes it warm.',
        note: 'Famous for stalling around 1.030 and then finishing if kept warm. Saison strains genuinely prefer heat, so the usual warning about hot fermentation applies much later than normal.'
    },
    {
        id: 'hefeweizen',
        name: 'Hefeweizen',
        kind: 'ale',
        attenuation: 0.75,
        tempMinC: 17,
        tempMaxC: 24,
        tempIdealC: 19,
        flocculation: 'low',
        esterBase: 7,
        phenolBase: 7,
        tempSensitivity: 1.3,
        souring: 0,
        alcoholTolerance: 0.1,
        esterNotes: [
            'a quiet banana note',
            'banana and bubblegum'
        ],
        phenolNotes: 'clove, with vanilla behind',
        blurb: 'Banana and clove, and the balance between them is set by how warm you ferment. The whole flavour of a German wheat beer.',
        note: 'Cooler fermentation favours clove-like phenols, warmer favours banana esters. Few strains give the brewer this much direct control over flavour.'
    },
    {
        id: 'kolsch',
        name: 'Kölsch',
        kind: 'ale',
        attenuation: 0.76,
        tempMinC: 14,
        tempMaxC: 20,
        tempIdealC: 17,
        flocculation: 'high',
        esterBase: 2,
        phenolBase: 0,
        tempSensitivity: 0.9,
        souring: 0,
        alcoholTolerance: 0.11,
        esterNotes: [
            'almost nothing — a whisper of white wine',
            'pear, and a faint sulphur edge'
        ],
        blurb: 'An ale yeast that behaves like a lager yeast: a whisper of fruit, a crisp finish, and very clean. Kölsch, and clean pale beers.',
        note: 'Fermented cool and then lagered, it produces a beer most drinkers would guess was bottom-fermented.'
    },
    {
        id: 'czech-lager',
        name: 'Czech lager',
        kind: 'lager',
        attenuation: 0.73,
        tempMinC: 8,
        tempMaxC: 14,
        tempIdealC: 11,
        flocculation: 'high',
        esterBase: 0.8,
        phenolBase: 0,
        tempSensitivity: 1.2,
        souring: 0,
        alcoholTolerance: 0.1,
        esterNotes: [
            'nothing fruity at all',
            'a green-apple note that has no business being there'
        ],
        blurb: 'Fermented cold and slowly: soft, malty, and it leaves a little sweetness behind. For pilsners and dark lagers.',
        note: 'Lager strains work slowly and produce diacetyl on the way. A warm rest at the end of fermentation is how brewers clean it up.'
    },
    {
        id: 'german-lager',
        name: 'German lager',
        kind: 'lager',
        attenuation: 0.77,
        tempMinC: 9,
        tempMaxC: 15,
        tempIdealC: 12,
        flocculation: 'medium',
        esterBase: 0.6,
        phenolBase: 0,
        tempSensitivity: 1.2,
        souring: 0,
        alcoholTolerance: 0.11,
        esterNotes: [
            'nothing fruity at all',
            'a green-apple note that has no business being there'
        ],
        blurb: 'Fermented cold: crisp, dry and almost invisible, so the malt and the hops are all you taste. Needs weeks, not days.',
        note: 'The most unforgiving yeast in this list: with nothing to hide behind, every process flaw shows up in the glass.'
    },
    {
        id: 'california-lager',
        name: 'California lager',
        kind: 'lager',
        attenuation: 0.76,
        tempMinC: 14,
        tempMaxC: 20,
        tempIdealC: 17,
        flocculation: 'high',
        esterBase: 1.5,
        phenolBase: 0,
        tempSensitivity: 0.7,
        souring: 0,
        alcoholTolerance: 0.11,
        esterNotes: [
            'a clean, faintly fruity note',
            'pear and melon'
        ],
        blurb: 'A lager yeast that puts up with ale temperatures. Clean and crisp without a fridge — the steam-beer yeast.',
        note: 'Used for steam beer. It gives lager-like cleanliness without refrigeration, at the cost of a slight woody fruitiness.'
    },
    {
        id: 'kveik-voss',
        name: 'Kveik (Voss)',
        kind: 'ale',
        attenuation: 0.82,
        tempMinC: 25,
        tempMaxC: 40,
        tempIdealC: 32,
        flocculation: 'high',
        esterBase: 5,
        phenolBase: 0,
        tempSensitivity: 0.35,
        souring: 0,
        alcoholTolerance: 0.14,
        esterNotes: [
            'a soft citrus note',
            'orange peel, mango and tropical fruit'
        ],
        blurb: 'A Norwegian farmhouse yeast that ferments hot and astonishingly fast — done in days — and tastes of orange peel. Forgiving.',
        note: 'Kveik breaks the usual rule that hot fermentation means fusel alcohol. At 35 °C it can finish a beer in two days and still taste clean.'
    },
    {
        id: 'brett-blend',
        name: 'Brett-forward blend',
        kind: 'wild',
        attenuation: 0.88,
        tempMinC: 18,
        tempMaxC: 26,
        tempIdealC: 22,
        flocculation: 'low',
        esterBase: 5,
        phenolBase: 5,
        tempSensitivity: 0.7,
        souring: 2,
        alcoholTolerance: 0.12,
        esterNotes: [
            'a dry, faintly earthy note',
            'pineapple, hay and horse blanket'
        ],
        phenolNotes: 'barnyard',
        blurb: 'A wild yeast alongside a normal one: pineapple, hay and barnyard funk, and it eats sugars other yeasts leave, so the beer ends very dry. Slow.',
        note: 'Brettanomyces slowly consumes sugars other yeasts leave behind, so these beers keep drying out for months in the bottle.'
    },
    {
        id: 'mixed-sour',
        name: 'Mixed sour culture',
        kind: 'wild',
        attenuation: 0.85,
        tempMinC: 18,
        tempMaxC: 30,
        tempIdealC: 24,
        flocculation: 'low',
        esterBase: 4,
        phenolBase: 3,
        tempSensitivity: 0.6,
        souring: 6,
        alcoholTolerance: 0.12,
        esterNotes: [
            'a clean lactic tang',
            'lemon, green apple and a lactic sharpness'
        ],
        blurb: 'Souring bacteria alongside yeast: a clean tartness and depth, like a good yoghurt. For sour beers only — it will sour anything it touches.',
        note: 'Lactobacillus is inhibited by hops, so soured beers are traditionally brewed with very low bitterness. High IBU and a sour culture fight each other.'
    }
];
export const YEAST_BY_ID = new Map(YEASTS.map((y)=>[
        y.id,
        y
    ]));
export function getYeast(id) {
    return YEAST_BY_ID.get(id);
}
