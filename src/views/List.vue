<template>
  <div v-if="list && list.id">
    <header>
      <h1>{{ list.title }}</h1>
      <p>{{ list.description }}</p>
    </header>
    <section v-if="admin">
      <input type="text" v-model="input.title" placeholder="title" />
      <input type="text" v-model="input.description" placeholder="description" />
      <input type="text" v-model="input.links" placeholder="url, url" />
      <button @click="syncItem()">Wunsch hinzufügen</button>
    </section>
    <section class="list">
      <div class="item" v-for="(i, n) in items" :key="i.id">
        <h2>#{{ i.id }} {{ i.title }}</h2>
        <div>
          {{ i.description }}
          <span v-for="l in i.links"><a :href="l" target="_blank">Shop</a></span>
          <span v-show="i.reserved">R</span>
          <span v-show="i.bought">K</span>
        </div>
        <div>
          <button @click="reserveItem(i)">Reservieren</button>
          <button @click="boughtItem(i)">Gekauft</button>
        </div>
        <div v-if="admin">
          <button @click="editItem(i)">Bearbeiten</button>
          <button @click="deleteItem(i.id)">Löschen</button>
        </div>
      </div>
    </section>
    <section v-if="admin">
      <h3>Teilen</h3>
      Link zum Teilen: <code>https://wishlist.devmount.de/{{ $route.params.public }}</code><br>
      Link zum Administrieren: <code>https://wishlist.devmount.de/{{ $route.params.public }}/{{ $route.params.private }}</code>
    </section>
  </div>
  <div v-else>
    Diese Liste existiert nicht mehr oder der Link ist ungültig.
   <router-link to="/">Neustart</router-link>
  </div>
</template>

<script>
export default {
  name: 'App',
  data: () => ({
    list: null,
    items: [],
    input: {},
    mode: 'INSERT',
    target: null,
  }),
  async created () {
    // subscribe to all changes on the lists table and the items table to provide realtime experience
    this.$supabase.from('lists').on('*', async payload => { await this.getList() }).subscribe()
    this.$supabase.from('items').on('*', async payload => { await this.getItems() }).subscribe()
    // initially get all existing items
    await this.getList()
    await this.getItems()
    // init input
    this.input = JSON.parse(JSON.stringify(this.initItem))
  },
  methods: {
    // retrieve list object
    async getList () {
      let { data: lists, error } = await this.$supabase.from('lists').select('*')
      let requestedList = lists.find(l => l.slug_public == this.$route.params.public)
      if (requestedList) {
        this.list = requestedList
      } else {
        this.list = null
      }
    },
    // retrieve list of item objects
    async getItems () {
      if (this.list && this.list.id) {
        let { data: items, error } = await this.$supabase.from('items').select('*').filter('list', 'eq', this.list.id)
        this.items = items
      }
    },
    // store new item
    async syncItem () {
      switch (this.mode) {
        case 'INSERT':
          await this.$supabase.from('items').insert([ this.processedInput ]); break
        case 'UPDATE':
          await this.$supabase.from('items').update([ this.processedInput ]).match({ id: this.target }); break
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
    // set item reserved
    async reserveItem (item) {
      item.reserved = true
      await this.$supabase.from('items').update([ item ]).match({ id: item.id })
    },
    // set item bought
    async boughtItem (item) {
      item.bought = true
      await this.$supabase.from('items').update([ item ]).match({ id: item.id })
    },
    // delete existing item
    async deleteItem (id) {
      await this.$supabase.from('items').delete().match({ id: id })
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
        list: null
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
    // check if admin token is given and correct
    admin () {
      return  this.$route.params.private && this.list.slug_private === this.$route.params.private
    }
  },
  watch: {
    async $route (to, from) {
      await this.getList()
      await this.getItems()
    }
  }
}
</script>

<style lang="stylus">
</style>