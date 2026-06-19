(function () {
  const script = document.currentScript || document.querySelector('script[src$="lazuril-search.js"]');
  const siteRoot = script ? new URL('../..', script.src) : new URL('/', window.location.href);
  const searchPageUrl = new URL('Search/', siteRoot);
  const searchIndexUrl = new URL('search/search_index.json', siteRoot);
  const lunrUrl = new URL('search/lunr.js', siteRoot);

  function onReady(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  function addHeaderSearch() {
    const headerNav = document.querySelector('.torillic-header nav');
    if (!headerNav || headerNav.querySelector('.lazuril-header-search')) return;

    const form = document.createElement('form');
    form.className = 'lazuril-header-search';
    form.role = 'search';
    form.action = searchPageUrl.href;
    form.method = 'get';

    const label = document.createElement('label');
    label.className = 'lazuril-search-visually-hidden';
    label.setAttribute('for', 'lazuril-header-search-input');
    label.textContent = 'Search Lazuril';

    const input = document.createElement('input');
    input.id = 'lazuril-header-search-input';
    input.className = 'lazuril-header-search-input';
    input.type = 'search';
    input.name = 'q';
    input.placeholder = 'Search';
    input.autocomplete = 'off';
    input.value = new URLSearchParams(window.location.search).get('q') || '';

    const button = document.createElement('button');
    button.className = 'lazuril-header-search-button';
    button.type = 'submit';
    button.setAttribute('aria-label', 'Search');
    button.textContent = 'Search';

    form.append(label, input, button);
    form.addEventListener('submit', event => {
      if (!input.value.trim()) {
        event.preventDefault();
        input.focus();
      }
    });

    headerNav.appendChild(form);
  }

  function addHeaderSearchWhenNavIsReady() {
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      const nav = document.querySelector('.torillic-header nav');
      if (nav && nav.classList.contains('wiki-top-nav')) {
        window.clearInterval(timer);
        addHeaderSearch();
      } else if (attempts > 80) {
        window.clearInterval(timer);
        addHeaderSearch();
      }
    }, 50);
  }

  function renderSearchPage() {
    const root = document.getElementById('lazuril-search-page');
    if (!root) return;

    const params = new URLSearchParams(window.location.search);
    const query = (params.get('q') || '').trim();
    const input = document.getElementById('lazuril-search-page-input');
    const summary = document.getElementById('lazuril-search-summary');
    const resultsList = document.getElementById('lazuril-search-results');

    if (input) input.value = query;
    if (!summary || !resultsList) return;

    if (!query) {
      summary.textContent = 'Enter a search term to find lore pages, sections, states, factions, and races.';
      return;
    }

    summary.textContent = 'Searching...';
    loadSearchData()
      .then(({ docs, index }) => {
        const results = runSearch(index, docs, query);
        resultsList.innerHTML = '';

        if (!results.length) {
          summary.textContent = `No results found for "${query}".`;
          return;
        }

        summary.textContent = `${results.length} result${results.length === 1 ? '' : 's'} for "${query}", sorted by relevance.`;
        results.slice(0, 50).forEach(result => {
          resultsList.appendChild(createResultItem(result, query));
        });
      })
      .catch(error => {
        summary.textContent = 'Search could not be loaded. Please try again.';
        console.error('Lazuril search failed:', error);
      });
  }

  function loadSearchData() {
    return loadLunr()
      .then(() => fetch(searchIndexUrl, { cache: 'no-store' }))
      .then(response => {
        if (!response.ok) throw new Error(`Search index returned ${response.status}`);
        return response.json();
      })
      .then(data => {
        const docs = Array.isArray(data.docs) ? data.docs : [];
        const index = lunr(function () {
          this.ref('location');
          this.field('title', { boost: 12 });
          this.field('location', { boost: 4 });
          this.field('text');

          docs.forEach(doc => {
            this.add({
              location: doc.location || '',
              title: doc.title || '',
              text: doc.text || ''
            });
          });
        });

        return { docs, index };
      });
  }

  function loadLunr() {
    if (window.lunr) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const lunrScript = document.createElement('script');
      lunrScript.src = lunrUrl.href;
      lunrScript.onload = resolve;
      lunrScript.onerror = () => reject(new Error('Unable to load lunr.js'));
      document.head.appendChild(lunrScript);
    });
  }

  function runSearch(index, docs, query) {
    const docsByLocation = new Map(docs.map(doc => [doc.location || '', doc]));
    const terms = tokenize(query);
    let matches;

    try {
      matches = index.search(query);
    } catch (_error) {
      matches = index.query(builder => {
        terms.forEach(term => {
          builder.term(term, {
            wildcard: lunr.Query.wildcard.TRAILING,
            presence: lunr.Query.presence.OPTIONAL
          });
        });
      });
    }

    return matches
      .map(match => {
        const doc = docsByLocation.get(match.ref);
        if (!doc) return null;
        return {
          doc,
          score: adjustScore(match.score, doc, query, terms),
          baseScore: match.score
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);
  }

  function adjustScore(score, doc, query, terms) {
    const title = (doc.title || '').toLowerCase();
    const location = (doc.location || '').toLowerCase();
    const text = (doc.text || '').toLowerCase();
    const exact = query.toLowerCase();
    let adjusted = score;

    if (title === exact) adjusted += 20;
    if (title.includes(exact)) adjusted += 8;
    if (location.includes(exact.replace(/\s+/g, '%20'))) adjusted += 4;
    terms.forEach(term => {
      if (title.includes(term)) adjusted += 3;
      if (location.includes(term)) adjusted += 1.5;
      if (text.includes(term)) adjusted += 0.25;
    });

    return adjusted;
  }

  function createResultItem(result, query) {
    const { doc, score } = result;
    const item = document.createElement('li');
    item.className = 'lazuril-search-result';

    const link = document.createElement('a');
    link.className = 'lazuril-search-result-title';
    link.href = new URL(doc.location || '', siteRoot).href;
    link.textContent = doc.title || 'Untitled';

    const meta = document.createElement('div');
    meta.className = 'lazuril-search-result-meta';
    meta.textContent = `${formatLocation(doc.location || '')} - relevance ${score.toFixed(2)}`;

    const snippet = document.createElement('p');
    snippet.className = 'lazuril-search-result-snippet';
    snippet.textContent = createSnippet(doc.text || '', query);

    item.append(link, meta, snippet);
    return item;
  }

  function createSnippet(text, query) {
    const cleanText = text.replace(/\s+/g, ' ').trim();
    if (!cleanText) return 'No preview text is available for this result.';

    const terms = tokenize(query);
    const lowerText = cleanText.toLowerCase();
    const firstMatch = terms
      .map(term => lowerText.indexOf(term))
      .filter(index => index >= 0)
      .sort((a, b) => a - b)[0];

    if (firstMatch === undefined) {
      return cleanText.length > 220 ? `${cleanText.slice(0, 220).trim()}...` : cleanText;
    }

    const start = Math.max(0, firstMatch - 85);
    const end = Math.min(cleanText.length, firstMatch + 170);
    const prefix = start > 0 ? '...' : '';
    const suffix = end < cleanText.length ? '...' : '';
    return `${prefix}${cleanText.slice(start, end).trim()}${suffix}`;
  }

  function formatLocation(location) {
    if (!location) return 'Home';
    return decodeURIComponent(location)
      .replace(/\/$/, '')
      .replace(/#/g, ' > ')
      .replace(/\//g, ' / ');
  }

  function tokenize(query) {
    return query
      .toLowerCase()
      .split(/[\s\-_/]+/)
      .map(term => term.replace(/[^\w\u00c0-\u024f\u2019']/g, ''))
      .filter(term => term.length >= 2);
  }

  onReady(() => {
    addHeaderSearchWhenNavIsReady();
    renderSearchPage();
  });
})();
