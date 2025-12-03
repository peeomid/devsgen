// Utility: Generate single-tab download link from a Google Sheets URL
function buildExportLink(rawUrl, format) {
  if (typeof rawUrl !== 'string') {
    throw new TypeError('Enter a Google Sheets URL.');
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    throw new TypeError('Enter a Google Sheets URL.');
  }

  const normalised = ensureProtocol(trimmed);
  const parsed = parseSheetUrl(normalised);
  const spreadsheetId = extractSpreadsheetId(parsed);
  const gid = extractGid(parsed);

  if (!spreadsheetId || !gid) {
    throw new Error('Could not find spreadsheet ID or gid in this URL. Click the tab first, then copy the URL.');
  }

  const allowedFormats = new Set(['csv', 'tsv', 'xlsx', 'ods', 'pdf', 'html', 'zip']);
  const chosenFormat = (format || '').toLowerCase();
  if (!allowedFormats.has(chosenFormat)) {
    throw new TypeError('Select a valid export format.');
  }

  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=${encodeURIComponent(chosenFormat)}&gid=${encodeURIComponent(gid)}`;
}

function ensureProtocol(url) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function parseSheetUrl(url) {
  try {
    return new URL(url);
  } catch {
    throw new TypeError('Invalid URL. Please check and try again.');
  }
}

function extractSpreadsheetId(parsed) {
  // Typical path: /spreadsheets/d/<id>/edit
  const match = parsed.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

function extractGid(parsed) {
  const hash = parsed.hash || '';

  // Prefer #gid=<number> from the fragment
  const hashMatch = hash.match(/[#&]gid=([0-9]+)/);
  if (hashMatch) {
    return hashMatch[1];
  }

  // Fallback: query parameter gid=
  const searchMatch = parsed.searchParams.get('gid');
  if (searchMatch) {
    return searchMatch;
  }

  return null;
}

function init() {
  const form = document.querySelector('[data-role="sheet-form"]');
  const inputEl = document.querySelector('[name="sheetUrl"]');
  const formatEl = document.querySelector('[name="exportFormat"]');
  const statusEl = document.querySelector('[data-role="sheet-status"]');
  const resultEl = document.querySelector('[data-role="sheet-result"]');
  const linkEl = document.querySelector('[data-role="sheet-link"]');

  if (!form || !inputEl || !formatEl || !statusEl || !resultEl || !linkEl) {
    console.warn('Missing required elements for Google Sheet tab downloader.');
    return;
  }

  const hideStatus = () => {
    statusEl.classList.add('hidden');
    statusEl.textContent = '';
  };

  const showStatus = (message) => {
    statusEl.textContent = message;
    statusEl.classList.remove('hidden');
  };

  const showResult = (link) => {
    linkEl.textContent = link;
    linkEl.href = link;
    resultEl.classList.remove('hidden');
  };

  const hideResult = () => {
    resultEl.classList.add('hidden');
  };

  const updateUrlParams = (sheetUrl, exportFormat) => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('sheetUrl', sheetUrl);
      url.searchParams.set('format', exportFormat);
      window.history.replaceState({}, '', url.toString());
    } catch (error) {
      console.error('Failed to update URL parameters:', error);
    }
  };

  const generate = (sheetUrl, exportFormat) => {
    hideStatus();
    hideResult();

    try {
      const link = buildExportLink(sheetUrl, exportFormat);
      showResult(link);
      updateUrlParams(sheetUrl, exportFormat);
    } catch (error) {
      console.error(error);
      showStatus(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    }
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const sheetUrl = inputEl.value;
    const exportFormat = formatEl.value;
    generate(sheetUrl, exportFormat);
  });

  // Auto-fill from query parameters
  const params = new URLSearchParams(window.location.search);
  const sheetUrlParam = params.get('sheetUrl');
  const formatParam = params.get('format');

  if (sheetUrlParam) {
    inputEl.value = sheetUrlParam;
  }
  if (formatParam && formatEl.querySelector(`option[value="${formatParam}"]`)) {
    formatEl.value = formatParam;
  }

  if (sheetUrlParam) {
    generate(sheetUrlParam, formatEl.value);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
