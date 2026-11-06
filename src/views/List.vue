<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref } from 'vue';
import { addToStorage } from "@/storage";
import { Sortable } from "sortablejs-vue3";
import { Api, ApiError } from '@/api';
import { SlDialog, SlDetails } from '@shoelace-style/shoelace';
import { List, Item } from '@/types/global';
import { useRoute, useRouter } from 'vue-router';
import { colorFavicon, notify } from '@/utils';

// Components
import Logo from '@/components/Logo.vue';
import ItemCard from '@/components/cards/ItemCard.vue';
import AdminDrawer from '@/components/AdminDrawer.vue';
import ItemForm from '@/components/ItemForm.vue';
import ReserveDialog from '@/components/dialogs/ReserveDialog.vue';
import PurchaseDialog from '@/components/dialogs/PurchaseDialog.vue';
import DeleteDialog from '@/components/dialogs/DeleteDialog.vue';

// References
const wishlist = ref<HTMLElement>();
const drawer = ref();
const itemForm = ref();
const dialogPurchase = ref<SlDialog>();
const dialogReserve = ref<SlDialog>();
const dialogDelete = ref<SlDialog>();

const api = inject<Api>('api')!;
const route = useRoute();
const router = useRouter();

const loading = ref(true); // Initially page loading indication
const processing = ref(false); // Loading indication for async data in between
const list = ref<List | null>(null);
const items = ref<Item[]>([]);
const dialogItem = ref<Item | null>(null);
const POLL_INTERVAL = 4000; // Milliseconds between checks for changes made by others
let pollTimer: number;

// Check if admin token is given and correct, the API only returns the private slug in that case
const isAdmin = computed(() => {
  return !!list.value?.slug_private;
});

onMounted(async () => {
  // Handle api not being available
  if (!api) {
    loading.value = false;
    return;
  }
  // Initially get all existing items
  await getData();

  // Regularly check for changes made by others to provide a realtime experience
  pollTimer = window.setInterval(poll, POLL_INTERVAL);
  document.addEventListener('visibilitychange', poll);

  // Set browser title
  document.title = isAdmin.value
    ? 'Wishlist - Admin: ' + list.value?.title
    : 'Wishlist - ' + list.value?.title;

  // Check for existing local storage entry and add if it's not there
  if (isAdmin.value) {
    addToStorage(list.value);
  }

  // Finished loading
  loading.value = false;
});

onUnmounted(() => {
  // Stop checking for changes
  window.clearInterval(pollTimer);
  document.removeEventListener('visibilitychange', poll);
});

// Retrieve requested data
const getData = async () => {
  processing.value = true;

  // Query list with its items by route, private slug is only returned if correct
  try {
    const data = await api.getList(route.params.public as string, route.params.private as string);
    list.value = data.list;
    items.value = data.items;
    colorFavicon(list.value.color);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      list.value = null;
      items.value = [];
    } else {
      console.error(error);
    }
  }

  processing.value = false;
};

// Reload data if the list was changed since last load. Skipped while tab is hidden.
const poll = async () => {
  if (document.hidden || processing.value) {
    return;
  }
  // A failed check (e.g. list deleted) also triggers a reload, which handles the error
  const version = await api.getVersion(route.params.public as string).catch(() => null);
  if (version !== list.value?.modified) {
    await getData();
  }
};

// Edit existing item
const edit = (item: Item) => {
  itemForm.value.setItem(item);
};

// Open dialog for reservation confirmation
const confirmReserved = (item: Item) => {
  dialogItem.value = item;
  dialogReserve.value?.show();
};

// Open dialog for purchase confirmation
const confirmPurchased = (item: Item) => {
  dialogItem.value = item;
  dialogPurchase.value?.show();
};

// Open dialog for item removal confirmation
const confirmRemoval = (item: Item) => {
  dialogItem.value = item;
  dialogDelete.value?.show();
};

// Send given text as body content in new email
const sendEmail = (text: string) => {
  window.location.href = "mailto:?subject=Meine Wunschliste: " + list.value?.title + "&body=" + text;
};

// Close all other list items if one is shown
const closeOtherItems = (index: number) => {
  [...(wishlist.value?.querySelectorAll('sl-details') ?? [])].forEach(
    (item: SlDetails, position: number) => (item.open = position == index)
  );
};

// Update the order of items
const saveOrder = async (event: { oldIndex: number, newIndex: number }) => {
  if (!list.value) {
    return;
  }
  // Locally set the new order
  const movedItem = items.value.splice(event.oldIndex, 1)[0];
  items.value.splice(event.newIndex, 0, movedItem);

  // Now sync the new order
  try {
    await api.reorder(list.value, items.value.map(i => i.id));
    notify('Gespeichert!', 'success');
  } catch (error) {
    console.error(error);
    notify('Die Änderung konnte nicht gespeichert werden!', 'danger');
  }
  await getData();
};

// Return base url
const baseUrl = computed(() => {
  return window.location.origin
});

// Return complete public link for sharing
const publicLink = computed(() => {
  return baseUrl.value + '/' + route.params.public
});

// Return complete private link for administration
const privateLink = computed(() => {
  return baseUrl.value + '/' + route.params.public + '/' + route.params.private
});

// Check if public token is given and correct
const visitor = computed(() => {
  return route.params.public && list.value?.slug_public === route.params.public && !route.params.private
});

// Approve if something is allowed to be shown
const allowed = computed(() => {
  return !!(visitor.value || list.value?.spoiler)
});

// Prived accent color once list color is loaded
const accent = computed(() => {
  return list.value?.color ?? '#000000'
});
</script>

<template>
  <div v-if="loading">
    <header class="content-center mb-3xl">
      <Logo @click="router.push({ name: 'start' })" class="c-pointer" />
      <div class="mt-2xl">
        <sl-spinner class="font-3xl"></sl-spinner>
      </div>
    </header>
  </div>
  <div v-else-if="list">
    <header class="content-center mb-3xl accent" :style="{ '--accent': accent }">
      <Logo @click="router.push({ name: 'start' })" class="c-pointer" />
      <h1>{{ list.title }}</h1>
      <hr />
      <p class="pre-line">{{ list.description }}</p>
    </header>

    <!-- Form to add or edit items -->
    <item-form v-if="isAdmin" ref="itemForm" :list="list" @changed="getData" />

    <!-- Sortable item list -->
    <section ref="wishlist" class="mb-3xl">
      <Sortable
        :list="items"
        item-key="id"
        :options="{ handle: '.icon-handle' }"
        @end="saveOrder"
      >
        <template #item="{ element, index }">
          <item-card
            :class="{ draggable: isAdmin }"
            :item="element"
            :index="index"
            :is-admin="isAdmin"
            :is-status-visible="allowed"
            :has-sort-handle="isAdmin && items.length > 1"
            @expand="closeOtherItems"
            @delete="confirmRemoval"
            @edit="edit"
            @reserve="confirmReserved"
            @purchase="confirmPurchased"
          />
        </template>
      </Sortable>
    </section>

    <!-- Sharing links area -->
    <section v-if="isAdmin" class="mb-3xl">
      <h2>
        <sl-icon class="font-xl" name="share"></sl-icon>
        Teile deine Wunschliste
      </h2>
      Den öffentlichen Link deiner Wunschliste kannst du hier kopieren und versenden.
      <div class="d-flex align-items-center">
        <pre class="grow-1">{{ publicLink }}</pre>
        <sl-button-group>
          <sl-copy-button
            class="copy-button"
            :value="publicLink"
            copy-label="Link kopieren"
            success-label="In die Zwischenablage kopiert!"
            error-label="Das hat leider nicht geklappt"
            feedback-duration="1000"
          >
            <sl-icon slot="copy-icon" name="clipboard-plus"></sl-icon>
            <sl-icon slot="success-icon" name="clipboard-check"></sl-icon>
            <sl-icon slot="error-icon" name="clipboard-x"></sl-icon>
          </sl-copy-button>
          <sl-button class="font-xl" size="medium" @click="sendEmail(publicLink)">
            <sl-icon name="envelope"></sl-icon>
          </sl-button>
        </sl-button-group>
      </div>
    </section>
    <section v-if="isAdmin" class="mb-3xl">
      <h2>
        <sl-icon class="font-xl" name="shield-lock"></sl-icon>
        Verwalte deine Wunschliste
      </h2>
      Bitte bewahre den geheimen Link deiner Wunschliste auf, sodass du später noch Änderungen vornehmen kannst.
      Dieser Link sollte nicht geteilt werden!
      <div class="d-flex align-items-center">
        <pre class="grow-1">{{ privateLink }}</pre>
        <sl-copy-button
          class="copy-button"
          :value="privateLink"
          copy-label="Link kopieren"
          success-label="In die Zwischenablage kopiert!"
          error-label="Das hat leider nicht geklappt"
          feedback-duration="1000"
        >
          <sl-icon slot="copy-icon" name="clipboard-plus"></sl-icon>
          <sl-icon slot="success-icon" name="clipboard-check"></sl-icon>
          <sl-icon slot="error-icon" name="clipboard-x"></sl-icon>
        </sl-copy-button>
      </div>
    </section>

    <!-- Meta data -->
    <section class="content-center font-xs text-gray">
      Diese Wunschliste wurde <sl-relative-time :date="list.created" lang="de"></sl-relative-time>
      am <sl-format-date :date="list.created" month="long" day="numeric" year="numeric" lang="de"></sl-format-date> erstellt
    </section>

    <!-- Admin area trigger -->
    <div class="admin p-fixed-top-right">
      <div v-if="isAdmin" class="menu" @click="drawer.show()">
        <sl-icon class="font-3xl" name="list"></sl-icon>
      </div>
    </div>

    <!-- Admin area for managing the list -->
    <admin-drawer ref="drawer" :list="list" @changed="getData" />

    <!-- Dialog: item state handling reservation -->
    <reserve-dialog ref="dialogReserve" :list="list" :item="dialogItem" @changed="getData" />

    <!-- Dialog: item state handling reservation -->
    <purchase-dialog ref="dialogPurchase" :list="list" :item="dialogItem" @changed="getData" />

    <!-- Dialog: item removal -->
    <delete-dialog ref="dialogDelete" :list="list" :item="dialogItem" @changed="getData" />
  </div>

  <!-- 404 -->
  <div v-if="!loading && !list">
    <header class="content-center mb-3xl">
      <Logo />
      <h1>Was zum ... ?</h1>
      <p>
        Diese Liste existiert nicht mehr oder der Link ist ungültig.
        Bitte prüfe den Link oder frage bei der Person nach, die ihn dir geschickt hat.
        Wenn alles nichts hilft, <router-link :to="{ name: 'start' }">starte von vorn</router-link>.
      </p>
    </header>
  </div>

  <!-- Background processing indicator -->
  <sl-spinner v-if="processing" class="processing font-2xl"></sl-spinner>
</template>

<style>
header.accent .logo {
  color: var(--accent-safe);
}
header.accent hr {
  background: var(--accent-safe);
}

.menu {
  height: var(--sl-spacing-4x-large);
  width: var(--sl-spacing-4x-large);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: color var(--sl-transition-fast) ease;
}
.menu:hover {
  color: var(--sl-color-primary-500);
}

.copy-button::part(button) {
  background-color: var(--sl-color-neutral-0);
  border-color: var(--sl-input-border-color);
  height: auto;
  cursor: pointer !important;
  min-height: var(--sl-input-height-medium);
  font-size: var(--sl-button-font-size-medium);
  line-height: calc(var(--sl-input-height-medium) - var(--sl-input-border-width) * 2);
  border-top-left-radius: var(--sl-input-border-radius-medium);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  border-style: solid;
  border-width: var(--sl-input-border-width);
  font-family: var(--sl-input-font-family);
  font-weight: var(--sl-font-weight-semibold);
  text-decoration: none;
  user-select: none;
  white-space: nowrap;
  vertical-align: middle;
  padding: 0 var(--sl-spacing-medium);
  transition: var(--sl-transition-x-fast) background-color, var(--sl-transition-x-fast) color, var(--sl-transition-x-fast) border, var(--sl-transition-x-fast) box-shadow;
  cursor: inherit;
}
.copy-button:hover::part(button) {
  background-color: var(--sl-color-primary-50);
  border-color: var(--sl-color-primary-300);
}
sl-button-group .copy-button::part(button) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.processing {
  position: fixed;
  bottom: 1rem;
  left: 1rem;
}
</style>
