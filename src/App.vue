<template>
  <router-view/>
</template>

<style lang="stylus">
@import "assets/global"

@media (min-width: break)
  #app
    max-width: break

#app
  margin: 0 auto
  padding: var(--sl-spacing-xxx-large) var(--sl-spacing-medium)
</style>
