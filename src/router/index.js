import { createRouter, createWebHashHistory } from 'vue-router'
import Start from '../views/Start.vue'
import List from '../views/List.vue'

const routes = [
  { path: '/',                 name: 'Start',   component: Start },
  { path: '/:public',          name: 'Public',  component: List  },
  { path: '/:public/:private', name: 'Private', component: List  },
]

const router = createRouter({
  mode: 'history',
  history: createWebHashHistory(),
  routes
})

export default router
