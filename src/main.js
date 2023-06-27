// init app
import { createApp } from 'vue';
import App from '@/App.vue';
const app = createApp(App);

// init router
import router from '@/router'
app.use(router);

// Supabase
import { createClient } from '@supabase/supabase-js';
const SUPABASE_KEY = import.meta.env.VITE_SB_KEY;
const SUPABASE_URL = import.meta.env.VITE_SB_URL;

app.provide('supabase', createClient(SUPABASE_URL, SUPABASE_KEY));
app.provide('version', APP_VERSION);

// ready? let's go!
app.mount('#app');
