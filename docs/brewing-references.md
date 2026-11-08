# 家酿底稿与模型参照

引擎可以查到两类数值。单锅比重、用量和发酵温度来自酿酒师配方或供应商工艺说明。风格区间来自 BJCP 2021，描述同一风格可以容纳哪些结果。以下为整理者摘要。

|ID|参照对象|可核对的参数或感官特征|
|---|---|---|
|sn-pale|[Sierra Nevada Pale Ale](https://sierranevada.com/blog/our-beer/pale-ale-homebrew-recipe)|Cascade 的柑橘与松香可以和轻焦糖麦芽味同时出现，颜色约 10–12 SRM。|
|sn-torpedo|[Sierra Nevada Torpedo](https://sierranevada.com/blog/our-beer/torpedo-ipa-homebrew-recipe)|酒厂家酿版用 Chico 酵母，约 20°C 接种。|
|punk-ipa|[BrewDog DIY Dog，第 2 号配方](https://d1fnkk8n0t8a0e.cloudfront.net/docs/DIY_DOG_Combined_LR.pdf)|Punk IPA 配方列出 19°C 发酵，供现代酒花型 IPA 比较。|
|hanella|[AHA · Hanella Hazy IPA](https://www.homebrewersassociation.org/homebrew-recipe/hanella-hazy-ipa/)|Ross Stuart 的浑浊 IPA 公开摘要列出 OG 1.061、FG 1.012，为麦汁浓度和主发酵终点提供了具体对照。|
|jabba|[AHA 与 Lallemand · Jabba Juice](https://homebrewersassociation.org/wp-content/uploads/2024/04/AHA-BigBrew24-Homebrew-Recipe_Jabba-Juice-Hazy-IPA.pdf)|OG 1.064，约第 3 天干投，接触约 5 天。|
|pilz|[AHA · Pilz](https://homebrewersassociation.org/homebrew-recipe/pilz-czech-pale-lager/)|捷克浅色拉格的公开配方摘要给出 OG 1.042、FG 1.009、40 IBU、3.3 SRM。浅色与明显苦味可以并存。|
|star-maker|[AHA · Star Maker](https://homebrewersassociation.org/homebrew-recipe/star-maker-imperial-stout/)|帝国世涛的公开摘要给出 OG 1.144、FG 1.033、72 IBU、70.2 SRM。与 Pilz 对比，同样的苦度读数要结合残糖与烘烤感解释。|
|lal-souring|[Lallemand 酸化工艺指南](https://admin.lallemandbrewing.com/wp-content/uploads/2023/10/Bacteria-Souring-Methods-Best-Practices-A4.pdf)|锅内酸化的建议培养时间是 24–48 小时。另一条工艺路线是将 WildBrew Sour Pitch 与 Voss 共同接种，指南给出的共同温区为 30–35°C。|

## 经典风格的数值参照

| 配方 ID | BJCP 2021 原文 | 色度 SRM | 苦度 IBU | 酒精度 %vol |
|---|---|---|---|---|
| english-bitter | [11B · 英式优选苦啤](https://styles.bjcp.org/bjcp-2021-beer/11/11b-best-bitter) | 8–16 | 25–40 | 3.8–4.6 |
| marzen | [6A · 三月啤酒](https://styles.bjcp.org/bjcp-2021-beer/6/6a-marzen) | 8–17 | 18–24 | 5.6–6.3 |
| dry-stout | [15B · 爱尔兰干世涛](https://styles.bjcp.org/bjcp-2021-beer/15/15b-irish-stout) | 25–40 | 25–45 | 3.8–5 |
| milk-stout | [16A · 甜世涛](https://styles.bjcp.org/bjcp-2021-beer/16/16a-sweet-stout) | 30–40 | 20–40 | 4–6 |
| saison | [25B · 赛松（浅色、标准强度）](https://styles.bjcp.org/bjcp-2021-beer/25/25b-saison) | 5–14 | 20–35 | 5–7 |
| dubbel | [26B · 比利时双料](https://styles.bjcp.org/bjcp-2021-beer/26/26b-belgian-dubbel) | 10–17 | 15–25 | 6–7.6 |
| hefeweizen | [10A · 德式小麦啤酒](https://styles.bjcp.org/bjcp-2021-beer/10/10a-weissbier) | 2–6 | 8–15 | 4.3–5.6 |
| rauchbier | [6B · 德式烟熏啤酒](https://styles.bjcp.org/bjcp-2021-beer/6/6b-rauchbier) | 12–22 | 20–30 | 4.8–6 |
| munich-helles | [4A · 慕尼黑淡色拉格](https://styles.bjcp.org/bjcp-2021-beer/4/4a-munich-helles) | 3–5 | 16–22 | 4.7–5.4 |
| witbier | [24A · 比利时白啤](https://styles.bjcp.org/bjcp-2021-beer/24/24a-witbier) | 2–4 | 8–20 | 4.5–5.5 |
| gose | [23G · 古斯](https://styles.bjcp.org/bjcp-2021-beer/23/23g-gose) | 3–4 | 5–12 | 4.2–4.8 |
| english-porter | [13C · 英式波特](https://styles.bjcp.org/bjcp-2021-beer/13/13c-english-porter) | 20–30 | 18–35 | 4–5.4 |
| tripel | [26C · 比利时三料](https://styles.bjcp.org/bjcp-2021-beer/26/26c-belgian-tripel) | 4.5–7 | 20–40 | 7.5–9.5 |

这些条目以 `bjcp-风格代码` 为 ID（例如 `bjcp-10a`），通过 `referencePoints` 传给裁决。味觉引擎从同一张表读取参照范围。感官轴上的 0–10 分和风格偏离扣分是游戏标定。申报 30A 时会保留所选基酒的参照。古斯与比利时白啤配方自带的芫荽等调料会进入杯中描述，两款酒各有自己的经典风格。

德式小麦的香蕉与丁香取决于酵母、发酵和杯中留存的酯香。比利时白啤的芫荽籽与橙皮按各自投料浓度计算，另附下表中的 Allagash 工艺记录。木烟、烤面包皮和黑咖啡分别跟随烟熏麦芽比例、维也纳或慕尼黑类麦芽比例及烤大麦的使用。首杯和酒客共用这份杯中结果。

## 按实际增味取用的跨风格参照

| ID | 参照对象 | 可对照的原料和工艺 |
|---|---|---|
| allagash-wit | [Allagash 酿酒师 Jason Perkins 的白啤建议](https://homebrewersassociation.org/how-to-brew/5-tips-brew-better-witbier-allagash-brewing-co/) | 芫荽籽在酿造当天压碎，每美制加仑约 1–2 克。酿酒师偏好库拉索苦橙，并提到甜橙更容易盖过其他香气。 |
| epic-coffee | [Epic Brewing 提供的巧克力咖啡世涛配方](https://www.beerandbrewing.com/chocolate-coffee-stout-recipe) | 转桶离开酵母泥后，将粗磨咖啡与可可碎放在 0–4°C 的酒中浸泡 3–5 天，再次转桶包装。 |
| craisin-saison | [AHA · Saison de Craisin](https://homebrewersassociation.org/homebrew-recipe/saison-de-craisin/) | 19 L 配方含蔓越莓干 4–6 oz、蔓越莓蜂蜜 16 oz（均为重量盎司），用 Saison 酵母在约 24°C 发酵。记录的 FG 1.007 反映整份配方与工艺。 |
| smokeska-porter | [Mark Pasquinelli · Smokeska Porter](https://homebrewersassociation.org/homebrew-recipe/smokeska-porter/) | 22.7 L 烟熏波罗的海波特使用 3.40 kg 烟熏麦芽，和其他麦芽一起在 67°C 糖化。烟熏味在投料阶段便有了来源。 |

裁决调用 `referencePoints(ids, materialName)` 得到去重的条目数组。每条带有用途 `use`、出处 `source`、资料类型 `scope` 和工艺字段 `facts`。数值字段名注明单位，其中 `SG` 为相对密度，`dryHopDayOfPrimary` 为主发酵的第几天。数值对表示该来源给出的低端和高端。第二个参数可省略。传入“咖啡豆”时，裁决会同时拿到当前风格参照和 Epic 的冷泡记录。只有本桶所选的材料、剂量、发酵阶段与批次状态能决定本桶风味。参照里的共用原料和投料量只用于类比。

## 酵母与抽样

[US-05](https://fermentis.com/en/product/safale-us-05/) 产品资料给出 18–26°C 的推荐发酵温区。[Voss](https://admin.lallemandbrewing.com/wp-content/uploads/2023/05/TDS_LPS_BREWINGYEAST_VOSS_ENG_A4-1-3.pdf) 的标示范围为 25–40°C，传统高温用法落在 35–40°C。同样是 35°C，选用不同酵母会改变模型对这锅酒的判断。引擎采用 `vendor/brewlab` 中每种游戏酵母的标定范围，品牌温区仅作为独立核对点。

每锅在增味前以批次种子和独立随机流抽一次速率因子。温区内允许相对波动 ±4%，起始温度每偏离温区 1°C 就将范围放宽 1.5 个百分点，上限 ±16%。两个独立均匀数之差使接近中心的结果更常见。中心保持在 1，温度对平均速率的方向性影响由发酵引擎单独处理。以上波动幅度是可替换的游戏设定，公开配方无法给出跨批次方差。回味时可沿 `referenceIds` 查到对应工艺，比较玩家自己的选择。自订风格缺少参照时仍按所选酵母抽样。
