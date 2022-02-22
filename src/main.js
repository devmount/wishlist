// Vue
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Supabase
import { createClient } from '@supabase/supabase-js'
const SUPABASE_KEY = process.env.VUE_APP_SB_KEY
const SUPABASE_URL = process.env.VUE_APP_SB_URL

const app = createApp(App)
app.config.globalProperties.$version = process.env.VUE_APP_VERSION
app.config.globalProperties.$supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
app.use(router).mount('#app')
