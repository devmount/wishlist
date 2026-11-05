<script setup lang="ts">
import { Item, ItemState, List } from '@/types/global';
import { ref, inject, computed } from 'vue';
import { SlDialog } from '@shoelace-style/shoelace';
import { Api, ApiError } from '@/api';
import { notify } from '@/utils';

// Component emits
const emit = defineEmits(['changed']);

// Component properties
interface Props {
  list: List,
  item: Item|null,
}
const props = defineProps<Props>();

const api = inject<Api>('api');
const dialog = ref<SlDialog>();

// Open dialog
const show = () => dialog.value.show();

// Set item state to purchased or open and close dialog
const togglePurchased = async () => {
  const state = props.item.state === ItemState.Purchased ? ItemState.Open : ItemState.Purchased;
  try {
    await api.setState(props.list, props.item, state);
    if (state === ItemState.Purchased) {
      notify('Vielen Dank! ❤️', 'success');
    }
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      notify('Dieser Wunsch wurde gerade von jemand anderem geändert!', 'warning', 'Bitte prüfe den aktuellen Status.');
    } else {
      console.error(error);
      notify('Der Kauf-Status konnte nicht gespeichert werden!', 'danger');
    }
  }
  emit('changed');
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
