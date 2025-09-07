<template>
  <div class="flex h-screen items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-gray-800">
    <div class="bg-white/90 backdrop-blur-xl p-10 rounded-2xl shadow-2xl space-y-6 w-full max-w-lg">
      <h1 class="text-2xl font-bold text-center text-indigo-700">
        💬 Choose Your Chatbot
      </h1>
      <p class="text-center text-gray-500">
        Select a chatbot to start a text conversation.
      </p>

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
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useChatbotStore } from '../components/chatbotStore';

const router = useRouter();
const chatbotStore = useChatbotStore();

onMounted(() => {
  chatbotStore.loadBots();
});

// Function to navigate to text-based chat only
function chooseBot(bot) {
  // Navigate to the chatbot URL for text-based conversation
  router.push({ name: 'Chat', params: { botId: bot.id } });
}
</script>
