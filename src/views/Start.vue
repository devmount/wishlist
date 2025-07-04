<script setup lang="ts">
import { inject, onMounted, reactive, ref } from 'vue';
import { getAllFromStorage, addToStorage, removeFromStorage } from "@/storage";
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { List } from '@/types/global';
import { useRouter } from 'vue-router';

// import partials
import Logo from '@/views/partials/Logo.vue';

const router = useRouter();
const supabase = inject<SupabaseClient<Database>>('supabase');

const input = reactive({
  title: '',
  color: '#0ea5e9',
  description: '',
});
const localLists = ref<List[]>([]);

onMounted(() => {
  // Init list overview from local storage
  localLists.value = getAllFromStorage();

  // Set browser title
  document.title = 'Wishlist';
});

// Get random slug string
const generateSlug = (length: number): string => {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = length; i > 0; --i) {
    result += chars[Math.round(Math.random() * (chars.length-1))];
  }
  return result;
};

// Store new list in database
const addList = async () => {
  if (input.title) {
    const slugPublic = generateSlug(10)
    const slugPrivate = generateSlug(16)
    const { data, error } = await supabase.from('lists').insert({
      'title': input.title,
      'color': input.color,
      'description': input.description,
      'slug_public': slugPublic,
      'slug_private': slugPrivate,
    }).select();
    if (!error) {
      const obj = addToStorage(data[0]);
      if (obj) {
        localLists.value.push(obj);
      }
      // workaround for race condition in vue router
      setTimeout(() => {
        router.push({ name: 'list', params: { public: slugPublic, private: slugPrivate }});
      }, 100);
    }
  }
};

// Remove list stored at <index> from local list and local storage
const removeLocalListEntry = (index: number) => {
  if (removeFromStorage(localLists.value[index])) {
    localLists.value.splice(index, 1);
  }
};

</script>

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
      Diese Einträge sind nur auf diesem Gerät und in diesem Browser sichtbar, du kannst sie löschen, wenn du sie nicht
      mehr brauchst (die Wunschlisten selbst werden dadurch nicht gelöscht).
    </p>
    <div v-if="localLists.length>0" class="d-grid gap-m three-col">
      <sl-card
        v-for="(l, i) in localLists"
        :key="i"
        :style="{ background: `linear-gradient(135deg, ${l.color} 0%, ${l.color} 24px, transparent 24px)` }"
      >
        <div class="text-overflow-ellipsis">{{ l.title }}</div>
        <div class="font-xs">
          Erstellt <sl-relative-time :date="l.created" lang="de"></sl-relative-time>
          am <sl-format-date :date="l.created" month="long" day="numeric" year="numeric" lang="de"></sl-format-date>
        </div>
        <div slot="footer" class="font-xl d-flex justify-space-between">
          <sl-tooltip content="Eintrag löschen" placement="bottom">
            <sl-button variant="danger" size="large" @click="removeLocalListEntry(i)" outline>
              <sl-icon name="trash"></sl-icon>
            </sl-button>
          </sl-tooltip>
          <sl-button-group>
            <sl-tooltip content="Geteilte Ansicht" placement="bottom">
              <sl-button
                variant="default"
                size="large"
                @click="$router.push({ name: 'list', params: { public: l.slug_public }})"
              >
                <sl-icon name="share"></sl-icon>
              </sl-button>
            </sl-tooltip>
            <sl-tooltip content="Liste bearbeiten" placement="bottom">
              <sl-button
                variant="default"
                size="large"
                @click="$router.push({ name: 'list', params: { public: l.slug_public, private: l.slug_private }})"
              >
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

<style>
sl-card {
  border-radius: var(--sl-border-radius-medium);

  &::part(base) {
    background-color: transparent;
    overflow: hidden;
  }
}
</style>
