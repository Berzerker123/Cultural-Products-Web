(function () {
  'use strict';

  var data = window.APP_DATA;
  var state = {
    menuOpen: false,
    sidebarCollapsed: false,
    filters: { search: '', platform: 'all', risk: 'all', status: 'all', sort: 'newest' },
    page: 1,
    pageSize: 6,
    draft: {},
    detailRules: {},
    lastAlertsHash: '#/alerts'
  };

  var platformMeta = {
    douyin: { label: '抖音', className: 'platform-douyin', mark: '音', image: 'assets/platform-douyin.png' },
    wechat: { label: '微信', className: 'platform-wechat', mark: '微', image: 'assets/platform-wechat.png' },
    rednote: { label: '小红书', className: 'platform-rednote', mark: '书', image: 'assets/platform-rednote.png' },
    kuaishou: { label: '快手', className: 'platform-kuaishou', mark: '快', image: 'assets/platform-kuaishou.png' },
    weibo: { label: '微博', className: 'platform-weibo', mark: '博', image: 'assets/platform-weibo.png' },
    zhihu: { label: '知乎', className: 'platform-zhihu', mark: '知' },
    bilibili: { label: 'B站', className: 'platform-bilibili', mark: 'B' }
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function formatNumber(value) {
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function platformBadge(key, label) {
    var meta = platformMeta[key] || { label: label || '平台', className: 'platform-default', mark: '平' };
    var graphic = meta.image ? '<img src="' + escapeHtml(meta.image) + '" alt="">' : '<b>' + escapeHtml(meta.mark) + '</b>';
    return '<span class="platform-badge ' + meta.className + '">' + graphic + '<span>' + escapeHtml(label || meta.label) + '</span></span>';
  }

  function platformIcon(key, label) {
    var meta = platformMeta[key] || { label: label || '平台', className: 'platform-default', mark: '平' };
    var graphic = meta.image ? '<img src="' + escapeHtml(meta.image) + '" alt="" aria-hidden="true">' : '<b aria-hidden="true">' + escapeHtml(meta.mark) + '</b>';
    return '<span class="latest-platform ' + meta.className + '">' + graphic + '<span class="sr-only">平台：' + escapeHtml(label || meta.label) + '</span></span>';
  }

  function riskDot(key, label) {
    return '<span class="risk-label risk-' + escapeHtml(key) + '"><i></i>' + escapeHtml(label) + '</span>';
  }

  function trend(value, tone) {
    return '<span class="trend ' + (tone || 'up') + '"><span aria-hidden="true">▲</span> ' + escapeHtml(value) + '</span>';
  }

  function parseRoute() {
    var raw = location.hash.replace(/^#\/?/, '') || 'overview';
    var parts = raw.split('?');
    var path = parts[0];
    var query = new URLSearchParams(parts[1] || '');
    if (path.indexOf('detail/') === 0) return { name: 'detail', id: decodeURIComponent(path.slice(7)) || data.detail.id, query: query };
    if (path === 'alerts') return { name: 'alerts', query: query };
    return { name: 'overview', query: query };
  }

  function setAlertsHash(changes) {
    var values = Object.assign({}, state.filters, changes || {});
    var params = new URLSearchParams();
    Object.keys(values).forEach(function (key) {
      if (values[key] && values[key] !== 'all' && values[key] !== 'newest') params.set(key, values[key]);
    });
    params.set('page', String(changes && Object.prototype.hasOwnProperty.call(changes, 'page') ? changes.page : 1));
    location.hash = '#/alerts?' + params.toString();
  }

  function syncStateFromRoute(route) {
    if (route.name !== 'alerts') return;
    var q = route.query;
    state.filters.search = q.get('search') || '';
    state.filters.platform = q.get('platform') || 'all';
    state.filters.risk = q.get('risk') || 'all';
    state.filters.status = q.get('status') || 'all';
    state.filters.sort = q.get('sort') || 'newest';
    state.page = Math.max(1, Number(q.get('page') || 1));
  }

  function updateClock() {
    var now = new Date();
    var time = now.toLocaleTimeString('zh-CN', { hour12: false });
    var date = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0')
    ].join('-');
    var dayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    var timeEl = document.getElementById('current-time');
    var dateEl = document.getElementById('current-date');
    var weekEl = document.getElementById('current-week');
    if (timeEl) timeEl.textContent = time;
    if (dateEl) dateEl.textContent = date;
    if (weekEl) weekEl.textContent = dayNames[now.getDay()];
  }

  function showToast(message, tone) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'toast show ' + (tone || '');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(function () { toast.className = 'toast'; }, 2800);
  }

  function metricCard(iconName, label, value, options) {
    var opts = options || {};
    return '<article class="metric-card ' + (opts.tone || '') + '">' +
      '<div class="metric-icon">' + icon(iconName, 26) + '</div>' +
      '<div class="metric-copy"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value) + '</strong>' +
      (opts.note ? '<small>' + escapeHtml(opts.note) + '</small>' : '') +
      (opts.trend ? trend(opts.trend, opts.trendTone) : '') + '</div></article>';
  }

  function renderOverview() {
    var totals = data.totals;
    var categoryStops = [];
    var cursor = 0;
    data.categories.forEach(function (item) {
      categoryStops.push(item.color + ' ' + cursor + '% ' + (cursor + item.percent) + '%');
      cursor += item.percent;
    });
    var latest = data.latestWarnings || data.alerts.slice(0, 5);
    var accountRows = data.accounts.map(function (item) {
      return '<div class="account-row"><img class="avatar" src="' + escapeHtml(item[4]) + '" alt="' + escapeHtml(item[0]) + '头像" loading="lazy"><strong>' + escapeHtml(item[0]) + '</strong><span class="account-stat"><small>粉丝数</small>' + escapeHtml(item[1]) + '</span><span class="account-stat"><small>作品数</small>' + escapeHtml(item[2]) + '</span></div>';
    }).join('');
    var latestRows = latest.map(function (item) {
      var displayTime = item.time.length > 5 ? item.time.slice(11, 16) : item.time;
      return '<button class="latest-row" type="button" data-action="open-detail" data-id="' + escapeHtml(item.id) + '">' +
        '<img class="latest-thumbnail" src="' + escapeHtml(item.image) + '" alt="" loading="lazy"><span class="latest-copy"><strong>' + escapeHtml(item.title) + '</strong></span>' +
        platformIcon(item.platformKey, item.platform) + '<time class="latest-time">' + escapeHtml(displayTime) + '</time></button>';
    }).join('');
    var topRisks = data.topRisks.map(function (item) {
      return '<div class="top-risk-card"><strong style="color:' + item.color + '">' + escapeHtml(item.label) + '</strong><b style="color:' + item.color + '">' + escapeHtml(item.value) + '</b>' + trend(item.trend, 'danger') + '</div>';
    }).join('');
    var warningTypes = data.warningTypes.map(function (item) {
      return '<article class="warning-type-card"><span class="warning-type-icon">' + icon(item.icon, 30) + '</span><strong>' + escapeHtml(item.label) + '</strong><b>' + escapeHtml(item.value) + '</b>' + trend(item.trend) + '<small>较昨日</small></article>';
    }).join('');
    var mapSources = [
      ['wechat', '微信', 'platform-wechat'], ['weibo', '微博', 'platform-weibo'], ['douyin', '抖音', 'platform-douyin'],
      ['kuaishou', '快手', 'platform-kuaishou'], ['rednote', '小红书', 'platform-rednote'], ['all', '更多平台', 'platform-more']
    ].map(function (source) {
      var sourceMeta = platformMeta[source[0]];
      var imagePath = source[0] === 'all' ? 'assets/platform-more.png' : (sourceMeta && sourceMeta.image);
      var graphic = imagePath ? '<img src="' + escapeHtml(imagePath) + '" alt="">' : '<b>' + escapeHtml(sourceMeta ? sourceMeta.mark : '平') + '</b>';
      return '<button type="button" class="map-source ' + source[2] + '" data-action="platform-filter" data-platform="' + source[0] + '">' + graphic + '<span>' + source[1] + '</span></button>';
    }).join('');
    var legend = data.categories.map(function (item) { return '<span><i style="background:' + item.color + '"></i>' + escapeHtml(item.label) + '</span>'; }).join('');

    return [
      '<div class="page page-overview"><section class="overview-grid"><div class="overview-left">',
      '<section class="panel monitor-panel"><div class="panel-heading"><div><span class="eyebrow">TODAY · MONITORING</span><h1>今日监测概况</h1></div><button class="text-button" type="button" data-action="show-refresh">数据实时更新 ', icon('refresh-cw', 15), '</button></div><div class="metric-grid">',
      metricCard('user-round', '累计监测作者数量', totals.authors), metricCard('file-text', '累计监测作品数量', totals.works),
      metricCard('user-pen', '今日累计监测作者数量', totals.todayAuthors, { note: '较昨日', trend: '12.7%' }), metricCard('scan-search', '今日累计监测作品数量', totals.todayWorks, { note: '较昨日', trend: '18.6%' }),
      metricCard('triangle-alert', '高危预警', totals.highRisk, { note: '较昨日', trend: '15.3%', tone: 'metric-danger', trendTone: 'danger' }), metricCard('bell', '新增预警', totals.newAlerts, { note: '较昨日', trend: '23.4%', tone: 'metric-warning' }),
      metricCard('shield-check', '已处置预警', totals.handled, { note: '较昨日', trend: '22.7%', tone: 'metric-success' }), metricCard('user-pen', '人工处置预警', totals.manual, { note: '较昨日', trend: '9.1%', tone: 'metric-orange' }),
      '</div></section>',
      '<section class="panel distribution-panel"><div class="panel-heading"><div><span class="eyebrow">RISK DOMAIN</span><h2>失范领域分布图</h2></div><button class="icon-button" type="button" data-action="show-refresh" aria-label="刷新分布图">', icon('refresh-cw', 18), '</button></div>',
      '<div class="distribution-content"><div class="donut" style="background:conic-gradient(', categoryStops.join(','), ')"><div><strong>总数</strong><b>8,452</b><small>今日预警</small></div></div><div class="distribution-legend">',
      data.categories.map(function (item) { return '<button type="button" data-action="risk-filter" data-risk="' + item.key + '"><i style="background:' + item.color + '"></i><span>' + escapeHtml(item.label) + '</span><b>' + formatNumber(item.value) + '</b><small>(' + item.percent + '%)</small></button>'; }).join(''),
      '</div></div></section></div>',
      '<div class="overview-center"><section class="panel map-panel"><div class="map-heading"><div><span class="eyebrow">NATIONAL RISK SENSE</span><h2>全国风险态势感知</h2></div><span class="live-dot"><i></i>实时</span></div>',
      '<div class="map-stage"><div class="map-source-rail">', mapSources, '</div><div class="map-image-wrap"><img src="assets/china-map-clean.png" alt="全国风险态势示意图"><button class="map-marker marker-beijing" type="button" data-action="map-marker" data-label="北京：高危预警 248 条" aria-label="北京风险点"></button><button class="map-marker marker-shanghai" type="button" data-action="map-marker" data-label="上海：高危预警 176 条" aria-label="上海风险点"></button><button class="map-marker marker-sichuan" type="button" data-action="map-marker" data-label="四川：高危预警 132 条" aria-label="四川风险点"></button></div></div>',
      '<div class="map-legend"><strong>失范领域：</strong>', legend, '</div></section>',
      '<section class="panel warning-panel"><div class="panel-heading"><div><span class="eyebrow">ALERT TYPES</span><h2>价值失范预警</h2></div><button class="text-button" type="button" data-action="go-alerts">查看全部 ', icon('chevron-right', 15), '</button></div><div class="warning-type-grid">', warningTypes, '</div></section></div>',
      '<div class="overview-right"><section class="panel top-risks-panel"><div class="panel-heading"><div><span class="eyebrow">NEW ALERTS</span><h2>今日新增预警</h2></div><button class="text-button" type="button" data-action="go-alerts">更多 ', icon('chevron-right', 15), '</button></div><h3>TOP3 失范类别</h3><div class="top-risk-grid">', topRisks, '</div></section>',
      '<section class="panel latest-panel"><div class="panel-heading"><div><span class="eyebrow">LATEST HIGH RISK</span><h2>最新高危预警</h2></div><button class="text-button" type="button" data-action="go-alerts">更多 ', icon('chevron-right', 15), '</button></div><div class="latest-list">', latestRows, '</div></section>',
      '<section class="panel accounts-panel"><div class="panel-heading"><div><span class="eyebrow">WATCH LIST</span><h2>重点账号关注</h2></div><button class="text-button" type="button" data-action="nav-placeholder" data-label="重点账号">更多 ', icon('chevron-right', 15), '</button></div><div class="account-list">', accountRows, '</div></section></div>',
      '</section></div>'
    ].join('');
  }

  function filterAlerts() {
    var f = state.filters;
    var list = data.alerts.filter(function (item) {
      var needle = f.search.trim().toLowerCase();
      var matchesSearch = !needle || [item.title, item.summary, item.account, item.id].join(' ').toLowerCase().indexOf(needle) > -1;
      var matchesPlatform = f.platform === 'all' || item.platformKey === f.platform;
      var matchesRisk = f.risk === 'all' || item.riskKey === f.risk;
      var matchesStatus = f.status === 'all' || item.status === f.status;
      return matchesSearch && matchesPlatform && matchesRisk && matchesStatus;
    });
    if (f.sort === 'confidence') list.sort(function (a, b) { return b.confidence - a.confidence; });
    else if (f.sort === 'oldest') list.sort(function (a, b) { return a.time.localeCompare(b.time); });
    else list.sort(function (a, b) { return b.time.localeCompare(a.time); });
    return list;
  }

  function alertSummaryCard(iconName, label, value, trendValue, tone) {
    return '<article class="alert-summary-card ' + (tone || '') + '"><span class="summary-icon">' + icon(iconName, 28) + '</span><div><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value) + '</strong><small>较昨日 ' + trend(trendValue, tone === 'danger' ? 'danger' : 'up') + '</small></div></article>';
  }

  function renderKeywordCloud() {
    return data.keywords.map(function (item, index) {
      var size = 13 + Math.round(item[1] / 9);
      var color = index % 5 === 0 ? 'keyword-hot' : (index % 3 === 0 ? 'keyword-mid' : '');
      return '<button type="button" class="keyword ' + color + '" style="font-size:' + size + 'px" data-action="keyword-search" data-keyword="' + escapeHtml(item[0]) + '">' + escapeHtml(item[0]) + '</button>';
    }).join('');
  }

  function renderAlertsTable(list) {
    if (!list.length) return '<div class="empty-state"><span>' + icon('search', 30) + '</span><strong>没有匹配的预警记录</strong><p>调整筛选条件后再试，或恢复全部记录。</p><button class="button secondary" type="button" data-action="reset-filters">恢复全部</button></div>';
    return '<div class="table-scroll"><table class="alerts-table"><thead><tr><th>序号</th><th>危险等级</th><th>作品信息</th><th>平台账号</th><th>内容摘要</th><th>发布时间</th><th>传播数据</th><th>处置建议</th><th>处置状态</th><th>操作</th></tr></thead><tbody>' + list.map(function (item, index) {
      var spread = item.spread.map(function (entry) { return '<span>' + escapeHtml(entry[0]) + ' <b>' + escapeHtml(entry[1]) + '</b></span>'; }).join('');
      return '<tr><td><span class="row-index">' + (index + 1 + (state.page - 1) * state.pageSize) + '</span></td><td>' + riskDot(item.riskKey, item.risk) + '</td><td><div class="work-cell"><img src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.title) + '"><div><strong>' + escapeHtml(item.title) + '</strong><small>' + escapeHtml(item.media) + '</small></div></div></td><td><div class="platform-account">' + platformBadge(item.platformKey, item.platform) + '<strong>' + escapeHtml(item.account) + '</strong><small>粉丝：' + escapeHtml(item.followers) + ' · ID: ' + escapeHtml(item.accountId) + '</small></div></td><td><p class="summary-cell">' + escapeHtml(item.summary) + '</p></td><td><time>' + escapeHtml(item.time.slice(0, 10)) + '<br>' + escapeHtml(item.time.slice(11)) + '</time></td><td><div class="spread-cell">' + spread + '</div></td><td><strong class="suggestion suggestion-' + (item.suggestion === '彻底清理' ? 'danger' : 'warning') + '">' + escapeHtml(item.suggestion) + '</strong></td><td><span class="status status-' + ((item.status === '已处置' || item.status === '已通过') ? 'done' : item.status === '整改中' ? 'progress' : 'pending') + '">' + escapeHtml(item.status) + '</span></td><td><div class="row-actions"><button class="link-button" type="button" data-action="open-detail" data-id="' + escapeHtml(item.id) + '">查看详情</button><button class="subtle-link" type="button" data-action="mark-item" data-id="' + escapeHtml(item.id) + '">标记 <span aria-hidden="true">|</span> 加入黑名单</button></div></td></tr>';
    }).join('') + '</tbody></table></div>';
  }

  function renderAlerts() {
    var list = filterAlerts();
    var totalPages = Math.max(1, Math.ceil(list.length / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;
    var pageList = list.slice((state.page - 1) * state.pageSize, state.page * state.pageSize);
    var pageButtons = '';
    for (var p = 1; p <= totalPages; p += 1) pageButtons += '<button type="button" class="page-number ' + (p === state.page ? 'active' : '') + '" data-action="page" data-page="' + p + '">' + p + '</button>';
    var statusTabs = [['all', '全部', '1,248'], ['待处置', '待处理', '1,248'], ['待人工审核', '待人工审核', '2,371'], ['已通过', '已通过', '1,732'], ['已处置', '已处置', '11,732']].map(function (tab) { return '<button class="alert-tab ' + (state.filters.status === tab[0] ? 'active' : '') + '" type="button" data-action="status-tab" data-status="' + tab[0] + '">' + tab[1] + ' <span>(' + tab[2] + ')</span></button>'; }).join('');
    return '<div class="page page-alerts"><div class="alerts-top-grid"><section class="panel alert-summary-panel"><div class="section-title-line"><div><span class="eyebrow">REAL-TIME MONITORING</span><h1>实时预警</h1></div><span class="updated-label"><i></i>最后更新 10:28:36</span></div><div class="alert-summary-grid">' + alertSummaryCard('bell', '待处置预警', '1,248', '15.3%', 'danger') + alertSummaryCard('shield-alert', '24小时内新发现', '532', '18.9%', 'warning') + alertSummaryCard('shield-check', '今日已完结', '1,732', '18.4%', 'success') + alertSummaryCard('file-text', '待人工审核', '2,371', '9.1%', 'info') + '</div></section><section class="panel keyword-panel"><div class="section-title-line"><div><span class="eyebrow">KEYWORD EXTRACTION</span><h2>关键词云 <small>（危害作品提取）</small></h2></div><span class="keyword-count">15 个高频词</span></div><div class="keyword-cloud">' + renderKeywordCloud() + '</div></section></div><section class="panel filter-panel"><form class="filter-form" id="filter-form"><label class="search-field"><span class="sr-only">内容关键词</span><input id="filter-search" name="search" value="' + escapeHtml(state.filters.search) + '" placeholder="请输入内容关键词"><button type="submit" aria-label="搜索">' + icon('search', 19) + '</button></label><label class="filter-select"><span>平台</span><select name="platform"><option value="all">全部</option>' + Object.keys(platformMeta).map(function (key) { return '<option value="' + key + '" ' + (state.filters.platform === key ? 'selected' : '') + '>' + platformMeta[key].label + '</option>'; }).join('') + '</select></label><label class="filter-select"><span>发布时间</span><select name="sort"><option value="newest" ' + (state.filters.sort === 'newest' ? 'selected' : '') + '>最新发布</option><option value="oldest" ' + (state.filters.sort === 'oldest' ? 'selected' : '') + '>最早发布</option><option value="confidence" ' + (state.filters.sort === 'confidence' ? 'selected' : '') + '>模型置信度</option></select></label><label class="filter-select"><span>失范领域</span><select name="risk"><option value="all">全部</option>' + data.categories.map(function (item) { return '<option value="' + item.key + '" ' + (state.filters.risk === item.key ? 'selected' : '') + '>' + item.label + '</option>'; }).join('') + '</select></label><label class="filter-select"><span>处置状态</span><select name="status"><option value="all" ' + (state.filters.status === 'all' ? 'selected' : '') + '>全部</option><option value="待处置" ' + (state.filters.status === '待处置' ? 'selected' : '') + '>待处置</option><option value="待人工审核" ' + (state.filters.status === '待人工审核' ? 'selected' : '') + '>待人工审核</option><option value="整改中" ' + (state.filters.status === '整改中' ? 'selected' : '') + '>整改中</option><option value="已通过" ' + (state.filters.status === '已通过' ? 'selected' : '') + '>已通过</option><option value="已处置" ' + (state.filters.status === '已处置' ? 'selected' : '') + '>已处置</option></select></label><div class="date-range"><span>时间范围</span><input type="date" value="2025-05-01" aria-label="开始日期"><i>至</i><input type="date" value="2025-06-02" aria-label="结束日期"></div><div class="filter-actions"><button class="button secondary" type="button" data-action="reset-filters">重置</button><button class="button primary" type="submit">搜索 ' + icon('search', 16) + '</button></div></form></section><section class="panel table-panel"><div class="table-tabs">' + statusTabs + '</div>' + renderAlertsTable(pageList) + '<div class="table-footer"><span>共 <b>1,248</b> 条记录 · 当前展示 ' + list.length + ' 条示例数据</span><div class="pagination"><button type="button" class="page-number" data-action="page" data-page="prev" aria-label="上一页">' + icon('chevron-left', 16) + '</button>' + pageButtons + '<button type="button" class="page-number" data-action="page" data-page="next" aria-label="下一页">' + icon('chevron-right', 16) + '</button></div><span>数据每10秒自动刷新 <button class="icon-button" type="button" data-action="show-refresh" aria-label="刷新">' + icon('refresh-cw', 17) + '</button></span></div></section></div>';
  }

  function getDetail(id) {
    var item = data.alerts.find(function (entry) { return entry.id === id; }) || data.alerts[1];
    if (id === data.detail.id) {
      var saved = state.draft[id] || {};
      return Object.assign({}, data.detail, { image: 'assets/detail-work.png', title: item.title, sourceItem: item, rules: state.detailRules[id] || data.detail.rules, judgment: saved.judgment || '确认失范', opinion: saved.opinion || '' });
    }
    return {
      id: item.id, category: item.risk === '道德风化' ? '低俗不良内容' : item.risk === '政治安全' ? '历史认知误导' : item.risk,
      confidence: item.confidence.toFixed(1) + '%', type: item.status === '已处置' ? '已完成处置' : '待人工研判', time: item.time, platform: item.platform,
      image: item.image, title: item.title, sourceItem: item, originalText: item.title + '\n\n' + item.summary,
      account: item.account.replace('@', ''), accountId: item.accountId, fans: item.followers, likes: item.spread[0] ? item.spread[0][1] : '—',
      conclusion: item.summary, judgments: [{ label: item.risk, tone: 'danger', icon: 'shield-alert' }, { label: '不良价值导向', tone: 'warning', icon: 'circle-alert' }],
      evidence: [['识别到与' + item.risk + '相关的高风险表述', '00:02'], ['传播范围较广，存在扩散风险', '00:05'], ['建议结合人工复核确认处置等级', '00:08']],
      rules: state.detailRules[id] || [item.risk, '不良价值导向'], similar: data.detail.similar,
      judgment: (state.draft[id] || {}).judgment || '确认失范', opinion: (state.draft[id] || {}).opinion || ''
    };
  }

  function ruleTags(detail) {
    return (detail.rules || []).map(function (rule, index) { return '<span class="rule-tag">' + escapeHtml(rule) + '<button type="button" data-action="remove-rule" data-index="' + index + '" aria-label="移除' + escapeHtml(rule) + '">' + icon('x', 12) + '</button></span>'; }).join('');
  }

  function renderDetail(route) {
    var detail = getDetail(route.id);
    var item = detail.sourceItem;
    var similar = (detail.similar || []).map(function (row, index) { return '<button class="similar-row" type="button" data-action="open-detail" data-id="' + escapeHtml(index === 0 ? data.detail.id : data.alerts[index + 1].id) + '"><strong>' + escapeHtml(row[0]) + '</strong><span>平台：' + escapeHtml(row[1]) + '</span><span>相似度：<b>' + escapeHtml(row[2]) + '</b></span><span>处置：' + escapeHtml(row[3]) + '</span>' + icon('chevron-right', 17) + '</button>'; }).join('');
    var evidence = (detail.evidence || []).map(function (row) { return '<li><span>' + escapeHtml(row[0]) + '</span><time>' + escapeHtml(row[1]) + '</time></li>'; }).join('');
    var logs = [['2025-06-02 10:28:34', '创建记录', 'AI研判', '研判员（当前）', '待复核', '来源：预警/复核'], ['2025-06-02 10:27:48', '触发人工研判流程', 'AI研判', '系统', '待研判', '置信度：' + detail.confidence], ['2025-06-02 10:27:19', 'AI预警', '系统', '系统', '高危', '内容标签：' + detail.category], ['2025-06-02 10:27:14', '数据获取', '数据引擎', '系统', '—', '平台：' + detail.platform], ['2025-06-02 10:27:06', '发现内容', '内容中心（自动入库）', '—', '—', '规则ID：V2-07-03']];
    var logRows = logs.map(function (row) { return '<tr>' + row.map(function (cell) { return '<td>' + escapeHtml(cell) + '</td>'; }).join('') + '</tr>'; }).join('');
    return '<div class="page page-detail"><div class="detail-toolbar"><div class="breadcrumb"><button type="button" class="breadcrumb-link" data-action="go-alerts">研判中心</button><span>›</span><strong>预警详情</strong></div><div class="detail-title-row"><div><span class="eyebrow">ALERT DETAIL</span><h1>预警详情</h1></div><div class="detail-meta"><span><small>预警编号</small><b>' + escapeHtml(detail.id) + '</b></span><span class="meta-danger"><small>失范类别</small><b>' + icon('triangle-alert', 17) + escapeHtml(detail.category) + '</b></span><span><small>模型置信度</small><b>' + escapeHtml(detail.confidence) + '</b></span><span class="meta-warning"><small>违规类型</small><b>◇ ' + escapeHtml(detail.type) + '</b></span><span><small>发布时间</small><b>' + escapeHtml(detail.time) + '</b></span><span><small>平台</small><b>' + platformBadge(item ? item.platformKey : 'douyin', detail.platform) + '</b></span></div><div class="detail-actions"><button class="button secondary" type="button" data-action="go-alerts">' + icon('arrow-left', 16) + ' 返回列表</button><button class="button primary" type="button" data-action="export-report">' + icon('download', 16) + ' 导出报告</button></div></div></div><div class="detail-grid"><div class="detail-left"><section class="panel original-panel"><div class="panel-heading"><h2>原始作品</h2><span class="source-pill">内容截图</span></div><div class="original-media"><img src="' + escapeHtml(detail.image) + '" alt="原始作品截图"></div><div class="transcript"><div class="subheading"><strong>原始文案 / 字幕摘要</strong><button class="icon-text-button" type="button" data-action="copy-text">' + icon('copy', 15) + ' 复制全部</button></div><p>' + escapeHtml(detail.originalText).replace(/\n/g, '<br>') + '</p></div></section><section class="panel account-detail-panel"><div class="panel-heading"><h2>账号信息</h2><span class="verified">已认证</span></div><div class="account-hero"><span class="large-avatar">' + escapeHtml((detail.account || '自').slice(0, 1)) + '</span><div><strong>' + escapeHtml(detail.account) + '</strong><small>ID: ' + escapeHtml(detail.accountId) + '</small></div></div><div class="account-metrics"><span><small>粉丝数</small><b>' + escapeHtml(detail.fans) + '</b></span><span><small>获赞阅读</small><b>' + escapeHtml(detail.likes) + '</b></span><span><small>安全认证</small><b class="green-text">已认证</b></span><span><small>近30日趋势</small><b class="sparkline">▂▃▅▆▇▇▇</b></span></div></section><section class="panel spread-detail-panel"><div class="panel-heading"><h2>传播数据</h2><span>截至 10:28</span></div><div class="spread-detail-grid">' + (item ? item.spread : [['情感度量', '86.27万'], ['点赞', '11.27万'], ['评论', '8,642'], ['分享', '3,217'], ['图文热度', '1.9775万/小时']]).map(function (entry) { return '<span><small>' + escapeHtml(entry[0]) + '</small><b>' + escapeHtml(entry[1]) + '</b><em>↑ ' + (Math.floor(Math.random() * 20) + 65) + '.4%</em></span>'; }).join('') + '</div></section></div><div class="detail-middle"><section class="panel ai-panel"><div class="panel-heading"><div><span class="eyebrow">MODEL REVIEW</span><h2>AI失范分析</h2></div><span class="model-chip">V2.07 · 多模态</span></div><div class="conclusion-banner"><span class="banner-icon">' + icon('shield-alert', 24) + '</span><strong>风险结论</strong><b>' + escapeHtml(detail.conclusion) + '</b></div><div class="subsection"><h3>关键模型判断</h3><div class="judgment-grid">' + detail.judgments.map(function (j) { return '<div class="judgment-chip ' + j.tone + '">' + icon(j.icon, 22) + '<strong>' + escapeHtml(j.label) + '</strong></div>'; }).join('') + '</div></div><div class="subsection evidence-section"><h3>关键证据</h3><ul class="evidence-list">' + evidence + '</ul></div><div class="subsection logic-section"><h3>逻辑摘要</h3><div class="logic-copy">' + icon('file-text', 24) + '<p>以反传统价值观的表达方式传播错误认知，具有较强的社会认知误导性和价值导向风险。</p></div></div></section><section class="panel similar-panel"><div class="panel-heading"><h2>相似案例</h2><span>按相似度排序</span></div><div class="similar-list">' + similar + '</div></section></div><div class="detail-right"><section class="panel disposition-panel"><div class="panel-heading"><div><span class="eyebrow">HUMAN REVIEW</span><h2>研判与处置</h2></div><span class="required-label">* 必填项</span></div><div class="recommendation-box"><span>' + icon('triangle-alert', 28) + '</span><strong>责令修正</strong><small>应停止错误认知引导内容</small></div><form id="judgment-form"><fieldset><legend>研判结论 <i>*</i></legend><div class="radio-row"><label><input type="radio" name="judgment" value="确认失范" ' + (detail.judgment === '确认失范' ? 'checked' : '') + '><span>确认失范</span></label><label><input type="radio" name="judgment" value="部分失范" ' + (detail.judgment === '部分失范' ? 'checked' : '') + '><span>部分失范</span></label><label><input type="radio" name="judgment" value="无法判断" ' + (detail.judgment === '无法判断' ? 'checked' : '') + '><span>无法判断</span></label><label><input type="radio" name="judgment" value="模型误报" ' + (detail.judgment === '模型误报' ? 'checked' : '') + '><span>模型误报</span></label></div></fieldset><fieldset><legend>最终关联规则（可多选）<i>*</i></legend><div class="rule-editor"><div class="rule-tags">' + ruleTags(detail) + '</div><button class="add-rule" type="button" data-action="add-rule">' + icon('plus', 14) + ' 选择标签</button></div></fieldset><fieldset><legend>研判意见 <i>*</i></legend><div class="textarea-wrap"><textarea id="judgment-opinion" name="opinion" maxlength="500" placeholder="请撰写研判意见（不少于10字）">' + escapeHtml(detail.opinion) + '</textarea><span id="opinion-count">' + String(detail.opinion || '').length + '/500</span></div></fieldset><div class="form-actions"><button class="button danger" type="button" data-action="save-suggestion">采纳建议</button><button class="button secondary" type="button" data-action="switch-disposition">切换处置</button><button class="button muted" type="button" data-action="mark-false">判定为误报</button><button class="button primary" type="submit">提交复核 ' + icon('send', 15) + '</button></div></form></section><section class="panel process-panel"><div class="panel-heading"><h2>复核 / 审批流程</h2><span>提交后自动流转</span></div><div class="process-flow"><div class="process-step active"><span>' + icon('user-pen', 20) + '</span><strong>研判（当前）</strong><small>等待中</small></div><i></i><div class="process-step"><span>' + icon('user-round', 20) + '</span><strong>复核</strong><small>资深研判员</small></div><i></i><div class="process-step"><span>' + icon('user-round', 20) + '</span><strong>审批</strong><small>审核主管</small></div><i></i><div class="process-step"><span>' + icon('monitor-check', 20) + '</span><strong>执行处置</strong><small>平台执行</small></div></div></section></div></div><section class="panel logs-panel"><div class="panel-heading"><div class="log-tabs"><button class="active" type="button">操作日志</button><button type="button">处置记录</button><button type="button">历史预警</button></div><span>共 5 条</span></div><div class="table-scroll"><table class="logs-table"><thead><tr><th>时间</th><th>操作记录</th><th>操作人</th><th>角色</th><th>结果</th><th>备注</th></tr></thead><tbody>' + logRows + '</tbody></table></div></section></div>';
  }

  function render() {
    var route = parseRoute();
    syncStateFromRoute(route);
    var main = document.getElementById('main-content');
    if (!main) return;
    if (route.name === 'overview') main.innerHTML = renderOverview();
    else if (route.name === 'alerts') main.innerHTML = renderAlerts();
    else main.innerHTML = renderDetail(route);
    document.querySelectorAll('[data-nav]').forEach(function (nav) {
      var target = nav.getAttribute('data-nav');
      nav.classList.toggle('active', target === (route.name === 'detail' ? 'analysis' : route.name));
    });
    document.body.classList.toggle('menu-open', state.menuOpen);
    document.body.classList.toggle('sidebar-collapsed', state.sidebarCollapsed);
    window.hydrateIcons(main);
    window.hydrateIcons(document.querySelector('.topbar'));
    window.hydrateIcons(document.querySelector('.sidebar'));
    if (route.name === 'detail') bindOpinionCounter();
  }

  function bindOpinionCounter() {
    var textarea = document.getElementById('judgment-opinion');
    var counter = document.getElementById('opinion-count');
    if (!textarea || !counter) return;
    textarea.addEventListener('input', function () { counter.textContent = textarea.value.length + '/500'; });
  }

  function copyText() {
    var text = document.querySelector('.transcript p');
    if (!text) return;
    var value = text.innerText;
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(value).then(function () { showToast('原始文案已复制'); }).catch(function () { showToast('复制失败，请手动选择文本', 'error'); });
    else { var area = document.createElement('textarea'); area.value = value; document.body.appendChild(area); area.select(); document.execCommand('copy'); area.remove(); showToast('原始文案已复制'); }
  }

  function exportReport() {
    var route = parseRoute();
    var detail = getDetail(route.id);
    var lines = ['文化产品价值失范作品综合预警平台', '预警编号：' + detail.id, '失范类别：' + detail.category, '模型置信度：' + detail.confidence, '发布时间：' + detail.time, '平台：' + detail.platform, '', '风险结论：' + detail.conclusion, '关联规则：' + (detail.rules || []).join('、'), '研判意见：' + (detail.opinion || '尚未提交')];
    var blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    var link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = detail.id + '-预警报告.txt'; link.click(); URL.revokeObjectURL(link.href); showToast('报告已导出');
  }

  function submitJudgment(event) {
    event.preventDefault();
    var route = parseRoute();
    var form = document.getElementById('judgment-form');
    var opinion = (form.querySelector('textarea') || {}).value || '';
    var judgment = (form.querySelector('input[name="judgment"]:checked') || {}).value || '';
    if (!judgment) { showToast('请选择研判结论', 'error'); return; }
    if (opinion.trim().length < 10) { showToast('研判意见不少于 10 个字', 'error'); form.querySelector('textarea').focus(); return; }
    state.draft[route.id] = { judgment: judgment, opinion: opinion };
    try { localStorage.setItem('cultural-alert-draft', JSON.stringify(state.draft)); } catch (e) { /* private mode */ }
    showToast('已提交复核，流程节点已更新');
    setTimeout(function () { render(); }, 500);
  }

  function readFilterForm() {
    var form = document.getElementById('filter-form');
    if (!form) return;
    var formData = new FormData(form);
    state.filters.search = formData.get('search') || '';
    state.filters.platform = formData.get('platform') || 'all';
    state.filters.risk = formData.get('risk') || 'all';
    state.filters.status = formData.get('status') || 'all';
    state.filters.sort = formData.get('sort') || 'newest';
    setAlertsHash({ page: 1 });
  }

  document.addEventListener('click', function (event) {
    var target = event.target.closest('[data-action]');
    if (!target) return;
    var action = target.getAttribute('data-action');
    if (action === 'toggle-menu') state.menuOpen = !state.menuOpen;
    else if (action === 'collapse-menu') state.sidebarCollapsed = !state.sidebarCollapsed;
    else if (action === 'admin-menu') showToast('管理员菜单暂未开放');
    else if (action === 'nav-placeholder') showToast(target.getAttribute('data-label') + '模块正在建设中');
    else if (action === 'go-alerts') location.hash = state.lastAlertsHash || '#/alerts';
    else if (action === 'open-detail') { if (location.hash.indexOf('#/alerts') === 0) state.lastAlertsHash = location.hash; location.hash = '#/detail/' + encodeURIComponent(target.getAttribute('data-id')); }
    else if (action === 'platform-filter') setAlertsHash({ platform: target.getAttribute('data-platform'), page: 1 });
    else if (action === 'risk-filter') setAlertsHash({ risk: target.getAttribute('data-risk'), page: 1 });
    else if (action === 'keyword-search') setAlertsHash({ search: target.getAttribute('data-keyword'), page: 1 });
    else if (action === 'status-tab') setAlertsHash({ status: target.getAttribute('data-status'), page: 1 });
    else if (action === 'page') {
      var list = filterAlerts(); var pages = Math.max(1, Math.ceil(list.length / state.pageSize)); var requested = target.getAttribute('data-page');
      var next = requested === 'prev' ? state.page - 1 : requested === 'next' ? state.page + 1 : Number(requested); next = Math.min(pages, Math.max(1, next)); setAlertsHash({ page: next });
    } else if (action === 'reset-filters') { state.filters = { search: '', platform: 'all', risk: 'all', status: 'all', sort: 'newest' }; setAlertsHash({ page: 1 }); }
    else if (action === 'show-refresh') { showToast('数据已刷新'); }
    else if (action === 'map-marker') { showToast(target.getAttribute('data-label')); }
    else if (action === 'mark-item') { showToast('已标记记录，可在重点账号中查看'); }
    else if (action === 'copy-text') copyText();
    else if (action === 'export-report') exportReport();
    else if (action === 'add-rule') {
      var route = parseRoute(); var existing = state.detailRules[route.id] || getDetail(route.id).rules.slice();
      if (existing.indexOf('待人工复核') === -1) existing.push('待人工复核'); state.detailRules[route.id] = existing; render();
    } else if (action === 'remove-rule') {
      var routeRemove = parseRoute(); var rules = state.detailRules[routeRemove.id] || getDetail(routeRemove.id).rules.slice(); rules.splice(Number(target.getAttribute('data-index')), 1); state.detailRules[routeRemove.id] = rules; render();
    } else if (action === 'save-suggestion') showToast('已采纳系统处置建议');
    else if (action === 'switch-disposition') showToast('处置方式已切换为限期整改');
    else if (action === 'mark-false') showToast('已标记为待确认误报');
    if (action === 'toggle-menu' || action === 'collapse-menu') render();
  });

  document.addEventListener('submit', function (event) {
    if (event.target.id === 'filter-form') { event.preventDefault(); readFilterForm(); }
    if (event.target.id === 'judgment-form') submitJudgment(event);
  });

  window.addEventListener('hashchange', function () { state.menuOpen = false; render(); });
  try { state.draft = JSON.parse(localStorage.getItem('cultural-alert-draft') || '{}'); } catch (e) { state.draft = {}; }
  updateClock(); setInterval(updateClock, 1000); render();
})();
