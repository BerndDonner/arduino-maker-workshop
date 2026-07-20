<script setup lang="ts">
import Toolbox from './components/Toolbox.vue';
import { onMounted, onUnmounted, ref } from 'vue';
import { useVsCodeStore } from './stores/useVsCodeStore';
import Theme from './components/Theme.vue';
import { ARDUINO_MESSAGES, THEME_COLOR } from '@shared/messages';

const store = useVsCodeStore();
const closeRequired = ref(false);

const HEARTBEAT_TIMEOUT_MS = 3000;
const HEARTBEAT_CHECK_INTERVAL_MS = 500;
let lastHeartbeatAt = Date.now();
let heartbeatCheckTimer: ReturnType<typeof setInterval> | undefined;
let heartbeatReceived = false;

function logHeartbeat(message: string, payload: Record<string, unknown> = {}) {
  console.log(`[webview heartbeat] ${message}`, payload);
  store.sendMessage({
    command: ARDUINO_MESSAGES.LOG_DEBUG,
    errorMessage: '',
    payload: JSON.stringify({ source: 'webview-heartbeat', message, ...payload })
  });
}

function handleMessageFromVsCode(event: MessageEvent) {
  const message = event.data; // The message sent from the extension

  if (message.command === ARDUINO_MESSAGES.WEBVIEW_HEARTBEAT) {
    lastHeartbeatAt = Date.now();
    if (!heartbeatReceived) {
      heartbeatReceived = true;
      logHeartbeat('first heartbeat received', {
        sequence: message.payload?.sequence,
        timeoutMs: HEARTBEAT_TIMEOUT_MS
      });
    }
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
  logHeartbeat('watchdog started', {
    timeoutMs: HEARTBEAT_TIMEOUT_MS,
    checkIntervalMs: HEARTBEAT_CHECK_INTERVAL_MS
  });

  heartbeatCheckTimer = setInterval(() => {
    const elapsedMs = Date.now() - lastHeartbeatAt;
    if (!closeRequired.value && elapsedMs >= HEARTBEAT_TIMEOUT_MS) {
      closeRequired.value = true;
      console.error('[webview heartbeat] timeout; extension connection lost', { elapsedMs });
    }
  }, HEARTBEAT_CHECK_INTERVAL_MS);

  if (import.meta.env.DEV) {
    store.sendMessage({ command: ARDUINO_MESSAGES.CHANGE_THEME_COLOR, errorMessage: "", payload: THEME_COLOR.dark });
  }
});

onUnmounted(() => {
  window.removeEventListener('message', handleMessageFromVsCode);
  if (heartbeatCheckTimer) {
    clearInterval(heartbeatCheckTimer);
    heartbeatCheckTimer = undefined;
  }
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
