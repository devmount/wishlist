import { expect, test } from 'vitest'
import { mount } from '@vue/test-utils'
import Logo from '@/components/Logo.vue';

test('Logo can be displayed', () => {
  const wrapper = mount(Logo, {});
  expect(wrapper.html()).toContain('<svg');
});
