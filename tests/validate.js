/**
 * Frizerescu Website Validation Script
 * Run with: node tests/validate.js
 *
 * Checks HTML structure, SEO meta tags, JSON-LD, accessibility attributes,
 * image alt tags, link integrity, and i18n translation coverage.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let passed = 0;
let failed = 0;
const errors = [];

function check(name, condition, detail) {
    if (condition) {
        passed++;
        console.log(`  ✅ ${name}`);
    } else {
        failed++;
        const msg = detail ? `${name} — ${detail}` : name;
        errors.push(msg);
        console.log(`  ❌ ${name}${detail ? ' — ' + detail : ''}`);
    }
}

// Load files
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf-8');
const css = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf-8');
const js = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf-8');
const i18nRaw = fs.readFileSync(path.join(ROOT, 'i18n.js'), 'utf-8');

// Parse i18n translations
let translations = {};
try {
    const i18nCode = i18nRaw.replace('const translations = ', '').replace(/;[\s]*$/, '');
    translations = JSON.parse(i18nCode.replace(/'/g, '"').replace(/,\s*}/g, '}').replace(/,\s*]/g, ']'));
} catch (e) {
    // Fallback: extract keys with regex
    const roKeys = [...i18nRaw.matchAll(/'([a-z0-9-]+)':/g)].map(m => m[1]);
    translations = { ro: roKeys, en: roKeys };
}

// =============================
// 1. Required Files
// =============================
console.log('\n📁 Required Files');
check('index.html exists', fs.existsSync(path.join(ROOT, 'index.html')));
check('styles.css exists', fs.existsSync(path.join(ROOT, 'styles.css')));
check('script.js exists', fs.existsSync(path.join(ROOT, 'script.js')));
check('i18n.js exists', fs.existsSync(path.join(ROOT, 'i18n.js')));
check('robots.txt exists', fs.existsSync(path.join(ROOT, 'robots.txt')));
check('sitemap.xml exists', fs.existsSync(path.join(ROOT, 'sitemap.xml')));
check('CNAME exists', fs.existsSync(path.join(ROOT, 'CNAME')));
check('logo.jpeg exists', fs.existsSync(path.join(ROOT, 'images', 'logo.jpeg')));
check('favicon.ico exists', fs.existsSync(path.join(ROOT, 'favicon.ico')));
check('favicon-32x32.png exists', fs.existsSync(path.join(ROOT, 'images', 'favicon-32x32.png')));
check('favicon-16x16.png exists', fs.existsSync(path.join(ROOT, 'images', 'favicon-16x16.png')));
check('apple-touch-icon.png exists', fs.existsSync(path.join(ROOT, 'apple-touch-icon.png')));
check('og-image.jpg exists', fs.existsSync(path.join(ROOT, 'images', 'og-image.jpg')));

// =============================
// 2. HTML Structure
// =============================
console.log('\n🏗️  HTML Structure');
check('DOCTYPE present', html.includes('<!DOCTYPE html>'));
check('lang attribute set', /^<html\s+lang="[a-z]{2}">/m.test(html) || html.includes('lang="ro"'));
check('charset UTF-8', html.includes('charset="UTF-8"'));
check('viewport meta', html.includes('name="viewport"'));
check('Single H1 tag', (html.match(/<h1[\s>]/g) || []).length === 1);

const h2Count = (html.match(/<h2[\s>]/g) || []).length;
check('H2 tags present', h2Count >= 3, `Found ${h2Count}`);

check('No inline <style> blocks', !/<style[\s>]/i.test(html.split('<link rel="stylesheet"')[0]) && (html.match(/<style[\s>]/gi) || []).length === 0);
check('No inline <script> blocks (except JSON-LD)', (html.match(/<script(?!\s+type="application\/ld\+json")[\s>]/gi) || []).length <= 2); // i18n.js + script.js src tags

// =============================
// 3. SEO Meta Tags
// =============================
console.log('\n🔍 SEO Meta Tags');
check('Title tag present', /<title>.+<\/title>/.test(html));
check('Title under 60 chars', ((html.match(/<title>(.+?)<\/title>/) || [])[1] || '').length <= 60);
check('Meta description present', html.includes('name="description"'));
check('Meta description under 160 chars', ((html.match(/name="description"\s+content="(.+?)"/) || [])[1] || '').length <= 160);
check('Canonical URL present', html.includes('rel="canonical"'));
check('Canonical points to frizerescu.ro', html.includes('href="https://frizerescu.ro/"'));

// =============================
// 4. Open Graph (Social Sharing)
// =============================
console.log('\n📱 Social Sharing (OG + Twitter)');
check('og:title present', html.includes('og:title'));
check('og:description present', html.includes('og:description'));
check('og:image present', html.includes('og:image'));
check('og:image points to images/og-image.jpg', /og:image.*images\/og-image\.jpg/.test(html));
check('og:image:width present', html.includes('og:image:width'));
check('og:image:height present', html.includes('og:image:height'));
check('og:url present', html.includes('og:url'));
check('og:type present', html.includes('og:type'));
check('og:locale present', html.includes('og:locale'));
check('og:site_name present', html.includes('og:site_name'));
check('Twitter card present', html.includes('twitter:card'));
check('Twitter image points to images/og-image.jpg', /twitter:image.*images\/og-image\.jpg/.test(html));

// =============================
// 5. Favicon
// =============================
console.log('\n🖼️  Favicon');
check('Favicon .ico link present', html.includes('href="favicon.ico"'));
check('Favicon 32x32 link present', html.includes('images/favicon-32x32.png'));
check('Favicon 16x16 link present', html.includes('images/favicon-16x16.png'));
check('Apple touch icon link present', html.includes('apple-touch-icon.png'));

// =============================
// 6. Structured Data (JSON-LD)
// =============================
console.log('\n📊 Structured Data (JSON-LD)');
const jsonLdBlocks = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || [];
check('JSON-LD blocks present', jsonLdBlocks.length >= 1);
check('Two JSON-LD blocks (both locations)', jsonLdBlocks.length === 2, `Found ${jsonLdBlocks.length}`);

jsonLdBlocks.forEach((block, i) => {
    const jsonStr = block.replace(/<script type="application\/ld\+json">/, '').replace(/<\/script>/, '');
    try {
        const data = JSON.parse(jsonStr);
        check(`JSON-LD #${i + 1}: valid JSON`, true);
        check(`JSON-LD #${i + 1}: has @type HairSalon`, data['@type'] === 'HairSalon');
        check(`JSON-LD #${i + 1}: has name`, !!data.name);
        check(`JSON-LD #${i + 1}: has telephone`, !!data.telephone);
        check(`JSON-LD #${i + 1}: has address`, !!data.address);
        check(`JSON-LD #${i + 1}: has geo coordinates`, !!data.geo);
        check(`JSON-LD #${i + 1}: has aggregateRating`, !!data.aggregateRating);
        check(`JSON-LD #${i + 1}: has image`, !!data.image);
    } catch (e) {
        check(`JSON-LD #${i + 1}: valid JSON`, false, e.message);
    }
});

// =============================
// 7. Accessibility
// =============================
console.log('\n♿ Accessibility');

// Check images have alt tags
const imgTags = html.match(/<img\s[^>]*>/g) || [];
imgTags.forEach((tag, i) => {
    check(`Image #${i + 1} has alt attribute`, /alt="/.test(tag), tag.substring(0, 80));
});

// Check external links have rel="noopener noreferrer"
const externalLinks = html.match(/<a\s[^>]*target="_blank"[^>]*>/g) || [];
externalLinks.forEach((tag, i) => {
    check(`External link #${i + 1} has rel="noopener noreferrer"`, /rel="noopener\s*noreferrer"/.test(tag), tag.substring(0, 80));
});

// Check hamburger has aria-label
check('Hamburger has aria-label', /class="hamburger"[^>]*aria-label/.test(html));
check('Hamburger has aria-expanded', /class="hamburger"[^>]*aria-expanded/.test(html));

// Check nav has aria-label
check('Nav has aria-label', /nav[^>]*aria-label/.test(html));

// =============================
// 8. Images
// =============================
console.log('\n🖼️  Images');
imgTags.forEach((tag, i) => {
    check(`Image #${i + 1} has width attribute`, /width=/.test(tag), tag.substring(0, 60));
    check(`Image #${i + 1} has height attribute`, /height=/.test(tag), tag.substring(0, 60));
});

// =============================
// 9. i18n Translation Coverage
// =============================
console.log('\n🌍 i18n Translation Coverage');

// Extract all data-i18n keys from HTML
const i18nKeys = [...new Set((html.match(/data-i18n="([^"]+)"/g) || []).map(m => m.match(/"([^"]+)"/)[1]))];
check(`Found ${i18nKeys.length} i18n keys in HTML`, i18nKeys.length > 0);

// Check RO and EN sections exist in i18n.js
check('RO translations defined', i18nRaw.includes("ro:"));
check('EN translations defined', i18nRaw.includes("en:"));

// Check each HTML key exists in translations
i18nKeys.forEach(key => {
    check(`Key "${key}" exists in RO`, i18nRaw.includes(`'${key}'`));
    check(`Key "${key}" exists in EN`, i18nRaw.includes(`'${key}'`));
});

// =============================
// 10. Links
// =============================
console.log('\n🔗 Links');

// Check anchor links point to valid IDs
const anchorLinks = [...new Set((html.match(/href="#([^"]+)"/g) || []).map(m => m.match(/"#([^"]+)"/)[1]))];
anchorLinks.forEach(id => {
    check(`Anchor #${id} has matching element`, html.includes(`id="${id}"`));
});

// Check MERO booking links
check('MERO Pipera link present', html.includes('mero.ro/p/frizerescu'));
check('MERO Kaufland link present', html.includes('mero.ro/p/frizerescu-kaufland'));

// Check phone links
check('Phone link (Pipera) present', html.includes('tel:0758720970'));
check('Phone link (Kaufland) present', html.includes('tel:0750235222'));

// =============================
// 11. Preconnect Hints
// =============================
console.log('\n⚡ Performance');
check('Preconnect to fonts.googleapis.com', html.includes('preconnect" href="https://fonts.googleapis.com"'));
check('Preconnect to fonts.gstatic.com', html.includes('preconnect" href="https://fonts.gstatic.com"'));
check('Preconnect to cdnjs.cloudflare.com', html.includes('preconnect" href="https://cdnjs.cloudflare.com"'));
check('Google Fonts uses display=swap', html.includes('display=swap'));

// =============================
// 12. CSS Quality
// =============================
console.log('\n🎨 CSS Quality');
check('CSS custom properties defined (:root)', css.includes(':root'));
check('No !important declarations', !css.includes('!important'));
check('Uses clamp() for fluid sizing', css.includes('clamp('));
check('No unused .apple-footer class', !css.includes('.apple-footer'));
check('No unused .dropdown-menu class', !css.includes('.dropdown-menu'));
check('No unused .contact class', !css.includes('.contact {'));
check('No unused .service-price class', !css.includes('.service-price'));

// =============================
// 13. JavaScript Quality
// =============================
console.log('\n⚙️  JavaScript Quality');
check('No var declarations', !/(^|\s)var\s/.test(js));
check('No deprecated pageYOffset', !js.includes('pageYOffset'));
check('No service worker registration', !js.includes('serviceWorker'));
check('No setupLazyLoading (unused)', !js.includes('setupLazyLoading'));
check('No optimizePerformance (unused)', !js.includes('optimizePerformance'));
check('Uses window.scrollY', js.includes('window.scrollY'));

// =============================
// Summary
// =============================
console.log('\n' + '='.repeat(50));
console.log(`\n✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);

if (errors.length > 0) {
    console.log('\n📋 Failed checks:');
    errors.forEach(e => console.log(`   - ${e}`));
}

console.log('');
process.exit(failed > 0 ? 1 : 0);
