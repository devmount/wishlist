<script setup lang="ts">
import { computed } from 'vue';
import { getBaseUrl } from '@/utils';
import { Item, ItemState } from '@/types/global';

// Component emits
const emit = defineEmits(['expand', 'delete', 'edit', 'reserve', 'purchase']);

// Component properties
interface Props {
  item: Item, // Actual list item
  index: number, // Position of the item in the list
  isAdmin: boolean, // Indicates that the list is shown in admin mode (via private link)
  isStatusVisible: boolean, // True if the item status should be visible
  hasSortHandle: boolean, // True, if a sort handle should show up
}
const props = defineProps<Props>();

// Check item states
const isItemReserved = computed(() => {
  return props.item.state == ItemState.Reserved;
});
const isItemPurchased = computed(() => {
  return props.item.state == ItemState.Purchased;
});
</script>

<template>
  <div class="d-flex align-items-center">
    <sl-icon
      v-if="hasSortHandle"
      name="chevron-bar-expand"
      class="icon-handle c-pointer p-s pl-xs font-xl shrink-0"
    ></sl-icon>
    <sl-details
      class="item mb-2xs width-full shrink-1"
      :reserved="isItemReserved && isStatusVisible"
      :purchased="isItemPurchased && isStatusVisible"
      @sl-show="emit('expand', index)"
    >
      <!-- Item title and flag -->
      <header slot="summary" class="d-flex align-items-center gap-m width-full">
        <sl-icon v-if="isItemPurchased && isStatusVisible" name="check-circle" class="font-xl shrink-0"></sl-icon>
        <sl-icon v-else-if="isItemReserved && isStatusVisible" name="exclamation-circle" class="font-xl"></sl-icon>
        <sl-icon v-else name="circle" class="font-xl"></sl-icon>
        <h3 class="m-0" :title="item.title">{{ item.title }}</h3>
        <sl-badge v-if="isItemReserved && isStatusVisible" variant="neutral">RESERVIERT</sl-badge>
        <sl-badge v-if="isItemPurchased && isStatusVisible" variant="primary">GEKAUFT</sl-badge>
        <div v-if="item.price" class="ml-auto mr-m text-mono">
          <sl-icon name="tag" class="content-middle"></sl-icon>
          {{ item.price }}
        </div>
      </header>
      <!-- Item information -->
      <main class="d-flex-column gap-m mb-m">
        <div v-if="item.description" class="pre-line">{{ item.description }}</div>
        <div v-if="item.links?.length">
          <div>Hier kann man das kaufen:</div>
          <a v-for="l in item.links" :key="l" class="d-flex align-items-center" :href="l" target="_blank">
            <sl-icon name="link-45deg" class="shrink-0 font-l mt-3xs mr-xs"></sl-icon>
            <span class="text-overflow-ellipsis">{{ getBaseUrl(l) }}</span>
          </a>
        </div>
        <div v-else>
          Für diesen Wunsch sind keine Linkvorschläge hinterlegt.
        </div>
        <div class="font-xs text-gray">
          Erstellt am <sl-format-date :date="item.created" month="long" day="numeric" year="numeric" lang="de"></sl-format-date>
          &middot;
          Letzte Aktivität <sl-relative-time :date="item.modified" lang="de"></sl-relative-time>
        </div>
      </main>
      <!-- Flag and manage item -->
      <footer class="d-flex justify-end flex-wrap gap-m">
        <sl-button v-if="isAdmin" variant="danger" size="large" @click="emit('delete', item)">
          <sl-icon name="trash"></sl-icon>
        </sl-button>
        <sl-button v-if="isAdmin" class="mr-auto" variant="primary" size="large" @click="emit('edit', item)">
          <sl-icon name="pencil"></sl-icon>
        </sl-button>
        <sl-button-group>
          <sl-button v-if="!isItemReserved" variant="neutral" size="large" @click="emit('reserve', item)">
            <sl-icon class="font-xl" slot="suffix" name="patch-exclamation"></sl-icon>
            Reserviere ich
          </sl-button>
          <sl-button v-else variant="neutral" size="large" @click="emit('reserve', item)">
            <sl-icon class="font-xl" slot="suffix" name="patch-minus"></sl-icon>
            Doch nicht reserviert
          </sl-button>
          <sl-button v-if="!isItemPurchased" variant="primary" size="large" @click="emit('purchase', item)">
            <sl-icon class="font-xl" slot="suffix" name="cart-check"></sl-icon>
            Habe ich gekauft
          </sl-button>
          <sl-button v-else variant="primary" size="large" @click="emit('purchase', item)">
            <sl-icon class="font-xl" slot="suffix" name="cart-dash"></sl-icon>
            Doch nicht gekauft
          </sl-button>
        </sl-button-group>
      </footer>
    </sl-details>
  </div>
</template>

<style>
.item::part(header) {
  border-top-left-radius: var(--sl-border-radius-medium);
}
.item h3 {
  max-width: 55%;
}
.item[reserved=true]::part(header) {
  background: linear-gradient(135deg, var(--sl-color-gray-500) 0%, var(--sl-color-gray-500) 24px, transparent 24px);
}
.item[reserved=true] h3 {
  color: var(--sl-color-gray-400);
}
.item[purchased=true]::part(header) {
  background: linear-gradient(135deg, var(--sl-color-primary-500) 0%, var(--sl-color-primary-500) 24px, transparent 24px);
}
.item[purchased=true] h3 {
  color: var(--sl-color-gray-400);
  text-decoration: line-through;
}
</style>
