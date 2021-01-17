<template>
  <section class="form">
    <input type="text" v-model="input.title" placeholder="title" />
    <input type="text" v-model="input.description" placeholder="description" />
    <input type="text" v-model="input.links" placeholder="url, url" />
    <input type="checkbox" v-model="input.bought" /> Gekauft
    <button @click="syncData()">Add</button>
  </section>
  <section class="list">
    <div class="item" v-for="(i, n) in items" :key="i.id">
      <h2>#{{ i.id }} {{ i.title }}</h2>
      <div>
        {{ i.description }}
        <span v-for="l in i.links"><a :href="l" target="_blank">Link</a></span>
      </div>
      <div><span @click="editItem(i)">Edit</span> <span @click="deleteItem(i.id)">Delete</span></div>
    </div>
  </section>
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
    items: [],
    input: {},
    mode: 'INSERT',
    target: null,
  }),
  async created () {
    // subscribe to all events to provide realtime experience
    supabase.from('items').on('*', async payload => { await this.syncItems() }).subscribe()
    // initially get all existing items
    await this.syncItems()
    // init input
    this.input = JSON.parse(JSON.stringify(this.initItem))
  },
  methods: {
    // retrieve list of items
    async syncItems () {
      let { data: items, error } = await supabase.from('items').select('*')
      this.items = items
    },
    // store new item
    async syncData () {
      switch (this.mode) {
        case 'INSERT':
          await supabase.from('items').insert([ this.processedInput ]); break
        case 'UPDATE':
          await supabase.from('items').update([ this.processedInput ]).match({ id: this.target }); break
        case 'DELETE':
          await supabase.from('items').delete().match({ id: this.target }); break
        default:
          break;
      }
      this.input = JSON.parse(JSON.stringify(this.initItem))
      this.mode = 'INSERT'
      this.target = null
    },
    // edit existing item
    async editItem (item) {
      let i = JSON.parse(JSON.stringify(item))
      i.links = item.links.join(',')
      this.input = i
      this.mode = 'UPDATE'
      this.target = i.id
    },
  },
  computed: {
    // initial item object
    initItem () {
      return {
        title: '',
        description: '',
        links: '',
        bought: false
      }
    },
    // processed input object
    processedInput () {
      return {
        title: this.input.title,
        description: this.input.description,
        links: this.input.links.split(',').map(l => l.trim()),
        bought: this.input.bought
      }
    },
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
