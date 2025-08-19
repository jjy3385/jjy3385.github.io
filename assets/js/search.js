(function () {
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  let data = [];

  function escapeHTML(s) {
    return s.replace(/[&<>"']/g, m => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"
    }[m]));
  }

  function render(list) {
    if (!list.length) {
      results.innerHTML = '<p>검색 결과가 없습니다.</p>';
      return;
    }
    const html = list.map(item => {
      const cats = Array.isArray(item.categories) ? item.categories.join(', ') : item.categories;
      const tags = Array.isArray(item.tags) ? item.tags.join(', ') : item.tags;
      return [
        '<div class="search-result">',
        '<a href="' + item.url + '">' + escapeHTML(item.title) + '</a>',
        '<div class="search-meta">' + escapeHTML(item.date) + (cats ? ' · ' + escapeHTML(cats) : '') + (tags ? ' · #' + escapeHTML(tags) : '') + '</div>',
        '<div>' + escapeHTML(item.excerpt || '') + '</div>',
        '</div>'
      ].join('');
    }).join('');
    results.innerHTML = html;
  }

  function normalize(s) {
    return (s || '').toString().toLowerCase();
  }

  function scoreItem(item, q) {
    const qs = q.split(/\s+/).filter(Boolean);
    let score = 0;
    const title = normalize(item.title);
    const excerpt = normalize(item.excerpt);
    const cats = normalize((item.categories || []).join(' '));
    const tags = normalize((item.tags || []).join(' '));
    for (const token of qs) {
      if (title.includes(token)) score += 5;
      if (tags.includes(token)) score += 3;
      if (cats.includes(token)) score += 2;
      if (excerpt.includes(token)) score += 1;
    }
    return score;
  }

  function onQuery() {
    const q = normalize(input.value);
    if (!q) { results.innerHTML = ''; return; }
    const ranked = data
      .map(item => ({ item, score: scoreItem(item, q) }))
      .filter(x => x.score > 0)
      .sort((a,b) => b.score - a.score || (a.item.date < b.item.date ? 1 : -1))
      .map(x => x.item);
    render(ranked);
  }

  fetch('{{ '/search.json' | relative_url }}', { cache: 'no-store' })
    .then(r => r.json())
    .then(json => { data = json; })
    .catch(() => { results.innerHTML = '<p>검색 인덱스를 불러오지 못했습니다.</p>'; });

  input.addEventListener('input', onQuery);
})();