/**
 * Utilities for generating Messenger deep-links from Facebook profile/page URLs.
 */
export interface MessengerLinkResult {
  identifier: string;
  messengerUrl: string;
}

/**
 * Extracts the identifier (username/page slug or numeric id) from a Facebook profile/page URL
 * and returns the corresponding https://m.me/ link.
 *
 * @throws {TypeError} if the url cannot be parsed or does not belong to facebook.com
 * @throws {Error} if an identifier cannot be extracted from the url
 */
export function generateMessengerLink(rawUrl: string): MessengerLinkResult {
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

function ensureProtocol(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function parseFacebookUrl(url: string): URL {
  let parsed: URL;
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
    throw new TypeError('This URL is not from Facebook.');
  }

  return parsed;
}

function extractIdentifier(parsed: URL): string | null {
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

function cleanIdentifier(identifier: string): string {
  return identifier.replace(/[?#].*$/, '');
}
