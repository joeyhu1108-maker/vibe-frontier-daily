const applications = document.querySelector('#applications');
const planned = document.querySelector('#planned-applications');
const search = document.querySelector('#library-search');
const filters = [...document.querySelectorAll('[data-access]')];
const clear = document.querySelector('#clear-filters');
const empty = document.querySelector('#library-empty');
let access = 'free';
let scenario = 'all';

function render(syncURL = true) {
  const query = search.value.trim().toLocaleLowerCase('zh-CN');
  const activeSection = access === 'free' ? applications : planned;
  const cards = [...activeSection.querySelectorAll('[data-search]')];
  let count = 0;
  applications.hidden = access !== 'free';
  planned.hidden = access !== 'planned';
  cards.forEach((card) => {
    card.hidden = (scenario !== 'all' && card.dataset.scenario !== scenario) || (query && !`${card.dataset.search} ${card.textContent}`.toLocaleLowerCase('zh-CN').includes(query));
    if (!card.hidden) count++;
  });
  document.querySelector('#library-note').textContent = access === 'free' ? '独立源码 / 无需安装 / MIT 许可' : '专题规划 / 尚未交付 / 价格待定';
  filters.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.access === access)));
  applications.classList.toggle('is-filtered', count < 3);
  const filtered = query || scenario !== 'all';
  clear.hidden = !filtered;
  empty.hidden = count !== 0;
  document.querySelector('#library-results').textContent = filtered ? `${count} 个结果` : access === 'free' ? '3 个原创实验 · 可在线编辑' : '3 个专题规划 · 尚未开放购买';
  document.querySelectorAll('.application iframe').forEach((frame) => {
    const visible = access === 'free' && !frame.closest('.application').hidden;
    if (!visible && frame.hasAttribute('src')) { frame.dataset.previewSrc = frame.getAttribute('src'); frame.removeAttribute('src'); }
    if (visible && !frame.hasAttribute('src')) frame.src = frame.dataset.previewSrc;
  });
  if (syncURL) {
    const url = new URL(location.href);
    if (['#plan-particle', '#plan-scroll', '#plan-data'].includes(url.hash) && access === 'free') url.hash = '';
    for (const [key, value] of [['access', access], ['scenario', scenario], ['q', search.value.trim()]]) {
      if (!value || value === 'all' || (key === 'access' && value === 'free')) url.searchParams.delete(key); else url.searchParams.set(key, value);
    }
    history.replaceState(null, '', url);
  }
}
function restore() {
  const params = new URLSearchParams(location.search);
  access = params.get('access') === 'planned' || ['#plan-particle', '#plan-scroll', '#plan-data'].includes(location.hash) ? 'planned' : 'free';
  scenario = ['brand', 'product', 'data'].includes(params.get('scenario')) ? params.get('scenario') : 'all';
  search.value = params.get('q') || '';
  render(false);
}
function reset() { search.value = ''; scenario = 'all'; render(); }
filters.forEach((button) => button.addEventListener('click', () => { access = button.dataset.access; scenario = 'all'; render(); }));
search.addEventListener('input', () => { scenario = 'all'; render(); });
clear.addEventListener('click', reset);
document.querySelector('[data-reset]').addEventListener('click', reset);
window.addEventListener('popstate', restore);
document.querySelector('.library-tools').hidden = false;
restore();
