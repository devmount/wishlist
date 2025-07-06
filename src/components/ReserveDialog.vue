<script setup lang="ts">
import { Item, ItemState } from '@/types/global';
import { ref, inject, computed } from 'vue';
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

// Set item state to reserved or open and close dialog
const toggleReserved = async () => {
  const state = props.item.state === ItemState.Reserved ? ItemState.Open : ItemState.Reserved;
  const { error } = await supabase.from('items').update({ state: state }).eq('id', props.item.id);
  if (!error) {
    if (state === ItemState.Reserved) {
      notify(
        'Erfolgreich reserviert!',
        'success',
        'Bitte merke dir, dass dieser Wunsch von dir reserviert ist.',
        'info-circle',
        6000
      );
    }
  } else {
    console.error(error);
    notify('Der Reservierungs-Status konnte nicht gespeichert werden!', 'danger');
  }
  dialog.value.hide();
};

// Check item state
const isItemReserved = computed(() => {
  return props.item?.state == ItemState.Reserved;
});

defineExpose({ show });
</script>
<template>
  <sl-dialog ref="dialog">
    <div slot="label">
      <span v-if="isItemReserved">Möchtest du die Reservierung aufheben?</span>
      <span v-else>Möchtest du reservieren?</span>
    </div>
    <div v-if="isItemReserved">
      Damit entfernst du die Reservierung für den Wunsch «{{ item?.title }}»
      und er wird für jeden wieder als verfügbar angezeigt.
    </div>
    <div v-else>
      Damit markierst du den Wunsch «{{ item?.title }}» für jeden sichtbar als reserviert.
      <strong>Bitte merke dir deine Reservierungen gut, damit du sie später nocht weißt!</strong>
    </div>
    <div slot="footer">
      <sl-button variant="default" @click="dialog.hide()" class="mr-s" size="large">
        <sl-icon class="font-xl" slot="suffix" name="arrow-return-left"></sl-icon>
        Lieber nicht
      </sl-button>
      <sl-button variant="neutral" size="large" @click="toggleReserved()">
        <sl-icon class="font-xl" slot="suffix" :name="isItemReserved ? 'patch-minus' : 'patch-exclamation'"></sl-icon>
        <span v-if="isItemReserved">Ja, Reservierung aufheben</span>
        <span v-else>Ja, bitte reservieren</span>
      </sl-button>
    </div>
  </sl-dialog>
</template>
