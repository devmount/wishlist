<template>
  <div v-if="list && list.id">
    <header>
      <h1>{{ list.title }}</h1>
      <p>{{ list.description }}</p>
    </header>
    <section class="form">
      <input type="text" v-model="input.title" placeholder="title" />
      <input type="text" v-model="input.description" placeholder="description" />
      <input type="text" v-model="input.links" placeholder="url, url" />
      <input type="checkbox" v-model="input.bought" /> Gekauft
      <button @click="syncItem()">Add Item</button>
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
  </div>
  <div v-else>
    <button @click="syncList()">Add List</button>
  </div>
</template>

<script>
// import external dependencies
import { createClient } from '@supabase/supabase-js'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYxMDg4MjU1MiwiZXhwIjoxOTI2NDU4NTUyfQ.FLgpeb22wLfHaZl6bQD6ztDG5UiTPTC9ympeN4bq0bc'
const SUPABASE_URL = "https://ttohmduvoxaknazzfyre.supabase.co"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// @ is an alias to /src
import HelloWorld from '@/components/HelloWorld.vue'

export default {
  name: 'App',
  components: {
    HelloWorld
  },
  data: () => ({
    list: null,
    items: [],
    input: {},
    mode: 'INSERT',
    target: null,
  }),
  async created () {
    // subscribe to all changes on the lists table and the items table to provide realtime experience
    supabase.from('lists').on('*', async payload => { await this.getList() }).subscribe()
    supabase.from('items').on('*', async payload => { await this.getItems() }).subscribe()
    // initially get all existing items
    await this.getList()
    await this.getItems()
    // init input
    this.input = JSON.parse(JSON.stringify(this.initItem))
  },
  methods: {
    // retrieve list object
    async getList () {
      let { data: lists, error } = await supabase.from('lists').select('*')
      this.list = lists.find(l => l.id == 1)
    },
    // retrieve list of item objects
    async getItems () {
      let { data: items, error } = await supabase.from('items').select('*')
      this.items = items
    },
    // store new item
    async syncItem () {
      switch (this.mode) {
        case 'INSERT':
          await supabase.from('items').insert([ this.processedInput ]); break
        case 'UPDATE':
          await supabase.from('items').update([ this.processedInput ]).match({ id: this.target }); break
        default:
          break;
      }
      this.input = JSON.parse(JSON.stringify(this.initItem))
      this.mode = 'INSERT'
      this.target = null
    },
    // edit existing item
    editItem (item) {
      let i = JSON.parse(JSON.stringify(item))
      i.links = item.links.join(',')
      this.input = i
      this.mode = 'UPDATE'
      this.target = i.id
    },
    // delete existing item
    async deleteItem (id) {
      await supabase.from('items').delete().match({ id: id })
    },
  },
  computed: {
    // initial item object
    initItem () {
      return {
        title: '',
        description: '',
        links: '',
        bought: false,
        reserved: false,
        list: this.list.id
      }
    },
    // processed input object
    processedInput () {
      return {
        title: this.input.title,
        description: this.input.description,
        links: this.input.links.split(',').map(l => l.trim()),
        bought: this.input.bought,
        reserved: this.input.reserved,
        list: this.list.id
      }
    },
  }
}
</script>

<style lang="stylus">
</style>
