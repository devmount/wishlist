<template>
  <div class="list">
    <div class="item" v-for="(i, n) in items" :key="i.id">
      <h2>#{{ n+1 }} {{ i.title }}</h2>
      <p>{{ i.description }}</p>
      <ul>
        <li v-for="l in i.links">{{ l }}</li>
      </ul>
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
    // subscribe to all items changes to prived realtime experience
    supabase.from('items').on('*', payload => {  console.log('Change received!', payload)}).subscribe()
    // initially get all existing items
    this.items = await this.getItems()
  },
  methods: {
    // retrieve list of items
    async getItems () {
      let { data: items, error } = await supabase.from('items').select('*')
      return items
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
