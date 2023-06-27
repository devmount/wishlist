import { createRouter, createWebHistory } from 'vue-router';
import Start from '@/views/Start.vue'
import List from '@/views/List.vue'

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/',                 name: 'start',   component: Start },
    { path: '/:public',          name: 'public',  component: List  },
    { path: '/:public/:private', name: 'private', component: List  },
  ]
});
