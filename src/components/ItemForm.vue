<script setup lang="ts">
import { InputMode, Item, List } from '@/types/global';
import { ref, inject, computed } from 'vue';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { notify } from '@/utils';

// Component emits
const emit = defineEmits(['delete']);

// Component properties
interface Props {
  list: List,
  maxWeight: number,
}
const props = defineProps<Props>();

const supabase = inject<SupabaseClient<Database>>('supabase');
const initItem = computed(() => ({
  title: '',
  price: '',
  description: '',
  links: '',
  list: props.list?.id,
}));

const input = ref({
  data: {} as Item,
  mode: InputMode.Insert,
  target: null as number,
});

// Edit existing item
const setItem = (item: Item) => {
  let i = JSON.parse(JSON.stringify(item));
  i.links = item.links ? item.links.join('\n') : '';
  input.value.data = i;
  input.value.mode = InputMode.Update;
  input.value.target = i.id;
};

// Store new or edit existing item
const syncItem = async () => {
  if (input.value.data.title) {
    // If valid input: get and preprocess item data
    let i = JSON.parse(JSON.stringify(input.value.data));
    i.links = i.links ? i.links.split('\n').map((l: string) => l.trim()) : [];
    // Check if new or edited item
    switch (input.value.mode) {
      case InputMode.Insert:
        i.list = props.list.id;
        i.weight = props.maxWeight+1;
        const { error: insertError } = await supabase.from('items').insert(i)
        if (!insertError) {
          notify('Wunsch hinzugefügt!', 'success');
        } else {
          console.error(insertError);
          notify('Die Änderung konnte nicht gespeichert werden!', 'danger');
        }
        break;
      case InputMode.Update:
        const { error: updateError } = await supabase.from('items').update(i).eq('id', input.value.target)
        if (!updateError) {
          notify('Wunsch erfolgreich aktualisiert!', 'success');
        } else {
          console.error(updateError);
          notify('Die Änderung konnte nicht gespeichert werden!', 'danger');
        }
        break;
      default:
        break;
    }
    // Reset form
    resetItemInput();
  }
};

// Reset item form
const resetItemInput = () => {
  input.value.data = JSON.parse(JSON.stringify(initItem.value));
  input.value.mode = InputMode.Insert;
  input.value.target = null;
};

// Check input modes
const isInputUpdate = computed(() => {
  return input.value.mode == InputMode.Update;
});
const isInputInsert = computed(() => {
  return input.value.mode == InputMode.Insert;
});

// Public methods
defineExpose({ setItem });
</script>
<template>
  <sl-card class="width-full mb-3xl">
    <h2 v-if="isInputInsert" class="d-flex justify-space-between align-items-center">
      Füge einen Wunsch hinzu
      <sl-icon class="font-2xl" name="bag-plus"></sl-icon>
    </h2>
    <h2 v-if="isInputUpdate" class="d-flex justify-space-between align-items-center">
      Wunsch bearbeiten
      <sl-icon class="font-2xl" name="bag-check"></sl-icon>
    </h2>
    <form @submit.prevent="syncItem()">
      <div class="d-flex flex-wrap gap-m mb-m">
        <sl-input
          ref="input-item-title"
          class="check-input grow-5"
          type="text"
          :value="input.data.title"
          @input="input.data.title = $event.target.value"
          placeholder="Titel"
          required
        ></sl-input>
        <sl-input
          class="grow-1"
          type="text"
          :value="input.data.price"
          @input="input.data.price = $event.target.value"
          placeholder="Preis (optional)"
        ></sl-input>
      </div>
      <sl-textarea
        class="grow-1 mb-m"
        type="text"
        :value="input.data.description"
        @input="input.data.description = $event.target.value"
        placeholder="Beschreibung (optional)"
        rows="1"
        resize="auto"
      ></sl-textarea>
      <sl-textarea
        class="check-input grow-1 mb-m"
        :value="input.data.links"
        @input="input.data.links = $event.target.value"
        placeholder="Link Adressen zum Artikel (ein Link pro Zeile)"
        rows="1"
        resize="auto"
      ></sl-textarea>
      <div class="d-flex justify-end gap-m">
        <sl-button v-if="isInputUpdate" variant="default" size="large" @click="resetItemInput()">
          <sl-icon class="font-xl" slot="suffix" name="arrow-return-left"></sl-icon>
          Lieber nicht ändern
        </sl-button>
        <sl-button v-if="isInputUpdate" type="submit" variant="primary" size="large">
          <sl-icon class="font-xl" slot="suffix" name="pencil"></sl-icon>
          Wunsch anpassen
        </sl-button>
        <sl-button v-if="isInputInsert" type="submit" variant="primary" size="large">
          <sl-icon class="font-xl" slot="suffix" name="plus"></sl-icon>
          Wünschen
        </sl-button>
      </div>
    </form>
  </sl-card>
</template>

<style>
</style>
