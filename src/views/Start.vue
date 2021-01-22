<template>
  <header class="content-center">
    <Logo />
    <h1>Wunschliste</h1>
  </header>
  <section class="mb-xxxl">
    <h2>
      <sl-icon class="font-xl" name="lightning"></sl-icon>
      Starte eine neue Liste
    </h2>
    <sl-form class="form-overview">
      <sl-input class="mb-m" type="text" :value="input.title" @input="input.title = $event.target.value" placeholder="Titel"></sl-input>
      <sl-textarea class="mb-m" :value="input.description" @input="input.description = $event.target.value" placeholder="Beschreibung" rows="1" resize="auto"></sl-textarea>
      <sl-button type="primary" size="large" @click="addList()">
        <sl-icon slot="suffix" name="caret-right-fill"></sl-icon>
        Los geht's
      </sl-button>
    </sl-form>
  </section>
  <section>
    <h2>
      <sl-icon class="font-xl" name="list-nested"></sl-icon>
      Zuletzt erstellt
    </h2>
    <p>
      Zur Erinnerung sind hier die von dir angelegten Listen aufgeführt.
      Diese Einträge sind nur auf diesem Gerät und in diesem Browser sichtbar, du kannst sie löschen, wenn du sie nicht mehr brauchst
      (die Wunschlisten selbst werden dadurch nicht gelöscht).
    </p>
    <div v-if="localLists.length>0" class="d-flex gap-m flex-wrap justify-space-between">
      <sl-card v-for="(l, i) in localLists" :key="i">
        Erstellt <sl-relative-time :date="l.ts" locale="de"></sl-relative-time><br />
        am <sl-format-date :date="l.ts" month="long" day="numeric" year="numeric" locale="de"></sl-format-date>
        <div slot="footer" class="font-xl">
          <sl-tooltip content="Eintrag löschen" placement="bottom">
            <sl-button type="danger" size="large" @click="removeLocalListEntry(i)">
              <sl-icon name="trash"></sl-icon>
            </sl-button>
          </sl-tooltip>
          <sl-button-group class="ml-m">
            <sl-tooltip content="Geteilte Ansicht" placement="bottom">
              <sl-button type="default" size="large" @click="$router.push({ name: 'public', params: { public: l.pu }})">
                <sl-icon name="share"></sl-icon>
              </sl-button>
            </sl-tooltip>
            <sl-tooltip content="Liste bearbeiten" placement="bottom">
              <sl-button type="default" size="large" @click="$router.push({ name: 'private', params: { public: l.pu, private: l.pr }})">
                <sl-icon name="pencil"></sl-icon>
              </sl-button>
            </sl-tooltip>
          </sl-button-group>
        </div>
      </sl-card>
    </div>
    <div v-else>
      Momentan sind hier keine Listen gespeichert.
    </div>
  </section>
</template>

<script>
// import partials
import Logo from './partials/Logo'

export default {
  name: 'App',
  components: { Logo },
  data: () => ({
    input: {
      title: '',
      description: '',
    },
    localLists: []
  }),
  created () {
    this.getLocalListEntries()
  },
  methods: {
    // get all existing lists from local storage
    getLocalListEntries () {
      this.localLists = JSON.parse(localStorage.wishlists || null) || []
    },
    // store new list in database
    async addList () {
      const slugPublic = this.generateSlug(10)
      const slugPrivate = this.generateSlug(16)
      const { data, error } = await this.$supabase.from('lists').insert({
        'title': this.input.title,
        'description': this.input.description,
        'slug_public': slugPublic,
        'slug_private': slugPrivate,
      })
      if (!error) {
        this.storeLocalListEntry(data[0])
        this.$router.push('/' + slugPublic + '/' + slugPrivate)
      }
    },
    // store added <list> in local storage
    storeLocalListEntry (list) {
      let obj = {
        ts: list.created,
        pu: list.slug_public,
        pr: list.slug_private,
      }
      this.localLists.push(obj)
      localStorage.wishlists = JSON.stringify(this.localLists)
    },
    // remove list stored at <index> from local list and local storage
    removeLocalListEntry (index) {
      this.localLists.splice(index, 1)
      localStorage.wishlists = JSON.stringify(this.localLists)
    },
    // get random slug string
    generateSlug (length) {
      const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
      let result = ''
      for (let i = length; i>0; --i) result += chars[Math.round(Math.random()*(chars.length-1))]
      return result
    }
  }
}
</script>

<style lang="stylus">
</style>
