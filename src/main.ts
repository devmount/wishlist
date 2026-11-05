// Init app
import { createApp } from 'vue';
import App from '@/App.vue';
const app = createApp(App);

// Init router
import router from '@/router.js';
app.use(router);

// Backend API
import api from '@/api';
app.provide('api', api);

/** @ts-ignore Defined in global.ts */
app.provide('version', APP_VERSION);

// Ready? let's go!
app.mount('#app');
