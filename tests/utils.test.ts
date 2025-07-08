import { expect, test } from 'vitest'
import { mount } from '@vue/test-utils'
import * as utils from '@/utils';
import App from '@/App.vue';

test('base url extraction', () => {
  expect(utils.getBaseUrl('https://test.org/')).toBe('test.org');
  expect(utils.getBaseUrl('https://test.org/test')).toBe('test.org');
  expect(utils.getBaseUrl('https://test.org:1234/test')).toBe('test.org');
  expect(utils.getBaseUrl('http://test.org:1234')).toBe('test.org');
});

test('toast notifications', () => {
  const wrapper = mount(App, {});
  expect(wrapper.html()).not.toContain('<sl-alert');
  utils.notify('alert xyz');
  expect(wrapper.html()).toContain('<sl-alert');
});
