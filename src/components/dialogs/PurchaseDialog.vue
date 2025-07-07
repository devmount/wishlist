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

// Set item state to purchased or open and close dialog
const togglePurchased = async () => {
  const state = props.item.state === ItemState.Purchased ? ItemState.Open : ItemState.Purchased;
  const { error } = await supabase.from('items').update({ state: state }).eq('id', props.item.id);
  if (!error) {
    if (state === ItemState.Purchased) {
      notify('Vielen Dank! ❤️', 'success');
    }
  } else {
    console.error(error);
    notify('Der Kauf-Status konnte nicht gespeichert werden!', 'danger');
  }
  dialog.value.hide();
};

// Check item state
const isItemPurchased = computed(() => {
  return props.item?.state == ItemState.Purchased;
});

defineExpose({ show });
</script>
<template>
  <sl-dialog ref="dialog">
    <div slot="label">
      <span v-if="isItemPurchased">Den Kauf stornieren?</span>
      <span v-else>Als gekauft markieren?</span>
    </div>
    <div v-if="isItemPurchased">
      Damit ist der Wunsch «{{ item?.title }}» nicht mehr als gekauft markiert
      und er wird für jeden wieder als verfügbar angezeigt.
    </div>
    <div v-else>
      Damit markierst du den Wunsch «{{ item?.title }}» für jeden sichtbar als gekauft.
    </div>
    <div slot="footer">
      <sl-button variant="default" @click="dialog.hide()" class="mr-s" size="large">
        <sl-icon class="font-xl" slot="suffix" name="arrow-return-left"></sl-icon>
        Lieber nicht
      </sl-button>
      <sl-button variant="primary" size="large" @click="togglePurchased()">
        <sl-icon class="font-xl" slot="suffix" :name="isItemPurchased ? 'cart-dash' : 'cart-check'"></sl-icon>
        <span v-if="isItemPurchased">Ja, der Kauf hat nicht geklappt</span>
        <span v-else>Ja, habe ich gekauft</span>
      </sl-button>
    </div>
  </sl-dialog>
</template>
