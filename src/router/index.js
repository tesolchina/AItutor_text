// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Chat from '../views/Chat.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    // Dynamic route for text-based chatbot
    // It captures part of the URL as a variable named 'botId'.
    path: '/chat/:botId',
    name: 'Chat',
    component: Chat,
    // We pass the route params (like botId) as props to the component.
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
