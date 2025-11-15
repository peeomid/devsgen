// Utility: Generate messenger link from Facebook URL
function generateMessengerLink(rawUrl) {
  if (typeof rawUrl !== 'string') {
    throw new TypeError('Please enter a Facebook URL.');
  }

  const trimmed = rawUrl.trim();
  if (trimmed.length === 0) {
    throw new TypeError('Please enter a Facebook URL.');
  }

  const normalised = ensureProtocol(trimmed);
  const parsed = parseFacebookUrl(normalised);

  const identifier = extractIdentifier(parsed);
  if (!identifier) {
    throw new Error('Could not extract Facebook identifier from this URL.');
  }

  return {
    identifier,
    messengerUrl: `https://m.me/${encodeURIComponent(identifier)}`,
  };
}

function ensureProtocol(url) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function parseFacebookUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new TypeError('Invalid URL. Please check and try again.');
  }

  const hostname = parsed.hostname.toLowerCase();
  const allowedHosts = new Set([
    'facebook.com',
    'www.facebook.com',
    'm.facebook.com',
    'web.facebook.com',
  ]);

  if (!allowedHosts.has(hostname)) {
    throw new TypeError('This URL does not belong to Facebook.');
  }

  return parsed;
}

function extractIdentifier(parsed) {
  const pathname = parsed.pathname;

  // Case A: profile.php?id=<numeric>
  if (pathname.toLowerCase().startsWith('/profile.php')) {
    const id = parsed.searchParams.get('id');
    if (id && id.trim()) {
      return cleanIdentifier(id);
    }
  }

  // Case B: /username/ style
  const segments = pathname
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  // Ignore leading "pages" path as it usually follows /pages/<title>/<id>
  if (segments[0].toLowerCase() === 'pages') {
    const potentialId = segments[2]; // pages/{title}/{id}
    if (potentialId) {
      return cleanIdentifier(potentialId);
    }
    return null;
  }

  return cleanIdentifier(segments[0]);
}

function cleanIdentifier(identifier) {
  return identifier.replace(/[?#].*$/, '');
}

// Ensure DOM is ready before executing
function init() {
  const form = document.querySelector('[data-role="form"]');
  const statusEl = document.querySelector('[data-role="status"]');
  const resultEl = document.querySelector('[data-role="result"]');
  const linkEl = document.querySelector('[data-role="link"]');
  const inputEl = document.querySelector('[name="facebookUrl"]');

  if (!form || !statusEl || !resultEl || !linkEl || !inputEl) {
    console.warn('Missing required elements for Messenger link generator.');
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

  const showResult = (messengerUrl) => {
    linkEl.textContent = messengerUrl;
    linkEl.href = messengerUrl;
    resultEl.classList.remove('hidden');
  };

  const hideResult = () => {
    resultEl.classList.add('hidden');
  };

  const updateUrlParameter = (facebookUrl) => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('facebookUrl', facebookUrl);
      window.history.replaceState({}, '', url.toString());
      console.log('URL parameter updated:', url.toString());
    } catch (error) {
      console.error('Failed to update URL parameter:', error);
    }
  };

  const processConversion = (url) => {
    hideStatus();
    hideResult();

    try {
      const { messengerUrl } = generateMessengerLink(url);
      showResult(messengerUrl);
      updateUrlParameter(url);
    } catch (error) {
      console.error(error);
      showStatus(error instanceof Error ? error.message : 'An error occurred. Please try again.');
    }
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const url = (formData.get('facebookUrl') ?? '').toString();

    processConversion(url);
  });

  // Auto-fill and auto-convert on page load if query parameter is present
  const urlParams = new URLSearchParams(window.location.search);
  const facebookUrlParam = urlParams.get('facebookUrl');

  if (facebookUrlParam && facebookUrlParam.trim()) {
    console.log('Found facebookUrl parameter, auto-filling and converting:', facebookUrlParam);
    inputEl.value = facebookUrlParam;
    processConversion(facebookUrlParam);
  }
}

// Run init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
