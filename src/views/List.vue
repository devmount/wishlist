<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, reactive, ref } from 'vue';
import { addToStorage, removeFromStorage } from "@/storage";
import { Sortable } from "sortablejs-vue3";
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { SlDialog, SlDrawer, SlDetails } from '@shoelace-style/shoelace';
import { List, Item, ItemState, InputMode } from '@/types/global';
import { useRoute, useRouter } from 'vue-router';

// Import partials
import Logo from '@/views/partials/Logo.vue';

// References
const wishlist = ref<HTMLElement>();
const drawer = ref<SlDrawer>();
const dialogPurchase = ref<SlDialog>();
const dialogReserve = ref<SlDialog>();
const dialogDelete = ref<SlDialog>();

const supabase = inject<SupabaseClient<Database>>('supabase');
const route = useRoute();
const router = useRouter();

const loading = ref(true);
const list = ref<List>(null);
const items = ref<Item[]>([]);
const input = reactive({
  item: {
    data: {} as Item,
    mode: InputMode.Insert,
    target: null as number,
  },
  list: {
    title: '',
    color: '#0ea5e9',
    description: '',
  } as List,
});
const dialog = reactive({
  item: null as Item,
});
const confirmListDeletion = ref(false);

const initItem = computed(() => ({
  title: '',
  price: '',
  description: '',
  links: '',
  list: list.value?.id
}));

// Check if admin token is given and correct
const isAdmin = computed(() => {
  return route.params.private && list.value?.slug_private === route.params.private
});

onMounted(async () => {
  // Initially get all existing items
  await getData();

  // Subscribe to all changes on the lists table and the items table to provide realtime experience
  supabase.channel('room').on(
    'postgres_changes',
    { event: '*', schema: '*' },
    async () => { await getData(); }
  ).subscribe();

  // Init item and list input
  resetItemInput();
  resetListInput();
  
  // Set browser title
  document.title = isAdmin.value ? 'Wishlist - Admin: ' + list.value?.title : 'Wishlist - ' + list.value?.title;

  // Check for existing local storage entry and add if it's not there
  if (isAdmin.value) {
    addToStorage(list.value);
  }

  // Finished loading
  loading.value = false;
});

onUnmounted(() => {
  // Unsubscribe from active channels
  supabase.removeAllChannels();
});

// Retrieve requested data
const getData = async () => {
  // Query list by route
  const { data, error } = await supabase
    .from('lists')
    .select()
    .eq('slug_public', route.params.public as string);
  if (!error) {
    list.value = data[0] ?? null;
  } else {
    console.error(error);
  }
  
  // Query corresponding list items
  if (list.value?.id) {
    const { data: records, error: fail } = await supabase.from('items').select().eq('list', list.value.id)
    if (!fail) {
      items.value = records.sort((a,b) => a.weight - b.weight || Number(a.created < b.created));
    } else {
      console.error(fail);
    }
  }
};

// Save list
const syncList = async () => {
  if (input.list.title) {
    const { data, error } = await supabase
      .from('lists')
      .update(input.list)
      .eq('id', list.value?.id )
      .select();
    if (!error) {
      list.value = data[0];
    } else {
      console.error(error);
    }
    drawer.value.hide();
  }
};

// Reset list form
const resetListInput = () => {
  input.list.title = list.value?.title;
  input.list.color = list.value?.color;
  input.list.description = list.value?.description;
};

// Calculate the maximum existing weight plus one
const nextWeight = () => {
  return Math.max(...items.value.map(i => i.weight)) + 1;
};

// Store new or edit existing item
const syncItem = async () => {
  if (input.item.data.title) {
    // If valid input: get and preprocess item data
    let i = JSON.parse(JSON.stringify(input.item.data));
    i.links = i.links ? i.links.split('\n').map((l: string) => l.trim()) : [];
    // Check if new or edited item
    switch (input.item.mode) {
      case InputMode.Insert:
        i.weight = nextWeight();
        const insertResult = await supabase.from('items').insert(i).select()
        if (!insertResult.error) {
          items.value.unshift(i);
        } else {
          console.error(insertResult.error);
        }
        break;
      case InputMode.Update:
        const updateResult = await supabase.from('items').update(i).eq('id', input.item.target).select()
        if (!updateResult.error) {
          items.value[getItemPosition(i.id)] = i;
        } else {
          console.error(updateResult.error);
        }
        break;
      default: break
    }
    // Reset form
    resetItemInput()
  }
};

// Edit existing item
const editItem = (item: Item) => {
  let i = JSON.parse(JSON.stringify(item));
  i.links = item.links ? item.links.join('\n') : '';
  input.item.data = i;
  input.item.mode = InputMode.Update;
  input.item.target = i.id;
};

// Reset item form
const resetItemInput = () => {
  input.item.data = JSON.parse(JSON.stringify(initItem.value));
  input.item.mode = InputMode.Insert;
  input.item.target = null;
};

// Open dialog for reservation confirmation
const confirmReserved = (item: Item) => {
  dialog.item = item;
  dialogReserve.value.show();
};

// Find current position of list item with given <id>
const getItemPosition = (id: number) => {
  return items.value.findIndex(i => i.id === id);
};

// Set item state to reserved or open and close dialog
const toggleReserved = async (item: Item) => {
  const state = item.state == ItemState.Reserved ? ItemState.Open : ItemState.Reserved;
  const { data, error } = await supabase.from('items').update({ state: state }).eq('id', item.id).select();
  if (!error) {
    items.value[getItemPosition(data[0].id)].state = state;
  } else {
    console.error(error);
  }
  dialogReserve.value.hide();
};

// Open dialog for purchase confirmation
const confirmPurchased = (item: Item) => {
  dialog.item = item;
  dialogPurchase.value.show();
};

// Set item state to purchased or open
const togglePurchased = async (item: Item) => {
  const state = item.state == ItemState.Purchased ? ItemState.Open : ItemState.Purchased;
  const { data, error } = await supabase.from('items').update({ state: state }).eq('id', item.id).select()
  if (!error) {
    items.value[getItemPosition(data[0].id)].state = state;
  } else {
    console.error(error);
  }
  dialogPurchase.value.hide();
};

// Open dialog for item removal confirmation
const confirmRemoval = (item: Item) => {
  dialog.item = item;
  dialogDelete.value.show();
};

// Delete existing item
const deleteItem = async (item: Item) => {
  const { error } = await supabase.from('items').delete().match({ id: item.id });
  if (!error) {
    items.value.slice(getItemPosition(item.id), 1);
  } else {
    console.error(error);
  }
  dialogDelete.value.hide();
};

// Send given text as body content in new email
const sendEmail = (text: string) => {
  window.location.href = "mailto:?subject=Meine Wunschliste: " + list.value?.title + "&body=" + text;
};

// Close all other list items if one is shown
const closeOtherItems = (index: number) => {
  [...wishlist.value.querySelectorAll('sl-details')].forEach(
    (item: SlDetails, position: number) => (item.open = position == index)
  );
};

// Delete existing item
const deleteList = async () => {
  const deleteResult = await supabase.from('lists').delete().eq('id', list.value?.id)
  if (!deleteResult.error) {
    removeFromStorage(list.value);
    router.push({ name: 'start' });
  } else {
    console.error(deleteResult.error);
  }
};

// Update the order of items
const saveOrder = async (event) => {
  // Locally set the new order
  const movedItem = items.value.splice(event.oldIndex, 1)[0];
  items.value.splice(event.newIndex, 0, movedItem);
  // Now sync the new weights for each item where the weight has changed
  for (const [i, item] of items.value.entries()) {
    if (item.weight !== i) {
      const updateResult = await supabase.from('items').update({ weight: i }).eq('id', item.id).select()
      if (updateResult.error) {
        console.error(updateResult.error);
      }
    }
  }
};

// Extract the hostname from a given url
const getBaseUrl = (url: string) => {
  const obj = new URL(url);
  return obj.hostname;
};

// Handle spoiler changes
const toggleSpoiler = async () => {
  list.value.spoiler = !list.value.spoiler;
  await supabase.from('lists').update({ spoiler: list.value.spoiler }).eq('id', list.value.id).select();
};

// Return base url
const baseUrl =  computed(() => {
  return window.location.origin
});

// Return complete public link for sharing
const publicLink =  computed(() => {
  return baseUrl.value + '/' + route.params.public
});

// Return complete private link for administration
const privateLink =  computed(() => {
  return baseUrl.value + '/' + route.params.public + '/' + route.params.private
});

// Check if public token is given and correct
const visitor =  computed(() => {
  return route.params.public && list.value?.slug_public === route.params.public && !route.params.private
});

// Approve if something is allowed to be shown
const allowed =  computed(() => {
  return visitor.value || list.value?.spoiler
});

// Prived accent color once list color is loaded
const accent =  computed(() => {
  return list.value?.color ?? '#000000'
});

// Check input modes
const isInputUpdate =  computed(() => {
  return input.item.mode == InputMode.Update;
});
const isInputInsert =  computed(() => {
  return input.item.mode == InputMode.Insert;
});

// Check item states
const isItemReserved =  computed(() => {
  return dialog.item.state == ItemState.Reserved;
});
const isItemPurchased =  computed(() => {
  return dialog.item.state == ItemState.Purchased;
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
    <header class="content-center mb-3xl">
      <Logo @click="router.push({ name: 'start' })" :style="{ color: accent }" class="c-pointer" />
      <h1>{{ list.title }}</h1>
      <hr :style="{ background: accent }" /> 
      <p class="pre-line">{{ list.description }}</p>
    </header>
    <section v-if="isAdmin" class="mb-3xl">
      <h2>
        <sl-icon class="font-xl" name="bag-plus"></sl-icon>
        Füge einen Wunsch hinzu
      </h2>
      <form @submit.prevent="syncItem()">
        <div class="d-flex flex-wrap gap-m mb-m">
          <sl-input
            ref="input-item-title"
            class="check-input grow-5"
            type="text"
            :value="input.item.data.title"
            @input="input.item.data.title = $event.target.value"
            placeholder="Titel"
            required
          ></sl-input>
          <sl-input
            class="grow-1"
            type="text"
            :value="input.item.data.price"
            @input="input.item.data.price = $event.target.value"
            placeholder="Preis (optional)"
          ></sl-input>
        </div>
        <sl-textarea
          class="grow-1 mb-m"
          type="text"
          :value="input.item.data.description"
          @input="input.item.data.description = $event.target.value"
          placeholder="Beschreibung (optional)"
          rows="1"
          resize="auto"
        ></sl-textarea>
        <sl-textarea
          class="check-input grow-1 mb-m"
          :value="input.item.data.links"
          @input="input.item.data.links = $event.target.value"
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
    </section>
    <section ref="wishlist" class="mb-3xl">
      <Sortable
        :list="items"
        item-key="id"
        :options="{ handle: '.icon-handle' }"
        @end="saveOrder"
      >
        <template #item="{ element, index }">
          <div class="draggable d-flex align-items-center">
            <sl-icon
              v-if="isAdmin"
              name="chevron-bar-expand"
              class="icon-handle c-pointer p-s pl-xs font-xl shrink-0"
            ></sl-icon>
            <sl-details
              class="item mb-2xs width-full shrink-1"
              :reserved="element.state == 'reserved' && allowed"
              :purchased="element.state == 'purchased' && allowed"
              @sl-show="closeOtherItems(index)"
            >
              <!-- Item title and flag -->
              <header slot="summary" class="d-flex align-items-center gap-m width-full">
                <sl-icon v-if="element.state == 'purchased' && allowed" name="check-circle" class="font-xl shrink-0"></sl-icon>
                <sl-icon v-else-if="element.state == 'reserved' && allowed" name="exclamation-circle" class="font-xl"></sl-icon>
                <sl-icon v-else name="circle" class="font-xl"></sl-icon>
                <h3 class="m-0" :title="element.title">{{ element.title }}</h3>
                <sl-badge v-if="element.state == 'reserved' && allowed" variant="neutral">RESERVIERT</sl-badge>
                <sl-badge v-if="element.state == 'purchased' && allowed" variant="primary">GEKAUFT</sl-badge>
                <div v-if="element.price" class="ml-auto mr-m text-mono">
                  <sl-icon name="tag" class="content-middle"></sl-icon>
                  {{ element.price }}
                </div>
              </header>
              <!-- Item information -->
              <main class="d-flex-column gap-m mb-m">
                <div v-if="element.description" class="pre-line">{{ element.description }}</div>
                <div v-if="element.links?.length">
                  <div>Hier kann man das kaufen:</div>
                  <a v-for="l in element.links" :key="l" class="d-flex align-items-center" :href="l" target="_blank">
                    <sl-icon name="link-45deg" class="shrink-0 font-l mt-3xs mr-xs"></sl-icon>
                    <span class="text-overflow-ellipsis">{{ getBaseUrl(l) }}</span>
                  </a>
                </div>
                <div v-else>
                  Für diesen Wunsch sind keine Linkvorschläge hinterlegt.
                </div>
                <div class="font-xs text-gray">
                  Erstellt am <sl-format-date :date="element.created" month="long" day="numeric" year="numeric" lang="de"></sl-format-date>
                  &middot;
                  Letzte Aktivität <sl-relative-time :date="element.modified" lang="de"></sl-relative-time>
                </div>
              </main>
              <!-- Flag and manage item -->
              <footer class="d-flex justify-end flex-wrap gap-m">
                <sl-button v-if="isAdmin" variant="danger" size="large" @click="confirmRemoval(element)">
                  <sl-icon name="trash"></sl-icon>
                </sl-button>
                <sl-button v-if="isAdmin" class="mr-auto" variant="primary" size="large" @click="editItem(element)">
                  <sl-icon name="pencil"></sl-icon>
                </sl-button>
                <sl-button-group>
                  <sl-button v-if="element.state != 'reserved'" variant="neutral" size="large" @click="confirmReserved(element)">
                    <sl-icon class="font-xl" slot="suffix" name="patch-exclamation"></sl-icon>
                    Reserviere ich
                  </sl-button>
                  <sl-button v-else variant="neutral" size="large" @click="confirmReserved(element)">
                    <sl-icon class="font-xl" slot="suffix" name="patch-minus"></sl-icon>
                    Doch nicht reserviert
                  </sl-button>
                  <sl-button v-if="element.state != 'purchased'" variant="primary" size="large" @click="confirmPurchased(element)">
                      <sl-icon class="font-xl" slot="suffix" name="cart-check"></sl-icon>
                      Habe ich gekauft
                  </sl-button>
                  <sl-button v-else variant="primary" size="large" @click="confirmPurchased(element)">
                    <sl-icon class="font-xl" slot="suffix" name="cart-dash"></sl-icon>
                    Doch nicht gekauft
                  </sl-button>
                </sl-button-group>
              </footer>
            </sl-details>
          </div>
        </template>
      </Sortable>
    </section>
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
    <!-- Admin area for list -->
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
                :value="input.list.title"
                @input="input.list.title = $event.target.value"
                placeholder="Titel der Liste"
                required
              ></sl-input>
              <sl-color-picker
                format="hex"
                :value="input.list.color"
                @input="input.list.color = $event.target.value"
              ></sl-color-picker>
            </div>
            <sl-textarea
              :value="input.list.description"
              @input="input.list.description = $event.target.value"
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
        <p>Wenn aktiviert, werden alle Reservierungen und Käufe auch in der Verwaltungsansicht der Wunschliste (geheimer Link) angezeigt.</p>
        <sl-switch @sl-change="toggleSpoiler()" :checked.prop="list.spoiler"></sl-switch>
      </div>
      <div class="danger">
        <h3>Diese Liste kann weg</h3>
        <p>Hier kann die komplette Wunschliste gelöscht werden. <strong>Das kann nicht rückgängig gemacht werden!</strong> Bist du sicher, dass du das willst?</p>
        <form @submit.prevent="deleteList()" class="d-flex-column align-items-start gap-m">
          <sl-checkbox @input="confirmListDeletion = $event.target.checked">
            Ja, ich bin mir sicher
          </sl-checkbox>
          <sl-button type="submit" variant="danger" size="large" :disabled="!confirmListDeletion">
            <sl-icon class="font-xl" slot="suffix" name="trash"></sl-icon>
            Löschen
          </sl-button>
        </form>
      </div>
    </sl-drawer>
    <!-- Dialog: item state handling reservation -->
    <sl-dialog ref="dialogReserve">
      <div slot="label">
        <span v-if="dialog.item && !isItemReserved">Möchtest du reservieren?</span>
        <span v-if="dialog.item && isItemReserved">Möchtest du die Reservierung aufheben?</span>
      </div>
      <div v-if="dialog.item && !isItemReserved">
        Damit markierst du den Wunsch «{{ dialog.item.title }}» für jeden sichtbar als reserviert.
      </div>
      <div v-if="dialog.item && isItemReserved">
        Damit entfernst du die Reservierung für den Wunsch «{{ dialog.item.title }}»
        und er wird für jeden wieder als verfügbar angezeigt.
      </div>
      <div slot="footer">
        <sl-button variant="default" @click="dialogReserve.hide()" class="mr-s" size="large">
          <sl-icon class="font-xl" slot="suffix" name="arrow-return-left"></sl-icon>
          Lieber nicht
        </sl-button>
        <sl-button v-if="dialog.item && !isItemReserved" variant="neutral" size="large" @click="toggleReserved(dialog.item)">
          <sl-icon class="font-xl" slot="suffix" name="patch-exclamation"></sl-icon>
          Ja, bitte reservieren
        </sl-button>
        <sl-button v-if="dialog.item && isItemReserved" variant="neutral" size="large" @click="toggleReserved(dialog.item)">
          <sl-icon class="font-xl" slot="suffix" name="patch-minus"></sl-icon>
          Ja, Reservierung aufheben
        </sl-button>
      </div>
    </sl-dialog>
    <!-- Dialog: item state handling reservation -->
    <sl-dialog ref="dialogPurchase">
      <div slot="label">
        <span v-if="dialog.item && !isItemPurchased">Als gekauft markieren?</span>
        <span v-if="dialog.item && isItemPurchased">Den Kauf stornieren?</span>
      </div>
      <div v-if="dialog.item && !isItemPurchased">
        Damit markierst du den Wunsch «{{ dialog.item.title }}» für jeden sichtbar als gekauft.
      </div>
      <div v-if="dialog.item && isItemPurchased">
        Damit ist der Wunsch «{{ dialog.item.title }}» nicht mehr als gekauft markiert
        und er wird für jeden wieder als verfügbar angezeigt.
      </div>
      <div slot="footer">
        <sl-button variant="default" @click="dialogPurchase.hide()" class="mr-s" size="large">
          <sl-icon class="font-xl" slot="suffix" name="arrow-return-left"></sl-icon>
          Lieber nicht
        </sl-button>
        <sl-button v-if="dialog.item && !isItemPurchased" variant="primary" size="large" @click="togglePurchased(dialog.item)">
          <sl-icon class="font-xl" slot="suffix" name="cart-check"></sl-icon>
          Ja, hab ich gekauft
        </sl-button>
        <sl-button v-if="dialog.item && isItemPurchased" variant="primary" size="large" @click="togglePurchased(dialog.item)">
          <sl-icon class="font-xl" slot="suffix" name="cart-dash"></sl-icon>
          Ja, der Kauf hat nicht geklappt
        </sl-button>
      </div>
    </sl-dialog>
    <!-- Dialog: item removal -->
    <sl-dialog ref="dialogDelete">
      <div slot="label">
        Diesen Wunsch löschen?
      </div>
      <div v-if="dialog.item">
        Damit entfernst den Wunsch «{{ dialog.item.title }}». Dieses Aktion kann nicht rückgängig gemacht werden.
      </div>
      <div slot="footer">
        <sl-button variant="default" @click="dialogDelete.hide()" class="mr-s" size="large">
          <sl-icon class="font-xl" slot="suffix" name="arrow-return-left"></sl-icon>
          Lieber nicht
        </sl-button>
        <sl-button variant="danger" size="large" @click="deleteItem(dialog.item)">
          <sl-icon class="font-xl" slot="suffix" name="trash"></sl-icon>
          Ja, kann weg
        </sl-button>
      </div>
    </sl-dialog>
  </div>
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

.admin-drawer::part(body) {
  display: flex;
  flex-direction: column;
  gap: var(--sl-spacing-2x-large);
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
</style>
