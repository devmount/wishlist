import { expect, test } from 'vitest'
import * as utils from '@/utils';

test('base url extraction', () => {
  expect(utils.getBaseUrl('https://test.org/')).toBe('test.org');
  expect(utils.getBaseUrl('https://test.org/test')).toBe('test.org');
  expect(utils.getBaseUrl('https://test.org:1234/test')).toBe('test.org');
  expect(utils.getBaseUrl('http://test.org:1234')).toBe('test.org');
});

test('toast notification default appearance', async () => {
  expect(document.querySelector('sl-alert')).toBeNull();
  utils.notify('abc');
  const alert = document.querySelector('sl-alert');
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
  const alert = document.querySelector('sl-alert');
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
  let link: HTMLLinkElement = document.querySelector("link[rel*='icon']")
  let meta: HTMLMetaElement = document.querySelector("meta[name='theme-color']");
  expect(link).toBeNull();
  expect(meta).toBeNull();
  utils.colorFavicon(color);
  link = document.querySelector("link[rel*='icon']")
  meta = document.querySelector("meta[name='theme-color']");
  expect(link.href).toContain('data:image/svg+xml;base64');
  expect(meta.content).toContain(color);
});
