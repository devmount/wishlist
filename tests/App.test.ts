import { expect, test, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createWebHistory, Router } from 'vue-router'
import { routes } from "@/router"
import App from '@/App.vue';

const provide = {
  version: '0.1.2',
  api: null,
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

// Mock api returning a list, including the private slug only for admins
const mockApi = (admin: boolean) => ({
  getList: async () => ({
    list: {
      id: 1,
      title: 'foo',
      color: '#123456',
      description: null,
      slug_public: 'abc',
      spoiler: false,
      created: '2026-11-05T20:00:00Z',
      modified: '2026-11-05T20:00:00.123456Z',
      ...(admin ? { slug_private: 'xyz' } : {}),
    },
    items: [],
  }),
  getVersion: async () => '2026-11-05T20:00:00.123456Z',
});

test('Public list is displayed without admin controls', async () => {
  router.push('/abc')
  await router.isReady()

  const wrapper = mount(App, {
    global: {
      plugins: [router],
      provide: { ...provide, api: mockApi(false) },
    }
  });
  await flushPromises();
  expect(wrapper.html()).toContain('foo');
  expect(wrapper.html()).not.toContain('Verwalte deine Wunschliste');
  wrapper.unmount();
});

test('Private list is displayed with admin controls', async () => {
  router.push('/abc/xyz')
  await router.isReady()

  const wrapper = mount(App, {
    global: {
      plugins: [router],
      provide: { ...provide, api: mockApi(true) },
    }
  });
  await flushPromises();
  expect(wrapper.html()).toContain('Verwalte deine Wunschliste');
  wrapper.unmount();
});

test('Opening an admin link adds the list to local storage', async () => {
  localStorage.clear();
  router.push('/abc/xyz')
  await router.isReady()

  const wrapper = mount(App, {
    global: {
      plugins: [router],
      provide: { ...provide, api: mockApi(true) },
    }
  });
  await flushPromises();
  const stored = JSON.parse(localStorage.wishlists ?? '[]');
  expect(stored).toHaveLength(1);
  expect(stored[0].slug_public).toBe('abc');
  expect(stored[0].slug_private).toBe('xyz');
  wrapper.unmount();
});

test('Opening a public link does not add the list to local storage', async () => {
  localStorage.clear();
  router.push('/abc')
  await router.isReady()

  const wrapper = mount(App, {
    global: {
      plugins: [router],
      provide: { ...provide, api: mockApi(false) },
    }
  });
  await flushPromises();
  expect(localStorage.wishlists).toBeUndefined();
  wrapper.unmount();
});

test('Admin edit form stays visible when the list is stored on first visit', async () => {
  localStorage.clear();
  router.push('/abc/xyz')
  await router.isReady()

  const wrapper = mount(App, {
    global: {
      plugins: [router],
      provide: { ...provide, api: mockApi(true) },
    }
  });
  await flushPromises();
  const html = wrapper.html();
  const form = html.slice(html.indexOf('Bearbeite deine Wunschliste'), html.indexOf('Speichern'));
  expect(form).not.toContain('<!--v-if-->');
  wrapper.unmount();
});
