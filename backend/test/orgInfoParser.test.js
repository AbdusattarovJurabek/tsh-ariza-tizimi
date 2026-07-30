const test = require('node:test');
const assert = require('node:assert/strict');
const {
  lookupOrganization,
  parseOrganizationPage,
  parseSearchResult
} = require('../src/utils/orgInfoParser');

test('parseSearchResult returns the exact INN organization URL', () => {
  const html = `
    <a href="/uz/organization/wrong/"><span>310000000</span></a>
    <a href="/uz/organization/4661cdcc373a/">
      <span>310009796</span>
      <h6>"INN SIDE CORP" mas'uliyati cheklangan jamiyati</h6>
    </a>
  `;

  assert.equal(
    parseSearchResult(html, '310009796'),
    'https://orginfo.uz/uz/organization/4661cdcc373a/'
  );
});

test('parseOrganizationPage extracts application fields', () => {
  const html = `
    <span itemprop="legalName">"NAMUNA &amp; HAMKOR" MCHJ</span>
    <span itemprop="taxID" content="310009796">310009796</span>
    <span itemprop="addressLocality">Toshkent shahri, Yunusobod tumani</span>
    <span itemprop="streetAddress">Amir Temur ko'chasi, 10-uy</span>
    <div><span>Rahbar</span></div>
    <div>
      <a href="/uz/search/managers/?q=ALIYEV+ALI">
        <span>ALIYEV ALI VALIYEVICH</span>
      </a>
    </div>
  `;

  assert.deepEqual(
    parseOrganizationPage(
      html,
      '310009796',
      'https://orginfo.uz/uz/organization/4661cdcc373a/'
    ),
    {
      full_name: '"NAMUNA & HAMKOR" MCHJ',
      leader_full_name: 'ALIYEV ALI VALIYEVICH',
      legal_address: "Toshkent shahri, Yunusobod tumani, Amir Temur ko'chasi, 10-uy",
      stir: '310009796',
      land_area: null,
      source: 'orginfo',
      source_url: 'https://orginfo.uz/uz/organization/4661cdcc373a/'
    }
  );
});

test('parseOrganizationPage rejects a mismatched INN', () => {
  const html = '<span itemprop="taxID">111111111</span>';
  assert.throws(
    () => parseOrganizationPage(html, '310009796', 'https://orginfo.uz/'),
    /INN mos kelmadi/
  );
});

test('lookupOrganization uses one shared 10-second deadline for both pages', async () => {
  const signals = [];
  const searchHtml = `
    <a href="/uz/organization/4661cdcc373a/">
      <span>310009796</span>
    </a>
  `;
  const organizationHtml = `
    <span itemprop="legalName">NAMUNA MCHJ</span>
    <span itemprop="taxID">310009796</span>
    <span itemprop="addressLocality">Toshkent shahri</span>
    <span itemprop="streetAddress">Amir Temur ko'chasi, 10-uy</span>
    <span>Rahbar</span>
    <a href="/uz/search/managers/?q=ALIYEV">
      <span>ALIYEV ALI</span>
    </a>
  `;
  const pages = [searchHtml, organizationHtml];
  const fetchImpl = async (_url, options) => {
    signals.push(options.signal);
    const html = pages.shift();
    return {
      ok: true,
      headers: { get: (name) => name === 'content-type' ? 'text/html' : null },
      text: async () => html
    };
  };

  await lookupOrganization('310009796', fetchImpl);

  assert.equal(signals.length, 2);
  assert.ok(signals[0]);
  assert.equal(signals[0], signals[1]);
});
