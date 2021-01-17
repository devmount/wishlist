<template>
  <div class="list">
    <div class="item" v-for="(i, n) in items" :key="i.id">
      <h2>#{{ n+1 }} {{ i.title }}</h2>
      <p>
        {{ i.description }}
        <span v-for="l in i.links"><a :href="l" target="_blank">Link</a></span>
      </p>
    </div>
  </div>
</template>

<script>
// import external dependencies
import { createClient } from '@supabase/supabase-js'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYxMDg4MjU1MiwiZXhwIjoxOTI2NDU4NTUyfQ.FLgpeb22wLfHaZl6bQD6ztDG5UiTPTC9ympeN4bq0bc'
const SUPABASE_URL = "https://ttohmduvoxaknazzfyre.supabase.co"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// import internal components
import HelloWorld from './components/HelloWorld.vue'

export default {
  name: 'App',
  components: {
    HelloWorld
  },
  data: () => ({
    items: []
  }),
  async created () {
    // subscribe to all events to provide realtime experience
    supabase.from('items').on('*', async payload => { await this.syncItems() }).subscribe()
    // initially get all existing items
    await this.syncItems()
  },
  methods: {
    // retrieve list of items
    async syncItems () {
      let { data: items, error } = await supabase.from('items').select('*')
      this.items = items
    }
  }
}
</script>

<style lang="stylus">
#app
  font-family Avenir, Helvetica, Arial, sans-serif
  -webkit-font-smoothing antialiased
  -moz-osx-font-smoothing grayscale
  text-align center
  color #2c3e50
  margin-top 60px
</style>
