// Init app
import { createApp } from 'vue';
import App from '@/App.vue';
const app = createApp(App);

// Init router
import router from '@/router.js';
app.use(router);

// Supabase
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
const SUPABASE_KEY = import.meta.env.VITE_SB_KEY;
const SUPABASE_URL = import.meta.env.VITE_SB_URL;

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY);
app.provide('supabase', supabase);
/** @ts-ignore Defined in global.ts */
app.provide('version', APP_VERSION);

// Ready? let's go!
app.mount('#app');
