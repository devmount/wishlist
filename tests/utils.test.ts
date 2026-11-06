import { expect, test, vi } from 'vitest'
import * as utils from '@/utils';

test('base url extraction', () => {
  expect(utils.getBaseUrl('https://test.org/')).toBe('test.org');
  expect(utils.getBaseUrl('https://test.org/test')).toBe('test.org');
  expect(utils.getBaseUrl('https://test.org:1234/test')).toBe('test.org');
  expect(utils.getBaseUrl('http://test.org:1234')).toBe('test.org');
});

test('base url extraction of invalid url', () => {
  expect(utils.getBaseUrl('not a url')).toBe('not a url');
});

test('url normalization', () => {
  expect(utils.normalizeUrl('amazon.de/x')).toBe('https://amazon.de/x');
  expect(utils.normalizeUrl('www.test.org')).toBe('https://www.test.org');
  expect(utils.normalizeUrl('https://test.org')).toBe('https://test.org');
  expect(utils.normalizeUrl('http://test.org')).toBe('http://test.org');
  expect(utils.normalizeUrl('HTTPS://TEST.ORG')).toBe('HTTPS://TEST.ORG');
});

test('safe url check', () => {
  expect(utils.isSafeUrl('https://test.org/x?y=z')).toBe(true);
  expect(utils.isSafeUrl('http://test.org')).toBe(true);
  expect(utils.isSafeUrl('HTTPS://TEST.ORG')).toBe(true);
  expect(utils.isSafeUrl('javascript:alert(1)')).toBe(false);
  expect(utils.isSafeUrl(' javascript:alert(1)')).toBe(false);
  expect(utils.isSafeUrl('JavaScript:alert(1)')).toBe(false);
  expect(utils.isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
  expect(utils.isSafeUrl('test.org')).toBe(false);
  expect(utils.isSafeUrl('')).toBe(false);
});

test('toast notification default appearance', async () => {
  expect(document.querySelector('sl-alert')).toBeNull();
  utils.notify('abc');
  const alert = document.querySelector('sl-alert')!;
  expect(alert).toBeTruthy();
  expect(alert.variant).toBe('primary');
  expect(alert.closable).toBe(true);
  expect(alert.duration).toBe(3000);
  expect(alert.innerHTML).toContain('abc');
  alert.remove();
});

test('toast notification custom appearance', async () => {
  expect(document.querySelector('sl-alert')).toBeNull();
  utils.notify('foo', 'success', 'bar', 'x', 200);
  const alert = document.querySelector('sl-alert')!;
  expect(alert).toBeTruthy();
  expect(alert.variant).toBe('success');
  expect(alert.closable).toBe(true);
  expect(alert.duration).toBe(200);
  expect(alert.innerHTML).toContain('<strong>foo</strong>');
  expect(alert.innerHTML).toContain('bar');
  alert.remove();
});

test('custom colored favicon', async () => {
  const color = '#123456';
  let link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
  let meta = document.querySelector<HTMLMetaElement>("meta[name='theme-color']");
  expect(link).toBeNull();
  expect(meta).toBeNull();
  utils.colorFavicon(color);
  link = document.querySelector("link[rel*='icon']")
  meta = document.querySelector("meta[name='theme-color']");
  expect(link?.href).toContain('data:image/svg+xml;base64');
  expect(meta?.content).toContain(color);
});

test('dark theme follows system color scheme', () => {
  let listener = () => {};
  const query = {
    matches: true,
    addEventListener: (_: string, fn: () => void) => { listener = fn },
  };
  vi.stubGlobal('matchMedia', () => query);
  const html = document.documentElement;
  utils.followColorScheme();
  expect(html.classList.contains('sl-theme-dark')).toBe(true);
  query.matches = false;
  listener();
  expect(html.classList.contains('sl-theme-dark')).toBe(false);
  query.matches = true;
  listener();
  expect(html.classList.contains('sl-theme-dark')).toBe(true);
  vi.unstubAllGlobals();
  html.classList.remove('sl-theme-dark');
});
