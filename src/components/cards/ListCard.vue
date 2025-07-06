<script setup lang="ts">
import { List } from '@/types/global';
import { useRouter } from 'vue-router';

const router = useRouter();

// Component emits
const emit = defineEmits(['delete']);

// Component properties
interface Props {
  list: List,
}
defineProps<Props>();
</script>
<template>
  <sl-card :style="{ background: `linear-gradient(135deg, ${list.color} 0%, ${list.color} 24px, transparent 24px)` }">
    <div class="text-overflow-ellipsis">{{ list.title }}</div>
    <div class="font-xs">
      Erstellt <sl-relative-time :date="list.created" lang="de"></sl-relative-time>
      am <sl-format-date :date="list.created" month="long" day="numeric" year="numeric" lang="de"></sl-format-date>
    </div>
    <div slot="footer" class="font-xl d-flex justify-space-between">
      <sl-tooltip content="Eintrag löschen" placement="bottom">
        <sl-button variant="danger" size="large" @click="emit('delete', list.slug_public)" outline>
          <sl-icon name="trash"></sl-icon>
        </sl-button>
      </sl-tooltip>
      <sl-button-group>
        <sl-tooltip content="Geteilte Ansicht" placement="bottom">
          <sl-button
            variant="default"
            size="large"
            @click="router.push({ name: 'list', params: { public: list.slug_public }})"
          >
            <sl-icon name="share"></sl-icon>
          </sl-button>
        </sl-tooltip>
        <sl-tooltip content="Liste bearbeiten" placement="bottom">
          <sl-button
            variant="default"
            size="large"
            @click="router.push({ name: 'list', params: { public: list.slug_public, private: list.slug_private }})"
          >
            <sl-icon name="pencil"></sl-icon>
          </sl-button>
        </sl-tooltip>
      </sl-button-group>
    </div>
  </sl-card>
</template>
