<template>
  <header class="content-center">
    <Logo />
    <h1>Wunschliste</h1>
  </header>
  <section class="mb-3xl">
    <h2>
      <sl-icon class="font-xl" name="lightning"></sl-icon>
      Starte eine neue Liste
    </h2>
    <p>
      Gib einen kurzen Titel für deine Wunschliste an und wähle einen Farbakzent, an dem man deine Liste erkennt.
      Optional kannst du den Beschreibungstext nutzen, um die Besucher deiner Wunschliste zu informieren,
      was dir beim Schenken wichtig ist.
    </p>
    <form @submit.prevent="addList()" class="content-center">
      <div class="d-flex gap-m mb-m">
        <sl-input
          ref="input-title"
          class="check-input grow-1"
          type="text"
          :value="input.title"
          @input="input.title = $event.target.value"
          placeholder="Titel der Liste"
          autocomplete="title"
          required
        ></sl-input>
        <sl-color-picker
          format="hex"
          :value="input.color"
          @sl-change="input.color = $event.target.value"
        ></sl-color-picker>
      </div>
      <sl-textarea
        class="mb-m"
        :value="input.description"
        @input="input.description = $event.target.value"
        placeholder="Beschreibung (optional)"
        rows="1"
        resize="auto"
      ></sl-textarea>
      <sl-button type="submit" variant="primary" size="medium">
        <sl-icon class="font-l" slot="suffix" name="arrow-right"></sl-icon>
        Los geht's
      </sl-button>
    </form>
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
    <div v-if="localLists.length>0" class="d-flex gap-m flex-wrap">
      <sl-card v-for="(l, i) in localLists" :key="i">
        Erstellt <sl-relative-time :date="l.ts" locale="de"></sl-relative-time><br />
        am <sl-format-date :date="l.ts" month="long" day="numeric" year="numeric" locale="de"></sl-format-date>
        <div slot="footer" class="font-xl">
          <sl-tooltip content="Eintrag löschen" placement="bottom">
            <sl-button variant="danger" size="large" @click="removeLocalListEntry(i)">
              <sl-icon name="trash"></sl-icon>
            </sl-button>
          </sl-tooltip>
          <sl-button-group class="ml-m">
            <sl-tooltip content="Geteilte Ansicht" placement="bottom">
              <sl-button variant="default" size="large" @click="$router.push({ name: 'public', params: { public: l.pu }})">
                <sl-icon name="share"></sl-icon>
              </sl-button>
            </sl-tooltip>
            <sl-tooltip content="Liste bearbeiten" placement="bottom">
              <sl-button variant="default" size="large" @click="$router.push({ name: 'private', params: { public: l.pu, private: l.pr }})">
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
import { inject } from 'vue';
import { getAllFromStorage, addToStorage, removeFromStorage } from "@/storage";

// import partials
import Logo from '@/views/partials/Logo.vue';

export default {
  name: 'App',
  components: { Logo },
  setup () {
    const supabase = inject('supabase');
    return { supabase }
  },
  data: () => ({
    input: {
      title: '',
      color: '#0ea5e9',
      description: '',
    },
    localLists: []
  }),
  created () {
    this.localLists = getAllFromStorage();
  },
  methods: {
    // store new list in database
    async addList () {
      if (this.input.title) {
        const slugPublic = this.generateSlug(10)
        const slugPrivate = this.generateSlug(16)
        const { data, error } = await this.supabase.from('lists').insert({
          'title': this.input.title,
          'color': this.input.color,
          'description': this.input.description,
          'slug_public': slugPublic,
          'slug_private': slugPrivate,
        }).select()
        if (!error) {
          if (obj = addToStorage(data[0])) {
            this.localLists.push(obj);
          }
          // workaround for race condition in vue router
          setTimeout(() => {
            this.$router.push({ name: 'private', params: { public: slugPublic, private: slugPrivate }})
          }, 100);
        }
      }
    },
    // remove list stored at <index> from local list and local storage
    removeLocalListEntry (index) {
      removeFromStorage(this.localLists[index])
      this.localLists.splice(index, 1)
    },
    // get random slug string
    generateSlug (length) {
      const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
      let result = ''
      for (let i = length; i>0; --i) {
        result += chars[Math.round(Math.random()*(chars.length-1))];
      }
      return result
    }
  }
}
</script>
