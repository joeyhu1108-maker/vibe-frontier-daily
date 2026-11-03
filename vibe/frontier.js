const $ = (selector) => document.querySelector(selector);
const state = { works: [], issues: [], covers: {}, previews: {}, contexts: {}, types: [], query: '', type: 'all', source: 'all', mechanism: 'all', date: 'all', sort: 'newest', count: 12, view: 'discover', events: [], checkedAt: '', returnHash: '#discover', pushedWork: false };
const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const url = (value = '') => { try { const parsed = new URL(value, location.href); return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : '#'; } catch { return '#'; } };
const localMedia = (value = '', folder) => typeof value === 'string' && (value.startsWith(`./vibe/${folder}/`) || /^https:\/\//.test(value)) ? value : '';
const context = (item) => item.context || state.contexts[item.id] || {};
const cover = (item) => localMedia(state.covers[item.id]?.src, 'covers');
const preview = (item) => localMedia(state.previews[item.id]?.src, 'previews');
const duration = (item) => `${Math.round(Number(state.previews[item.id]?.durationSeconds) * 10) / 10}s`;
const title = (item) => item.title;
const typeName = (item) => state.types.find((type) => type.id === context(item).type)?.label || '实验作品';
const dateName = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || '') ? value.replaceAll('-', '.') : '未记录';
const mechanismNames = { '数据变成空间': '数据可视化', '模型成为界面': '可交互 3D', '滚动变成镜头': '滚动叙事', '排版变成界面': '动态排版', '交互变成叙事': '互动故事' };
const field = (label, value) => value ? `<div class="detail-field"><h4>${escapeHTML(label)}</h4><p>${escapeHTML(value)}</p></div>` : '';
const workLink = (item) => `#work/${encodeURIComponent(item.id)}`;

function media(item, detail = false, eager = false) {
  const source = preview(item);
  const label = `${title(item)} 的${detail ? '作品' : '拆解'}`;
  return `<div class="media">${detail ? '<div class="media-open">' : `<a class="media-open" href="${workLink(item)}" data-work="${escapeHTML(item.id)}" aria-label="查看 ${escapeHTML(label)}">`}<img src="${escapeHTML(cover(item))}" alt="${escapeHTML(item.title)} 的公开作品画面" loading="${detail || eager ? 'eager' : 'lazy'}" /><span class="media-fallback" aria-hidden="true">公开画面暂不可用<br />可查看拆解与原始来源</span>${source ? `<video data-preview="${escapeHTML(item.id)}" data-src="${escapeHTML(source)}" data-detail="${detail}" muted loop playsinline preload="none" aria-hidden="true"></video>` : ''}${detail ? '</div>' : '</a>'}${!source && state.previews[item.id]?.status === 'unavailable' ? '<span class="preview-note">动态暂缺</span>' : ''}${source ? `<button class="preview-toggle" type="button" aria-label="播放 ${escapeHTML(title(item))} 的短片" data-toggle><span aria-hidden="true">▶</span><b>${escapeHTML(duration(item))}</b></button>` : ''}</div>`;
}
function card(item, index) {
  return `<article class="work-card" data-id="${escapeHTML(item.id)}">${media(item, false, index < 3)}<div class="work-meta"><span>${escapeHTML(typeName(item))}</span><time datetime="${escapeHTML(context(item).collectedOn || '')}">${dateName(context(item).collectedOn)} 收录</time></div><h2><a href="${workLink(item)}" data-work="${escapeHTML(item.id)}">${escapeHTML(title(item))}</a></h2><p class="work-author">${escapeHTML(item.author)}</p><p class="work-summary">${escapeHTML(context(item).summary || item.memory)}</p>${codeURL(item) ? `<p class="source-label">已核验源码 · <a href="${escapeHTML(url(item.code.licenseUrl))}" target="_blank" rel="noopener noreferrer">${escapeHTML(item.code.license)} 原许可 ↗</a></p>` : ''}<div class="card-actions"><a href="${escapeHTML(url(item.url))}" target="_blank" rel="noopener noreferrer">体验原作 ↗</a><a href="${workLink(item)}" data-work="${escapeHTML(item.id)}">拆开看看 →</a></div></article>`;
}
function matches() {
  const query = state.query.trim().toLocaleLowerCase('zh-CN');
  return state.works.filter((item) => {
    const ctx = context(item);
    const text = [item.title, item.author, item.platform, item.memory, item.transfer, typeName(item), ctx.summary, ctx.audience, ctx.value, ...(ctx.tags || []), ...(item.mechanisms || []), ...(item.mechanisms || []).map((m) => mechanismNames[m])].join(' ').toLocaleLowerCase('zh-CN');
    return (state.type === 'all' || ctx.type === state.type) && (state.source === 'all' || state.source === (codeURL(item) ? 'free' : 'pending')) && (state.date === 'all' || ctx.collectedOn === state.date) && (state.mechanism === 'all' || item.mechanisms?.includes(state.mechanism)) && (!query || text.includes(query));
  }).sort((a, b) => state.sort === 'title' ? a.title.localeCompare(b.title, 'zh-CN') : (state.sort === 'oldest' ? 1 : -1) * (context(a).collectedOn || '').localeCompare(context(b).collectedOn || ''));
}
function renderWorks(append = false) {
  const items = matches();
  const prior = append ? $('#works').children.length : 0;
  if (!append) { releasePlayers($('#works')); $('#works').replaceChildren(); }
  $('#works').insertAdjacentHTML('beforeend', items.slice(prior, state.count).map((item, i) => card(item, prior + i)).join('') || (!append ? '<div class="empty">没有找到相关作品。试试更短的关键词，或清除筛选。<br /><button class="button secondary" data-reset type="button">清除筛选</button></div>' : ''));
  const filtered = state.query || state.type !== 'all' || state.source !== 'all' || state.mechanism !== 'all' || state.date !== 'all';
  $('#results').textContent = filtered ? `${items.length} 件结果 / ${state.works.length} 件作品` : `${state.works.length} 件作品 · 最新收录优先`;
  if (!filtered && state.sort !== 'newest') $('#results').textContent = `${items.length} 件作品 · ${state.sort === 'title' ? '作品名称排序' : '最早收录优先'}`;
  $('#clear').hidden = !filtered;
  $('#shown').textContent = `已展示 ${Math.min(state.count, items.length)} / ${items.length}`;
  $('#more').hidden = state.count >= items.length;
  $('#types').querySelectorAll('button').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.type === state.type)));
  attachPlayers($('#works'));
}
function resetFilters() {
  Object.assign(state, { query: '', type: 'all', source: 'all', date: 'all', mechanism: 'all', sort: 'newest', count: 12 });
  $('#search').value = ''; $('#source').value = 'all'; $('#date').value = 'all'; $('#mechanism').value = 'all'; $('#sort').value = 'newest'; renderWorks();
}

const players = new Map();
const manuallyPaused = new Set();
const manuallyRequested = new Set();
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const smallScreen = matchMedia('(max-width:600px)');
const observer = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => { entries.forEach((entry) => { const player = players.get(entry.target); if (player) player.visible = entry.isIntersecting && entry.intersectionRatio >= .4; }); syncPlayers(); }, { threshold: [0, .4] }) : null;
function eligible(video, player) {
  const inDetail = video.dataset.detail === 'true';
  return video.isConnected && !video.closest('.view')?.hidden && player.visible && !document.hidden && !player.failed && !player.blocked && !manuallyPaused.has(video.dataset.preview) && ($('#work-dialog').open ? inDetail : !inDetail) && ((!reduced.matches && !navigator.connection?.saveData) || manuallyRequested.has(video.dataset.preview));
}
function playerLabel(video, player) {
  const playing = !video.paused && !player.failed;
  player.button.setAttribute('aria-label', `${playing ? '暂停' : '播放'} ${title(state.works.find((item) => item.id === video.dataset.preview))} 的短片`);
  player.button.querySelector('span').textContent = playing ? 'Ⅱ' : '▶';
  player.button.querySelector('b').textContent = player.failed ? '暂不可用' : duration(state.works.find((item) => item.id === video.dataset.preview));
  player.button.disabled = player.failed;
}
function syncPlayers() {
  let remaining = $('#work-dialog').open || smallScreen.matches ? 1 : 3;
  [...players].sort((a, b) => b[1].priority - a[1].priority).forEach(([video, player]) => {
    player.allowed = eligible(video, player) && remaining-- > 0;
    if (!player.allowed) { video.pause(); video.classList.remove('is-playing'); }
    else if (video.paused && !player.pending) {
      if (!video.hasAttribute('src')) video.src = video.dataset.src;
      player.pending = true;
      video.play().then(() => { if (!player.allowed) video.pause(); }).catch((error) => { if (error.name !== 'AbortError') player.blocked = true; video.classList.remove('is-playing'); }).finally(() => { player.pending = false; if (video.isConnected) syncPlayers(); });
    }
    playerLabel(video, player);
  });
}
function releasePlayers(container) {
  container.querySelectorAll('video[data-preview]').forEach((video) => { observer?.unobserve(video); players.delete(video); video.pause(); video.removeAttribute('src'); video.load(); });
}
function attachPlayers(container) {
  container.querySelectorAll('.media img').forEach((image) => {
    const failed = () => image.closest('.media').classList.add('has-image-error');
    image.addEventListener('error', failed, { once: true });
    if (image.complete && !image.naturalWidth) failed();
  });
  container.querySelectorAll('video[data-preview]').forEach((video) => {
    if (players.has(video)) return;
    const player = { button: video.closest('.media').querySelector('[data-toggle]'), visible: false, pending: false, failed: false, blocked: false, allowed: false, priority: 0 };
    players.set(video, player); video.muted = true;
    video.addEventListener('playing', () => { if (!player.allowed) return video.pause(); video.classList.add('is-playing'); playerLabel(video, player); });
    video.addEventListener('pause', () => { video.classList.remove('is-playing'); if (video.isConnected) playerLabel(video, player); });
    video.addEventListener('error', () => { player.failed = true; video.classList.remove('is-playing'); syncPlayers(); });
    player.button.addEventListener('click', () => {
      if (!video.paused) manuallyPaused.add(video.dataset.preview);
      else { manuallyPaused.delete(video.dataset.preview); manuallyRequested.add(video.dataset.preview); player.blocked = false; player.visible = true; player.priority = Date.now(); }
      syncPlayers();
    });
    observer?.observe(video);
  });
}
document.addEventListener('visibilitychange', syncPlayers);
reduced.addEventListener('change', syncPlayers); smallScreen.addEventListener('change', syncPlayers); navigator.connection?.addEventListener('change', syncPlayers);

function codeURL(item) {
  const code = item.code;
  return code && /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(code.repository) && /^[a-f0-9]{40}$/.test(code.revision) && code.license && code.licenseUrl ? `${code.repository}/archive/${code.revision}.zip` : '';
}
function download(item) {
  if (!codeURL(item)) return '<p>学习代码尚未核验下载许可，请通过原作与来源继续研究。</p>';
  return `<p>公开学习代码 · <a href="${escapeHTML(url(item.code.licenseUrl))}" target="_blank" rel="noopener noreferrer">${escapeHTML(item.code.license)} 原许可 ↗</a></p><p>${escapeHTML(item.code.notice)}</p><p class="credit">以下是本站入口的学习承诺，不改写原作者许可，也不授予额外权利；素材、字体与数据仍遵守各自条款。ZIP 直接来自作者原仓库。</p><form class="code-form" data-code="${escapeHTML(item.id)}"><label class="code-agreement"><input type="checkbox" required /><span>我已阅读并承诺仅作个人学习，不抄袭、不商用，保留原作者署名与许可说明。</span></label><button class="button" type="submit" disabled>同意后下载代码 ZIP ↗</button><small>每次打开需重新勾选。免费学习，不收集个人信息。</small></form>`;
}
function renderDetail(item) {
  releasePlayers($('#detail'));
  const ctx = context(item), credit = state.covers[item.id] || {}, clip = state.previews[item.id];
  $('#detail').innerHTML = `<div class="detail-hero">${media(item, true)}<div class="detail-intro"><p class="eyebrow">${escapeHTML(typeName(item))}</p><h2 id="work-title">${escapeHTML(item.title)}</h2><p class="work-author">${escapeHTML(item.author)} · ${escapeHTML(item.platform)}</p><p class="memory">${escapeHTML(item.memory)}</p><a class="button" href="${escapeHTML(url(item.url))}" target="_blank" rel="noopener noreferrer">体验原作 ↗</a><p class="detail-dates">收录 ${dateName(ctx.collectedOn)}<br />来源时间 ${escapeHTML(ctx.pageTime || item.pageTime || '原记录未注明')}</p></div></div><nav class="detail-nav" aria-label="拆解内容"><a href="#implementation" data-jump="implementation">实现原理 ↓</a><a href="#application" data-jump="application">应用判断 ↓</a><a href="#sources" data-jump="sources">来源与代码 ↓</a></nav><div class="detail-body"><section class="detail-section" id="implementation"><p class="eyebrow">HOW IT WORKS</p><h3>为什么成立</h3>${item.why ? field('核心机制', item.why) : '<p>本条目前为作品索引，尚未完成工程拆解。实现与性能请以作者原作、公开说明或源码为准。</p>'}${field('用户输入', item.input)}${field('表现层', item.layer)}<details><summary>继续看工程、镜头与性能 ＋</summary>${field('动效与镜头', item.motion)}${field('工程管线与难点', item.pipeline)}${field('性能与移动端降级', item.performance)}</details>${field('可以复用的方向', item.transfer)}<p class="credit">复现难度：${escapeHTML(item.difficulty || '原记录未注明')} · ${escapeHTML((item.mechanisms || []).join(' / '))}</p></section><section class="detail-section" id="application"><p class="eyebrow">EDITORIAL JUDGMENT</p><h3>用在什么地方</h3><p class="credit">以下为策展与学习判断，商业结果未验证。</p>${field('适用对象与场景', ctx.audience)}${field('应用价值', ctx.value)}${field('落地条件与限制', ctx.conditions)}${field('建议如何验证', ctx.measure || state.types.find((type) => type.id === ctx.type)?.measure)}</section><section class="detail-section" id="sources"><p class="eyebrow">TRACE THE SOURCE</p><h3>证据、署名与学习代码</h3><div class="evidence-note">${field('证据边界', item.evidence || '原档案未提供完整技术证据，本站不据此确认具体实现或性能。')}</div><p class="credit">画面：${escapeHTML(credit.credit || item.author)} · <a href="${escapeHTML(url(credit.source || item.url))}" target="_blank" rel="noopener noreferrer">画面来源 ↗</a></p>${clip?.src ? `<p class="credit">短片：${escapeHTML(clip.credit)} · <a href="${escapeHTML(url(clip.source))}" target="_blank" rel="noopener noreferrer">视频来源 ↗</a></p>${clip.evidence ? `<p class="credit">采集说明：${escapeHTML(clip.evidence)}</p>` : ''}` : ''}${clip?.status === 'unavailable' ? `<p class="credit">动态预览暂缺：${escapeHTML(clip.reason)}</p>` : ''}${download(item)}</section></div>`;
  if (!$('#work-dialog').open) $('#work-dialog').showModal();
  $('#work-dialog').scrollTop = 0;
  attachPlayers($('#detail')); syncPlayers(); $('#close').focus({ preventScroll: true });
}
function closeDetail() {
  if (state.pushedWork) { state.pushedWork = false; history.back(); }
  else { history.replaceState(null, '', state.returnHash); route(); }
}
function openWork(id) {
  state.returnHash = location.hash || '#discover'; state.pushedWork = true;
  location.hash = `work/${encodeURIComponent(id)}`;
}
function renderJournal(id) {
  const issue = state.issues.find((item) => item.id === id) || state.issues[0];
  if (!issue || state.selectedIssue === issue.id) return;
  const changingIssue = Boolean(state.selectedIssue) && state.view === 'journals';
  state.selectedIssue = issue.id;
  releasePlayers($('#issue-content'));
  $('#issue-list').innerHTML = state.issues.map((item) => `<a href="#journals/${item.id}" aria-current="${item.id === issue.id}">${dateName(item.id)}<small>${escapeHTML(item.issueNo || '')}</small></a>`).join('');
  const experiment = issue.experiment;
  $('#issue-content').innerHTML = `<article><div class="issue-lead"><p class="eyebrow">${escapeHTML(issue.issueNo || 'DAILY ISSUE')} / ${dateName(issue.id)}</p><h2>今日观察</h2><p>${escapeHTML(issue.note)}</p></div><div class="issue-work-list">${issue.cases.map((record) => state.works.find((item) => item.id === record.id)).filter(Boolean).map((item) => `<article class="issue-work">${media(item)}<div><h3><a href="${workLink(item)}" data-work="${escapeHTML(item.id)}">${escapeHTML(title(item))}</a></h3><p>${escapeHTML(item.author)}</p><a class="issue-original" href="${escapeHTML(url(item.url))}" target="_blank" rel="noopener noreferrer">体验原作 ↗</a></div></article>`).join('')}</div>${experiment ? `<section class="issue-block"><p class="eyebrow">TRY IT YOURSELF</p><h3>${escapeHTML(experiment.title)}</h3>${Object.entries({ 输入: experiment.input, 视觉目标: experiment.target, 最小技术栈: experiment.stack, 验收标准: experiment.acceptance }).map(([label, value]) => field(label, value)).join('')}</section>` : ''}<section class="issue-block"><h3>关于 Creative Twin</h3><p>${escapeHTML(issue.restraint || '')}</p></section></article>`;
  attachPlayers($('#issue-content'));
  if (changingIssue) $('#issue-content').scrollIntoView({ block: 'start' });
}
function eventStatus(item) {
  const now = new Date(), today = new Intl.DateTimeFormat('en-CA', { timeZone: item.eventTimeZone || 'Asia/Shanghai' }).format(now);
  if (item.eventEndsOn && today > item.eventEndsOn) return '活动已结束';
  if (item.registrationStatus === 'closed' || (item.registrationClosesOn && today > item.registrationClosesOn) || (item.registrationClosesAt && now >= new Date(item.registrationClosesAt))) return '报名截止日已过';
  return '信息待复核 · 请查官方';
}
async function loadEvents() {
  try {
    const data = await readJSON('hackathons.json'); state.events = data.events || []; state.checkedAt = data.checkedAt;
    $('#event-check').textContent = `官方信息核验于 ${new Date(data.checkedAt).toLocaleDateString('zh-CN')}。${data.note || ''}`;
    $('#event-list').innerHTML = state.events.map((item) => `<article class="event"><span class="event-status">${eventStatus(item)} · ${escapeHTML(item.format)}</span><h2>${escapeHTML(item.title)}</h2><p>${escapeHTML(item.organizer)} · ${escapeHTML(item.topic)}</p><dl><dt>赛程</dt><dd>${escapeHTML(item.period)}</dd><dt>地点</dt><dd>${escapeHTML(item.location)}</dd><dt>截止</dt><dd>${escapeHTML(item.deadlineLabel)}</dd><dt>门槛</dt><dd>${escapeHTML(item.eligibility)}</dd></dl><details><summary>参与要求与证据 ＋</summary><p>${escapeHTML(item.restriction || '')}</p>${field('需要交付', item.deliverables)}${field('参与成本', item.cost)}${field('参与价值 · 编辑判断', item.value)}${field('证据边界', item.boundary)}${(item.sources || []).map((source) => `<p><a href="${escapeHTML(url(source.url))}" target="_blank" rel="noopener noreferrer">${escapeHTML(source.label)} ↗</a></p>`).join('')}</details><a href="${escapeHTML(url(item.url))}" target="_blank" rel="noopener noreferrer">查看官方详情 ↗</a></article>`).join('');
  } catch { $('#event-list').innerHTML = '<p class="empty">活动记录暂时无法载入，请稍后重试。</p>'; }
}
const scrollPositions = { discover: 0, journals: 0, events: 0 };
function route() {
  const [path, id] = location.hash.slice(1).split('/');
  if (path === 'work') {
    const item = state.works.find((entry) => encodeURIComponent(entry.id) === (id || ''));
    if (item) { renderDetail(item); document.title = `${title(item)} · VIBE FRONTIER`; return; }
    history.replaceState(null, '', '#discover');
  }
  if ($('#work-dialog').open) { releasePlayers($('#detail')); $('#work-dialog').close(); }
  const next = ['journals', 'events'].includes(path) ? path : path === 'hackathons' ? 'events' : 'discover';
  const changed = next !== state.view;
  if (changed) scrollPositions[state.view] = scrollY;
  document.querySelectorAll('.view').forEach((view) => view.hidden = view.id !== next);
  document.querySelectorAll('[data-nav]').forEach((link) => { if (link.dataset.nav === next) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current'); });
  if (next === 'journals') renderJournal(id);
  state.view = next;
  document.title = `${next === 'discover' ? '作品' : next === 'journals' ? '每日期刊' : '活动'} · VIBE FRONTIER`;
  if (changed) scrollTo(0, scrollPositions[next]);
  syncPlayers();
}
async function readJSON(file) { const response = await fetch(`./vibe/${file}`, { cache: 'no-cache' }); if (!response.ok) throw new Error(file); return response.json(); }
async function load() {
  try {
    const [issues, candidates, covers, contexts, previews] = await Promise.all(['issues.json', 'site-candidates.json', 'cover-map.json', 'case-context.json', 'video-previews.json'].map(readJSON));
    Object.assign(state, { issues: issues.issues || [], covers, contexts: contexts.cases || {}, types: contexts.types || [], previews });
    const library = new Map((candidates.candidates || []).map((item) => [item.id, item]));
    for (const issue of [...state.issues].reverse()) for (const item of issue.cases) {
      const ctx = item.context || state.contexts[item.id] || {};
      library.set(item.id, { ...item, context: { ...ctx, collectedOn: ctx.collectedOn || issue.id, pageTime: ctx.pageTime || item.pageTime } });
      if (item.image) state.covers[item.id] = { src: item.image, source: item.imageSource, credit: item.imageCredit };
    }
    state.works = [...library.values()].filter(cover);
    $('#types').innerHTML = [{ id: 'all', label: '全部作品' }, ...state.types].map((type) => `<button type="button" data-type="${escapeHTML(type.id)}" aria-pressed="${type.id === 'all'}">${escapeHTML(type.label)}<small>${state.works.filter((item) => type.id === 'all' || context(item).type === type.id).length}</small></button>`).join('');
    Object.entries(mechanismNames).forEach(([value, label]) => $('#mechanism').add(new Option(label, value)));
    [...new Set(state.works.map((item) => context(item).collectedOn).filter(Boolean))].sort().reverse().forEach((date) => $('#date').add(new Option(dateName(date), date)));
    const totalPreviews = state.works.filter(preview).length;
    $('#media-status').textContent = `全库 ${totalPreviews} 段短片 · ${totalPreviews === state.works.length ? '静音循环' : `${state.works.length - totalPreviews} 件暂缺`}`;
    if (state.issues[0]) $('#latest-link').innerHTML = `最新一期 ${dateName(state.issues[0].id)} <span aria-hidden="true">↗</span>`;
    renderWorks(); route(); loadEvents();
  } catch { $('#works').innerHTML = '<div class="empty">作品档案暂时无法载入。<br /><button class="button secondary" type="button" data-reload>重新载入</button></div>'; $('#results').textContent = '载入失败'; }
}
$('#search').addEventListener('input', (event) => { state.query = event.target.value; state.count = 12; renderWorks(); });
$('#types').addEventListener('click', (event) => { const button = event.target.closest('[data-type]'); if (button) { state.type = button.dataset.type; state.count = 12; renderWorks(); } });
['source', 'mechanism', 'date', 'sort'].forEach((name) => $(`#${name}`).addEventListener('change', (event) => { state[name] = event.target.value; state.count = 12; renderWorks(); }));
$('#refine-toggle').addEventListener('click', () => { const open = $('#refine').hidden; $('#refine').hidden = !open; $('#refine-toggle').setAttribute('aria-expanded', String(open)); $('#refine-toggle').textContent = `精细筛选 ${open ? '−' : '＋'}`; });
$('#clear').addEventListener('click', resetFilters);
$('#more').addEventListener('click', () => { state.count += 12; renderWorks(true); });
$('#random').addEventListener('click', () => { const pool = matches(); if (pool.length) openWork(pool[Math.floor(Math.random() * pool.length)].id); });
$('#close').addEventListener('click', closeDetail);
$('#work-dialog').addEventListener('cancel', (event) => { event.preventDefault(); closeDetail(); });
$('#work-dialog').addEventListener('click', (event) => { if (event.target === $('#work-dialog')) { const rect = event.target.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDetail(); } });
document.addEventListener('click', (event) => {
  const work = event.target.closest('[data-work]');
  if (work && !event.metaKey && !event.ctrlKey && !event.shiftKey && event.button === 0) { event.preventDefault(); openWork(work.dataset.work); }
  const jump = event.target.closest('[data-jump]'); if (jump) { event.preventDefault(); $(`#${jump.dataset.jump}`).scrollIntoView({ behavior: 'instant', block: 'start' }); }
  if (event.target.closest('[data-reset]')) resetFilters();
  if (event.target.closest('[data-reload]')) location.reload();
});
$('#detail').addEventListener('change', (event) => { if (event.target.matches('.code-form input')) event.target.closest('form').querySelector('button').disabled = !event.target.checked; });
$('#detail').addEventListener('submit', (event) => { const form = event.target.closest('.code-form'); if (!form) return; event.preventDefault(); if (!form.querySelector('input').checked) return; const item = state.works.find((entry) => entry.id === form.dataset.code); const target = item && codeURL(item); if (target) window.open(target, '_blank', 'noopener,noreferrer'); });
window.addEventListener('hashchange', route);
load();
