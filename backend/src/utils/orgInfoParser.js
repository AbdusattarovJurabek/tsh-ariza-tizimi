const ORGINFO_BASE_URL = 'https://orginfo.uz';
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 10_000;

class OrgInfoError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = 'OrgInfoError';
    this.status = status;
  }
}

const decodeHtml = (value = '') => value
  .replace(/&nbsp;|&#160;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
  .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));

const textFromHtml = (value = '') => decodeHtml(
  value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
).replace(/\s+/g, ' ').trim();

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const extractItemprop = (html, itemprop) => {
  const prop = escapeRegExp(itemprop);
  const pattern = new RegExp(
    `<([a-z0-9]+)\\b[^>]*\\bitemprop=["']${prop}["'][^>]*>([\\s\\S]*?)<\\/\\1>`,
    'i'
  );
  const match = html.match(pattern);
  return match ? textFromHtml(match[2]) : '';
};

const parseSearchResult = (html, stir) => {
  const organizationLinks = html.matchAll(
    /<a\b[^>]*\bhref=["']([^"']*\/organization\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  );

  for (const match of organizationLinks) {
    const href = match[1];
    const cardText = textFromHtml(match[2]);
    if (!new RegExp(`(?:^|\\D)${escapeRegExp(stir)}(?:\\D|$)`).test(cardText)) continue;

    const url = new URL(href, ORGINFO_BASE_URL);
    if (url.origin !== ORGINFO_BASE_URL || !/^\/uz\/organization\/[a-z0-9]+\/$/i.test(url.pathname)) {
      continue;
    }
    return url.toString();
  }

  return null;
};

const parseOrganizationPage = (html, expectedStir, sourceUrl) => {
  const stir = extractItemprop(html, 'taxID');
  if (stir !== expectedStir) {
    throw new OrgInfoError('OrgInfo natijasidagi INN mos kelmadi');
  }

  const fullName =
    extractItemprop(html, 'legalName') ||
    extractItemprop(html, 'name');
  const locality = extractItemprop(html, 'addressLocality');
  const street = extractItemprop(html, 'streetAddress');
  const legalAddress = [locality, street].filter(Boolean).join(', ');
  const managerMatch = html.match(
    /<span[^>]*>\s*Rahbar\s*<\/span>[\s\S]{0,1500}?<a\b[^>]*\/search\/managers\/[^>]*>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i
  );
  const leaderFullName = managerMatch ? textFromHtml(managerMatch[1]) : '';

  if (!fullName || !legalAddress) {
    throw new OrgInfoError("OrgInfo sahifasidan tashkilot ma'lumotlarini o'qib bo'lmadi");
  }

  return {
    full_name: fullName,
    leader_full_name: leaderFullName,
    legal_address: legalAddress,
    stir,
    land_area: null,
    source: 'orginfo',
    source_url: sourceUrl
  };
};

const fetchHtml = async (url, fetchImpl = fetch, signal) => {
  let response;
  try {
    response = await fetchImpl(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'uz,en;q=0.8',
        'User-Agent': 'TSH-Ariza-Tizimi/1.0 (organization lookup)'
      },
      redirect: 'follow',
      signal
    });
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      throw new OrgInfoError("OrgInfo javob berish vaqti tugadi", 504);
    }
    throw new OrgInfoError("OrgInfo bilan bog'lanib bo'lmadi");
  }

  if (!response.ok) {
    throw new OrgInfoError(`OrgInfo ${response.status} xato bilan javob berdi`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    throw new OrgInfoError("OrgInfo HTML sahifa qaytarmadi");
  }

  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength > MAX_RESPONSE_BYTES) {
    throw new OrgInfoError("OrgInfo javobi ruxsat etilgan hajmdan katta");
  }

  const html = await response.text();
  if (Buffer.byteLength(html, 'utf8') > MAX_RESPONSE_BYTES) {
    throw new OrgInfoError("OrgInfo javobi ruxsat etilgan hajmdan katta");
  }
  return html;
};

const lookupOrganization = async (stir, fetchImpl = fetch) => {
  if (!/^\d{9}$/.test(stir)) {
    throw new OrgInfoError("INN aynan 9 ta raqamdan iborat bo'lishi kerak", 400);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const searchUrl = `${ORGINFO_BASE_URL}/uz/search/all/?q=${encodeURIComponent(stir)}`;
    const searchHtml = await fetchHtml(searchUrl, fetchImpl, controller.signal);
    const organizationUrl = parseSearchResult(searchHtml, stir);
    if (!organizationUrl) {
      throw new OrgInfoError("Bu INN bo'yicha tashkilot topilmadi", 404);
    }

    const organizationHtml = await fetchHtml(organizationUrl, fetchImpl, controller.signal);
    return parseOrganizationPage(organizationHtml, stir, organizationUrl);
  } finally {
    clearTimeout(timeout);
  }
};

module.exports = {
  OrgInfoError,
  lookupOrganization,
  parseOrganizationPage,
  parseSearchResult
};
