export const packagingShots = {
  "B01-keg-master": {
    "src": "assets/packaging/B01-keg-master.png",
    "label": "钢桶母版",
    "width": 1448,
    "height": 1086
  },
  "B02-keg-cleaning-v2": {
    "src": "assets/packaging/B02-keg-cleaning-v2.png",
    "label": "钢桶清洗",
    "width": 1448,
    "height": 1086
  },
  "B03-keg-filling": {
    "src": "assets/packaging/B03-keg-filling.png",
    "label": "发酵罐灌入钢桶",
    "width": 1448,
    "height": 1086
  },
  "B04-keg-sealed": {
    "src": "assets/packaging/B04-keg-sealed.png",
    "label": "封桶贴签",
    "width": 1448,
    "height": 1086
  },
  "B05-keg-coldstorage": {
    "src": "assets/packaging/B05-keg-coldstorage.png",
    "label": "钢桶冷藏",
    "width": 1448,
    "height": 1086
  },
  "B06-keg-connection": {
    "src": "assets/packaging/B06-keg-connection.png",
    "label": "换桶接管",
    "width": 1448,
    "height": 1086
  },
  "B07-tap-pour": {
    "src": "assets/packaging/B07-tap-pour.png",
    "label": "酒头正常出酒",
    "width": 1448,
    "height": 1086
  },
  "B08-empty-keg-v2": {
    "src": "assets/packaging/B08-empty-keg-v2.png",
    "label": "空桶回收",
    "width": 1448,
    "height": 1086
  },
  "B09-bottle-capping": {
    "src": "assets/packaging/B09-bottle-capping.png",
    "label": "玻璃瓶压盖",
    "width": 1448,
    "height": 1086
  },
  "B10-bottles-finished": {
    "src": "assets/packaging/B10-bottles-finished.png",
    "label": "成品瓶归筐",
    "width": 1448,
    "height": 1086
  },
  "B11-can-filling": {
    "src": "assets/packaging/B11-can-filling.png",
    "label": "易拉罐灌装",
    "width": 1448,
    "height": 1086
  },
  "B12-can-seaming": {
    "src": "assets/packaging/B12-can-seaming.png",
    "label": "易拉罐卷封",
    "width": 1448,
    "height": 1086
  },
  "B13-cans-finished": {
    "src": "assets/packaging/B13-cans-finished.png",
    "label": "成品罐组",
    "width": 1448,
    "height": 1086
  },
  "B14-bottles-coldstorage": {
    "src": "assets/packaging/B14-bottles-coldstorage.png",
    "label": "瓶罐冷藏",
    "width": 1448,
    "height": 1086
  }
};
export const supplementalShots = {
  "kitchen-day": {
    "src": "assets/workshop/kitchen-day.png",
    "label": "厨房日景母版"
  },
  "kitchen-night": {
    "src": "assets/workshop/kitchen-night.png",
    "label": "厨房夜景母版"
  },
  "fermentation-day": {
    "src": "assets/workshop/fermentation-day.png",
    "label": "发酵角日景母版"
  },
  "fermentation-night": {
    "src": "assets/workshop/fermentation-night.png",
    "label": "发酵角夜景母版"
  },
  "p01-malt-01": {
    "src": "assets/ingredients/p01-malt-01.jpg",
    "label": "麦芽 01"
  },
  "p01-malt-02": {
    "src": "assets/ingredients/p01-malt-02.jpg",
    "label": "麦芽 02"
  },
  "p01-malt-03": {
    "src": "assets/ingredients/p01-malt-03.jpg",
    "label": "麦芽 03"
  },
  "p01-malt-04": {
    "src": "assets/ingredients/p01-malt-04.jpg",
    "label": "麦芽 04"
  },
  "p02-hops-01": {
    "src": "assets/ingredients/p02-hops-01.jpg",
    "label": "酒花（鲜球果候选） 01"
  },
  "p02-hops-02": {
    "src": "assets/ingredients/p02-hops-02.jpg",
    "label": "酒花（鲜球果候选） 02"
  },
  "p02-hops-03": {
    "src": "assets/ingredients/p02-hops-03.jpg",
    "label": "酒花（鲜球果候选） 03"
  },
  "p02-hops-04": {
    "src": "assets/ingredients/p02-hops-04.jpg",
    "label": "酒花（鲜球果候选） 04"
  },
  "p03-yeast-01": {
    "src": "assets/ingredients/p03-yeast-01.jpg",
    "label": "酵母（画风候选） 01"
  },
  "p03-yeast-02": {
    "src": "assets/ingredients/p03-yeast-02.jpg",
    "label": "酵母（画风候选） 02"
  },
  "p03-yeast-03": {
    "src": "assets/ingredients/p03-yeast-03.jpg",
    "label": "酵母（画风候选） 03"
  },
  "p03-yeast-04": {
    "src": "assets/ingredients/p03-yeast-04.jpg",
    "label": "酵母（画风候选） 04"
  },
  "p04-fruit-01": {
    "src": "assets/ingredients/p04-fruit-01.jpg",
    "label": "增味原料 01"
  },
  "p04-fruit-02": {
    "src": "assets/ingredients/p04-fruit-02.jpg",
    "label": "增味原料 02"
  },
  "p04-fruit-03": {
    "src": "assets/ingredients/p04-fruit-03.jpg",
    "label": "增味原料 03"
  },
  "p04-fruit-04": {
    "src": "assets/ingredients/p04-fruit-04.jpg",
    "label": "增味原料 04"
  }
};

export function packagingShot(pack, phase = 'fill') {
  const shots = {
    keg: { clean: 'B02-keg-cleaning-v2', fill: 'B03-keg-filling', seal: 'B04-keg-sealed', finished: 'B04-keg-sealed', storage: 'B05-keg-coldstorage', connect: 'B06-keg-connection', pour: 'B07-tap-pour', empty: 'B08-empty-keg-v2' },
    bottle: { fill: 'bottling', seal: 'B09-bottle-capping', finished: 'B10-bottles-finished', storage: 'B14-bottles-coldstorage' },
    can: { fill: 'B11-can-filling', seal: 'B12-can-seaming', finished: 'B13-cans-finished', storage: 'B14-bottles-coldstorage' },
  };
  return shots[pack]?.[phase];
}
export function packagingSequence(pack) {
  const steps = [];
  if (pack === 'keg') steps.push({shot: 'B01-keg-master', text: '把生啤桶搬到发酵罐旁，找好桶顶的两个接头。'}, {shot: packagingShot(pack, 'clean'), text: '先清洁消毒生啤桶，把桶盖和接头检查一遍。'});
  steps.push({shot: packagingShot(pack), text: '检查好转移管线，让酒进入' + ({keg:'钢制生啤桶',bottle:'玻璃瓶',can:'易拉罐'})[pack] + '。'});
  return steps;
}
