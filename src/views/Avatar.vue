<template>
  <div
    v-if="selectedBot"
    class="flex h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-gray-800"
  >
    <LeftSidebar
      :isOpen="isSidebarOpen"
      :systemPrompt="systemPrompt"
      :welcomePrompt="welcomePrompt"
      :model="model"
      :apiKey="apiKey"
      :isConnected="isConnected"
      @update:isOpen="(val) => (isSidebarOpen = val)"
      @update:apiKey="(val) => (apiKey = val)"
      @update:model="(val) => (model = val)"
      @connectAPI="connectAPI"
      @clearAPI="clearAPI"
    />

    <div
      class="flex flex-col flex-1 bg-white shadow-lg overflow-hidden transition-all duration-300"
      :class="{ 'mr-80': isRightSidebarOpen }"
    >
      <div
        class="chat-header flex justify-between items-center p-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
      >
        <div>
          <h1 class="text-xl font-bold">{{ selectedBot.name }}</h1>
          <div class="text-sm opacity-80">🎙️ Speak with your AI assistant</div>
        </div>
        <div class="flex gap-2">
          <button
            class="bg-white/20 px-3 py-1 rounded-lg hover:bg-white/30"
            @click="isSidebarOpen = !isSidebarOpen"
          >
            {{ isSidebarOpen ? "⬅ Hide Left" : "➡ Show Left" }}
          </button>
          <button
            class="bg-white/20 px-3 py-1 rounded-lg hover:bg-white/30"
            @click="isRightSidebarOpen = !isRightSidebarOpen"
          >
            {{ isRightSidebarOpen ? "Hide Right ➡" : "⬅ Show Right" }}
          </button>
          <button
            class="new-session-btn bg-white/20 px-3 py-1 rounded-lg hover:bg-white/30"
            @click="startNewSession"
          >
            🔄 New Session
          </button>
          <button
            class="bg-white/20 px-3 py-1 rounded-lg hover:bg-white/30"
            @click="goBack()"
          >
            ⬅ Back
          </button>
        </div>
      </div>

      <div class="chat-messages flex-1 overflow-y-auto p-5 space-y-4">
        <div
          v-for="(msg, i) in chatHistory"
          :key="i"
          class="flex"
          :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl shadow text-base break-words"
            :class="
              msg.role === 'user'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-none'
                : 'bg-gray-100 border border-gray-200 text-gray-800 rounded-bl-none'
            "
          >
            <div class="font-semibold text-xs mb-1">
              {{ msg.role === "user" ? "👤 You" : "🤖 Assistant" }}
            </div>
            <div class="text-base whitespace-pre-wrap">
              {{ msg.content }}
            </div>
            <div class="text-xs text-gray-400 mt-2 text-right">
              {{ msg.timestamp.toLocaleTimeString() }}
            </div>
          </div>
        </div>
      </div>

      <div class="chat-input-container p-4 border-t bg-gray-50 relative">
        <div
          v-if="!isConnected"
          class="absolute inset-0 flex items-center justify-center bg-white/70 text-gray-600 text-sm font-medium z-10"
        >
          🔑 Please connect your API key first
        </div>

        <div class="flex justify-end mb-4">
          <div class="flex items-center space-x-2">
            <span class="text-sm font-medium text-gray-700">Audio Mode</span>
            <button
              @click="inputMode = inputMode === 'audio' ? 'text' : 'audio'"
              :class="[
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                inputMode === 'audio' ? 'bg-indigo-600' : 'bg-gray-200',
              ]"
            >
              <span
                :class="[
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  inputMode === 'audio' ? 'translate-x-6' : 'translate-x-1',
                ]"
              ></span>
            </button>
            <span class="text-sm font-medium text-gray-700">Text Mode</span>
          </div>
        </div>

        <div v-if="inputMode === 'audio'">
          <div class="flex justify-center">
            <button
              class="px-6 py-3 rounded-full bg-red-500 text-white text-lg font-bold shadow-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              :disabled="!isConnected || isPlaying || isRecognizing"
              @click="toggleRecording"
            >
              {{ isRecording ? "⏹ Stop" : "🎤 Speak" }}
            </button>
          </div>
          <div class="mt-4 flex justify-center" v-if="audioUrl">
            <audio
              :src="audioUrl"
              autoplay
              @play="
                isPlaying = true;
                avatarState = 'speaking';
              "
              @ended="
                isPlaying = false;
                avatarState = 'idle';
              "
            ></audio>
          </div>
        </div>

        <div v-else class="flex items-center space-x-2">
          <input
            v-model="userText"
            @keyup.enter="sendTextToChatbot"
            type="text"
            placeholder="Type your message..."
            class="flex-1 p-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow disabled:bg-gray-100"
            :disabled="!isConnected || isLoading"
          />
          <button
            @click="sendTextToChatbot"
            :disabled="!isConnected || !userText.trim() || isLoading"
            class="px-6 py-3 rounded-full bg-indigo-600 text-white font-bold shadow-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
          <button
            class="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed shadow transition transform hover:scale-105"
            :disabled="!chatHistory || chatHistory.length === 0"
            @click="showReport = true"
            title="Finish & View Report"
          >
            ✓
          </button>
        </div>
      </div>
      <!-- Modals (no changes here) -->
      <ReportModal
        :show="showReport"
        :chatHistory="chatHistory"
        :userCount="userCount"
        :assistantCount="assistantCount"
        :botName="selectedBot.name"
        @close="showReport = false"
      />
    </div>

    <aside
      class="fixed right-0 top-0 h-full bg-white/90 backdrop-blur shadow-xl flex flex-col items-center justify-center border-l w-80 transition-all duration-300 ease-in-out"
      :class="isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full'"
    >
      <AvatarComponent :state="avatarState" />
    </aside>
  </div>

  <div
    v-else
    class="flex h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 items-center justify-center"
  >
    <div class="flex items-center justify-center space-x-3">
      <svg
        class="animate-spin h-8 w-8 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      <span class="text-white text-2xl font-semibold">Loading Chatbot...</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useChatbotStore } from "../components/chatbotStore";
import { io } from "socket.io-client";
import { BASE_URL } from "../components/base_url";
import audioBufferToWav from "audiobuffer-to-wav";
import AvatarComponent from "../components/avatar/AvatarComponent.vue";
import LeftSidebar from "../components/avatar/LeftSidebar.vue";
import ReportModal from "../components/ReportModal.vue";

const props = defineProps({ avatarId: { type: String, required: true } });
const router = useRouter();
const chatbotStore = useChatbotStore();
const selectedBot = computed(() =>
  chatbotStore.availableBots.find((b) => b.id === props.avatarId)
);
const assistantCount = computed(
  () => chatHistory.value.filter((m) => m.role === "assistant").length
);
const chatHistory = ref([]);
const apiKey = ref("");
const systemPrompt = ref("");
const welcomePrompt = ref("");
const model = ref("");
const isConnected = ref(false);
const isSidebarOpen = ref(true);
const avatarState = ref("idle");
const isRecording = ref(false);
const isPlaying = ref(false);
const audioUrl = ref(null);
const isRecognizing = ref(false);
const isRightSidebarOpen = ref(true);
const inputMode = ref("audio"); // 'audio' or 'text'
const userText = ref("");
const isLoading = ref(false);
const showReport = ref(false);

let mediaRecorder = null;
let audioChunks = [];
let socket = null;
let chunks = [];

const userCount = computed(
  () => chatHistory.value.filter((m) => m.role === "user").length
);

onMounted(async () => {
  await chatbotStore.loadBots();
  if (!selectedBot.value) {
    router.push("/");
    return;
  }

  systemPrompt.value = selectedBot.value.systemPrompt;
  welcomePrompt.value = selectedBot.value.welcomePrompt;
  model.value = selectedBot.value.model;

  const savedApiKey = localStorage.getItem("chatbot_api_key");
  if (savedApiKey) {
    apiKey.value = savedApiKey;
    connectAPI(true);
  }
});

function goBack() {
  router.push("/");
}

function connectAPI(isAutoConnect = false) {
  if (!apiKey.value) return;
  localStorage.setItem("chatbot_api_key", apiKey.value);
  isConnected.value = true;
  if (chatHistory.value.length === 0) {
    chatHistory.value.push({
      role: "assistant",
      content: welcomePrompt.value,
      timestamp: new Date(),
    });
  }
  connectWebSocket();
}

function clearAPI() {
  localStorage.removeItem("chatbot_api_key");
  apiKey.value = "";
  isConnected.value = false;
  chatHistory.value = [];
}

function connectWebSocket() {
  socket = io(`${BASE_URL}/streaming-avatar`, { transports: ["websocket"] });

  socket.on("connect", () => {
    console.log("WS connected");
    chunks = [];
  });
  socket.on("audio_chunk", (chunk) => {
    if (chunk instanceof ArrayBuffer) chunks.push(new Uint8Array(chunk));
  });

  socket.on("audio_complete", () => {
    console.log("Audio complete, total chunks:", chunks.length);
    const blob = new Blob(chunks, { type: "audio/mpeg" });
    audioUrl.value = URL.createObjectURL(blob);
    chunks = [];
    isRecognizing.value = false;
  });
  socket.on("stt_result", (result) => {
    if (result && typeof result.text === "string") {
      chatHistory.value.push({
        role: "user",
        content: result.text,
        timestamp: new Date(),
      });

      // Call Flask streaming endpoint
      sendUserAudioMessage(result.text);
    }
  });

  socket.on("disconnect", () => {
    console.log("WS disconnected");
  });
}

async function toggleRecording() {
  if (!isRecording.value) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
    mediaRecorder.onstop = sendAudioToBackend;
    mediaRecorder.start();
    isRecording.value = true;
    avatarState.value = "listening";
  } else {
    mediaRecorder.stop();
    isRecording.value = false;
    avatarState.value = "thinking";
  }
}

async function sendAudioToBackend() {
  const blob = new Blob(audioChunks, { type: "audio/webm" });
  const arrayBuffer = await blob.arrayBuffer();

  // Decode WebM → AudioBuffer
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  // Convert AudioBuffer → WAV
  const wavArrayBuffer = audioBufferToWav(audioBuffer);
  const wavBlob = new Blob([wavArrayBuffer], { type: "audio/wav" });

  if (socket && socket.connected) {
    socket.emit("user_audio", await wavBlob.arrayBuffer()); // send WAV
    isRecognizing.value = true;
  }

  // reset
  audioChunks = [];
}

function startNewSession() {
  chatHistory.value = [];
  if (isConnected.value) {
    chatHistory.value.push({
      role: "assistant",
      content: welcomePrompt.value,
      timestamp: new Date(),
    });
  }
}

function sendUserAudioMessage(userText) {
  if (!isConnected.value || !userText.trim() || !socket) return;
  // Add a placeholder assistant reply while waiting
  chatHistory.value.push({
    role: "assistant",
    content: "⏳ Avatar is thinking...",
    timestamp: new Date(),
  });
  const msgIndex = chatHistory.value.length - 1;

  // Send through websocket
  socket.emit("user_message", {
    text: userText,
    system_prompt: systemPrompt.value,
    api_key: apiKey.value,
    model: model.value,
    history: chatHistory.value.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  // Listen for assistant reply
  socket.once("assistant_reply", (reply) => {
    chatHistory.value[msgIndex] = {
      ...chatHistory.value[msgIndex],
      content: reply?.content || "[No response]",
      timestamp: new Date(),
    };
  });
}

async function sendTextToChatbot() {
  if (!isConnected.value || !userText.value.trim() || isLoading.value) {
    return;
  }

  const message = userText.value.trim();

  // Add the user's message to chat history
  chatHistory.value.push({
    role: "user",
    content: message,
    timestamp: new Date(),
  });

  // Clear the input field
  userText.value = "";

  // Add a placeholder for the assistant's reply
  chatHistory.value.push({
    role: "assistant",
    content: "⏳ Thinking...",
    timestamp: new Date(),
  });
  const assistantMessageIndex = chatHistory.value.length - 1;

  isLoading.value = true;
  avatarState.value = "thinking";

  try {
    const response = await fetch(`${BASE_URL}/chatbot/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Corrected payload keys to match backend
        chat_history: chatHistory.value.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        api_key: apiKey.value,
        model_name: model.value,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Extract the content from the API response
    const assistantReply =
      data?.choices?.[0]?.message?.content || data?.error || "[No response]";

    // Update the placeholder with the actual assistant reply
    chatHistory.value[assistantMessageIndex] = {
      role: "assistant",
      content: assistantReply,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("Error sending text to chatbot:", error);
    chatHistory.value[assistantMessageIndex] = {
      role: "assistant",
      content: "❌ Sorry, an error occurred. Please try again.",
      timestamp: new Date(),
    };
  } finally {
    isLoading.value = false;
    avatarState.value = "idle";
  }
}
</script>
