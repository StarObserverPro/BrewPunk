// The ranges below are the published BJCP 2021 style benchmarks, not house recipes.
// Saison here is the pale, standard-strength entry.
const guides = [
  ["english-bitter", "11B", "英式优选苦啤", "best-bitter", [8,16], [25,40], [3.8,4.6]],
  ["marzen", "6A", "三月啤酒", "marzen", [8,17], [18,24], [5.6,6.3]],
  ["dry-stout", "15B", "爱尔兰干世涛", "irish-stout", [25,40], [25,45], [3.8,5]],
  ["milk-stout", "16A", "甜世涛", "sweet-stout", [30,40], [20,40], [4,6]],
  ["saison", "25B", "赛松（浅色、标准强度）", "saison", [5,14], [20,35], [5,7]],
  ["dubbel", "26B", "比利时双料", "belgian-dubbel", [10,17], [15,25], [6,7.6]],
  ["hefeweizen", "10A", "德式小麦啤酒", "weissbier", [2,6], [8,15], [4.3,5.6]],
  ["rauchbier", "6B", "德式烟熏啤酒", "rauchbier", [12,22], [20,30], [4.8,6]],
  ["munich-helles", "4A", "慕尼黑淡色拉格", "munich-helles", [3,5], [16,22], [4.7,5.4]],
  ["witbier", "24A", "比利时白啤", "witbier", [2,4], [8,20], [4.5,5.5]],
  ["gose", "23G", "古斯", "gose", [3,4], [5,12], [4.2,4.8]],
  ["english-porter", "13C", "英式波特", "english-porter", [20,30], [18,35], [4,5.4]],
  ["tripel", "26C", "比利时三料", "belgian-tripel", [4.5,7], [20,40], [7.5,9.5]],
];

export const STYLE_BENCHMARKS = Object.fromEntries(guides.map(([id, code, name, slug, colorSRM, bitternessIBU, alcoholABV]) => [
  id, {
    code, name, colorSRM, bitternessIBU, alcoholABV,
    source: `https://styles.bjcp.org/bjcp-2021-beer/${parseInt(code,10)}/${code.toLowerCase()}-${slug}`,
  },
]));
