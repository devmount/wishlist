<template>
  <main>
    <router-view/>
  </main>
  <footer>
    <sl-button class="mb-3xl" variant="neutral" size="large" @click="router.push({ name: 'start' })">
      Zur Startseite
      <sl-icon slot="suffix" size="large" name="house-door"></sl-icon>
    </sl-button>
    <div class="mb-m">
      Wishlist {{ version }} von Andreas Müller
    </div>
    <div>
      &copy; 2021-{{ (new Date()).getFullYear() }} <a href="https://devmount.de" target="_blank">devmount</a>
    </div>
  </footer>
</template>

<script setup>
import { inject } from "vue";
import { useRouter } from 'vue-router';

// global properties
const version = inject('version');
const router = useRouter();
</script>

<style>
@import "assets/global.css";

#app {
  display: grid;
  grid-template-rows: auto auto;
  min-height: 100vh;
}
#app > main {
  margin: 0 auto;
  padding: var(--sl-spacing-3x-large) var(--sl-spacing-medium) var(--sl-spacing-4x-large) var(--sl-spacing-medium);
}
#app > footer {
  text-align: center;
  padding: var(--sl-spacing-4x-large) var(--sl-spacing-medium);
  background: var(--sl-color-gray-800);
  color: var(--sl-color-primary-100);
}
@media (min-width: 740px) {
  #app > main {
    max-width: 740px;
  }
}

</style>
