<script setup lang="ts">
import Toolbox from './components/Toolbox.vue';
import { onMounted, onUnmounted, ref } from 'vue';
import { useVsCodeStore } from './stores/useVsCodeStore';
import Theme from './components/Theme.vue';
import { ARDUINO_MESSAGES, THEME_COLOR } from '@shared/messages';

const store = useVsCodeStore();
const closeRequired = ref(false);

function handleMessageFromVsCode(event: MessageEvent) {
  const message = event.data; // The message sent from the extension

  if (message.command === ARDUINO_MESSAGES.WEBVIEW_CLOSE_REQUIRED) {
    closeRequired.value = true;
    store.sendMessage({
      command: ARDUINO_MESSAGES.WEBVIEW_CLOSE_ACKNOWLEDGED,
      errorMessage: '',
      payload: { state: 'close-required' }
    });
    return;
  }

  // Use the store action to handle the message
  if (import.meta.env.DEV) {
    store.mockMessage(message);
  } else {
    store.handleMessage(message);
  }
}

onMounted(() => {
  window.addEventListener('message', handleMessageFromVsCode);
  if (import.meta.env.DEV) {
    store.sendMessage({ command: ARDUINO_MESSAGES.CHANGE_THEME_COLOR, errorMessage: "", payload: THEME_COLOR.dark });
  }
});

onUnmounted(() => {
  window.removeEventListener('message', handleMessageFromVsCode);
});

</script>

<template>
  <Theme></Theme>
  <v-app v-if="closeRequired">
    <v-main class="d-flex align-center justify-center">
      <v-container class="text-center">
        <v-icon size="64" class="mb-4">mdi-close-circle-outline</v-icon>
        <h1 class="text-h5 mb-2">Webview no longer active</h1>
        <p class="text-body-1">Close this tab and reopen Arduino Maker Workshop.</p>
      </v-container>
    </v-main>
  </v-app>
  <v-app v-else-if="store.currentTheme">
    <Toolbox></Toolbox>
    <v-main>
      <router-view></router-view>
    </v-main>
  </v-app>
  <v-progress-linear v-else color="grey" indeterminate></v-progress-linear>
</template>
