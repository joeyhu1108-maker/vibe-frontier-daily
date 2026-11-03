const cards = [...document.querySelectorAll('.application')];
const search = document.querySelector('#library-search');
const scenario = document.querySelector('#scenario');
const filters = [...document.querySelectorAll('.access-filters button')];
const clear = document.querySelector('#clear-filters');
let access = 'all';

function render(syncURL = true) {
  const query = search.value.trim().toLocaleLowerCase('zh-CN');
  let count = 0;
  cards.forEach((card) => {
    const matches = (access === 'all' || card.dataset.access === access) && (scenario.value === 'all' || card.dataset.scenario === scenario.value) && (!query || `${card.dataset.search} ${card.textContent}`.toLocaleLowerCase('zh-CN').includes(query));
    card.hidden = !matches;
    if (matches) count++;
    const frame = card.querySelector('iframe');
    if (frame && !matches && frame.hasAttribute('src')) { frame.dataset.previewSrc = frame.getAttribute('src'); frame.removeAttribute('src'); }
    if (frame && matches && !frame.hasAttribute('src')) frame.src = frame.dataset.previewSrc;
  });
  filters.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.access === access)));
  const filtered = query || access !== 'all' || scenario.value !== 'all';
  clear.hidden = !filtered;
  document.querySelector('#library-empty').hidden = count !== 0;
  document.querySelector('#library-results').textContent = filtered ? `${count} 个结果 / ${cards.length} 个条目` : '3 个可用示例 · 3 个筹备中的付费专题';
  if (syncURL) {
    const url = new URL(location.href);
    for (const [key, value] of [['access', access], ['scenario', scenario.value], ['q', search.value.trim()]]) {
      if (!value || value === 'all') url.searchParams.delete(key); else url.searchParams.set(key, value);
    }
    history.replaceState(null, '', url);
  }
}
function restore() {
  const params = new URLSearchParams(location.search);
  access = ['free', 'planned'].includes(params.get('access')) ? params.get('access') : 'all';
  scenario.value = ['brand', 'product', 'data'].includes(params.get('scenario')) ? params.get('scenario') : 'all';
  search.value = params.get('q') || '';
  render(false);
}
function reset() { access = 'all'; search.value = ''; scenario.value = 'all'; render(); }
filters.forEach((button) => button.addEventListener('click', () => { access = button.dataset.access; render(); }));
search.addEventListener('input', () => render());
scenario.addEventListener('change', () => render());
clear.addEventListener('click', reset);
document.querySelector('[data-reset]').addEventListener('click', reset);
window.addEventListener('popstate', restore);
document.querySelector('.library-tools').hidden = false;
restore();
