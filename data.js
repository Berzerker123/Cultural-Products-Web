(function () {
  'use strict';

  var baseAlerts = [
    {
      id: 'AL250602-009845', riskKey: 'political', risk: '政治安全', level: '高危',
      title: '日本侵华历史早已翻篇，不必再过度反思', media: '图文 · 3张', image: 'assets/case-1.png',
      platformKey: 'douyin', platform: '抖音', account: '@历史迷思', followers: '52.3w', accountId: '12345678',
      summary: '歪曲抗战历史，否认日本侵华罪责，宣扬历史虚无主义。', time: '2025-06-02 10:21:34',
      spread: [['播放', '82.3w'], ['点赞', '5.1w'], ['评论', '1.2w'], ['转发', '8,231']],
      suggestion: '彻底清理', status: '待处置', confidence: 96.8
    },
    {
      id: 'AL250602-009844', riskKey: 'social', risk: '社会安全', level: '中危',
      title: '男女思维本就不同，女性就该在家相夫教子', media: '图文 · 1张', image: 'assets/case-2.png',
      platformKey: 'wechat', platform: '微信', account: '@家庭生活说', followers: '18.6w', accountId: '87654321',
      summary: '宣扬性别刻板观念，强化性别歧视与不良价值导向。', time: '2025-06-02 09:15:22',
      spread: [['阅读', '63.7w'], ['点赞', '3.8w'], ['在看', '9,562']],
      suggestion: '限期整改', status: '整改中', confidence: 94.1
    },
    {
      id: 'AL250601-009712', riskKey: 'ethics', risk: '道德风化', level: '高危',
      title: '低俗段子合集，内容露骨不堪，纯属博眼球', media: '短视频 · 1个', image: 'assets/case-3.png',
      platformKey: 'rednote', platform: '小红书', account: '@段子大王', followers: '26.8w', accountId: '23456789',
      summary: '传播低俗内容，污染网络环境，对青少年群体造成不良影响。', time: '2025-06-01 22:47:10',
      spread: [['浏览', '71.4w'], ['点赞', '4.2w'], ['评论', '7,693'], ['收藏', '1.1w']],
      suggestion: '彻底清理', status: '已处置', confidence: 92.7
    },
    {
      id: 'AL250601-009658', riskKey: 'minor', risk: '未成年人保护', level: '中危',
      title: '教你绕过防沉迷系统，轻松无限制玩游戏', media: '短视频 · 1个', image: 'assets/case-4.png',
      platformKey: 'kuaishou', platform: '快手', account: '@游戏达人', followers: '14.2w', accountId: '24567890',
      summary: '诱导未成年人绕过防沉迷限制，存在明显安全风险。', time: '2025-06-01 16:33:58',
      spread: [['播放', '48.6w'], ['点赞', '2.6w'], ['评论', '1,253'], ['转发', '3,112']],
      suggestion: '限期整改', status: '整改中', confidence: 91.2
    },
    {
      id: 'AL250531-009433', riskKey: 'culture', risk: '文化信息', level: '高危',
      title: '恶搞经典红色歌曲，扭曲英雄形象博流量', media: '短视频 · 1个', image: 'assets/case-5.png',
      platformKey: 'weibo', platform: '微博', account: '@娱乐小咖', followers: '45.7w', accountId: '45678901',
      summary: '恶搞红色文化和英雄形象，损害主流价值观。', time: '2025-05-31 14:20:05',
      spread: [['阅读', '95.2w'], ['点赞', '6.7w'], ['评论', '2,831'], ['转发', '9,412']],
      suggestion: '彻底清理', status: '待处置', confidence: 89.9
    },
    {
      id: 'AL250530-009211', riskKey: 'ethics', risk: '道德风化', level: '高危',
      title: '擦边美女直播片段，画面不雅引人不适', media: '直播片段 · 1个', image: 'assets/case-6.png',
      platformKey: 'bilibili', platform: 'B站', account: '@主播小美', followers: '8.9w', accountId: '56789012',
      summary: '传播软色情擦边内容，危害网络生态。', time: '2025-05-30 21:05:33',
      spread: [['播放', '36.1w'], ['点赞', '1.9w'], ['评论', '987'], ['收藏', '5,321']],
      suggestion: '彻底清理', status: '已处置', confidence: 88.6
    }
  ];

  var extraAlerts = baseAlerts.map(function (item, index) {
    var copy = Object.assign({}, item);
    copy.id = 'AL250529-008' + (900 + index);
    copy.title = ['借热门影视剧散播历史虚无论调', '以情感话题包装极端性别对立', '方言段子中夹带低俗侮辱内容', '未成年人账号分享游戏解锁教程', '二创视频戏谑革命历史人物', '直播PK环节出现持续擦边行为'][index];
    copy.time = '2025-05-' + String(29 - Math.floor(index / 2)).padStart(2, '0') + ' ' + ['18:32:10', '15:08:43', '11:46:27', '09:18:56', '20:12:05', '16:54:31'][index];
    copy.status = ['待处置', '待人工审核', '已处置', '已通过', '待处置', '整改中'][index];
    copy.confidence = item.confidence - 3.4;
    return copy;
  });

  window.APP_DATA = {
    totals: {
      authors: '20万+', works: '500万+', todayAuthors: '1万+', todayWorks: '5万+',
      highRisk: '1,248', newAlerts: '8,452', handled: '6,173', manual: '2,371'
    },
    categories: [
      { key: 'political', label: '政治安全', value: 2156, percent: 25.5, color: '#f04438' },
      { key: 'social', label: '社会安全', value: 1542, percent: 18.2, color: '#ff7a00' },
      { key: 'ethics', label: '道德风化', value: 1230, percent: 14.6, color: '#f5b400' },
      { key: 'minor', label: '未成年人保护', value: 1123, percent: 13.3, color: '#14b8a6' },
      { key: 'culture', label: '文化信息', value: 2393, percent: 28.4, color: '#4f6bed' }
    ],
    warningTypes: [
      { label: '图像预警', value: '3,215', trend: '21.7%', icon: 'image' },
      { label: '文字预警', value: '2,168', trend: '17.8%', icon: 'file-text' },
      { label: '图文关联预警', value: '2,347', trend: '18.9%', icon: 'images' },
      { label: '亚文化预警', value: '722', trend: '15.3%', icon: 'scan-search' }
    ],
    topRisks: [
      { label: '历史虚无', value: '1,248', trend: '15.3%', color: '#ef4444' },
      { label: '多模态隐晦虚假内容', value: '1,002', trend: '10.2%', color: '#f97316' },
      { label: '违法违规', value: '722', trend: '8.7%', color: '#f59e0b' }
    ],
    latestWarnings: [
      { id: 'AL250602-009845', title: '歪曲抗战历史，宣扬“日本侵华是正当行为”', image: 'assets/case-1.png', platformKey: 'douyin', platform: '抖音', time: '10:25' },
      { id: 'AL250602-009844', title: '编造极端内容，歪曲新疆治理事实真相', image: 'assets/case-2.png', platformKey: 'weibo', platform: '微博', time: '10:24' },
      { id: 'AL250601-009712', title: '宣扬“男女混厕”谣言，引导性别对立', image: 'assets/case-3.png', platformKey: 'rednote', platform: '小红书', time: '10:23' },
      { id: 'AL250601-009658', title: '散布封建迷信，声称“转发可改命”', image: 'assets/case-4.png', platformKey: 'zhihu', platform: '知乎', time: '10:22' },
      { id: 'AL250531-009433', title: '制造未成年人不良行为，宣扬危险挑战', image: 'assets/case-5.png', platformKey: 'kuaishou', platform: '快手', time: '10:21' }
    ],
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
    alerts: baseAlerts.concat(extraAlerts),
    detail: {
      id: 'AL250602-009845', category: '宣扬畸形审美', confidence: '94.1%', type: '待人工研判', time: '2025-06-02 10:27:14', platform: '抖音',
      originalText: '跳出性别定义束缚，活出真实的自我；\n男扮女妆没有性别限制界限，只要我开心；\n喜欢怎样穿搭就怎样穿搭，自信做自己！',
      account: '自由星球发言人', accountId: '9876543210', fans: '32.6万', likes: '389.2万',
      conclusion: '涉嫌社会认知误导与不良价值导向',
      judgments: [
        { label: '社会认知误导', tone: 'danger', icon: 'shield-alert' },
        { label: '性别观念误导', tone: 'warning', icon: 'circle-alert' },
        { label: '影响未成年人认知', tone: 'success', icon: 'user-round' }
      ],
      evidence: [
        ['使用“跳脱性别框架”等表述，刻意弱化传统性别认知', '00:02'],
        ['宣扬“男性打扮成女性也无所谓”等错误性别观念', '00:05'],
        ['内容面向公众传播，可能影响未成年人认知', '00:08']
      ],
      rules: ['社会认知误导', '不良价值导向', '性别观念误导', '影响未成年人认知'],
      similar: [
        ['案例1：短视频宣扬性别错位审美与不良价值导向', '抖音', '92%', '责令修正'],
        ['案例2：图文内容传播错误性别观念并误导未成年人认知', '小红书', '89%', '责令修正'],
        ['案例3：漫画式内容弱化传统性别角色并引发争议', '微博', '86%', '限期整改'],
        ['案例4：图文作品借亚文化表达传播不当社会认知', 'B站', '84%', '责令修正']
      ]
    }
  };
})();
