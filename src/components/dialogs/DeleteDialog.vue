<script setup lang="ts">
import { Item } from '@/types/global';
import { ref, inject } from 'vue';
import { SlDialog } from '@shoelace-style/shoelace';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { notify } from '@/utils';

// Component emits
const emit = defineEmits(['delete']);

// Component properties
interface Props {
  item: Item|null,
}
const props = defineProps<Props>();

const supabase = inject<SupabaseClient<Database>>('supabase');
const dialog = ref<SlDialog>();

// Open dialog
const show = () => dialog.value.show();

// Delete existing item
const deleteItem = async () => {
  const { error } = await supabase.from('items').delete().match({ id: props.item.id });
  if (!error) {
    notify('Der Wunsch wurde erfolgreich gelöscht!', 'success');
  } else {
    console.error(error);
    notify('Der Wunsch konnte nicht gelöscht werden!', 'danger');
  }
  dialog.value.hide();
};

defineExpose({ show });
</script>

<template>
  <sl-dialog ref="dialog">
    <div slot="label">
      Diesen Wunsch löschen?
    </div>
    <div>
      Damit entfernst den Wunsch «{{ item?.title }}». Dieses Aktion kann nicht rückgängig gemacht werden.
    </div>
    <div slot="footer">
      <sl-button variant="default" @click="dialog.hide()" class="mr-s" size="large">
        <sl-icon class="font-xl" slot="suffix" name="arrow-return-left"></sl-icon>
        Lieber nicht
      </sl-button>
      <sl-button variant="danger" size="large" @click="deleteItem()">
        <sl-icon class="font-xl" slot="suffix" name="trash"></sl-icon>
        Ja, kann weg
      </sl-button>
    </div>
  </sl-dialog>
</template>
