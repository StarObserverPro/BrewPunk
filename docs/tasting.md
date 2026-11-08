# 从杯中到酒单

酿酒的人先读开桶笔记。随后酒接上龙头，来客只能看到公开酒牌、自己这杯和已经发出的留言。酿造事故、后台风格评分和实际配料只给酿酒的人看。引擎在写下留言前已确定这个人喝到什么、喜不喜欢和有没有续杯。

## 一杯酒的三种读法

- **风味。** `taste` 先根据酒龄、储温和批次摄氧推演开封时的状态，再写杯色、闻香、入口和余味。麦芽的烘烤感与颜色分别取值。果香与花香采用不同的保留系数，长期温放后，较稳定的香气可能变成主调。装瓶默认瓶内二发，罐和生啤桶默认已充气。基准轴上的商业酒和风格只帮助定位该轴，0–10 刻度出自游戏调校。
- **风格。** 玩家选择申报类别后，模拟评审按香气 12、外观 3、风味 20、口感 5、总体 10 计分。传统风格的 SRM、IBU、ABV 参照 BJCP 2021，其余感官阈值与扣分幅度属于游戏规则。酸 IPA 按混合风格申报，木桶世涛可选木材陈酿参照。两者按声明的特征评价。切换申报风格不改变杯中笔记。
- **个人反应。** 每位客人有苦感、酸感、酒体偏好。对当日酒样的偏好距离、陈味、可察觉的异常和当天心情共同决定喜欢程度。常客保留个人口味与表达习惯。续杯、同桌分尝、无留言和少量跟帖均可发生。

## 酒龄与来源

`taste(batch, {ageDays, packageType, styleId, storageC, oxygen, co2Loss})` 返回中性笔记、风味轴、感官标志和模拟评分。酒龄从封装开始，桶内陈放时间由酿造引擎单独计入。储温和氧气改变香气保留和陈味累积的速度。独立封装采用批次的封口缺陷概率，罐装中的连续几罐还可能经历同一段暴露。已知同一包材编号和批次种子即可重现其状态。头杯泡沫只影响特定出酒时段和倒掉的体积。

## 品鉴蒙特卡洛

`simulateNight(batch, {seed, volumeL, packageType, ageDays, storageC, tap, evening, proseSeed})` 把一批可供应的酒分给若干晚的客人，返回每次取酒的体积、杯与包装编号、原帖和跟帖。品脱、半杯和分享酒按 mL 记账。选瓶或罐时，同桌可以分同一只包装。单批最多刊出 48 条原帖，大桶降低发帖抽样率。原帖数量保留自然波动。

`sampleTastings(batch, {seed, runs, ...serviceOptions})` 固定已经酿成的酒，仅重抽来客。返回评论数、来客数、平均喜好百分制的 P10/P50/P90。改 `proseSeed` 只重写同一次服务的用词与跟帖。酒液、售出量、留言者和个人评分可逐项对照重放。

## 将来接入 Six Luna

`guestPrompt(post)` 返回 `{instructions, input}`。input 是客人视角的字段白名单，包括其品味经验、杯中印象、当晚的一件事、篇幅与是否来过。游戏当前使用按杯中感受组织的离线中文短评。服务端接入模型时，以批次、场次和留言 id 做缓存，只更新文字。一次生成失败可以沿用这一条的本地正文。回帖若接入模型，应另给回复人可见的原帖和目击信息。

## 模型依据

- BJCP 评分项目及风格范围。[评审说明](https://www.bjcp.org/exam-certification/program/studying/beer-exam-study-guide/beer-evaluation/) · [2021 指南](https://www.bjcp.org/beer-styles/beer-style-guidelines/)
- 不同类型香气分子在储存中的稳定性有别。游戏所用速度常数为演示参数。[Schubert et al., Food Chemistry, 2022](https://pubmed.ncbi.nlm.nih.gov/35843079/)
- 放瓶后的温度、时间和酵母状态会影响碳酸化进程。[American Homebrewers Association](https://www.homebrewersassociation.org/how-to-brew/mastering-the-art-of-bottle-conditioning/)
