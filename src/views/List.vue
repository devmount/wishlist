<template>
  <div v-if="list && list.id">
    <header class="content-center mb-xxxl">
      <Logo />
      <h1>{{ list.title }}</h1>
      <p>{{ list.description }}</p>
    </header>
    <section v-if="admin" class="mb-xxxl">
      <h2>
        <sl-icon class="font-xl" name="bag-plus"></sl-icon>
        Füge einen Wunsch hinzu
      </h2>
      <div class="d-flex flex-wrap gap-m mb-m">
        <sl-input class="grow-1" type="text" v-model="input.title" placeholder="Titel"></sl-input>
        <sl-input class="grow-5" type="text" v-model="input.description" placeholder="Beschreibung"></sl-input>
      </div>
      <sl-textarea class="grow-1 mb-m" v-model="input.links" placeholder="Links zum Artikel (ein Link pro Zeile)" rows="1" resize="auto"></sl-textarea>
      <sl-button type="primary" size="large" @click="syncItem()">
        <sl-icon class="font-xl" slot="suffix" name="plus"></sl-icon>
        Wunsch erstellen
      </sl-button>
    </section>
    <section ref="wishlist" class="mb-xxxl">
      <sl-details class="item mb-xxs" v-for="(i, n) in items" :key="i.id" :reserved="i.state == 'reserved'" :purchased="i.state == 'purchased'">
        <!-- item title and flag -->
        <header slot="summary" class="d-flex align-items-center gap-m">
          <sl-icon v-if="i.state == 'purchased'" name="check-circle" class="font-xl"></sl-icon>
          <sl-icon v-else-if="i.state == 'reserved'" name="exclamation-circle" class="font-xl"></sl-icon>
          <sl-icon v-else name="circle" class="font-xl"></sl-icon>
          <h3 class="m-none">{{ i.title }}</h3>
          <sl-badge v-if="i.state == 'reserved'" type="info">RESERVIERT</sl-badge>
          <sl-badge v-if="i.state == 'purchased'" type="primary">GEKAUFT</sl-badge>
        </header>
        <!-- item information -->
        <main class="d-grid gap-m two-col mb-m">
          <div>
            {{ i.description }}
          </div>
          <div>
            <a class="d-flex mb-xxs" v-for="l in i.links" :href="l" target="_blank">
              <span class="text-overflow-ellipsis">{{ l }}</span>
            </a>
          </div>
        </main>
        <!-- flag and manage item -->
        <footer class="d-flex justify-end flex-wrap gap-m">
          <sl-button v-if="admin" type="danger" size="large" @click="deleteItem(i.id)">
            <sl-icon name="trash"></sl-icon>
          </sl-button>
          <sl-button v-if="admin" class="mr-auto" type="primary" size="large" @click="editItem(i)">
            <sl-icon name="pencil"></sl-icon>
          </sl-button>
          <sl-button-group>
            <sl-button type="info" size="large" @click="setReserved(i)">
              <template v-if="i.state != 'reserved'">
                <sl-icon class="font-xl" slot="suffix" name="patch-exclamation"></sl-icon>
                Reserviere ich
              </template>
              <template v-else>
                <sl-icon class="font-xl" slot="suffix" name="patch-minus"></sl-icon>
                Doch nicht reserviert
              </template>
            </sl-button>
            <sl-button type="primary" size="large" @click="setPurchased(i)">
              <template v-if="i.state != 'purchased'">
                <sl-icon class="font-xl" slot="suffix" name="cart-check"></sl-icon>
                Habe ich gekauft
              </template>
              <template v-else>
                <sl-icon class="font-xl" slot="suffix" name="cart-dash"></sl-icon>
                Doch nicht gekauft
              </template>
            </sl-button>
          </sl-button-group>
        </footer>
      </sl-details>
    </section>
    <section v-if="admin" class="mb-xxxl">
      <h2>
        <sl-icon class="font-xl" name="share"></sl-icon>
        Teile deine Wunschliste
      </h2>
      Den öffentlichen Link deiner Wunschliste kannst du hier kopieren und versenden.
      <pre>{{ publicLink }}</pre><br>
    </section>
    <section v-if="admin" class="mb-xxxl">
      <h2>
        <sl-icon class="font-xl" name="shield-lock"></sl-icon>
        Verwalte deine Wunschliste
      </h2>
      Bitte bewahre den geheimen Link deiner Wunschliste auf, sodass du später noch Änderungen vornehmen kannst.
      Dieser Link sollte nicht geteilt werden!
      <pre>{{ privateLink }}</pre>
    </section>
  </div>
  <div v-else>
    Diese Liste existiert nicht mehr oder der Link ist ungültig.
   <router-link to="/">Neustart</router-link>
  </div>
</template>

<script>
// import partials
import Logo from './partials/Logo'

export default {
  name: 'App',
  components: { Logo },
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
      i.links = item.links.join('\n')
      this.input = i
      this.mode = 'UPDATE'
      this.target = i.id
    },
    // set item state to reserved
    async setReserved (item) {
      item.state = item.state == 'reserved' ? 'open' : 'reserved'
      await this.$supabase.from('items').update([ item ]).match({ id: item.id })
    },
    // set item state to purchased
    async setPurchased (item) {
      item.state = item.state == 'purchased' ? 'open' : 'purchased'
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
        list: null
      }
    },
    // processed input object
    processedInput () {
      return {
        title: this.input.title,
        description: this.input.description,
        links: this.input.links.split('\n').map(l => l.trim()),
        list: this.list.id
      }
    },
    // return base url
    baseUrl () {
      return document.baseURI.substring(0, document.baseURI.indexOf('/', 7))
    },
    // return complete public link for sharing
    publicLink () {
      return this.baseUrl + '/' + this.$route.params.public
    },
    // return complete private link for administration
    privateLink () {
      return this.baseUrl + '/' + this.$route.params.public + '/' + this.$route.params.private
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
.item
  border-top-left-radius: var(--sl-border-radius-medium)
  &[reserved=true]
    background: linear-gradient(135deg, var(--sl-color-gray-500) 0%, var(--sl-color-gray-500) 24px, transparent 24px);
    h3
      color: var(--sl-color-gray-400)
  &[purchased=true]
    background: linear-gradient(135deg, var(--sl-color-primary-500) 0%, var(--sl-color-primary-500) 24px, transparent 24px);
    h3
      color: var(--sl-color-gray-400)
      text-decoration: line-through
      
</style>
