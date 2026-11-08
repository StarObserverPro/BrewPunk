# 家酿底稿与模型参照

每个 ID 指向公开配方或技术资料。不同风格可各自对照一锅真实的酒。表中数值取自各自的配方、酿酒师建议或供应商工艺说明，单位紧随数值。以下文字为整理者摘要。

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
