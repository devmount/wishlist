<script setup lang="ts">
import { inject, onMounted, reactive, ref } from 'vue';
import { getAllFromStorage, addToStorage, removeFromStorage } from "@/storage";
import { Api } from '@/api';
import { List } from '@/types/global';
import { useRouter } from 'vue-router';

// Components
import Logo from '@/components/Logo.vue';
import ListCard from '@/components/cards/ListCard.vue';
import { colorFavicon } from '@/utils';

const router = useRouter();
const api = inject<Api>('api')!;

const input = reactive({
  title: '',
  color: '#0ea5e9',
  description: '',
});
const localLists = ref<List[]>([]);

onMounted(() => {
  // Init list overview from local storage
  localLists.value = getAllFromStorage();

  // Set browser title and favicon
  document.title = 'Wishlist';
  colorFavicon('#00abfd');
});

// Store new list in database
const addList = async () => {
  if (input.title) {
    try {
      const list = await api.createList(input);
      const { slug_public, slug_private } = list;
      const obj = addToStorage(list);
      if (obj) {
        localLists.value.push(obj);
      }
      // workaround for race condition in vue router
      setTimeout(() => {
        router.push({ name: 'list', params: { public: slug_public, private: slug_private }});
      }, 100);
    } catch (error) {
      console.error(error);
    }
  }
};

// Remove list with <slug_public> from local list and local storage
const removeLocalListEntry = (slug: string) => {
  const index = localLists.value.findIndex(l => l.slug_public === slug);
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
      <list-card
        v-for="list in localLists"
        :key="list.id"
        :list="list"
        @delete="removeLocalListEntry"
      />
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
