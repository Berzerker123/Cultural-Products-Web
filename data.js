(function () {
  'use strict';

  var totalAlerts = 8452;
  var riskDomains = [
    {
      key: 'political', code: '1', label: '政治安全风险', value: 2156, color: '#f04438',
      categories: [
        { code: '1.1', label: '政治制度攻击' },
        { code: '1.2', label: '历史虚无' },
        { code: '1.3', label: '破坏民族团结' },
        { code: '1.4', label: '破坏宗教政策' }
      ]
    },
    {
      key: 'social', code: '2', label: '社会安全风险', value: 1542, color: '#ff7a00',
      categories: [
        { code: '2.1', label: '违法违规' },
        { code: '2.2', label: '暴力恐怖' }
      ]
    },
    {
      key: 'ethics', code: '3', label: '道德风化风险', value: 1230, color: '#f5b400',
      categories: [
        { code: '3.1', label: '丑化内容' },
        { code: '3.2', label: '低俗内容' },
        { code: '3.3', label: '色情淫秽' }
      ]
    },
    {
      key: 'minor', code: '4', label: '未成年人保护风险', value: 1123, color: '#14b8a6',
      categories: [
        { code: '4.1', label: '不良行为诱导' },
        { code: '4.2', label: '宣扬畸形审美' },
        { code: '4.3', label: '宣扬奢靡享乐' }
      ]
    },
    {
      key: 'culture', code: '5', label: '文化信息风险', value: 2401, color: '#4f6bed',
      categories: [
        { code: '5.1', label: '多模态隐晦虚假内容' },
        { code: '5.2', label: '危害优秀文化传统' },
        { code: '5.3', label: '传播不良网络用语' }
      ]
    }
  ];

  var categoryIndex = {};
  riskDomains.forEach(function (domain) {
    domain.categories.forEach(function (category) {
      categoryIndex[category.code] = { domain: domain, category: category };
    });
  });

  function withCategory(alert) {
    var entry = categoryIndex[alert.categoryCode];
    if (!entry) throw new Error('Unknown category code: ' + alert.categoryCode);
    return Object.assign({}, alert, {
      riskKey: entry.domain.key,
      risk: entry.domain.label,
      category: entry.category.label,
      categoryLabel: entry.category.code + ' ' + entry.category.label
    });
  }

  var baseAlerts = [
    {
      id: 'AL250602-009845', categoryCode: '4.2', level: '高危',
      title: '极端瘦身妆造挑战，鼓吹“越瘦越高级”', media: '短视频 · 1个', image: 'assets/case-1.png',
      platformKey: 'douyin', platform: '抖音', account: '@自由星球发言人', followers: '32.6w', accountId: '9876543210',
      summary: '以极端身材与妆造标准包装挑战内容，向未成年人传递畸形审美和不当价值导向。', time: '2025-06-02 10:27:14',
      spread: [['获赞', '389.2万'], ['播放', '824.6万'], ['评论', '1.6万'], ['转发', '4.8万']],
      spreadGrowth: [12.6, 14.8, 8.2, 6.4], suggestion: '责令修正', status: '待人工审核', confidence: 94.1
    },
    {
      id: 'AL250602-009844', categoryCode: '3.1', level: '中危',
      title: '以贬损性称谓包装两性话题，强化刻板印象', media: '图文 · 1张', image: 'assets/case-2.png',
      platformKey: 'wechat', platform: '微信', account: '@家庭生活说', followers: '18.6w', accountId: '87654321',
      summary: '使用贬损性表达制造对立，传播不当价值导向并污染网络讨论环境。', time: '2025-06-02 09:15:22',
      spread: [['阅读', '63.7万'], ['点赞', '3.8万'], ['在看', '9,562']],
      spreadGrowth: [9.4, 7.1, 4.8], suggestion: '限期整改', status: '整改中', confidence: 94.1
    },
    {
      id: 'AL250601-009712', categoryCode: '3.2', level: '高危',
      title: '低俗段子合集，内容露骨不堪，纯属博眼球', media: '短视频 · 1个', image: 'assets/case-3.png',
      platformKey: 'rednote', platform: '小红书', account: '@段子大王', followers: '26.8w', accountId: '23456789',
      summary: '传播低俗内容，污染网络环境，对青少年群体造成不良影响。', time: '2025-06-01 22:47:10',
      spread: [['浏览', '71.4万'], ['点赞', '4.2万'], ['评论', '7,693'], ['收藏', '1.1万']],
      spreadGrowth: [11.2, 8.9, 5.6, 6.1], suggestion: '彻底清理', status: '已处置', confidence: 92.7
    },
    {
      id: 'AL250601-009658', categoryCode: '4.1', level: '中危',
      title: '教你绕过防沉迷系统，轻松无限制玩游戏', media: '短视频 · 1个', image: 'assets/case-4.png',
      platformKey: 'kuaishou', platform: '快手', account: '@游戏达人', followers: '14.2w', accountId: '24567890',
      summary: '诱导未成年人绕过防沉迷限制，存在明显安全风险。', time: '2025-06-01 16:33:58',
      spread: [['播放', '48.6万'], ['点赞', '2.6万'], ['评论', '1,253'], ['转发', '3,112']],
      spreadGrowth: [10.3, 7.8, 4.3, 5.7], suggestion: '限期整改', status: '整改中', confidence: 91.2
    },
    {
      id: 'AL250531-009433', categoryCode: '5.2', level: '高危',
      title: '恶搞经典红色歌曲，扭曲英雄形象博流量', media: '短视频 · 1个', image: 'assets/case-5.png',
      platformKey: 'weibo', platform: '微博', account: '@娱乐小咖', followers: '45.7w', accountId: '45678901',
      summary: '恶搞红色文化和英雄形象，损害主流价值观。', time: '2025-05-31 14:20:05',
      spread: [['阅读', '95.2万'], ['点赞', '6.7万'], ['评论', '2,831'], ['转发', '9,412']],
      spreadGrowth: [15.1, 12.4, 6.7, 8.5], suggestion: '彻底清理', status: '待处置', confidence: 89.9
    },
    {
      id: 'AL250530-009211', categoryCode: '3.3', level: '高危',
      title: '擦边美女直播片段，画面不雅引人不适', media: '直播片段 · 1个', image: 'assets/case-6.png',
      platformKey: 'bilibili', platform: 'B站', account: '@主播小美', followers: '8.9w', accountId: '56789012',
      summary: '传播软色情擦边内容，危害网络生态。', time: '2025-05-30 21:05:33',
      spread: [['播放', '36.1万'], ['点赞', '1.9万'], ['评论', '987'], ['收藏', '5,321']],
      spreadGrowth: [8.6, 6.5, 3.9, 4.2], suggestion: '彻底清理', status: '已处置', confidence: 88.6
    }
  ].map(withCategory);

  var extraAlerts = [
    {
      id: 'AL250529-008900', categoryCode: '1.2', level: '高危',
      title: '借热门影视剧散播历史虚无论调', media: '图文 · 2张', image: 'assets/case-7.png',
      platformKey: 'douyin', platform: '抖音', account: '@旧事辨析', followers: '21.4w', accountId: '36001234',
      summary: '借影视讨论歪曲历史事实，弱化侵略罪责并误导公众认知。', time: '2025-05-29 18:32:10',
      spread: [['播放', '54.8万'], ['点赞', '3.1万'], ['评论', '6,842'], ['转发', '5,276']],
      spreadGrowth: [13.8, 9.4, 7.5, 6.8], suggestion: '彻底清理', status: '待处置', confidence: 93.4
    },
    {
      id: 'AL250529-008901', categoryCode: '2.1', level: '中危',
      title: '以情感话题包装网络违法引流教程', media: '图文 · 1张', image: 'assets/case-8.png',
      platformKey: 'wechat', platform: '微信', account: '@城市情感铺', followers: '16.2w', accountId: '36005678',
      summary: '将违规引流方式包装为情感咨询技巧，存在诱导违法违规行为的风险。', time: '2025-05-29 15:08:43',
      spread: [['阅读', '42.3万'], ['点赞', '2.7万'], ['在看', '4,816']],
      spreadGrowth: [7.9, 5.8, 3.7], suggestion: '限期整改', status: '待人工审核', confidence: 90.7
    },
    {
      id: 'AL250528-008902', categoryCode: '1.1', level: '高危',
      title: '拼接片段攻击政治制度，歪曲政策信息', media: '短视频 · 1个', image: 'assets/case-9.png',
      platformKey: 'rednote', platform: '小红书', account: '@观点拼图', followers: '12.9w', accountId: '36009876',
      summary: '通过断章取义的剪辑攻击政治制度，传播失实政策解读。', time: '2025-05-28 11:46:27',
      spread: [['浏览', '39.5万'], ['点赞', '2.2万'], ['评论', '4,392'], ['收藏', '6,131']],
      spreadGrowth: [9.7, 6.4, 5.1, 4.6], suggestion: '彻底清理', status: '待处置', confidence: 89.3
    },
    {
      id: 'AL250528-008903', categoryCode: '4.3', level: '中危',
      title: '未成年人账号分享炫富攀比挑战', media: '短视频 · 1个', image: 'assets/case-10.png',
      platformKey: 'kuaishou', platform: '快手', account: '@校园日常录', followers: '10.6w', accountId: '36002456',
      summary: '以未成年人群体为受众传播攀比消费内容，宣扬奢靡享乐。', time: '2025-05-28 09:18:56',
      spread: [['播放', '31.8万'], ['点赞', '1.7万'], ['评论', '1,865'], ['转发', '2,648']],
      spreadGrowth: [6.8, 4.9, 3.6, 4.1], suggestion: '责令修正', status: '已通过', confidence: 87.8
    },
    {
      id: 'AL250527-008904', categoryCode: '5.3', level: '中危',
      title: '二创视频用不良网络用语戏谑革命人物', media: '短视频 · 1个', image: 'assets/case-11.png',
      platformKey: 'weibo', platform: '微博', account: '@剧评速递', followers: '28.1w', accountId: '36007890',
      summary: '使用不良网络用语戏谑革命历史人物，造成不良文化传播影响。', time: '2025-05-27 20:12:05',
      spread: [['阅读', '67.9万'], ['点赞', '4.5万'], ['评论', '3,954'], ['转发', '7,028']],
      spreadGrowth: [12.1, 8.2, 5.4, 7.6], suggestion: '限期整改', status: '待处置', confidence: 86.5
    },
    {
      id: 'AL250527-008905', categoryCode: '2.2', level: '高危',
      title: '直播片段以暴力冲突剪辑吸引流量', media: '直播片段 · 1个', image: 'assets/case-12.png',
      platformKey: 'bilibili', platform: 'B站', account: '@现场回放站', followers: '9.7w', accountId: '36004321',
      summary: '集中剪辑暴力冲突画面并进行煽动性传播，存在社会安全风险。', time: '2025-05-27 16:54:31',
      spread: [['播放', '28.4万'], ['点赞', '1.3万'], ['评论', '1,124'], ['收藏', '3,408']],
      spreadGrowth: [7.2, 4.7, 3.2, 3.8], suggestion: '彻底清理', status: '整改中', confidence: 85.2
    }
  ].map(withCategory);

  var alerts = baseAlerts.concat(extraAlerts);
  var statusCounts = {
    '待处置': 1248,
    '待人工审核': 2371,
    '整改中': 928,
    '已通过': 1732,
    '已处置': 2173
  };
  var statusTotal = Object.keys(statusCounts).reduce(function (sum, status) { return sum + statusCounts[status]; }, 0);
  if (statusTotal !== totalAlerts) throw new Error('Status counts must equal total alerts');

  var categories = riskDomains.map(function (domain) {
    return {
      key: domain.key,
      code: domain.code,
      label: domain.label,
      value: domain.value,
      percent: Number((domain.value / totalAlerts * 100).toFixed(1)),
      color: domain.color,
      categoryCodes: domain.categories.map(function (category) { return category.code; })
    };
  });
  var categoryTotal = categories.reduce(function (sum, category) { return sum + category.value; }, 0);
  if (categoryTotal !== totalAlerts) throw new Error('Category counts must equal total alerts');

  var warningTypes = [
    { label: '图像预警', value: 3215, trend: '21.7%', icon: 'image' },
    { label: '文字预警', value: 2168, trend: '17.8%', icon: 'file-text' },
    { label: '图文关联预警', value: 2347, trend: '18.9%', icon: 'images' },
    { label: '亚文化预警', value: 722, trend: '15.3%', icon: 'scan-search' }
  ];
  var warningTypeTotal = warningTypes.reduce(function (sum, type) { return sum + type.value; }, 0);
  if (warningTypeTotal !== totalAlerts) throw new Error('Warning type counts must equal total alerts');

  var primaryAlert = alerts.find(function (alert) { return alert.id === 'AL250602-009845'; });
  var detail = Object.assign({
    id: primaryAlert.id,
    categoryCode: primaryAlert.categoryCode,
    category: primaryAlert.category,
    categoryLabel: primaryAlert.categoryLabel,
    confidence: primaryAlert.confidence.toFixed(1) + '%',
    time: primaryAlert.time,
    platformKey: primaryAlert.platformKey,
    platform: primaryAlert.platform,
    image: primaryAlert.image,
    title: primaryAlert.title,
    summary: primaryAlert.summary,
    account: primaryAlert.account.replace(/^@/, ''),
    accountId: primaryAlert.accountId,
    fans: primaryAlert.followers,
    likes: primaryAlert.spread[0][1],
    spread: primaryAlert.spread,
    spreadGrowth: primaryAlert.spreadGrowth
  }, {
    type: '待人工研判',
    originalText: '以极端瘦身与夸张妆造吸引关注，\n将“越瘦越高级”包装成可复制的日常挑战；\n内容面向未成年人传播，可能强化单一审美标准。',
    conclusion: '涉嫌向未成年人传递畸形审美与不良价值导向',
    judgments: [
      { label: '畸形审美引导', tone: 'danger', icon: 'shield-alert' },
      { label: '不良价值导向', tone: 'warning', icon: 'circle-alert' },
      { label: '影响未成年人认知', tone: 'success', icon: 'user-round' }
    ],
    evidence: [
      ['以极端瘦身结果作为内容卖点，强化单一身材评价标准', '00:02'],
      ['使用绝对化语言鼓动模仿，缺少健康风险提示', '00:05'],
      ['内容面向公众传播，可能影响未成年人认知', '00:08']
    ],
    rules: ['宣扬畸形审美', '不良价值导向', '影响未成年人认知'],
    similar: [
      ['案例1：短视频鼓吹极端身材管理与单一审美标准', '抖音', '92%', '责令修正'],
      ['案例2：图文内容传播不当审美导向并影响未成年人认知', '小红书', '89%', '责令修正'],
      ['案例3：以夸张妆造挑战制造审美焦虑', '微博', '86%', '限期整改'],
      ['案例4：图文作品借潮流表达传播不当价值导向', 'B站', '84%', '责令修正']
    ]
  });

  var alertSummary = {
    pending: { label: '待处置预警', value: statusCounts['待处置'], trend: '15.3%', tone: 'danger' },
    newlyDiscovered: { label: '24小时内新发现', value: 532, trend: '18.9%', tone: 'warning' },
    completedToday: { label: '今日已完结', value: statusCounts['已通过'], trend: '18.4%', tone: 'success' },
    manualReview: { label: '待人工审核', value: statusCounts['待人工审核'], trend: '9.1%', tone: 'info' }
  };

  window.APP_DATA = {
    totalAlerts: totalAlerts,
    riskDomains: riskDomains,
    categories: categories,
    statusCounts: statusCounts,
    alertSummary: alertSummary,
    totals: {
      authors: '20万+', works: '500万+', todayAuthors: '1万+', todayWorks: '5万+',
      highRisk: statusCounts['待处置'], newAlerts: totalAlerts,
      handled: statusCounts['已处置'], manual: statusCounts['待人工审核']
    },
    warningTypes: warningTypes,
    topRisks: [
      { categoryCode: '1.2', label: '历史虚无', value: 1248, trend: '15.3%', color: '#ef4444' },
      { categoryCode: '5.1', label: '多模态隐晦虚假内容', value: 1002, trend: '10.2%', color: '#f97316' },
      { categoryCode: '2.1', label: '违法违规', value: 722, trend: '8.7%', color: '#f59e0b' }
    ],
    latestWarnings: alerts.slice().sort(function (a, b) { return b.time.localeCompare(a.time); }).slice(0, 5),
    accounts: [
      ['史实颠覆研究所', '56.4w', '48', '史', 'assets/account-1.png'], ['深夜解读档', '63.2w', '31', '深', 'assets/account-2.png'],
      ['梦想演讲秀', '52.1w', '37', '梦', 'assets/account-3.png'], ['名著漂流馆', '126.7w', '29', '名', 'assets/account-4.png'],
      ['裸色小剧场', '74.3w', '24', '剧', 'assets/account-5.png'], ['环球瞭望站', '61.6w', '21', '环', 'assets/account-6.png']
    ],
    keywords: [
      ['历史虚无主义', 42], ['低俗擦边', 25], ['不良价值观', 21], ['消极颓废', 15],
      ['恶意炒作', 16], ['攻击诋毁', 13], ['歪曲历史', 14], ['拜金主义', 14],
      ['宣扬极端主义', 12], ['违背公序良俗', 13], ['丑化传统文化', 11], ['挑起对立', 12],
      ['污蔑抹黑', 12], ['偷换概念', 10], ['道德沦丧', 10]
    ],
    alerts: alerts,
    detail: detail
  };
})();
