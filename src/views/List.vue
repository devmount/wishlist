<template>
  <div v-if="loading">
    <header class="content-center mb-3xl">
      <Logo @click="$router.push({ name: 'start' })" class="c-pointer" />
      <div class="mt-2xl">
        <sl-spinner class="font-3xl"></sl-spinner>
      </div>
    </header>
  </div>
  <div v-else-if="list && list.id">
    <header class="content-center mb-3xl">
      <Logo @click="$router.push({ name: 'start' })" :style="{ color: accent }" class="c-pointer" />
      <h1>{{ list.title }}</h1>
      <hr :style="{ background: accent }" /> 
      <p>{{ list.description }}</p>
    </header>
    <section v-if="admin" class="mb-3xl">
      <h2>
        <sl-icon class="font-xl" name="bag-plus"></sl-icon>
        Füge einen Wunsch hinzu
      </h2>
      <form @submit.prevent="syncItem()">
        <div class="d-flex flex-wrap gap-m mb-m">
          <sl-input
            ref="input-item-title"
            class="check-input grow-5"
            type="text"
            :value="input.item.data.title"
            @sl-change="input.item.data.title = $event.target.value"
            placeholder="Titel"
            required
          ></sl-input>
          <sl-input
            class="grow-1"
            type="text"
            :value="input.item.data.price"
            @sl-change="input.item.data.price = $event.target.value"
            placeholder="Preis (optional)"
          ></sl-input>
        </div>
        <sl-textarea
          class="grow-1 mb-m"
          type="text"
          :value="input.item.data.description"
          @sl-change="input.item.data.description = $event.target.value"
          placeholder="Beschreibung (optional)"
          rows="1"
          resize="auto"
        ></sl-textarea>
        <sl-textarea
          class="check-input grow-1 mb-m"
          :value="input.item.data.links"
          @sl-change="input.item.data.links = $event.target.value"
          placeholder="Link Adressen zum Artikel (ein Link pro Zeile)"
          rows="1"
          resize="auto"
        ></sl-textarea>
        <div class="d-flex justify-end gap-m">
          <sl-button v-if="input.item.mode=='UPDATE'" variant="default" size="large" @click="resetItemInput()">
            <sl-icon class="font-xl" slot="suffix" name="arrow-return-left"></sl-icon>
            Lieber nicht ändern
          </sl-button>
          <sl-button v-if="input.item.mode=='UPDATE'" type="submit" variant="primary" size="large">
            <sl-icon class="font-xl" slot="suffix" name="pencil"></sl-icon>
            Wunsch anpassen
          </sl-button>
          <sl-button v-if="input.item.mode=='INSERT'" type="submit" variant="primary" size="large">
            <sl-icon class="font-xl" slot="suffix" name="plus"></sl-icon>
            Wünschen
          </sl-button>
        </div>
      </form>
    </section>
    <section ref="wishlist" class="mb-3xl">
      <sl-details
        class="item mb-2xs"
        v-for="(i, n) in items"
        :key="i.id"
        :reserved="i.state == 'reserved' && allowed"
        :purchased="i.state == 'purchased' && allowed"
        @sl-show="closeOtherItems(n)"
      >
        <!-- item title and flag -->
        <header slot="summary" class="d-flex align-items-center gap-m width-full">
          <sl-icon v-if="i.state == 'purchased' && allowed" name="check-circle" class="font-xl shrink-0"></sl-icon>
          <sl-icon v-else-if="i.state == 'reserved' && allowed" name="exclamation-circle" class="font-xl"></sl-icon>
          <sl-icon v-else name="circle" class="font-xl"></sl-icon>
          <h3 class="m-0" :title="i.title">{{ i.title }}</h3>
          <sl-badge v-if="i.state == 'reserved' && allowed" variant="neutral">RESERVIERT</sl-badge>
          <sl-badge v-if="i.state == 'purchased' && allowed" variant="primary">GEKAUFT</sl-badge>
          <div v-if="i.price" class="ml-auto mr-m text-mono">
            <sl-icon name="tag" class="content-middle"></sl-icon>
            {{ i.price }}
          </div>
        </header>
        <!-- item information -->
        <main class="d-grid gap-m two-col mb-m">
          <div class="d-flex-column justify-space-between gap-m">
            {{ i.description }}
            <div class="font-xs text-gray">
              Erstellt am <sl-format-date :date="i.created" month="long" day="numeric" year="numeric" lang="de"></sl-format-date><br>
              Letzte Aktivität <sl-relative-time :date="i.modified" lang="de"></sl-relative-time>
            </div>
          </div>
          <div v-if="i.links?.length">
            Hier kann man das kaufen:
            <a class="d-flex align-items-center mt-2xs" v-for="l in i.links" :href="l" target="_blank">
              <sl-icon name="link-45deg" class="shrink-0 font-l mt-3xs mr-xs"></sl-icon>
              <span class="text-overflow-ellipsis">{{ l }}</span>
            </a>
          </div>
          <div v-else>
            Für diesen Wunsch sind keine Links hinterlegt.
          </div>
        </main>
        <!-- flag and manage item -->
        <footer class="d-flex justify-end flex-wrap gap-m">
          <sl-button v-if="admin" variant="danger" size="large" @click="confirmRemoval(i)">
            <sl-icon name="trash"></sl-icon>
          </sl-button>
          <sl-button v-if="admin" class="mr-auto" variant="primary" size="large" @click="editItem(i)">
            <sl-icon name="pencil"></sl-icon>
          </sl-button>
          <sl-button-group>
            <sl-button v-if="i.state != 'reserved'" variant="neutral" size="large" @click="confirmReserved(i)">
              <sl-icon class="font-xl" slot="suffix" name="patch-exclamation"></sl-icon>
              Reserviere ich
            </sl-button>
            <sl-button v-else variant="neutral" size="large" @click="confirmReserved(i)">
              <sl-icon class="font-xl" slot="suffix" name="patch-minus"></sl-icon>
              Doch nicht reserviert
            </sl-button>
            <sl-button v-if="i.state != 'purchased'" variant="primary" size="large" @click="confirmPurchased(i)">
                <sl-icon class="font-xl" slot="suffix" name="cart-check"></sl-icon>
                Habe ich gekauft
            </sl-button>
            <sl-button v-else variant="primary" size="large" @click="confirmPurchased(i)">
              <sl-icon class="font-xl" slot="suffix" name="cart-dash"></sl-icon>
              Doch nicht gekauft
            </sl-button>
          </sl-button-group>
        </footer>
      </sl-details>
    </section>
    <section v-if="admin" class="mb-3xl">
      <h2>
        <sl-icon class="font-xl" name="share"></sl-icon>
        Teile deine Wunschliste
      </h2>
      Den öffentlichen Link deiner Wunschliste kannst du hier kopieren und versenden.
      <div class="d-flex align-items-center">
        <pre class="grow-1">{{ publicLink }}</pre>
        <sl-button-group>
          <sl-tooltip content="Kopiert!" trigger="click" ref="public-copied">
            <sl-button class="font-xl" size="medium" @click="copyToClipboard(publicLink, $refs['public-copied'])">
              <sl-icon name="clipboard-plus"></sl-icon>
            </sl-button>
          </sl-tooltip>
          <sl-button class="font-xl" size="medium" @click="sendEmail(publicLink)">
            <sl-icon name="envelope"></sl-icon>
          </sl-button>
        </sl-button-group>
      </div>
    </section>
    <section v-if="admin" class="mb-3xl">
      <h2>
        <sl-icon class="font-xl" name="shield-lock"></sl-icon>
        Verwalte deine Wunschliste
      </h2>
      Bitte bewahre den geheimen Link deiner Wunschliste auf, sodass du später noch Änderungen vornehmen kannst.
      Dieser Link sollte nicht geteilt werden!
      <div class="d-flex align-items-center">
        <pre class="grow-1">{{ privateLink }}</pre>
        <sl-tooltip content="Kopiert!" trigger="click" ref="private-copied">
          <sl-button class="font-xl" size="medium" @click="copyToClipboard(privateLink, $refs['private-copied'])">
            <sl-icon name="clipboard-plus"></sl-icon>
          </sl-button>
        </sl-tooltip>
      </div>
    </section>
    <section class="content-center font-xs text-gray">
      Diese Wunschliste wurde <sl-relative-time :date="list.created" lang="de"></sl-relative-time>
      am <sl-format-date :date="list.created" month="long" day="numeric" year="numeric" lang="de"></sl-format-date> erstellt
    </section>
    <!-- admin area trigger -->
    <div class="admin p-fixed-top-right">
      <div v-if="admin" class="menu" @click="$refs.drawer.show()">
        <sl-icon class="font-3xl" name="list"></sl-icon>
      </div>
    </div>
    <!-- admin area for list -->
    <sl-drawer ref="drawer" label="Administration">
      <h3>Bearbeite deine Wunschliste</h3>
      <form @submit.prevent="syncList()">
        <div v-if="list && list.id" class="d-flex-column gap-m mb-m">
          <div class="d-flex gap-m">
            <sl-input
              class="check-input grow-1"
              ref="input-list-title"
              type="text"
              :value="input.list.title"
              @input="input.list.title = $event.target.value"
              placeholder="Titel der Liste"
              required
            ></sl-input>
            <sl-color-picker
              format="hex"
              :value="input.list.color"
              @sl-change="input.list.color = $event.target.value"
            ></sl-color-picker>
          </div>
          <sl-textarea
            :value="input.list.description"
            @input="input.list.description = $event.target.value"
            placeholder="Beschreibung (optional)"
            rows="3"
            resize="auto"
          ></sl-textarea>
        </div>
        <sl-button type="submit" variant="primary" size="large">
            <sl-icon class="font-xl" slot="suffix" name="pencil"></sl-icon>
            Speichern
        </sl-button>
      </form>
      <h3 class="mt-2xl">Spoiler</h3>
      <p>Wenn aktiviert, werden alle Reservierungen und Käufe auch in der Verwaltungsansicht der Wunschliste (geheimer Link) angezeigt.</p>
      <sl-switch @sl-change="list.spoiler = !list.spoiler" v-model="list.spoiler"></sl-switch>
    </sl-drawer>
    <!-- dialog: item state handling reservation -->
    <sl-dialog ref="dialog-reserve">
      <div slot="label">
        <span v-if="dialog.item && dialog.item.state != 'reserved'">Möchtest du reservieren?</span>
        <span v-if="dialog.item && dialog.item.state == 'reserved'">Möchtest du die Reservierung aufheben?</span>
      </div>
      <div v-if="dialog.item && dialog.item.state != 'reserved'">
        Damit markierst du den Wunsch «{{ dialog.item.title }}» für jeden sichtbar als reserviert.
      </div>
      <div v-if="dialog.item && dialog.item.state == 'reserved'">
        Damit entfernst du die Reservierung für den Wunsch «{{ dialog.item.title }}»
        und er wird für jeden wieder als verfügbar angezeigt.
      </div>
      <div slot="footer">
        <sl-button variant="default" @click="$refs['dialog-reserve'].hide()" class="mr-s" size="large">
          <sl-icon class="font-xl" slot="suffix" name="arrow-return-left"></sl-icon>
          Lieber nicht
        </sl-button>
        <sl-button v-if="dialog.item && dialog.item.state != 'reserved'" variant="neutral" size="large" @click="toggleReserved(dialog.item)">
          <sl-icon class="font-xl" slot="suffix" name="patch-exclamation"></sl-icon>
          Ja, bitte reservieren
        </sl-button>
        <sl-button v-if="dialog.item && dialog.item.state == 'reserved'" variant="neutral" size="large" @click="toggleReserved(dialog.item)">
          <sl-icon class="font-xl" slot="suffix" name="patch-minus"></sl-icon>
          Ja, Reservierung aufheben
        </sl-button>
      </div>
    </sl-dialog>
    <!-- dialog: item state handling reservation -->
    <sl-dialog ref="dialog-purchase">
      <div slot="label">
        <span v-if="dialog.item && dialog.item.state != 'purchased'">Als gekauft markieren?</span>
        <span v-if="dialog.item && dialog.item.state == 'purchased'">Den Kauf stornieren?</span>
      </div>
      <div v-if="dialog.item && dialog.item.state != 'purchased'">
        Damit markierst du den Wunsch «{{ dialog.item.title }}» für jeden sichtbar als gekauft.
      </div>
      <div v-if="dialog.item && dialog.item.state == 'purchased'">
        Damit ist der Wunsch «{{ dialog.item.title }}» nicht mehr als gekauft markiert
        und er wird für jeden wieder als verfügbar angezeigt.
      </div>
      <div slot="footer">
        <sl-button variant="default" @click="$refs['dialog-purchase'].hide()" class="mr-s" size="large">
          <sl-icon class="font-xl" slot="suffix" name="arrow-return-left"></sl-icon>
          Lieber nicht
        </sl-button>
        <sl-button v-if="dialog.item && dialog.item.state != 'purchased'" variant="primary" size="large" @click="togglePurchased(dialog.item)">
          <sl-icon class="font-xl" slot="suffix" name="cart-check"></sl-icon>
          Ja, hab ich gekauft
        </sl-button>
        <sl-button v-if="dialog.item && dialog.item.state == 'purchased'" variant="primary" size="large" @click="togglePurchased(dialog.item)">
          <sl-icon class="font-xl" slot="suffix" name="cart-dash"></sl-icon>
          Ja, der Kauf hat nicht geklappt
        </sl-button>
      </div>
    </sl-dialog>
    <!-- dialog: item removal -->
    <sl-dialog ref="dialog-delete">
      <div slot="label">
        Diesen Wunsch löschen?
      </div>
      <div v-if="dialog.item">
        Damit entfernst den Wunsch «{{ dialog.item.title }}». Dieses Aktion kann nicht rückgängig gemacht werden.
      </div>
      <div slot="footer">
        <sl-button variant="default" @click="$refs['dialog-delete'].hide()" class="mr-s" size="large">
          <sl-icon class="font-xl" slot="suffix" name="arrow-return-left"></sl-icon>
          Lieber nicht
        </sl-button>
        <sl-button variant="danger" size="large" @click="deleteItem(dialog.item)">
          <sl-icon class="font-xl" slot="suffix" name="trash"></sl-icon>
          Ja, kann weg
        </sl-button>
      </div>
    </sl-dialog>
  </div>
  <div v-else>
    <header class="content-center mb-3xl">
      <Logo />
      <h1>Was zum ... ?</h1>
      <p>
        Diese Liste existiert nicht mehr oder der Link ist ungültig.
        Bitte prüfe den Link oder frage bei der Person nach, die ihn dir geschickt hat.
        Wenn alles nichts hilft, <router-link :to="{ name: 'start' }">starte von vorn</router-link>.
      </p>
    </header>
  </div>
</template>

<script>
import { inject } from 'vue';
import { addToStorage } from "@/storage";

// import partials
import Logo from '@/views/partials/Logo.vue';

export default {
  name: 'App',
  components: { Logo },
  setup () {
    const supabase = inject('supabase');
    return { supabase };
  },
  data: () => ({
    loading: true,
    list: null,
    items: [],
    // input: {},
    input: {
      item: {
        data: {},
        mode: '', // 'INSERT' | 'UPDATE'
        target: null,
      },
      list: {
        title: '',
        color: '#0ea5e9',
        description: '',
      },
    },
    dialog: {
      item: null,
      action: '' // 'reserve' | 'purchase' | 'delete
    }
  }),
  async created () {
    // Subscribe to all changes on the lists table and the items table to provide realtime experience
    this.supabase.channel('room').on(
      'postgres_changes',
      { event: '*', schema: '*' },
      async () => { await this.getList(); await this.getItems(); }
    ).subscribe();

    // Initially get all existing items
    await this.getList();
    await this.getItems();

    // Init item and list input
    this.resetItemInput();
    this.resetListInput();

    // Finished loading
    this.loading = false;

    // Set browser title
    document.title = this.admin ? 'Wishlist - admin: ' + this.list?.title : 'Wishlist - ' + this.list?.title;

    // Check for existing local storage entry and add if it's not there
    addToStorage(this.list);
  },
  unmounted () {
    // Unsubscribe from active channels
    this.supabase.removeAllChannels();
  },
  methods: {
    // retrieve list object
    async getList () {
      const { data: lists, error } = await this.supabase.from('lists').select();
      if (!error) {
        const requestedList = lists.find(l => l.slug_public == this.$route.params.public)
        this.list = requestedList ? requestedList : null
      } else {
        console.log(error)
      }
    },
    // edit list
    async syncList () {
      if (this.input.list.title) {
        const { data, error} = await this.supabase
          .from('lists')
          .update(this.input.list)
          .eq('id', this.list?.id )
          .select()
        if (!error) this.list = data[0]
        else console.log(error)
        this.$refs.drawer.hide()
      }
    },
    // reset list form
    resetListInput () {
      this.input.list.title = this.list?.title
      this.input.list.color = this.list?.color
      this.input.list.description = this.list?.description
    },
    // retrieve list of item objects
    async getItems () {
      if (this.list?.id) {
        const { data: items, error } = await this.supabase.from('items').select().filter('list', 'eq', this.list.id)
        if (!error) this.items = items.sort((a,b) => a.created < b.created)
        else console.log(error)
      }
    },
    // store new or edit existing item
    async syncItem () {
      if (this.input.item.data.title) {
        // if valid input: get and preprocess item data
        let i = JSON.parse(JSON.stringify(this.input.item.data))
        i.links = i.links ? i.links.split('\n').map(l => l.trim()) : [];
        // check if new or edited item
        switch (this.input.item.mode) {
          case 'INSERT':
            const insertResult = await this.supabase.from('items').insert(i).select()
            if (!insertResult.error) this.items.unshift(i)
            else console.log(insertResult.error)
            break
          case 'UPDATE':
            const updateResult = await this.supabase.from('items').update(i).eq('id', this.input.item.target ).select()
            if (!updateResult.error) this.items[this.getItemPosition(i.id)] = i
            else console.log(updateResult.error)
            break
          default: break
        }
        // reset form
        this.resetItemInput()
      }
    },
    // edit existing item
    editItem (item) {
      let i = JSON.parse(JSON.stringify(item))
      i.links = item.links ? item.links.join('\n') : ''
      this.input.item.data = i
      this.input.item.mode = 'UPDATE'
      this.input.item.target = i.id
    },
    // reset item form
    resetItemInput () {
      this.input.item.data = JSON.parse(JSON.stringify(this.initItem))
      this.input.item.mode = 'INSERT'
      this.input.item.target = null
    },
    // open dialog for reservation confirmation
    confirmReserved (item) {
      this.dialog.item = item
      this.dialog.action = 'reserve'
      this.$refs['dialog-reserve'].show()
    },
    // set item state to reserved or open and close dialog
    async toggleReserved (item) {
      const state = item.state == 'reserved' ? 'open' : 'reserved'
      const { data, error } = await this.supabase.from('items').update({ state: state }).eq('id', item.id ).select();
      if (!error) this.items[this.getItemPosition(data[0].id)].state = state
      else console.log(error)
      this.$refs['dialog-reserve'].hide()
    },
    // open dialog for purchase confirmation
    confirmPurchased (item) {
      this.dialog.item = item
      this.dialog.action = 'purchase'
      this.$refs['dialog-purchase'].show()
    },
    // set item state to purchased or open
    async togglePurchased (item) {
      const state = item.state == 'purchased' ? 'open' : 'purchased'
      const { data, error } = await this.supabase.from('items').update({ state: state }).eq('id', item.id ).select()
      if (!error) this.items[this.getItemPosition(data[0].id)].state = state
      else console.log(error)
      this.$refs['dialog-purchase'].hide()
    },
    // open dialog for item removal confirmation
    confirmRemoval (item) {
      this.dialog.item = item
      this.dialog.action = 'delete'
      this.$refs['dialog-delete'].show()
    },
    // delete existing item
    async deleteItem (item) {
      const deleteResult = await this.supabase.from('items').delete().match({ id: item.id })
      if (!deleteResult.error) this.items.slice(this.getItemPosition(item.id), 1)
      else console.log(error)
      this.$refs['dialog-delete'].hide()
    },
    // find current position of list item with given <id>
    getItemPosition (id) {
      return this.items.findIndex(i => i.id === id)
    },
    // copy given <text> to system clipboard
    copyToClipboard (text, message) {
      navigator.clipboard.writeText(text)
      setTimeout(() => message.hide(), 3000)
    },
    // send given text as body content in new email
    sendEmail (text) {
      window.location = "mailto:?subject=Meine Wunschliste: " + this.list?.title + "&body=" + text
    },
    // close all other list items if one is shown
    closeOtherItems (index) {
      [...this.$refs.wishlist.querySelectorAll('sl-details')].map((item, position) => (item.open = position == index))
    },
  },
  computed: {
    // initial item object
    initItem () {
      return {
        title: '',
        price: '',
        description: '',
        links: '',
        list: this.list?.id
      }
    },
    // return base url
    baseUrl () {
      return window.location.origin
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
      return this.$route.params.private && this.list?.slug_private === this.$route.params.private
    },
    // check if public token is given and correct
    visitor () {
      return this.$route.params.public && this.list?.slug_public === this.$route.params.public && !this.$route.params.private
    },
    // approve if something is allowed to be shown
    allowed () {
      return this.visitor || this.list?.spoiler
    },
    // prived accent color once list color is loaded
    accent () {
      return this.list?.color ? this.list.color : '#000000'
    }
  },
  watch: {
    async $route (to, from) {
      await this.getList()
      await this.getItems()
    },
    'list.spoiler': async function (newVal) {
      await this.supabase.from('lists').update({ spoiler: newVal }).eq('id', this.list?.id )
    }
  }
}
</script>

<style>
.item::part(header) {
  border-top-left-radius: var(--sl-border-radius-medium);
}
.item h3 {
  max-width: 55%;
}
.item[reserved=true]::part(header) {
  background: linear-gradient(135deg, var(--sl-color-gray-500) 0%, var(--sl-color-gray-500) 24px, transparent 24px);
}
.item[reserved=true] h3 {
  color: var(--sl-color-gray-400);
}
.item[purchased=true]::part(header) {
  background: linear-gradient(135deg, var(--sl-color-primary-500) 0%, var(--sl-color-primary-500) 24px, transparent 24px);
}
.item[purchased=true] h3 {
  color: var(--sl-color-gray-400);
  text-decoration: line-through;
}
.menu {
  height: var(--sl-spacing-4x-large);
  width: var(--sl-spacing-4x-large);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: color var(--sl-transition-fast) ease;
}
.menu:hover {
  color: var(--sl-color-primary-500);
}
</style>
