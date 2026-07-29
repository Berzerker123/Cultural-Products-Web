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
      title: '夸张低俗段子拼接，靠刺激性剪辑博眼球', media: '短视频 · 1个', image: 'assets/case-3.png',
      platformKey: 'rednote', platform: '小红书', account: '@段子大王', followers: '26.8w', accountId: '23456789',
      summary: '传播低俗内容，污染网络环境，对青少年群体造成不良影响。', time: '2025-06-01 22:47:10',
      spread: [['浏览', '71.4万'], ['点赞', '4.2万'], ['评论', '7,693'], ['收藏', '1.1万']],
      spreadGrowth: [11.2, 8.9, 5.6, 6.1], suggestion: '彻底清理', status: '已处置', confidence: 92.7
    },
    {
      id: 'AL250601-009658', categoryCode: '4.1', level: '中危',
      title: '以解除时长限制为噱头，诱导规避防沉迷管理', media: '短视频 · 1个', image: 'assets/case-4.png',
      platformKey: 'kuaishou', platform: '快手', account: '@游戏达人', followers: '14.2w', accountId: '24567890',
      summary: '诱导未成年人绕过防沉迷限制，存在明显安全风险。', time: '2025-06-01 16:33:58',
      spread: [['播放', '48.6万'], ['点赞', '2.6万'], ['评论', '1,253'], ['转发', '3,112']],
      spreadGrowth: [10.3, 7.8, 4.3, 5.7], suggestion: '限期整改', status: '整改中', confidence: 91.2
    },
    {
      id: 'AL250531-009433', categoryCode: '5.2', level: '高危',
      title: '戏谑化混剪传统曲艺，消解文化作品语境', media: '短视频 · 1个', image: 'assets/case-5.png',
      platformKey: 'weibo', platform: '微博', account: '@娱乐小咖', followers: '45.7w', accountId: '45678901',
      summary: '以戏谑音效和错位字幕切碎传统曲艺内容，损害优秀文化传统的应有表达。', time: '2025-05-31 14:20:05',
      spread: [['阅读', '95.2万'], ['点赞', '6.7万'], ['评论', '2,831'], ['转发', '9,412']],
      spreadGrowth: [15.1, 12.4, 6.7, 8.5], suggestion: '彻底清理', status: '待处置', confidence: 89.9
    },
    {
      id: 'AL250530-009211', categoryCode: '3.3', level: '高危',
      title: '暧昧标题包装直播切片，反复聚焦无关画面', media: '直播片段 · 1个', image: 'assets/case-6.png',
      platformKey: 'bilibili', platform: 'B站', account: '@主播小美', followers: '8.9w', accountId: '56789012',
      summary: '利用暧昧包装、无关局部镜头和互动诱导传播低俗擦边内容，危害网络生态。', time: '2025-05-30 21:05:33',
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
      title: '以情感话题包装违规导流，诱导站外接触', media: '图文 · 1张', image: 'assets/case-8.png',
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
      title: '校园话题账号展示高消费，制造炫富攀比挑战', media: '短视频 · 1个', image: 'assets/case-10.png',
      platformKey: 'kuaishou', platform: '快手', account: '@校园日常录', followers: '10.6w', accountId: '36002456',
      summary: '以未成年人群体为受众传播攀比消费内容，宣扬奢靡享乐。', time: '2025-05-28 09:18:56',
      spread: [['播放', '31.8万'], ['点赞', '1.7万'], ['评论', '1,865'], ['转发', '2,648']],
      spreadGrowth: [6.8, 4.9, 3.6, 4.1], suggestion: '责令修正', status: '已通过', confidence: 87.8
    },
    {
      id: 'AL250527-008904', categoryCode: '5.3', level: '中危',
      title: '二创视频用不良网络用语戏谑严肃文化题材', media: '短视频 · 1个', image: 'assets/case-11.png',
      platformKey: 'weibo', platform: '微博', account: '@剧评速递', followers: '28.1w', accountId: '36007890',
      summary: '使用不良网络用语和贴纸覆盖严肃文化素材，造成不良文化传播影响。', time: '2025-05-27 20:12:05',
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

  /*
   * All people, accounts, engagement numbers and quoted copy below are
   * fictional, de-identified demonstration material.  Keep the content
   * payload keyed by alert ID so a list row and its detail view use the same
   * case narrative instead of falling back to a generic analysis.
   */
  var caseDetails = {
    'AL250602-009845': {
      introduction: '某短视频账号以“镜头妆造挑战”形式展示极端身材对照，并把单一体型与高级感绑定，受众中包含未成年用户。',
      imageAlt: '内容审核示意图：补光灯、镜面和体型测量道具构成的短视频拍摄场景。',
      originalText: '作品为 36 秒竖屏短视频（演示案例，已脱敏）。\n封面以镜面、补光灯和体型测量道具制造对比效果；文案将更窄的身形描述为值得复制的审美目标。\n视频连续展示妆造前后对照，并以挑战话题引导用户模仿，未提供健康风险或适龄提示。',
      conclusion: '涉嫌向未成年人传递畸形审美与不当价值导向。',
      judgments: [
        { label: '畸形审美引导', tone: 'danger', icon: 'shield-alert' },
        { label: '绝对化模仿暗示', tone: 'warning', icon: 'circle-alert' },
        { label: '影响未成年人认知', tone: 'success', icon: 'user-round' }
      ],
      evidence: [
        ['封面将单一体型作为主要评价标准，形成明显的对比导向', '00:03'],
        ['字幕以挑战口吻鼓励复刻，未附健康风险或年龄提示', '00:11'],
        ['评论区高频出现未成年用户的跟拍、打卡表达', '00:28']
      ],
      rules: ['4.2 宣扬畸形审美', '不良价值导向', '未成年人保护'],
      logic: '内容以可复制的挑战机制放大单一审美标准，并通过对照镜头强化焦虑感。结合受众画像和缺少风险提示的情况，可能对未成年人的身体认知和消费判断产生负面影响。',
      recommendation: { action: '责令修正', note: '删除绝对化引导，补充健康与适龄提示。' },
      relatedIds: ['AL250528-008903', 'AL250601-009658', 'AL250602-009844']
    },
    'AL250602-009844': {
      introduction: '某图文账号以两性话题吸引讨论，使用贬损性标签概括群体特征，并通过对立式问答提升互动。',
      imageAlt: '内容审核示意图：两个匿名讨论者之间出现破碎对话框和风险提示。',
      originalText: '作品为 5 页图文卡片（演示案例，已脱敏）。\n首图以对立式标题吸引点击，正文使用贬损性称谓概括不同群体的行为动机。\n结尾设置二选一投票，引导读者将个体经验泛化为群体标签。',
      conclusion: '涉嫌以贬损性表达固化刻板印象，污染公共讨论环境。',
      judgments: [
        { label: '贬损性表达', tone: 'danger', icon: 'shield-alert' },
        { label: '刻板印象固化', tone: 'warning', icon: 'circle-alert' },
        { label: '对立式互动引导', tone: 'success', icon: 'message-square' }
      ],
      evidence: [
        ['标题以标签化措辞替代事实讨论，形成先入为主的判断', '封面'],
        ['正文多处将个体经历外推为群体特征，缺少事实依据', '第 2 页'],
        ['投票选项仅保留对立立场，放大争议性互动', '第 5 页']
      ],
      rules: ['3.1 丑化内容', '贬损性表达', '不良价值导向'],
      logic: '作品没有提供可核验事实，而是利用群体标签和对立式互动制造情绪传播。该表达模式易固化偏见，并削弱理性讨论空间。',
      recommendation: { action: '限期整改', note: '删除贬损标签，改用事实性、非对立表述。' },
      relatedIds: ['AL250601-009712', 'AL250530-009211', 'AL250527-008904']
    },
    'AL250601-009712': {
      introduction: '某账号将夸张表演、粗俗暗示和高频闪烁剪辑拼接为“段子合集”，以刺激性标题争取停留和转发。',
      imageAlt: '内容审核示意图：短视频拍摄舞台、手机三脚架和抽象内容风险标识。',
      originalText: '作品为 52 秒短视频合集（演示案例，已脱敏）。\n画面在夸张表演、嘈杂音效和反复弹出的刺激性提示之间快速切换。\n关键段落使用低俗暗示制造笑点，标题和置顶评论均强调“越夸张越有流量”。',
      conclusion: '涉嫌以低俗表达和过度刺激内容博取流量，影响网络文化环境。',
      judgments: [
        { label: '低俗内容包装', tone: 'danger', icon: 'shield-alert' },
        { label: '刺激性剪辑', tone: 'warning', icon: 'circle-alert' },
        { label: '面向公众扩散', tone: 'success', icon: 'share-2' }
      ],
      evidence: [
        ['开场以粗俗暗示和夸张反应制造点击诱因', '00:04'],
        ['多段内容与主题无关，重复使用刺激性音效和闪烁画面', '00:18'],
        ['置顶评论鼓励继续投稿同类“猎奇”片段', '00:49']
      ],
      rules: ['3.2 低俗内容', '网络生态治理', '不良价值导向'],
      logic: '内容的主要吸引力来自粗俗暗示和感官刺激，而非正常创作表达。其剪辑和互动设计进一步鼓励复制传播，具有持续扩散风险。',
      recommendation: { action: '彻底清理', note: '下架低俗片段并清理相关引导性互动。' },
      relatedIds: ['AL250530-009211', 'AL250602-009844', 'AL250527-008904']
    },
    'AL250601-009658': {
      introduction: '某游戏类短视频以“解除时长限制”为卖点，借安全设置界面制造可轻易绕开管理规则的印象。',
      imageAlt: '内容审核示意图：带有安全计时与锁形图标的手机界面和被阻断的数字路径。',
      originalText: '作品为 41 秒短视频（演示案例，关键操作已脱敏）。\n封面展示倒计时、锁形图标和被拉开的数字屏障，文案暗示未成年人可以跳过使用时长管理。\n视频多次强调“无需等待”，未提供合法合规使用提醒。',
      conclusion: '涉嫌诱导未成年人规避网络游戏防沉迷管理要求。',
      judgments: [
        { label: '不良行为诱导', tone: 'danger', icon: 'shield-alert' },
        { label: '规避安全管理暗示', tone: 'warning', icon: 'lock-keyhole' },
        { label: '未成年人风险', tone: 'success', icon: 'user-round' }
      ],
      evidence: [
        ['封面把安全计时与“轻松跳过”式表达并置', '00:02'],
        ['旁白反复强调无需遵守时长限制，形成模仿暗示', '00:13'],
        ['评论区出现寻求操作方法的未成年用户互动', '00:34']
      ],
      rules: ['4.1 不良行为诱导', '网络游戏防沉迷', '未成年人保护'],
      logic: '作品将安全管理描述为可被绕开的障碍，并利用挑战式语气降低受众的规则意识。即使未展示完整操作，也会对未成年人形成不当诱导。',
      recommendation: { action: '限期整改', note: '删除规避暗示，增加未成年人保护提示。' },
      relatedIds: ['AL250602-009845', 'AL250528-008903', 'AL250529-008901']
    },
    'AL250531-009433': {
      introduction: '某娱乐类账号将传统曲艺与经典文化元素切碎重组，插入嘲弄音效和错位字幕，以反差效果争取传播。',
      imageAlt: '内容审核示意图：传统乐器、舞台帷幕和文化纹样被抽象剪辑片段打断。',
      originalText: '作品为 47 秒混剪视频（演示案例，已脱敏）。\n画面将传统乐器、戏曲舞台和文化纹样与无关的戏谑音效、夸张贴纸反复拼接。\n标题以“反转改编”为卖点，未交代素材来源，也未保留作品应有的语境。',
      conclusion: '涉嫌以戏谑化改编贬损优秀文化传统，削弱文化内容的应有尊重。',
      judgments: [
        { label: '文化传统贬损', tone: 'danger', icon: 'shield-alert' },
        { label: '语境错置剪辑', tone: 'warning', icon: 'circle-alert' },
        { label: '流量化包装', tone: 'success', icon: 'share-2' }
      ],
      evidence: [
        ['传统文化画面被截取为孤立片段，原有语境被删除', '00:06'],
        ['反复叠加戏谑音效和夸张贴纸，改变作品表达重心', '00:20'],
        ['标题和话题引导用户继续制作同类反差拼接', '00:43']
      ],
      rules: ['5.2 危害优秀文化传统', '文化内容保护', '不良价值导向'],
      logic: '作品以碎片化、戏谑化处理取代正常二次创作表达，传统文化元素被当作制造反差的工具。其传播方式易造成对相关文化内容的误读和轻慢。',
      recommendation: { action: '彻底清理', note: '下架贬损性混剪，保留创作须尊重文化语境。' },
      relatedIds: ['AL250529-008900', 'AL250527-008904', 'AL250601-009712']
    },
    'AL250530-009211': {
      introduction: '某直播回放通过暧昧标题、反复镜头聚焦和互动诱导吸引停留，内容与正常直播主题关联较弱。',
      imageAlt: '内容审核示意图：直播补光灯、摄像机和普通着装的匿名主播剪影，以及风险提示。',
      originalText: '作品为 29 秒直播切片（演示案例，已脱敏）。\n封面使用擦边式标题，画面反复切换至与讲解无关的局部特写和暧昧表情包。\n置顶互动以“继续看下一段”为导向，未设置分级或风险提示。',
      conclusion: '涉嫌传播低俗、软色情导向内容，可能危害网络生态。',
      judgments: [
        { label: '低俗擦边导向', tone: 'danger', icon: 'shield-alert' },
        { label: '互动诱导停留', tone: 'warning', icon: 'message-square' },
        { label: '适龄提示缺失', tone: 'success', icon: 'user-round' }
      ],
      evidence: [
        ['封面标题使用暧昧表达，与实际讲解主题不匹配', '封面'],
        ['画面多次出现与内容无关的局部聚焦和暗示性贴纸', '00:09'],
        ['置顶互动将更多类似片段作为解锁条件', '00:25']
      ],
      rules: ['3.3 色情淫秽', '低俗内容治理', '未成年人保护'],
      logic: '作品以暧昧包装和无关镜头替代正常内容表达，并通过互动机制延长观看。综合标题、画面和传播方式，存在低俗化、软色情化风险。',
      recommendation: { action: '彻底清理', note: '删除低俗切片和诱导互动，核查账号历史内容。' },
      relatedIds: ['AL250601-009712', 'AL250602-009844', 'AL250528-008903']
    },
    'AL250529-008900': {
      introduction: '某影视评论图文把虚构剧情、无来源旧图和片段化材料并置，暗示其可替代可核验的历史事实。',
      imageAlt: '内容审核示意图：档案桌、旧照片、胶片和被重新排列的时间线。',
      originalText: '作品为 2 张图文卡片（演示案例，已脱敏）。\n内容将影视画面、无来源图片和被拆散的时间线拼接在一起，以“另一种真相”吸引点击。\n文中未标明材料出处，也没有区分虚构表达与可核验史料。',
      conclusion: '涉嫌借影视话题歪曲历史叙事，误导公众认知。',
      judgments: [
        { label: '历史叙事失实', tone: 'danger', icon: 'shield-alert' },
        { label: '来源不可核验', tone: 'warning', icon: 'file-text' },
        { label: '拼接式误导', tone: 'success', icon: 'images' }
      ],
      evidence: [
        ['影视镜头被置于史料位置，未标注虚构来源', '第 1 张'],
        ['时间线存在跳跃和错位，缺少可核验出处', '第 2 张'],
        ['标题用悬念式表达替代事实说明，引导读者误判', '标题']
      ],
      rules: ['1.2 历史虚无', '历史信息真实性', '不良价值导向'],
      logic: '内容混淆影视创作与历史材料的边界，并利用无来源拼接构造“被遮蔽事实”的印象。该叙事方式降低了受众对历史信息真实性的判断门槛。',
      recommendation: { action: '彻底清理', note: '下架失实图文并标注经核验的史料来源。' },
      relatedIds: ['AL250528-008902', 'AL250531-009433', 'AL250527-008904']
    },
    'AL250529-008901': {
      introduction: '某情感咨询类图文把违规导流包装为“关系修复技巧”，通过私聊、跳转和模糊联系方式引导站外接触。',
      imageAlt: '内容审核示意图：匿名聊天气泡、被安全盾牌阻断的跳转箭头和不可扫描的几何图案。',
      originalText: '作品为单张长图（演示案例，联系方式已脱敏）。\n文案先以情感困扰切入，再使用“私下获取资料”“换个入口”等模糊表述诱导跳转。\n图片包含不可识别的几何图案和多重箭头，未展示任何可用联系信息。',
      conclusion: '涉嫌以情感话题包装违规引流，存在诱导违法违规行为的风险。',
      judgments: [
        { label: '违规导流包装', tone: 'danger', icon: 'shield-alert' },
        { label: '隐蔽跳转暗示', tone: 'warning', icon: 'share-2' },
        { label: '情绪化诱导', tone: 'success', icon: 'message-square' }
      ],
      evidence: [
        ['情感建议与站外跳转提示被连续编排，目的不一致', '开头'],
        ['多处使用“私下”“换入口”等规避性措辞', '正文'],
        ['图中箭头指向不可识别图案，具有导流结构特征', '配图']
      ],
      rules: ['2.1 违法违规', '违规导流', '网络交易风险'],
      logic: '内容表面提供情感建议，实际通过模糊话术和视觉引导推动受众脱离平台。该结构可能规避平台监管，并诱导用户接触不可验证的信息或服务。',
      recommendation: { action: '限期整改', note: '移除跳转暗示和站外引导，保留合规咨询内容。' },
      relatedIds: ['AL250601-009658', 'AL250527-008905', 'AL250528-008902']
    },
    'AL250528-008902': {
      introduction: '某账号截取公共议题视频中的零散片段，配合无来源说明卡片，将片段化观点包装为对制度和政策的完整判断。',
      imageAlt: '内容审核示意图：编辑工作台上的中性新闻画面被切割成误导性时间线片段。',
      originalText: '作品为 38 秒短视频（演示案例，人物和机构均为虚构）。\n画面把中性公开讨论切成若干短段，并在段落之间插入未经证实的解释卡片。\n标题使用结论先行的措辞，未给出原始视频、完整语境或可核验来源。',
      conclusion: '涉嫌通过断章取义和失实解读攻击政治制度、误导政策认知。',
      judgments: [
        { label: '断章取义剪辑', tone: 'danger', icon: 'shield-alert' },
        { label: '政策信息失实', tone: 'warning', icon: 'file-text' },
        { label: '结论先行传播', tone: 'success', icon: 'send' }
      ],
      evidence: [
        ['关键发言被截断，前后限定条件未保留', '00:07'],
        ['插入说明卡片没有标注信息来源或核验路径', '00:16'],
        ['标题直接给出负面结论，与完整语境不相符', '00:33']
      ],
      rules: ['1.1 政治制度攻击', '政策信息失实', '网络信息真实性'],
      logic: '作品将经过选择性剪辑的片段与无来源解读绑定，压缩了公众理解完整语境的空间。结论先行的叙事可能导致对公共政策和制度的错误认知。',
      recommendation: { action: '彻底清理', note: '下架失实剪辑，保留内容须补充完整语境和可靠来源。' },
      relatedIds: ['AL250529-008900', 'AL250529-008901', 'AL250531-009433']
    },
    'AL250528-008903': {
      introduction: '某面向校园话题的账号以品牌化消费道具和价格比较营造“同龄人都在拥有”的攀比氛围。',
      imageAlt: '内容审核示意图：无品牌购物袋、展示架、手机镜头和匿名青少年内容创作场景。',
      originalText: '作品为 33 秒短视频（演示案例，人物与商品均为虚构）。\n镜头围绕购物袋、展示架和价格对比卡片展开，并以“同龄配置”为话题标签。\n内容把高消费展示与校园社交地位绑定，未提供理性消费或适龄提醒。',
      conclusion: '涉嫌向未成年人宣扬炫富攀比和奢靡享乐价值取向。',
      judgments: [
        { label: '攀比消费引导', tone: 'danger', icon: 'shield-alert' },
        { label: '奢靡享乐包装', tone: 'warning', icon: 'image' },
        { label: '校园受众影响', tone: 'success', icon: 'user-round' }
      ],
      evidence: [
        ['标题把消费配置与同龄人比较直接关联', '封面'],
        ['画面反复强调价格和展示性道具，弱化实际使用价值', '00:12'],
        ['评论区出现“跟同学比一比”等跟风表达', '00:27']
      ],
      rules: ['4.3 宣扬奢靡享乐', '理性消费教育', '未成年人保护'],
      logic: '内容将高消费符号与校园认同感绑定，并通过对比镜头制造落差。对于价值观尚在形成阶段的未成年受众，容易强化攀比和炫耀式消费倾向。',
      recommendation: { action: '责令修正', note: '删除攀比导向，补充理性消费与适龄提示。' },
      relatedIds: ['AL250602-009845', 'AL250601-009658', 'AL250530-009211']
    },
    'AL250527-008904': {
      introduction: '某二创账号把文化题材素材与贬损性网络用语、表情贴纸叠加，借戏谑化表达追逐互动。',
      imageAlt: '内容审核示意图：文化石刻纹样和档案画框被抽象贴纸、对话形状和数字叠层覆盖。',
      originalText: '作品为 44 秒二创视频（演示案例，已脱敏）。\n画面在文化题材素材上覆盖大量戏谑贴纸和网络用语替代符号，并把严肃讲述改写为嘲弄式旁白。\n视频结尾鼓励观众使用同类标签参与再创作。',
      conclusion: '涉嫌以不良网络用语戏谑文化内容，造成不良文化传播影响。',
      judgments: [
        { label: '不良网络用语', tone: 'danger', icon: 'shield-alert' },
        { label: '文化语境消解', tone: 'warning', icon: 'image' },
        { label: '模仿式扩散', tone: 'success', icon: 'refresh-cw' }
      ],
      evidence: [
        ['严肃文化素材被覆盖戏谑贴纸，表达重心被改变', '00:05'],
        ['旁白采用贬损性网络用语替代正常叙述', '00:17'],
        ['结尾话题鼓励用户复用同类标签继续创作', '00:39']
      ],
      rules: ['5.3 传播不良网络用语', '文化语境保护', '不良价值导向'],
      logic: '二创表达并非问题本身，但本作品持续以贬损性网络用语覆盖文化内容，并设计标签扩散机制。该做法容易削弱受众对严肃文化内容的基本尊重。',
      recommendation: { action: '限期整改', note: '移除贬损性用语和贴纸，恢复必要文化语境。' },
      relatedIds: ['AL250531-009433', 'AL250529-008900', 'AL250601-009712']
    },
    'AL250527-008905': {
      introduction: '某直播回放账号把远距离、非血腥的城市冲突画面反复截取并配以煽动性标题，借紧张情绪吸引传播。',
      imageAlt: '内容审核示意图：监看屏幕中的远距离城市扰动、空置路障、薄雾和风险提示。',
      originalText: '作品为 26 秒直播切片（演示案例，未包含伤害画面）。\n画面反复播放远处人群扰动和空置路障，并加入夸张警示音效和紧迫性标题。\n评论区出现要求继续放大、继续追踪的互动，账号未说明事件来源与真实性。',
      conclusion: '涉嫌以暴力冲突片段和煽动性包装吸引流量，存在社会安全传播风险。',
      judgments: [
        { label: '冲突画面炒作', tone: 'danger', icon: 'shield-alert' },
        { label: '煽动性包装', tone: 'warning', icon: 'triangle-alert' },
        { label: '来源待核验', tone: 'success', icon: 'file-text' }
      ],
      evidence: [
        ['同一段远距离扰动画面被循环剪辑，营造持续升级印象', '00:04'],
        ['标题和警示音效使用紧迫措辞，放大情绪反应', '00:10'],
        ['未说明拍摄地点、时间或来源，信息真实性无法核验', '00:22']
      ],
      rules: ['2.2 暴力恐怖', '暴力信息传播治理', '网络信息真实性'],
      logic: '作品没有提供可核验的事件背景，却通过循环画面和煽动性包装放大紧张情绪。该传播模式可能引发恐慌、模仿或非理性扩散，需要优先控制。',
      recommendation: { action: '彻底清理', note: '停止传播冲突切片，核验来源并处置煽动性文案。' },
      relatedIds: ['AL250529-008901', 'AL250528-008902', 'AL250601-009658']
    }
  };

  caseDetails = Object.keys(caseDetails).reduce(function (profiles, id) {
    var profile = caseDetails[id];
    var similarity = [91, 87, 83];
    profiles[id] = Object.assign({}, profile, {
      recommendationReason: profile.recommendation.note,
      similar: profile.relatedIds.map(function (relatedId, index) {
        return { id: relatedId, similarity: similarity[index] };
      })
    });
    return profiles;
  }, {});

  var alertSummary = {
    pending: { label: '待处置预警', value: statusCounts['待处置'], trend: '5.3%', tone: 'danger' },
    newlyDiscovered: { label: '24小时内新发现', value: 532, trend: '5.9%', tone: 'warning' },
    completedToday: { label: '复核已通过', value: statusCounts['已通过'], trend: '5.4%', tone: 'success' },
    manualReview: { label: '待人工审核', value: statusCounts['待人工审核'], trend: '3.1%', tone: 'info' }
  };

  window.APP_DATA = {
    totalAlerts: totalAlerts,
    riskDomains: riskDomains,
    categories: categories,
    statusCounts: statusCounts,
    alertSummary: alertSummary,
    totals: {
      authors: '20万+', works: '500万+', todayAuthors: '1万+', todayWorks: '5万+',
      pending: statusCounts['待处置'], newAlerts: alertSummary.newlyDiscovered.value,
      handled: statusCounts['已处置'], manualReview: statusCounts['待人工审核']
    },
    warningTypes: warningTypes,
    topRisks: [
      { categoryCode: '1.2', label: '历史虚无', value: 1248, trend: '15.3%', color: '#ef4444' },
      { categoryCode: '5.1', label: '多模态隐晦虚假内容', value: 1002, trend: '10.2%', color: '#f97316' },
      { categoryCode: '2.1', label: '违法违规', value: 722, trend: '8.7%', color: '#f59e0b' }
    ],
    latestWarnings: alerts.filter(function (alert) { return alert.level === '高危'; })
      .sort(function (a, b) { return b.time.localeCompare(a.time); }).slice(0, 5),
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
    detail: detail,
    caseDetails: caseDetails
  };
})();
