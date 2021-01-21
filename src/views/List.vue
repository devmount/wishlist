<template>
  <div v-if="loading">
    <header class="content-center mb-xxxl">
      <Logo />
      <div class="mt-xxl">
        <sl-spinner class="font-xxxl"></sl-spinner>
      </div>
    </header>
  </div>
  <div v-else-if="list && list.id">
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
      <sl-textarea class="grow-1 mb-m" v-model="input.links" placeholder="Link Adressen zum Artikel (ein Link pro Zeile)" rows="1" resize="auto"></sl-textarea>
      <sl-button v-if="mode=='UPDATE'" type="primary" size="large" @click="syncItem()">
          <sl-icon class="font-xl" slot="suffix" name="pencil"></sl-icon>
          Wunsch anpassen
      </sl-button>
      <sl-button v-else type="primary" size="large" @click="syncItem()">
          <sl-icon class="font-xl" slot="suffix" name="plus"></sl-icon>
          Wünschen
      </sl-button>
    </section>
    <section ref="wishlist" class="mb-xxxl">
      <sl-details
        class="item mb-xxs"
        v-for="(i, n) in items"
        :key="i.id"
        :reserved="i.state == 'reserved' && allowed"
        :purchased="i.state == 'purchased' && allowed"
        @click="closeOtherItems(n)"
      >
        <!-- item title and flag -->
        <header slot="summary" class="d-flex align-items-center gap-m">
          <sl-icon v-if="i.state == 'purchased' && allowed" name="check-circle" class="font-xl"></sl-icon>
          <sl-icon v-else-if="i.state == 'reserved' && allowed" name="exclamation-circle" class="font-xl"></sl-icon>
          <sl-icon v-else name="circle" class="font-xl"></sl-icon>
          <h3 class="m-none">{{ i.title }}</h3>
          <sl-badge v-if="i.state == 'reserved' && allowed" type="info">RESERVIERT</sl-badge>
          <sl-badge v-if="i.state == 'purchased' && allowed" type="primary">GEKAUFT</sl-badge>
        </header>
        <!-- item information -->
        <main class="d-grid gap-m two-col mb-m">
          <div class="d-flex-column justify-space-between gap-m">
            {{ i.description }}
            <div class="font-xs text-gray">
              Erstellt am <sl-format-date :date="i.created" month="long" day="numeric" year="numeric" locale="de"></sl-format-date><br>
              Letzte Aktivität <sl-relative-time :date="i.modified" locale="de"></sl-relative-time>
            </div>
          </div>
          <div>
            Hier kann man das kaufen:
            <a class="d-flex align-items-center mt-xxs" v-for="l in i.links" :href="l" target="_blank">
              <sl-icon name="link-45deg" class="shrink-0 font-l mt-xxxs mr-xs"></sl-icon>
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
            <sl-button type="info" size="large" @click="confirmReserved(i)">
              <template v-if="i.state != 'reserved'">
                <sl-icon class="font-xl" slot="suffix" name="patch-exclamation"></sl-icon>
                Reserviere ich
              </template>
              <template v-else>
                <sl-icon class="font-xl" slot="suffix" name="patch-minus"></sl-icon>
                Doch nicht reserviert
              </template>
            </sl-button>
            <sl-button type="primary" size="large" @click="confirmPurchased(i)">
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
      <div class="d-flex align-items-center">
        <pre class="grow-1">{{ publicLink }}</pre>
        <sl-button-group>
          <sl-button class="font-xl" size="medium" @click="copyToClipboard(publicLink)">
            <sl-icon name="clipboard-plus"></sl-icon>
          </sl-button>
          <sl-button class="font-xl" size="medium" @click="sendEmail(publicLink)">
            <sl-icon name="envelope"></sl-icon>
          </sl-button>
        </sl-button-group>
      </div>
    </section>
    <section v-if="admin" class="mb-xxxl">
      <h2>
        <sl-icon class="font-xl" name="shield-lock"></sl-icon>
        Verwalte deine Wunschliste
      </h2>
      Bitte bewahre den geheimen Link deiner Wunschliste auf, sodass du später noch Änderungen vornehmen kannst.
      Dieser Link sollte nicht geteilt werden!
      <div class="d-flex align-items-center">
        <pre class="grow-1">{{ privateLink }}</pre>
        <sl-button class="font-xl" size="medium" @click="copyToClipboard(privateLink)">
          <sl-icon name="clipboard-plus"></sl-icon>
        </sl-button>
      </div>
    </section>
    <section class="content-center font-xs text-gray">
      Diese Wunschliste wurde <sl-relative-time :date="list.created" locale="de"></sl-relative-time>
      am <sl-format-date :date="list.created" month="long" day="numeric" year="numeric" locale="de"></sl-format-date> erstellt
    </section>
    <div class="admin p-fixed-top-right">
      <sl-button v-if="admin" type="text" @click="this.$refs.drawer.show()">
        <sl-icon class="font-xxl" name="list"></sl-icon>
      </sl-button>
    </div>
    <!-- list administration area -->
    <sl-drawer ref="drawer" label="Administration">
      <h3>Bearbeite deine Wunschliste</h3>
      <div v-if="list && list.id" class="d-flex-column gap-m mb-m">
        <sl-input type="text" :value="list.title" @input="list.title = $event.target.value" placeholder="Titel"></sl-input>
        <sl-textarea :value="list.description" @input="list.description = $event.target.value" placeholder="Beschreibung" rows="3" resize="auto"></sl-textarea>
      </div>
      <sl-button type="primary" size="large" @click="syncList()">
          <sl-icon class="font-xl" slot="suffix" name="pencil"></sl-icon>
          Wunschliste anpassen
      </sl-button>
      <h3 class="mt-xxl">Spoiler</h3>
      <p>Wenn aktiviert, werden alle Reservierungen und Käufe auch in der Verwaltungsansicht der Wunschliste (geheimer Link) angezeigt.</p>
      <sl-switch style="--width: 80px; --height: 32px; --thumb-size: 26px;" :value="list.spoiler" @input="list.spoiler = !list.spoiler" :checked="list.spoiler"></sl-switch>
    </sl-drawer>
    <!-- item state handling dialog -->
    <sl-dialog ref="dialog">
      <div slot="label">
        <span v-if="dialog.action == 'reserve' && dialog.item.state != 'reserved'">Möchtest du reservieren?</span>
        <span v-if="dialog.action == 'reserve' && dialog.item.state == 'reserved'">Möchtest du die Reservierung aufheben?</span>
        <span v-if="dialog.action == 'purchase' && dialog.item.state != 'purchased'">Als gekauft markieren?</span>
        <span v-if="dialog.action == 'purchase' && dialog.item.state == 'purchased'">Den Kauf stornieren?</span>
      </div>
      <div v-if="dialog.action == 'reserve'">
        <span v-if="dialog.item.state != 'reserved'">
          Damit markierst du den Wunsch «{{ dialog.item.title }}» für jeden sichtbar als reserviert.
        </span>
        <span v-if="dialog.item.state == 'reserved'">
          Damit entfernst du die Reservierung für den Wunsch «{{ dialog.item.title }}»
          und er wird für jeden wieder als verfügbar angezeigt.
        </span>
      </div>
      <div v-if="dialog.action == 'purchase'">
        <span v-if="dialog.item.state != 'purchased'">
          Damit markierst du den Wunsch «{{ dialog.item.title }}» für jeden sichtbar als gekauft.
        </span>
        <span v-if="dialog.item.state == 'purchased'">
          Damit ist der Wunsch «{{ dialog.item.title }}» nicht mehr als gekauft markiert
          und er wird für jeden wieder als verfügbar angezeigt.
        </span>
      </div>
      <div slot="footer">
        <sl-button type="default" @click="$refs.dialog.hide()" class="mr-s" size="large">Lieber nicht</sl-button>
        <sl-button v-if="dialog.action == 'reserve'" type="info" size="large" @click="toggleReserved(dialog.item)">
          <span v-if="dialog.item.state != 'reserved'">Ja, bitte reservieren</span>
          <span v-if="dialog.item.state == 'reserved'">Ja, Reservierung aufheben</span>
        </sl-button>
        <sl-button v-if="dialog.action == 'purchase'" type="primary" size="large" @click="togglePurchased(dialog.item)">
          <span v-if="dialog.item.state != 'purchased'">Ja, hab ich gekauft</span>
          <span v-if="dialog.item.state == 'purchased'">Ja, der Kauf hat nicht geklappt</span>
        </sl-button>
      </div>
    </sl-dialog>
  </div>
  <div v-else>
    <header class="content-center mb-xxxl">
      <Logo />
      <h1>Was zum ... ?</h1>
      <p>
        Diese Liste existiert nicht mehr oder der Link ist ungültig.
        Bitte prüfe den Link oder frage bei der Person nach, die ihn dir geschickt hat.
        Wenn alles nichts hilft, <router-link to="/">starte von vorn</router-link>.
      </p>
    </header>
  </div>
</template>

<script>
// import partials
import Logo from './partials/Logo'

export default {
  name: 'App',
  components: { Logo },
  data: () => ({
    loading: true,
    list: null,
    items: [],
    input: {},
    mode: 'INSERT',
    target: null,
    dialog: {
      item: null,
      action: '' // [reserve | purchase]
    }
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
    // finished loading
    this.loading = false
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
    // edit list
    async syncList () {
      await this.$supabase
        .from('lists')
        .update({ title: this.list.title, description: this.list.description })
        .match({ id: this.list.id })
    },
    // retrieve list of item objects
    async getItems () {
      if (this.list && this.list.id) {
        let { data: items, error } = await this.$supabase.from('items').select('*').filter('list', 'eq', this.list.id)
        this.items = items.sort((a,b) => a.created < b.created)
      }
    },
    // store new or edit existing item
    async syncItem () {
      switch (this.mode) {
        case 'INSERT':
          await this.$supabase.from('items').insert([ this.processedInput ])
          break
        case 'UPDATE':
          await this.$supabase.from('items').update([ this.processedInput ]).match({ id: this.target })
          break
        default: break
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
    // open dialog for reservation confirmation
    confirmReserved (item) {
      this.dialog.item = item
      this.dialog.action = 'reserve'
      this.$refs.dialog.show()
    },
    // set item state to reserved or open and close dialog
    async toggleReserved (item) {
      let state = item.state == 'reserved' ? 'open' : 'reserved'
      await this.$supabase.from('items').update({ state: state }).match({ id: item.id })
      this.$refs.dialog.hide()
    },
    // open dialog for purchase confirmation
    confirmPurchased (item) {
      this.dialog.item = item
      this.dialog.action = 'purchase'
      this.$refs.dialog.show()
    },
    // set item state to purchased or open
    async togglePurchased (item) {
      let state = item.state == 'purchased' ? 'open' : 'purchased'
      await this.$supabase.from('items').update({ state: state }).match({ id: item.id })
      this.$refs.dialog.hide()
    },
    // delete existing item
    async deleteItem (id) {
      await this.$supabase.from('items').delete().match({ id: id })
    },
    // copy given text to system clipboard
    copyToClipboard (text) {
      navigator.clipboard.writeText(text)
    },
    // send given text as body content in new email
    sendEmail (text) {
      window.location = "mailto:?subject=Meine Wunschliste: " + this.list.title + "&body=" + text
    },
    closeOtherItems (index) {
      [...this.$refs.wishlist.querySelectorAll('sl-details')].map((item, position) => {
        if (position != index) {
          item.open = false
        }
      })
    }
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
      return this.$route.params.private && this.list.slug_private === this.$route.params.private
    },
    // check if public token is given and correct
    visitor () {
      return this.$route.params.public && this.list.slug_public === this.$route.params.public && !this.$route.params.private
    },
    // approve if something is allowed to be shown
    allowed () {
      return this.visitor || this.list.spoiler
    }
  },
  watch: {
    async $route (to, from) {
      await this.getList()
      await this.getItems()
    },
    'list.spoiler': async function (newVal, oldVal) {
      await this.$supabase.from('lists').update({ spoiler: newVal }).match({ id: this.list.id })
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
