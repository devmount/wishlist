<template>
  <main>
    <router-view/>
  </main>
  <footer>
    <sl-button class="mb-xxxl" type="info" size="large" @click="$router.push({ name: 'start' })">
      Zur Startseite
      <sl-icon slot="suffix" size="large" name="house-door"></sl-icon>
    </sl-button>
    <div class="mb-m">
      Entwickelt von Andreas Müller
    </div>
    <div>
      &copy; 2021 <a href="https://devmount.de" target="_blank">devmount</a>
    </div>
  </footer>
</template>

<style lang="stylus">
@import "assets/global"

#app
  display: grid
  grid-template-rows: auto auto
  min-height: 100vh

#app > main
  margin: 0 auto
  padding: var(--sl-spacing-xxx-large) var(--sl-spacing-medium) var(--sl-spacing-xxxx-large) var(--sl-spacing-medium)

#app > footer
  text-align: center
  padding: var(--sl-spacing-xxxx-large) var(--sl-spacing-medium)
  background: var(--sl-color-gray-800)
  color: var(--sl-color-primary-100)

// responsiveness
@media (min-width: break)
  #app > main
    max-width: break

</style>
