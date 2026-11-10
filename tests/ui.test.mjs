import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { JSDOM } from 'jsdom';
const pages = ['index', 'layanan', 'produk', 'promo', 'kontak', '404'];
const html = page => readFileSync(`${page}.html`, 'utf8');
const text = source => {
  const dom = new JSDOM(source);
  dom.window.document.querySelectorAll('script,style').forEach(el => el.remove());
  return dom.window.document.body.textContent.replace(/\s+/g, ' ').trim();
};
for (const page of pages) {
  test(`${page}: copywriting unchanged`, () => {
    const original = execFileSync('git', ['show', `HEAD:${page}.html`], { encoding: 'utf8' });
    assert.equal(text(html(page)), text(original));
  });
  test(`${page}: local assets and links resolve; framework loaded`, () => {
    const document = new JSDOM(html(page)).window.document;
    assert.ok(document.querySelector('link[href="assets/css/framework.css"]'));
    assert.ok(document.querySelector('link[href="assets/css/refresh.css"]'));
    for (const el of document.querySelectorAll('[src], a[href], link[rel="stylesheet"]')) {
      const url = el.getAttribute('src') || el.getAttribute('href');
      if (!url || /^(https?:|data:|#|mailto:|tel:)/.test(url)) continue;
      assert.ok(existsSync(url.split('#')[0]), `${page}: missing ${url}`);
    }
  });
}
test('navigation opens, closes via Escape, outside click, and links', () => {
  const dom = new JSDOM(html('index'), { runScripts: 'outside-only', pretendToBeVisual: true });
  const { window } = dom;
  window.matchMedia = () => ({ matches: true });
  window.eval(readFileSync('assets/js/main.js', 'utf8'));
  const button = window.document.getElementById('menuBtn');
  const nav = window.document.getElementById('navList');
  button.click();
  assert.equal(button.getAttribute('aria-expanded'), 'true');
  assert.ok(nav.classList.contains('show'));
  window.document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));
  assert.equal(button.getAttribute('aria-expanded'), 'false');
  assert.equal(window.document.activeElement, button);
  button.click(); window.document.body.click();
  assert.ok(!nav.classList.contains('show'));
  button.click();
  nav.querySelector('a').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  assert.ok(!nav.classList.contains('show'));
  dom.window.close();
});
test('Bootstrap layout keeps all five trust cards and service actions', () => {
  const document = new JSDOM(html('index')).window.document;
  assert.equal(document.querySelectorAll('.trust-strip.row > .col > .trust-item').length, 5);
  assert.ok(document.querySelectorAll('.service-list-layout.row > .col > .service-list-item').length > 0);
});
