import { createRouter, createWebHistory } from 'vue-router';
import Start from '@/views/Start.vue';
import List from '@/views/List.vue';

const routes = [
  { path: '/',                  name: 'start', component: Start },
  { path: '/:public/:private?', name: 'list',  component: List  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
});

export { routes };

export default router;
