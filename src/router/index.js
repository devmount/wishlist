import { createRouter, createWebHashHistory } from 'vue-router'
import Start from '../views/Start.vue'
import Public from '../views/Public.vue'
import Private from '../views/Private.vue'

const routes = [
  { path: '/',                 name: 'Start',   component: Start   },
  { path: '/:public',          name: 'Public',  component: Public  },
  { path: '/:public/:private', name: 'Private', component: Private },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
