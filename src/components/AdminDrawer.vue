<script setup lang="ts">
import { List } from '@/types/global';
import { ref, inject, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { SlDrawer } from '@shoelace-style/shoelace';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { notify } from '@/utils';
import { removeFromStorage } from "@/storage";

const router = useRouter();

// Component emits
const emit = defineEmits(['delete']);

// Component properties
interface Props {
  list: List,
}
const props = defineProps<Props>();

const supabase = inject<SupabaseClient<Database>>('supabase');
const drawer = ref<SlDrawer>();
const confirmListDeletion = ref(false);
const input = ref({
  title: '',
  color: '#0ea5e9',
  description: '',
} as List);

onMounted(() => {
  // Init form input with given list data
  input.value.title = props.list.title;
  input.value.color = props.list.color;
  input.value.description = props.list.description;
});

// Save list
const syncList = async () => {
  if (input.value.title) {
    const { error } = await supabase.from('lists').update(input.value).eq('id', props.list.id );
    if (!error) {
      notify('Gespeichert!', 'success');
    } else {
      console.error(error);
      notify('Die Änderung konnte nicht gespeichert werden!', 'danger');
    }
    drawer.value.hide();
  }
};

// Handle spoiler changes
const toggleSpoiler = async () => {
  const { error } = await supabase.from('lists').update({ spoiler: !props.list.spoiler }).eq('id', props.list.id);
  if (!error) {
    notify('Gespeichert!', 'success');
  } else {
    notify('Die Änderung konnte nicht gespeichert werden!', 'danger');
  }
};

// Delete existing item
const deleteList = async () => {
  const { error } = await supabase.from('lists').delete().eq('id', props.list.id)
  if (!error) {
    removeFromStorage(props.list);
    notify('Erfolgreich gelöscht!', 'success');
    router.push({ name: 'start' });
  } else {
    console.error(error);
    notify('Die List konnte nicht gelöscht werden!', 'danger');
  }
};

// Open drawer
const show = () => drawer.value.show();

defineExpose({ show });
</script>
<template>
  <sl-drawer ref="drawer" label="Administration" class="admin-drawer">
    <div>
      <h3>Bearbeite deine Wunschliste</h3>
      <form @submit.prevent="syncList()">
        <div v-if="list && list.id" class="d-flex-column gap-m mb-m">
          <div class="d-flex gap-m">
            <sl-input
              class="check-input grow-1"
              ref="input-list-title"
              type="text"
              :value="input.title"
              @sl-change="input.title = $event.target.value"
              placeholder="Titel der Liste"
              required
            ></sl-input>
            <sl-color-picker
              format="hex"
              :value="input.color"
              @sl-change="input.color = $event.target.value"
            ></sl-color-picker>
          </div>
          <sl-textarea
            :value="input.description"
            @sl-change="input.description = $event.target.value"
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
    </div>
    <div>
      <h3>Spoiler</h3>
      <p>
        Wenn aktiviert, werden alle Reservierungen und Käufe auch in der Verwaltungsansicht der Wunschliste (geheimer
        Link) angezeigt.
      </p>
      <sl-switch @sl-change="toggleSpoiler()" :checked.prop="list.spoiler"></sl-switch>
    </div>
    <div class="danger">
      <h3>Diese Liste kann weg</h3>
      <p>
        Hier kann die komplette Wunschliste gelöscht werden. <strong>Das kann nicht rückgängig gemacht werden!</strong>
        Bist du sicher, dass du das willst?
      </p>
      <form @submit.prevent="deleteList()" class="d-flex-column align-items-start gap-m">
        <sl-checkbox @sl-change="confirmListDeletion = $event.target.checked">
          Ja, ich bin mir sicher
        </sl-checkbox>
        <sl-button type="submit" variant="danger" size="large" :disabled="!confirmListDeletion">
          <sl-icon class="font-xl" slot="suffix" name="trash"></sl-icon>
          Löschen
        </sl-button>
      </form>
    </div>
  </sl-drawer>
</template>

<style>
.admin-drawer::part(body) {
  display: flex;
  flex-direction: column;
  gap: var(--sl-spacing-2x-large);
}
</style>
