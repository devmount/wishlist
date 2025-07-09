import { expect, test, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory, Router } from 'vue-router'
import { routes } from "@/router"
import App from '@/App.vue';

const provide = {
  version: '0.1.2',
  supabase: null,
};

let router: Router;
beforeEach(async () => {
  router = createRouter({
    history: createWebHistory(),
    routes: routes,
  })
});

test('Start page can be displayed', async () => {
  router.push('/')
  await router.isReady()

  const wrapper = mount(App, {
    global: {
      plugins: [router],
      provide: provide,
    }
  });
  expect(wrapper.html()).toContain('<main>');
  expect(wrapper.html()).toContain('Wishlist 0.1.2');
});

test('Public list not found page can be displayed', async () => {
  router.push('/abc')
  await router.isReady()

  const wrapper = mount(App, {
    global: {
      plugins: [router],
      provide: provide,
    }
  });
  expect(wrapper.html()).toContain('404');
});

test('Private list not found page can be displayed', async () => {
  router.push('/abc/xyz')
  await router.isReady()

  const wrapper = mount(App, {
    global: {
      plugins: [router],
      provide: provide,
    }
  });
  expect(wrapper.html()).toContain('404');
});
