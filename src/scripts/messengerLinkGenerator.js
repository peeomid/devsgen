import { generateMessengerLink } from '../utils/facebook';

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
