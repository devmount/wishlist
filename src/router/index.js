import { createRouter, createWebHistory } from 'vue-router'
import Start from '../views/Start.vue'
import List from '../views/List.vue'

const routes = [
  { path: '/',                 name: 'start',   component: Start },
  { path: '/:public',          name: 'public',  component: List  },
  { path: '/:public/:private', name: 'private', component: List  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
