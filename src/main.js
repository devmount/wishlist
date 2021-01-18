// Vue
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Supabase
import { createClient } from '@supabase/supabase-js'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYxMDg4MjU1MiwiZXhwIjoxOTI2NDU4NTUyfQ.FLgpeb22wLfHaZl6bQD6ztDG5UiTPTC9ympeN4bq0bc'
const SUPABASE_URL = "https://ttohmduvoxaknazzfyre.supabase.co"

const app = createApp(App)
app.config.globalProperties.$supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
app.use(router).mount('#app')
