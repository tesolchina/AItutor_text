<template>
  <div class="flex h-screen items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-gray-800">
    <div class="bg-white/90 backdrop-blur-xl p-10 rounded-2xl shadow-2xl space-y-6 w-full max-w-lg">
      <h1 class="text-2xl font-bold text-center text-indigo-700">
        🤖 Choose Your Chatbot
      </h1>
      <p class="text-center text-gray-500">
        Select a chatbot to start a conversation.
      </p>

      <div class="flex justify-center items-center space-x-2">
        <span :class="['font-semibold transition-colors', isAvatarMode ? 'text-gray-400' : 'text-indigo-700']">Chatbot</span>
        <button
          @click="toggleMode"
          :class="['relative inline-flex h-6 w-11 items-center rounded-full transition-colors', isAvatarMode ? 'bg-purple-600' : 'bg-gray-200']"
        >
          <span
            :class="['inline-block h-4 w-4 transform rounded-full bg-white transition-transform', isAvatarMode ? 'translate-x-6' : 'translate-x-1']"
          ></span>
        </button>
        <span :class="['font-semibold transition-colors', isAvatarMode ? 'text-purple-700' : 'text-gray-400']">Avatar</span>
      </div>

      <div class="space-y-4">
        <button
          v-for="bot in chatbotStore.availableBots"
          :key="bot.id"
          :class="['w-full p-5 rounded-xl bg-gradient-to-r text-white font-semibold shadow hover:opacity-90 transition', bot.styleClass]"
          @click="chooseBot(bot)"
        >
          {{ bot.name }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useChatbotStore } from '../components/chatbotStore';

const router = useRouter();
const chatbotStore = useChatbotStore();

// A reactive variable to control the mode (Chatbot or Avatar)
const isAvatarMode = ref(false);

onMounted(() => {
  chatbotStore.loadBots();
});

// Toggles the isAvatarMode variable
function toggleMode() {
  isAvatarMode.value = !isAvatarMode.value;
}

// Function to handle navigation based on the selected mode
function chooseBot(bot) {
  if (isAvatarMode.value) {
    // Navigate to the avatar URL
    router.push({ name: 'Avatar', params: { avatarId: bot.id } });
  } else {
    // Navigate to the chatbot URL
    router.push({ name: 'Chat', params: { botId: bot.id } });
  }
}
</script>