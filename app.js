// Configuration: point this to your Google Apps Script web app endpoint or raw JSON file
const DATA_SOURCE_URL = 'https://script.google.com/macros/s/AKfycbz10CWB7iPbl60L1NThoe5QnjkHhuGTJC9Ex00m0Q_1FkDSeOTuDBVMYoIGO9Qn08UcKw/exec';

let allMatches = [];
let currentCategory = 'All';
let currentSort = 'card';
let searchQuery = '';

const matchGrid = document.getElementById('matchGrid');
const matchCount = document.getElementById('matchCount');
const loadingStatus = document.getElementById('loadingStatus');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearch');
const categoryNav = document.getElementById('categoryNav');

async function fetchMatches() {
  loadingStatus.textContent = 'Loading matches...';
  try {
    const res = await fetch(DATA_SOURCE_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
console.log("Raw API Response Sample:", data.matches ? data.matches[0] : data[0]);
    
    // Normalise match order index if not already present
    allMatches = (data.matches || data).map((item, idx) => ({
      ...item,
      orderIndex: item.orderIndex ?? idx
    }));
    
    loadingStatus.textContent = '';
    render();
  } catch (err) {
    loadingStatus.textContent = `Failed: ${err.message}`;
    console.error('Error loading matches:', err);
  }
}

function getFilteredMatches() {
  return allMatches.filter(match => {
    // Category check
    const matchesCategory =
      currentCategory === 'All' ||
      (match.category && match.category.toLowerCase() === currentCategory.toLowerCase()) ||
      (match.event && match.event.toLowerCase().includes(currentCategory.toLowerCase()));

    // Search check
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (match.title && match.title.toLowerCase().includes(q)) ||
      (match.event && match.event.toLowerCase().includes(q)) ||
      (match.stipulation && match.stipulation.toLowerCase().includes(q)) ||
      (match.participants && match.participants.toLowerCase().includes(q));

    return matchesCategory && matchesSearch;
  });
}

function sortMatches(matches) {
  if (currentSort === 'alpha') {
    return [...matches].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  }
  // Default: Match Order (Card)
  return [...matches].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
}

function render() {
  const filtered = getFilteredMatches();
  const sorted = sortMatches(filtered);
const targetUrl = m.netflixUrl || m.netflixurl || m.url || m.link || m.netflix || '#';

const hasValidLink = targetUrl !== '#' && targetUrl.trim().startsWith('http');

const buttonHtml = hasValidLink
  ? `<a href="${encodeURI(targetUrl)}" target="_blank" rel="noopener noreferrer" class="btn-netflix">
       Watch on Netflix ↗
     </a>`
  : `<span class="btn-netflix disabled" style="opacity: 0.4; cursor: not-allowed; pointer-events: none;">
       Link Pending
     </span>`;

  matchCount.textContent = `Showing: ${sorted.length} matches`;

  if (sorted.length === 0) {
    matchGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
        No matches found matching your filters.
      </div>
    `;
    return;
  }

  matchGrid.innerHTML = sorted.map(m => {
  const targetUrl = m.netflixUrl || m.netflixurl || m.url || m.link || m.netflix || '#';
  const hasValidLink = targetUrl !== '#' && targetUrl.trim().startsWith('http');

  return `
    <article class="match-card">
      <div>
        <div class="card-event">${escapeHtml(m.event || 'WWE Event')}</div>
        <h2 class="card-title">${escapeHtml(m.title || 'Match Title')}</h2>
        ${m.stipulation ? `<p class="card-details">${escapeHtml(m.stipulation)}</p>` : ''}
      </div>
      <div>
        ${hasValidLink 
          ? `<a href="${encodeURI(targetUrl)}" target="_blank" rel="noopener noreferrer" class="btn-netflix">Watch on Netflix ↗</a>` 
          : `<span class="btn-netflix disabled" style="opacity: 0.4; cursor: not-allowed; pointer-events: none;">Link Pending</span>`
        }
      </div>
    </article>
  `;
}).join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Event Listeners
categoryNav.addEventListener('click', (e) => {
  if (!e.target.classList.contains('pill')) return;
  document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  e.target.classList.add('active');
  currentCategory = e.target.dataset.category;
  render();
});

document.querySelectorAll('.sort-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    currentSort = e.target.dataset.sort;
    render();
  });
});

searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  render();
});

clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  searchQuery = '';
  render();
});

// Initial boot
fetchMatches();