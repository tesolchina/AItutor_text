<template>
  <q-dialog v-model="isShowOCR">
    <q-card style="min-width: 50%">
      <q-card-section class="column">
        <div class="text-h6 q-pa-md">Upload Image to OCR</div>
        <div class="q-pa-md">
          <q-file
            outlined
            v-model="uploadedImageToOCR"
            label="Select Image"
            accept=".jpg, .png, .jpeg"
            :max-file-size="10485760"
            @rejected="rejectUploadedImage"
            clearable
          >
            <template v-slot:prepend>
              <q-icon name="attach_file" />
            </template>
          </q-file>
        </div>
        <div class="q-px-md column items-center">
          <q-btn
            no-caps
            flat
            label="Upload and OCR"
            color="primary"
            @click="UploadImageAndOCR"
            :disable="isUploadingImage"
          />
        </div>
        <div class="q-pa-md">
          <q-input
            outlined
            v-model="ocrResult"
            placeholder="OCR Result"
            type="textarea"
            input-style="resize: none;"
          />
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn no-caps flat label="Attach to Chat" color="primary" @click="AttachOCRResultToChat" />
        <q-btn
          no-caps
          flat
          label="Cancel"
          color="primary"
          v-close-popup
          @click="onClickCancelUploadImage"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
  <q-dialog v-model="isShowAttachFile">
    <q-card style="min-width: 300px">
      <q-card-section>
        <div class="text-h6">Attach File</div>
      </q-card-section>

      <q-card-section>
        <q-file
          outlined
          v-model="attachedFile"
          label="Select File"
          accept=".pdf, .docx"
          clearable
          :max-file-size="10485760"
          @rejected="rejectAttachedFile"
        >
          <template v-slot:prepend>
            <q-icon name="attach_file" />
          </template>
        </q-file>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="primary" v-close-popup />
        <q-btn
          flat
          label="Attach"
          color="primary"
          @click="onConfirmAttachFile"
          :disable="!attachedFile"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
  <q-dialog v-model="showRatingDialog" persistent>
    <q-card style="min-width: 300px; max-width: 95vw">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">Session Rating</div>
      </q-card-section>

      <q-card-section class="q-pt-lg">
        <div class="text-center q-mb-lg">
          <div class="text-subtitle1 q-mb-md">How would you rate this session?</div>
          <q-rating
            v-model="userRating"
            size="3em"
            color="orange"
            icon="star_border"
            icon-selected="star"
          />
        </div>

        <q-input
          outlined
          v-model="userTextFeedback"
          label="Share your thoughts (optional)"
          hint="Your feedback helps us improve"
          type="textarea"
          autogrow
          :rows="3"
          class="q-mt-md"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          label="Cancel"
          color="primary"
          v-close-popup
          @click="showRatingDialog = false"
        />
        <q-btn
          flat
          label="Submit"
          color="primary"
          @click="submitRating"
          :disable="userRating === 0"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
  <q-dialog v-model="showEditDialog" persistent>
    <q-card style="min-width: 300px; max-width: 95vw">
      <q-card-section>
        <div class="text-h6">Edit Message</div>
      </q-card-section>
      <q-card-section>
        <q-input
          outlined
          v-model="editedText"
          label="Edit your message"
          type="textarea"
          input-style="resize: none;"
        />
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Cancel" v-close-popup @click="onCancelEdit" />
        <q-btn
          flat
          label="Save"
          color="primary"
          @click="saveEditedMessage"
          :loading="isSavingEdit"
          :disable="!isValidEdit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
  <q-page v-if="!isFetching">
    <div class="q-banner text-h6 q-pa-md row justify-between">
      <div>{{ moduleTitle }} - {{ selectedChatbot.chatbot_name }} - {{ sessionName }}</div>
      <q-space />
    </div>
    <div class="row justify-center">
      <div
        class="conversation-wrapper col-12 col-sm-10 col-md-8 col-lg-6"
        :style="conversationWrapperStyle"
      >
        <div class="row q-mt-md q-pa-md conversation-container" ref="conversationContainer">
          <div class="col-12">
            <div v-for="message in conversation" :key="message.id" class="q-mb-md">
              <q-chat-message
                :name="message.name"
                :avatar="message.avatar"
                :sent="message.sent"
                :text-color="message.textColor"
                :bg-color="message.bgColor"
              >
                <div class="message-container">
                  <div v-html="markdown.render(message.text)"></div>
                  <div class="message-actions">
                    <q-btn flat dense size="xs" round icon="more_vert" color="grey-6">
                      <q-menu>
                        <q-list style="min-width: 150px">
                          <q-item clickable v-close-popup @click="copyMessage(message)">
                            <q-item-section avatar>
                              <q-icon name="content_copy" color="primary" />
                            </q-item-section>
                            <q-item-section>Copy Message</q-item-section>
                          </q-item>
                          <q-item
                            v-if="hasHTMLContent(message)"
                            clickable
                            v-close-popup
                            @click="previewDocumentFromMessage(message)"
                          >
                            <q-item-section avatar>
                              <q-icon name="description" color="primary" />
                            </q-item-section>
                            <q-item-section>Preview Document</q-item-section>
                          </q-item>
                          <q-item
                            v-if="message.sent"
                            clickable
                            v-close-popup
                            @click="editMessage(message)"
                          >
                            <q-item-section avatar>
                              <q-icon name="edit" color="primary" />
                            </q-item-section>
                            <q-item-section>Edit Message</q-item-section>
                          </q-item>
                          <q-item clickable v-close-popup @click="deleteMessage(message)">
                            <q-item-section avatar>
                              <q-icon name="delete" color="negative" />
                            </q-item-section>
                            <q-item-section>Delete Message</q-item-section>
                          </q-item>
                          <q-item
                            v-if="message.sent"
                            clickable
                            v-close-popup
                            @click="resendMessage(message)"
                          >
                            <q-item-section avatar>
                              <q-icon name="refresh" color="primary" />
                            </q-item-section>
                            <q-item-section>Resend Message</q-item-section>
                          </q-item>
                        </q-list>
                      </q-menu>
                    </q-btn>
                  </div>
                </div>
              </q-chat-message>
            </div>
            <!-- Streaming message display -->
            <div v-if="isStreamingButtonVisible" class="q-mb-md">
              <q-chat-message
                name="Chatbot"
                avatar="avatar/chatbot.png"
                :sent="false"
                text-color="black"
                bg-color="grey-4"
              >
                <div class="message-container">
                  <div v-html="markdown.render(streamingMessage)"></div>
                  <div class="message-actions" v-if="analyzeMessageForHTML(streamingMessage).hasHTML">
                    <q-btn
                      flat
                      dense
                      size="xs"
                      round
                      icon="description"
                      color="primary"
                      @click="previewStreamingDocument"
                    >
                      <q-tooltip>Preview Document</q-tooltip>
                    </q-btn>
                  </div>
                </div>
              </q-chat-message>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="row justify-center">
      <div class="input-wrapper col-12 col-sm-10 col-md-8 col-lg-6">
        <div class="input-container q-pa-md">
          <div class="row items-center">
            <q-input
              outlined
              autofocus
              v-model="newMessage"
              :placeholder="getMessageBoxPlaceholderText()"
              class="col q-mb-sm"
              type="textarea"
              :input-style="{
                resize: 'none',
                minHeight: isInputExpanded ? '130px' : '20px',
                transition: 'min-height 0.3s ease',
              }"
              :rows="isInputExpanded ? 5 : 1"
              @keydown="handleKeydown"
              :disable="isDisableMessageBox"
            />
            <q-btn
              flat
              round
              :icon="isInputExpanded ? 'unfold_less' : 'unfold_more'"
              class="q-ml-sm"
              @click="toggleInputExpand"
              :disable="isDisableMessageBox"
            >
              <q-tooltip>{{ isInputExpanded ? 'Collapse' : 'Expand' }} input</q-tooltip>
            </q-btn>
          </div>
          <div class="row items-center q-gutter-sm">
            <q-btn flat round icon="attach_file" @click="onClickAttachFile">
              <q-tooltip>Attach File</q-tooltip>
            </q-btn>
            <q-btn flat round icon="image" @click="onClickUploadImage">
              <q-tooltip>Upload Image to OCR</q-tooltip>
            </q-btn>
            <q-btn
              flat
              round
              icon="public"
              @click="onClickToggleWebSearch"
              :color="isWebSearchEnabled ? 'primary' : ''"
            >
              <q-tooltip>Toggle Web Search</q-tooltip>
            </q-btn>
            <q-btn
              flat
              round
              icon="stream"
              @click="onClickToggleStreaming"
              :color="isStreamingEnabled ? 'primary' : ''"
            >
              <q-tooltip>Toggle Streaming Mode</q-tooltip>
            </q-btn>
            <q-btn flat round icon="ios_share" @click="onClickShareChat">
              <q-tooltip>Share Chat</q-tooltip>
            </q-btn>
            <q-btn
              flat
              round
              icon="play_circle_filled"
              @click="handleQuickReply('generate')"
              v-if="selectedChatbot.type_name === 'VideoGeneratorChatBot'"
            >
              <q-tooltip>Generate Video</q-tooltip>
            </q-btn>
            <q-space />
            <q-btn
              v-if="showQuickReplyButton && newMessage == ''"
              flat
              round
              icon="quickreply"
              color="primary"
              :loading="isSending"
              :disable="isSending || isDisableMessageBox"
            >
              <q-tooltip>Quick Reply</q-tooltip>
              <q-menu>
                <q-list>
                  <q-item
                    v-if="showMenuOption"
                    clickable
                    v-close-popup
                    @click="handleQuickReply('menu')"
                  >
                    <q-item-section>Menu</q-item-section>
                  </q-item>
                  <q-item
                    v-if="showDoneOption"
                    clickable
                    v-close-popup
                    @click="handleQuickReply('done')"
                  >
                    <q-item-section>Done</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
            <q-btn
              v-else
              flat
              round
              icon="send"
              @click="onClickSendMessage"
              color="primary"
              :loading="isSending"
              :disable="isSending || isDisableMessageBox"
            >
              <q-tooltip>Send Message</q-tooltip>
            </q-btn>
            <q-btn
              v-if="isStreamingButtonVisible"
              flat
              round
              icon="stop"
              @click="stopStreaming"
              color="negative"
            >
              <q-tooltip>Stop Streaming</q-tooltip>
            </q-btn>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, computed, onUnmounted, inject } from 'vue';
import { useRoute } from 'vue-router';
import { api } from 'boot/axios';
import { useQuasar, type QRejectedEntry } from 'quasar';
import { convertApiConversationToConversation } from 'src/utils/session';
import MarkdownIt from 'markdown-it';
import MarkdownItKatex from 'markdown-it-katex';
import type { Ref } from 'vue';
import { analyzeMessageForHTML, addDocument, resetDocumentPreview, previewState, removeDocument, switchToDocument, type DocumentItem } from 'src/utils/documentPreview';
const markdown = new MarkdownIt();
markdown.use(MarkdownItKatex);
const route = useRoute();
const $q = useQuasar();

interface Message {
  id: number;
  text: string;
  name: string;
  avatar: string;
  sent: boolean;
  textColor: string;
  bgColor: string;
}

const getStringParam = (param: string | string[]): string => {
  return Array.isArray(param) ? param[0] || '' : param;
};

// The conversation array contains messages that will be displayed in the chat
const conversation = ref([
  {
    id: 1,
    text: 'Hello! How can I help you today?',
    name: 'Chatbot',
    avatar: 'avatar/chatbot.png',
    sent: false,
    textColor: 'black',
    bgColor: 'grey-4',
  },
]);

// The apiConversation array contains messages that will be sent to the server
const apiConversation = ref<ApiMessage[]>([
  {
    role: 'system',
    content: 'Hello! How can I help you today?',
  },
  {
    role: 'assistant',
    content: 'Hello! How can I help you today?',
  },
]);

// interface Message {
//   id: number;
//   text: string;
//   name: string;
//   avatar: string;
//   sent: boolean;
// }

// const convertConversationToApiConversation = (conversation: Message[]) => {
//   return conversation.map(message => {
//     // Determine the role based on message's sent status and name
//     let role;
//     if (message.name === 'Chatbot') {
//       role = 'assistant';
//     } else if (message.name === 'User') {
//       role = 'user';
//     } else {
//       role = 'system'; // Default role if not Chatbot or User
//     }

//     return {
//       role: role,
//       content: message.text
//     };
//   });
// };

const isFetching = ref(true);
const isSending = ref(false);
const isShowOCR = ref(false);
const isShowAttachFile = ref(false);
const isUploadingImage = ref(false);

// const isShowAttachFile = ref(false);
const attachedFile = ref<File | null>(null);
const uploadedImageToOCR = ref<File | null>(null);
const isWebSearchEnabled = ref(false);
const isDisableMessageBox = ref(false);

// Streaming related variables
const isStreaming = ref(false);
const streamingMessage = ref('');
const streamingMessageId = ref(0);
const isStreamingEnabled = ref(true); // Default to enabled
const shouldStopStreaming = ref(false); // Add this line for stop streaming control
const isStreamingButtonVisible = ref(false);

const ocrResult = ref('');

const newMessage = ref('');

const sessionId = ref('');
const sessionName = ref('');
const moduleTitle = ref('');

interface Chatbot {
  chatbot_id: string;
  id: number;
  created_at: string;
  chatbot_name: string;
  model_name: string;
  system_prompt: string;
  welcome_prompt: string;
  temperature: number;
  type_name: string;
  description: JSON;
  knowledge_base_persist_directory: string;
  knowledge_base_file_paths: string[];
  knowledge_base_file_names: string[];
  knowledge_base_embedding_model: string;
  updated_at: string;
  deleted_at: string;
}

const selectedChatbot = ref<Chatbot>({
  chatbot_id: '',
  id: 0,
  created_at: '',
  chatbot_name: '',
  model_name: '',
  system_prompt: '',
  welcome_prompt: '',
  temperature: 0,
  type_name: '',
  description: JSON.parse('{}'),
  knowledge_base_persist_directory: '',
  knowledge_base_file_paths: [],
  knowledge_base_file_names: [],
  knowledge_base_embedding_model: '',
  updated_at: '',
  deleted_at: '',
});
const selectedChatbotId = ref('');

// Add new interfaces for the API conversation types
interface ApiMessage {
  role: string;
  content: string;
}

interface ChatbotDetail {
  chatbot_id: string;
  id: number;
  created_at: string;
  chatbot_name: string;
  model_name: string;
  system_prompt: string;
  welcome_prompt: string;
  temperature: number;
  type_name: string;
  description: JSON;
  knowledge_base_persist_directory: string;
  knowledge_base_file_paths: string[];
  knowledge_base_file_names: string[];
  knowledge_base_embedding_model: string;
  updated_at: string;
  deleted_at: string;
}

interface ConversationMessage {
  id: number;
  text: string;
  name: string;
  avatar: string;
  sent: boolean;
  textColor: string;
  bgColor: string;
}

// Update the SessionCache interface
interface SessionCache {
  timestamp: number;
  conversation: ConversationMessage[];
  apiConversation: ApiMessage[];
  chatbot: Chatbot; // We already have the Chatbot interface defined
}

// Define the SessionCache interface
interface SessionCache {
  timestamp: number;
  conversation: ConversationMessage[];
  apiConversation: ApiMessage[];
  chatbot: Chatbot;
}

// Create the session cache object
const sessionCache = new Map<string, SessionCache>();

// Cache expiration time (ms) - set to 30 minutes
const CACHE_EXPIRY = 30 * 60 * 1000;

// Function to clean up expired cache
const cleanExpiredCache = () => {
  const now = Date.now();
  for (const [key, value] of sessionCache.entries()) {
    if (now - value.timestamp > CACHE_EXPIRY) {
      sessionCache.delete(key);
    }
  }
};

// Clean up expired cache periodically
let cleanupInterval: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  cleanupInterval = setInterval(cleanExpiredCache, 5 * 60 * 1000);
  void addCopyButtons();
});

// Clean up the timer when the component is unmounted
onUnmounted(() => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
});

// Modify the fetchSessionInfo function to add cache logic
const fetchSessionInfo = async (sessionIdValue: string, selectedChatbotValue: Chatbot) => {
  // Reset conversation state before fetching new session
  conversation.value = [];
  apiConversation.value = [];
  streamingMessage.value = '';
  isStreaming.value = false;

  // Generate the cache key
  const cacheKey = `${sessionIdValue}-${selectedChatbotValue.chatbot_id}`;

  // Check if the cache exists and is not expired
  const cachedData = sessionCache.get(cacheKey);
  const now = Date.now();

  if (cachedData && now - cachedData.timestamp < CACHE_EXPIRY) {
    // Use the cached data
    apiConversation.value = cachedData.apiConversation;
    conversation.value = cachedData.conversation;
    selectedChatbot.value = cachedData.chatbot;
    return;
  }

  // If there is no cache or it has expired, fetch the data from the server
  const response = await api.get('/chat-session', {
    params: {
      session_id: sessionIdValue,
    },
  });

  // Handle the conversation data
  // When conversation is null, it means the session is new
  if (!response.data.conversation) {
    // We need to build the apiConversation array from the system prompt and welcome prompt
    apiConversation.value = [
      {
        role: 'system',
        content: selectedChatbotValue.system_prompt,
      },
    ];
    // If the chatbot has a welcome prompt, add it to the apiConversation array
    if (selectedChatbotValue.welcome_prompt !== '') {
      apiConversation.value.push({
        role: 'assistant',
        content: selectedChatbotValue.welcome_prompt,
      });
    }
  } else {
    // When conversation is not null, we need to update the apiConversation array with the fetched data
    apiConversation.value = response.data.conversation;
  }
  // Update the conversation with the fetched data
  conversation.value = convertApiConversationToConversation(apiConversation.value);

  // Update the cache
  sessionCache.set(cacheKey, {
    timestamp: now,
    conversation: conversation.value,
    apiConversation: apiConversation.value,
    chatbot: selectedChatbotValue,
  });
};

const fetchChatbotInfo = async (selectedChatbotIdValue: string) => {
  // Fetch chatbot information from the server
  const response = await api.get('/chatbot', {
    params: {
      chatbot_id: selectedChatbotIdValue,
    },
  });
  // Update the selectedChatbot with the fetched data
  selectedChatbot.value = response.data;
};

const copyMessage = async (message: Message) => {
  try {
    await navigator.clipboard.writeText(message.text); // 复制消息文本到剪贴板
    $q.notify({
      type: 'positive',
      message: 'Message copied to clipboard!', // 提示复制成功
    });
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Failed to copy message.', // 提示复制失败
    });
  }
};

const editingMessage = ref<Message | null>(null); // 正在编辑的消息
const editedText = ref(''); // 编辑后的文本
const isSavingEdit = ref(false); // 保存修改的加载状态
const originalText = ref(''); // 原始消息内容
const showEditDialog = ref(false); // 编辑对话框的显示状态

const editMessage = (message: Message) => {
  if (!message.sent) return; // 非用户发送的消息不能编辑
  editingMessage.value = message; // 设置为当前编辑的消息
  editedText.value = message.text; // 初始化编辑内容
  originalText.value = message.text; // 保存原始内容
  showEditDialog.value = true; // 打开编辑对话框
};

const onCancelEdit = () => {
  showEditDialog.value = false;
  editingMessage.value = null;
  editedText.value = '';
  originalText.value = '';
};

const saveEditedMessage = async () => {
  if (!editingMessage.value || !isValidEdit.value) return; // 验证无效时退出
  isSavingEdit.value = true; // 开始保存操作
  const currentEditingMessage = editingMessage.value;
  try {
    // 获取正在编辑消息的索引
    const messageIndex = conversation.value.findIndex((m) => m.id === currentEditingMessage.id);
    if (messageIndex === -1) {
      throw new Error('Message not found in conversation');
    }

    // 确保消息存在
    const conversationMessage = conversation.value[messageIndex];
    const apiMessage = apiConversation.value[messageIndex];

    if (!conversationMessage || !apiMessage) {
      throw new Error('Message not found in conversation or apiConversation');
    }

    // 更新 conversation 中的消息
    conversationMessage.text = editedText.value;

    // 更新 apiConversation 中的消息
    // 注意：我们需要保持其他消息不变，只修改当前消息
    apiMessage.content = editedText.value;

    // 更新后端数据
    await api.put('/chat-session-conversation', {
      session_id: sessionId.value,
      conversation: apiConversation.value,
    });

    // 更新缓存
    const cacheKey = `${sessionId.value}-${selectedChatbot.value.chatbot_id}`;
    sessionCache.set(cacheKey, {
      timestamp: Date.now(),
      conversation: conversation.value,
      apiConversation: apiConversation.value,
      chatbot: selectedChatbot.value,
    });

    $q.notify({
      type: 'positive',
      message: 'Message updated successfully',
    });
  } catch (error) {
    console.error('Failed to update message:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to update message. Please try again.',
    });
  } finally {
    isSavingEdit.value = false;
    // 关闭编辑对话框并重置状态
    editingMessage.value = null;
    showEditDialog.value = false;
    editedText.value = '';
  }
};

const isValidEdit = computed(() => {
  return (
    editedText.value &&
    editedText.value.trim().length > 0 &&
    editedText.value !== originalText.value // 不允许相同内容
  );
});

const deleteMessage = (message: Message) => {
  $q.dialog({
    title: 'Delete Message',
    message: 'Are you sure you want to delete this message?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        // Find the message index in conversation array
        const messageIndex = conversation.value.findIndex((m) => m.id === message.id);

        if (messageIndex === -1) {
          throw new Error('Message not found in conversation');
        }

        // Check if this is the last message and streaming is active
        const isLastMessage = messageIndex === conversation.value.length - 1;
        const isStreamingActive = isStreaming.value && isStreamingButtonVisible.value;

        if (isLastMessage && isStreamingActive) {
          // Stop streaming first
          stopStreaming();
          // Clear streaming message
          streamingMessage.value = '';
        }

        // Remove the message from conversation array
        conversation.value.splice(messageIndex, 1);

        // Find and remove the corresponding message from apiConversation
        // Skip the first message if it's a system message
        const startIndex = apiConversation.value[0]?.role === 'system' ? 1 : 0;
        const apiMessageIndex = apiConversation.value.findIndex(
          (m, index) =>
            index >= startIndex &&
            m.content === message.text &&
            m.role === (message.sent ? 'user' : 'assistant'),
        );

        if (apiMessageIndex !== -1) {
          apiConversation.value.splice(apiMessageIndex, 1);
        }

        // Update backend data
        await api.put('/chat-session-conversation', {
          session_id: sessionId.value,
          conversation: apiConversation.value,
        });

        // Update cache
        const cacheKey = `${sessionId.value}-${selectedChatbot.value.chatbot_id}`;
        sessionCache.set(cacheKey, {
          timestamp: Date.now(),
          conversation: conversation.value,
          apiConversation: apiConversation.value,
          chatbot: selectedChatbot.value,
        });
        $q.notify({
          type: 'positive',
          message: 'Message deleted successfully',
        });
      } catch (error) {
        console.error('Failed to delete message:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to delete message. Please try again.',
        });
      }
    })();
  });
};

const resendMessage = (message: Message) => {
  if (!message.sent) return; // 非用户发送的消息不能重发
  $q.dialog({
    title: 'Confirm Resend',
    message:
      'Resending this message will delete this message and all subsequent messages. Are you sure you want to continue?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        const messageIndex = conversation.value.findIndex((m) => m.id === message.id);
        if (messageIndex === -1) {
          throw new Error('Message not found in conversation');
        }
        // 移除该消息及其后的所有消息
        conversation.value = conversation.value.slice(0, messageIndex);
        apiConversation.value = apiConversation.value.slice(0, messageIndex);

        // 更新后端数据
        await api.put('/chat-session-conversation', {
          session_id: sessionId.value,
          conversation: apiConversation.value,
        });

        // 设置为要重发的消息
        newMessage.value = message.text;
        await onClickSendMessage(); // 触发发送逻辑
      } catch (error) {
        console.error('Failed to resend message:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to resend message. Please try again.',
        });
      }
    })();
  });
};

// Document Preview Functions
const hasHTMLContent = (message: Message): boolean => {
  const analysis = analyzeMessageForHTML(message.text);
  return analysis.hasHTML;
};

// Unified function to process HTML documents from a message
const processMessageDocuments = (message: Message): number => {
// Removed unnecessary debug log for cleaner production logs.
  const analysis = analyzeMessageForHTML(message.text);
  console.log('[processMessageDocuments] Analysis:', analysis);

  if (!analysis.hasHTML) {
    console.log('[processMessageDocuments] No HTML found');
    return 0;
  }

  let addedCount = 0;

  // Always prefer allDocuments if available (handles multiple docs correctly)
  if (analysis.allDocuments && analysis.allDocuments.length > 0) {
    analysis.allDocuments.forEach((doc, index) => {
      const docSource = `message_${message.id}_doc_${index}`;
      const alreadyExists = previewState.documents.some(d => d.source === docSource);
      if (!alreadyExists) {
        addDocument(doc.html, docSource, doc.title, index === 0);
        addedCount++;
        console.log(`[processMessageDocuments] Added doc: source=${docSource}, title=${doc.title}`);
      } else {
        console.log(`[processMessageDocuments] Skipped duplicate doc: source=${docSource}, title=${doc.title}`);
      }
    });
  } else if (analysis.extractedHTML) {
    // Fallback for single document (when allDocuments is empty)
    const docSource = `message_${message.id}`;
    const alreadyExists = previewState.documents.some(d => d.source === docSource);
    if (!alreadyExists) {
      addDocument(analysis.extractedHTML, docSource, undefined, true);
      addedCount++;
      console.log(`[processMessageDocuments] Added single doc: source=${docSource}`);
    } else {
      console.log(`[processMessageDocuments] Skipped duplicate single doc: source=${docSource}`);
    }
  }
  console.log('[processMessageDocuments] After processing, previewState.documents:', previewState.documents.map(d => ({id: d.id, source: d.source, title: d.title})));
  return addedCount;
};

const previewDocumentFromMessage = (message: Message) => {
  console.log('[previewDocumentFromMessage] Called for message', message.id);
  const analysis = analyzeMessageForHTML(message.text);
  console.log('[previewDocumentFromMessage] Analysis:', analysis);

  if (!analysis.hasHTML) {
    $q.notify({
      type: 'info',
      message: 'No HTML content detected in this message',
      position: 'top'
    });
    return;
  }

  // Smart logic: Check if documents from this message already exist
  const existingDocuments: DocumentItem[] = [];

  // Check for existing documents from this message
  if (analysis.allDocuments && analysis.allDocuments.length > 0) {
    // Check for multiple documents
    analysis.allDocuments.forEach((_, index) => {
      const docSource = `message_${message.id}_doc_${index}`;
      const existingDoc = previewState.documents.find(d => d.source === docSource);
      if (existingDoc) {
        existingDocuments.push(existingDoc);
      }
    });
  } else {
    const docSource = `message_${message.id}`;
    const existingDoc = previewState.documents.find(d => d.source === docSource);
    if (existingDoc) {
      existingDocuments.push(existingDoc);
    }
  }
  console.log('[previewDocumentFromMessage] Existing docs for this message:', existingDocuments.map(d => ({id: d.id, source: d.source, title: d.title})));

  if (existingDocuments.length > 0) {
    // Documents already exist - switch to the first one
    const firstDoc = existingDocuments[0];
    if (firstDoc) {
      switchToDocument(firstDoc.id);
      previewState.isVisible = true;
      console.log(`[previewDocumentFromMessage] Switched to existing doc: id=${firstDoc.id}, source=${firstDoc.source}, title=${firstDoc.title}`);
    }
    $q.notify({
      type: 'info',
      message: existingDocuments.length > 1
        ? `Switched to existing documents (${existingDocuments.length} total from this message)`
        : 'Switched to existing document',
      position: 'top'
    });
  } else {
    // Documents don't exist - render them (backup for failed auto-preview)
    const addedCount = processMessageDocuments(message);
    previewState.isVisible = true;
    console.log(`[previewDocumentFromMessage] Added ${addedCount} docs for message ${message.id}`);
    if (addedCount > 0) {
      $q.notify({
        type: 'positive',
        message: addedCount > 1 ? `${addedCount} documents added to preview` : 'Document added to preview',
        position: 'top'
      });
    } else {
      $q.notify({
        type: 'warning',
        message: 'Unable to process documents from this message',
        position: 'top'
      });
    }
  }
  console.log('[previewDocumentFromMessage] After action, previewState.documents:', previewState.documents.map(d => ({id: d.id, source: d.source, title: d.title})), 'activeDocumentId:', previewState.activeDocumentId);
};

const previewStreamingDocument = () => {
  const analysis = analyzeMessageForHTML(streamingMessage.value);
  if (analysis.hasHTML) {
            addDocument(analysis.extractedHTML, `stream_${Date.now()}`, undefined, true);
    $q.notify({
      type: 'positive',
      message: 'Live document preview opened in sidebar',
      position: 'top'
    });
  }
};

// Auto-detect HTML content in streaming messages
let lastStreamingDocumentCheck = '';
watch(streamingMessage, (newValue) => {
  // Only check every 500ms to avoid excessive processing
  if (newValue.length > lastStreamingDocumentCheck.length + 100) {
    lastStreamingDocumentCheck = newValue;
    const analysis = analyzeMessageForHTML(newValue);
    if (analysis.hasHTML && analysis.confidence > 0.8) {
      // Auto-preview if high confidence and preview is not already open
      if (!previewState.isVisible) {
        addDocument(analysis.extractedHTML, `stream_auto_${Date.now()}`, undefined, true);
      } else {
        // Update existing streaming document
        const existingStreamDoc = previewState.documents.find(doc =>
          doc.source.startsWith('stream_auto_') || doc.source.startsWith('stream_')
        );
        if (existingStreamDoc) {
          existingStreamDoc.content = analysis.extractedHTML;
          existingStreamDoc.timestamp = Date.now(); // Update timestamp
          if (previewState.activeDocumentId === existingStreamDoc.id) {
            previewState.htmlContent = analysis.extractedHTML;
          }
        } else {
          // Create new streaming document if none exists
          addDocument(analysis.extractedHTML, `stream_auto_${Date.now()}`, undefined, true);
        }
      }
    }
  }
}, { immediate: false });



//  Add a new reactive variable to control the input box expansion state
const isInputExpanded = ref(false);

// Add a method to toggle the input box expansion state
const toggleInputExpand = () => {
  isInputExpanded.value = !isInputExpanded.value;
};

// Modify the handleKeydown method
const handleKeydown = async (event: KeyboardEvent) => {
  if (event.key === 'Enter' && event.shiftKey) {
    event.preventDefault();
    // Directly send message when Shift+Enter is pressed
    await onClickSendMessage();
  } else if (event.key === 'Enter' && !event.shiftKey) {
    // Normal Enter key adds a new line
    if (!isInputExpanded.value) {
      event.preventDefault();
      isInputExpanded.value = true;
    }
  }
};

const scrollToBottom = async () => {
  // Wait for two ticks to ensure the DOM is fully updated
  await nextTick();
  await nextTick();

  const container = document.querySelector('.conversation-container');
  if (container) {
    // Use setTimeout to ensure execution after all updates
    setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 100);
  }
};

const onClickSendMessage = async () => {
  // Trim the new message
  newMessage.value = newMessage.value.trim();

  // Replace line breaks with double line breaks
  newMessage.value = newMessage.value.replace(/\n/g, '\n\n');

  // Check if the new message is empty
  if (newMessage.value === '') {
    $q.notify({
      type: 'negative',
      message: 'Cannot send an empty message.',
    });
    return;
  }
  // Validate the new message, limited to 3000 words
  if (newMessage.value.split(' ').length > 3000) {
    $q.notify({
      type: 'negative',
      message: 'Message is too long, limited to 3000 words.',
    });
    return;
  }
  // Set the isSending flag to true
  isSending.value = true;

  // If Web Search is enabled, append the search result to the new message
  if (isWebSearchEnabled.value) {
    // Validate the new message, limited to 500 words for Web Search
    if (newMessage.value.split(' ').length > 500) {
      $q.notify({
        type: 'negative',
        message: 'While Web Search is enabled, the message is limited to 500 words.',
      });
      return;
    }
    // Get the search result from the new message by API
    try {
      // Create a form data object
      const formData = new FormData();
      formData.append('query', newMessage.value);
      // Fetch the search result from the server
      const searchResponse = await api.post('/chat-session-web-search', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true, // Allows sending credentials
      });
      // Append the search query to the new message
      newMessage.value =
        newMessage.value +
        '\n\nPlease also refer to the following search results:\n\n' +
        searchResponse.data;
    } catch {
      $q.notify({
        type: 'negative',
        message: 'Error fetching search results.',
      });
    }
  }

  // Check if the new message have an attached file
  if (attachedFile.value) {
    // Upload the attached file
    const fileInfo = await uploadAttachedFile();
    // Append the file content to the new message, but limit to 5000 characters
    newMessage.value =
      '```file:' +
      fileInfo?.original_filename +
      '\n' +
      fileInfo?.file_content.slice(0, 5000) +
      '\n```\n\n' +
      newMessage.value;
    // Clear the attached file
    attachedFile.value = null;
  }

  // Check if there are any unsent internal messages to include
  try {
    const unsentMessagesResponse = await api.get('/internal-messages/unsent-to-chatbot', {
      params: {
        session_id: sessionId.value,
      },
    });

    if (unsentMessagesResponse.data && unsentMessagesResponse.data.length > 0) {
      // Format the teacher-student discussion
      let discussionContent = '\n\n[Teacher-Student Discussion Context]:\n';

      for (const message of unsentMessagesResponse.data) {
        const timestamp = new Date(message.created_at).toLocaleString();
        const role = message.sender_role === 'Student' ? 'Student' : 'Teacher';
        discussionContent += `\n${role} (${timestamp}): ${message.message_content}`;
      }

      discussionContent += '\n\n[End of Teacher-Student Discussion]\n\n';

      // Prepend the discussion to the user's message
      newMessage.value = discussionContent + newMessage.value;

      // Mark all internal messages as sent to chatbot
      await api.put(
        '/internal-messages/mark-all-sent-to-chatbot',
        {},
        {
          params: {
            session_id: sessionId.value,
          },
        },
      );
    }
  } catch (error) {
    console.error('Error fetching unsent internal messages:', error);
    // Continue with sending the message even if internal messages fetch fails
  }

  // Update the apiConversation with the new message
  apiConversation.value.push({ role: 'user', content: newMessage.value });
  // Update the conversation by converting the apiConversation to the conversation
  conversation.value = convertApiConversationToConversation(apiConversation.value);
  // Clear the new message input
  newMessage.value = '';

  // Create the request payload
  const payload = {
    session_id: sessionId.value,
    conversation_list: apiConversation.value,
    chatbot: selectedChatbot.value,
  };

  try {
    // Check if streaming is enabled
    if (isStreamingEnabled.value) {
      // Set streaming flag to true and initialize streaming message
      isStreaming.value = true;
      isStreamingButtonVisible.value = true;
      streamingMessage.value = '';
      streamingMessageId.value = conversation.value.length + 1;

      try {
        // Get base URL from api configuration
        const baseURL = api.defaults.baseURL;

        // Get token from localStorage (same as in api interceptor)
        const token = localStorage.getItem('btws-tkn');

        // Reset stop streaming flag
        shouldStopStreaming.value = false;

        // Use fetch for streaming but with api configuration
        const response = await fetch(`${baseURL}/messages-stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify(payload),
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Process the SSE response
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Response body reader could not be created');
        }

        // Process the stream
        const decoder = new TextDecoder();
        let buffer = '';
        let hasFinalized = false; // Add this flag to track if we've already saved the final message

        while (true) {
          // Check if we should stop streaming
          if (shouldStopStreaming.value) {
            await reader.cancel();
            isStreaming.value = false;
            isSending.value = false;

            if (!hasFinalized) {
              // Only save if we haven't finalized yet
              hasFinalized = true;
              // Use the same processing logic to handle the final message
              const processedContent = streamingMessage.value;

              // Create the final response message
              const apiResponse = {
                role: 'assistant',
                content: processedContent,
              };

              // Add to conversation
              apiConversation.value.push(apiResponse);
              conversation.value = convertApiConversationToConversation(apiConversation.value);

              // Update the conversation with the new message
              try {
                await api.put('/chat-session-conversation', {
                  session_id: sessionId.value,
                  conversation: apiConversation.value,
                });

                // Update the cache using the standard key format
                const cacheKey = `${sessionId.value}-${selectedChatbot.value.chatbot_id}`;
                sessionCache.set(cacheKey, {
                  timestamp: Date.now(),
                  conversation: conversation.value,
                  apiConversation: apiConversation.value,
                  chatbot: selectedChatbot.value,
                });
              } catch (error) {
                console.error('Failed to update conversation:', error);
                $q.notify({
                  type: 'negative',
                  message: 'Failed to save conversation. Please try again.',
                });
              }
            }
            break;
          }

          const { done, value } = await reader.read();
          if (done) {
            isStreamingButtonVisible.value = false;
            // Add this block to handle the case when stream ends without [DONE] or [CANCELLED]
            if (streamingMessage.value && !hasFinalized) {
              // Only save if we haven't finalized yet
              hasFinalized = true;
              const finalApiResponse = {
                role: 'assistant',
                content: streamingMessage.value,
              };

              // Add to conversation
              apiConversation.value.push(finalApiResponse);
              conversation.value = convertApiConversationToConversation(apiConversation.value);

              // Update the conversation with the new message
              try {
                await api.put('/chat-session-conversation', {
                  session_id: sessionId.value,
                  conversation: apiConversation.value,
                });

                // Update the cache
                const cacheKey = `${sessionId.value}-${selectedChatbot.value.chatbot_id}`;
                sessionCache.set(cacheKey, {
                  timestamp: Date.now(),
                  conversation: conversation.value,
                  apiConversation: apiConversation.value,
                  chatbot: selectedChatbot.value,
                });
              } catch (error) {
                console.error('Failed to update conversation:', error);
                $q.notify({
                  type: 'negative',
                  message: 'Failed to save conversation. Please try again.',
                });
              }
            }
            break;
          }

          // Decode the chunk and add to buffer
          buffer += decoder.decode(value, { stream: true });

          // Process complete lines from the buffer
          while (true) {
            const lineEnd = buffer.indexOf('\n');
            if (lineEnd === -1) break;

            const line = buffer.slice(0, lineEnd);
            buffer = buffer.slice(lineEnd + 1);

            // Log the raw buffer for debugging


            if (line.startsWith('data: ')) {
              const data = line.slice(6);

              if (data === '[DONE]' || data === '[CANCELLED]') {
                // Streaming is complete
                isStreamingButtonVisible.value = false;
                isStreaming.value = false;

                if (!hasFinalized) {
                  // Only save if we haven't finalized yet
                  hasFinalized = true;
                  // Use the same processing logic to handle the final message
                  const processedContent = streamingMessage.value;

                  // Create the final response message
                  const apiResponse = {
                    role: 'assistant',
                    content: processedContent,
                  };

                  // Add to conversation
                  apiConversation.value.push(apiResponse);
                  conversation.value = convertApiConversationToConversation(apiConversation.value);

                  // Update the conversation with the new message
                  try {
                    await api.put('/chat-session-conversation', {
                      session_id: sessionId.value,
                      conversation: apiConversation.value,
                    });

                    // Update the cache using the standard key format
                    const cacheKey = `${sessionId.value}-${selectedChatbot.value.chatbot_id}`;
                    sessionCache.set(cacheKey, {
                      timestamp: Date.now(),
                      conversation: conversation.value,
                      apiConversation: apiConversation.value,
                      chatbot: selectedChatbot.value,
                    });
                  } catch (error) {
                    console.error('Failed to update conversation:', error);
                    $q.notify({
                      type: 'negative',
                      message: 'Failed to save conversation. Please try again.',
                    });
                  }
                }
                break;
              } else {
                // Normal streaming data handling
                let newlineCount = 0;
                let pos = 0;
                while (pos < buffer.length && buffer[pos] === '\n') {
                  newlineCount++;
                  pos++;
                }

                if (newlineCount >= 2) {
                  const newlines = buffer.slice(0, newlineCount);
                  buffer = buffer.slice(newlineCount);
                  streamingMessage.value += data + newlines;
                } else {
                  streamingMessage.value += data;
                  if (newlineCount === 1) {
                    buffer = buffer.slice(1);
                  }
                }

                // Create a temporary response for display and update cache only
                const tempApiResponse = {
                  role: 'assistant',
                  content: streamingMessage.value,
                };

                // Only update cache with temporary state, skip backend update during streaming
                const tempConversation = [...apiConversation.value, tempApiResponse];
                const cacheKey = `${sessionId.value}-${selectedChatbot.value.chatbot_id}`;
                sessionCache.set(cacheKey, {
                  timestamp: Date.now(),
                  conversation: convertApiConversationToConversation(tempConversation),
                  apiConversation: tempConversation,
                  chatbot: selectedChatbot.value,
                });

                await scrollToBottom();
              }
            }
          }
        }
      } catch (error) {
        // Handle streaming errors
        isStreamingButtonVisible.value = false;
        isStreaming.value = false;
        throw error; // Re-throw to be caught by the outer catch block
      }
    } else {
      // Use the non-streaming API
      const response = await api.post('/messages', payload);

      // Assemble the response in the format of the apiConversation array
      const apiResponse = {
        role: 'assistant',
        content: response.data.chat_response,
      };

      // Update the apiConversation with the response
      apiConversation.value.push(apiResponse);
      // Update the conversation by converting the apiConversation to the conversation
      conversation.value = convertApiConversationToConversation(apiConversation.value);

      // Update the conversation with the new message
      try {
        await api.put('/chat-session-conversation', {
          session_id: sessionId.value,
          conversation: apiConversation.value,
        });

        // Update the cache using the standard key format
        const cacheKey = `${sessionId.value}-${selectedChatbot.value.chatbot_id}`;
        sessionCache.set(cacheKey, {
          timestamp: Date.now(),
          conversation: conversation.value,
          apiConversation: apiConversation.value,
          chatbot: selectedChatbot.value,
        });
      } catch (error) {
        console.error('Failed to update conversation:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to save conversation. Please try again.',
        });
      }
    }
  } catch (error) {
    // Handle errors
    isStreaming.value = false;

    // Try fallback to non-streaming API if the error is related to the streaming endpoint
    if (
      isStreamingEnabled.value &&
      (String(error).includes('HTTP error') || String(error).includes('NetworkError'))
    ) {
      try {
        $q.notify({
          type: 'warning',
          message: 'Streaming failed, falling back to standard API...',
          timeout: 2000,
        });

        // Send the request to the non-streaming endpoint
        const response = await api.post('/messages', payload);

        // Assemble the response in the format of the apiConversation array
        const apiResponse = {
          role: 'assistant',
          content: response.data.chat_response,
        };

        // Update the apiConversation with the response
        apiConversation.value.push(apiResponse);
        // Update the conversation by converting the apiConversation to the conversation
        conversation.value = convertApiConversationToConversation(apiConversation.value);

        // Update the conversation with the new message
        await api.put('/chat-session-conversation', {
          session_id: sessionId.value,
          conversation: apiConversation.value,
        });

        // Update the cache using the standard key format
        const cacheKey = `${sessionId.value}-${selectedChatbot.value.chatbot_id}`;
        sessionCache.set(cacheKey, {
          timestamp: Date.now(),
          conversation: conversation.value,
          apiConversation: apiConversation.value,
          chatbot: selectedChatbot.value,
        });
      } catch (fallbackError) {
        $q.notify({
          type: 'negative',
          message: 'Error with fallback API! ' + String(fallbackError),
        });
      }
    } else {
      $q.notify({
        type: 'negative',
        message: 'Error! ' + String(error),
      });
    }
  } finally {
    // Make sure isSending is reset and scroll to bottom
    isSending.value = false;
    await scrollToBottom();
  }
};

const getSessionShareLink = (sessionShareId: string) => {
  return window.location.origin + '/#/share/' + sessionShareId;
};

const onClickShareChat = () => {
  // Check if the visiable chat history is empty
  if (conversation.value.length === 0) {
    $q.notify({
      type: 'negative',
      message: 'Cannot share an empty chat. Please start a conversation first.',
    });
    return;
  }
  // Ask user if they want to share the chat
  $q.dialog({
    title: 'Share Chat',
    message: 'Do you want to share this chat?',
    ok: 'Yes',
    cancel: 'No',
  }).onOk(() => {
    void (async () => {
      const courseTitleValue = route.query.courseTitle as string;
      // Call the API to share the chat
      const response = await api.post('/chat-session-sharing', {
        session_id: sessionId.value,
        session_name: sessionName.value,
        course_title: courseTitleValue,
        module_title: moduleTitle.value,
        chatbot_id: selectedChatbotId.value,
        chatbot_name: selectedChatbot.value.chatbot_name,
        conversation: apiConversation.value,
      });
      // console.log(response.data);

      const shareLink = getSessionShareLink(response.data.session_sharing_id);

      // Detect iOS/iPadOS devices
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

      let notificationMessage = '';
      let dialogMessage = '';

      if (!isIOS) {
        // Try to copy to clipboard for non-iOS devices
        try {
          await navigator.clipboard.writeText(shareLink);
          notificationMessage = 'The share link has been copied to your clipboard.';
          dialogMessage = 'The chat has been shared. The share link has been copied to your clipboard: ';
        } catch (error) {
          console.log('[Share Chat] Clipboard copy failed:', error);
          // Fallback for non-iOS devices if clipboard fails
          notificationMessage = 'Chat shared successfully. Please copy the link from the dialog below.';
          dialogMessage = 'The chat has been shared. Please copy the link below: ';
        }
      } else {
        // For iOS devices, skip auto-copy and show manual copy message
        notificationMessage = 'Chat shared successfully. Please copy the link from the dialog below.';
        dialogMessage = 'The chat has been shared. Please tap and hold the link below to copy: ';
      }

      // Tell the user that the chat has been shared
      $q.notify({
        type: 'positive',
        message: notificationMessage,
      });
      $q.dialog({
        title: 'Chat Shared',
        message: dialogMessage,
        prompt: {
          model: shareLink,
          type: 'text',
          dense: true,
          readonly: true,
        },
        ok: 'OK',
      });
    })();
  });
};

const rejectAttachedFile = (rejectedEntries: QRejectedEntry[]) => {
  const errors = new Set<string>();

  rejectedEntries.forEach((entry) => {
    if (entry.failedPropValidation === 'accept') {
      errors.add('Invalid file type. Only .docx and .pdf files are allowed.');
    }
    if (entry.failedPropValidation === 'max-file-size') {
      errors.add('File size exceeds 10MB limit.');
    }
  });

  errors.forEach((error) => {
    $q.notify({
      type: 'negative',
      message: error,
      timeout: 5000,
    });
  });
};

const uploadAttachedFile = async () => {
  try {
    if (attachedFile.value) {
      $q.notify({
        type: 'info',
        message: 'Uploading file...',
      });
      // Create a FormData object
      const formData = new FormData();
      formData.append('session_id', sessionId.value);
      formData.append('chatbot_id', selectedChatbotId.value);
      formData.append('file', attachedFile.value);

      // Upload file using FormData
      const response = await api.post('/chat-session-attach-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true, // Allows sending credentials
      });
      // console.log(response.data);
      // Notify the user that the file has been uploaded
      $q.notify({
        type: 'positive',
        message: 'File uploaded successfully.',
      });
      // Return the file content
      const res = {
        unique_filename: response.data.unique_filename,
        original_filename: response.data.original_filename,
        file_content: response.data.file_content,
      };
      return res;
    } else {
      $q.notify({
        type: 'negative',
        message: 'Please attach a Docx/PDF file first.',
      });
    }
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Error uploading file.',
    });
  }
};

const onClickUploadImage = () => {
  uploadedImageToOCR.value = null;
  isShowOCR.value = true;
};

const onClickToggleWebSearch = () => {
  isWebSearchEnabled.value = !isWebSearchEnabled.value;
};

const onClickToggleStreaming = () => {
  isStreamingEnabled.value = !isStreamingEnabled.value;
};

const rejectUploadedImage = () => {
  $q.notify({
    type: 'negative',
    message: 'You can only attach a JPG/PNG file with a maximum size of 10MB.',
  });
};

const UploadImageAndOCR = async () => {
  try {
    if (uploadedImageToOCR.value) {
      // Disable UI interaction during upload
      isUploadingImage.value = true;
      // Notify the user that upload has started
      $q.notify({
        type: 'info',
        message: 'Uploading image...',
      });
      // Create a FormData object
      const formData = new FormData();
      formData.append('session_id', sessionId.value);
      formData.append('chatbot_id', selectedChatbotId.value);
      formData.append('image', uploadedImageToOCR.value);

      // Upload image using FormData
      const response = await api.post('/chat-session-ocr-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true, // Allows sending credentials
      });
      // console.log(response.data);
      // Notify the user that the image has been uploaded
      $q.notify({
        type: 'positive',
        message: 'Image successfully uploaded and OCR completed.',
      });
      // Update the OCR result
      ocrResult.value = response.data.ocr_result;
      isUploadingImage.value = false;
    } else {
      $q.notify({
        type: 'negative',
        message: 'Please select an image first.',
      });
    }
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Error uploading image.',
    });
  }
};

const AttachOCRResultToChat = () => {
  if (ocrResult.value === '') {
    $q.notify({
      type: 'negative',
      message: 'Cannot attach an empty OCR result.',
    });
    return;
  }
  // Append the OCR result to the new message
  if (newMessage.value !== '') {
    newMessage.value += '\n\n```\n' + ocrResult.value + '\n```';
  } else {
    newMessage.value += '```\n' + ocrResult.value + '\n```';
  }
  // Clear the OCR result
  ocrResult.value = '';
  // Close the OCR dialog
  isShowOCR.value = false;
};

const onClickCancelUploadImage = () => {
  isShowOCR.value = false;
};

const getMessageBoxPlaceholderText = () => {
  if (isDisableMessageBox.value) {
    return 'Session has been submitted. You can no longer send messages.';
  }
  if (isWebSearchEnabled.value && isStreamingEnabled.value) {
    return 'Type your message here... (Web Search & Streaming enabled)';
  }
  if (isWebSearchEnabled.value) {
    return 'Type your message here... (Web Search enabled, limited to 500 words)';
  }
  if (isStreamingEnabled.value) {
    return 'Type your message here... (Streaming enabled)';
  }
  return 'Type your message here...';
};

// const onClickRecordVoice = () => {
//   // Placeholder for recording voice
//   $q.notify({
//     type: 'info',
//     message: 'This feature is not available yet'
//   });
// };

// Add a computed property to dynamically calculate the conversation-wrapper style
import type { CSSProperties } from 'vue';

const conversationWrapperStyle = computed<CSSProperties>(() => ({
  height: `calc(100vh - ${isInputExpanded.value ? 350 : 280}px)`,
  margin: '0 16px',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}));

onMounted(async () => {
  isFetching.value = true;
  isDisableMessageBox.value = true;

  sessionId.value = getStringParam(route.params.sessionId || '');

  selectedChatbotId.value = getStringParam(route.params.chatbotId || '');

  const sessionNameValue = route.query.sessionName as string;
  sessionName.value = sessionNameValue || 'New Session';

  const moduleTitleValue = route.query.moduleTitle as string;
  moduleTitle.value = moduleTitleValue || 'Unknown Module';

  // Fetch the chatbot information and session information
  await fetchChatbotInfo(selectedChatbotId.value);
  // If the session_id is 'latest', do not fetch the session information
  if (sessionId.value !== 'latest') {
    await fetchSessionInfo(sessionId.value, selectedChatbot.value);
  }
  // If the chatbot is a CustomisedChatBot or GenericChatbot, enable the message box
  if (
    selectedChatbot.value.type_name === 'CustomisedChatbot' ||
    selectedChatbot.value.type_name === 'GenericChatbot'
  ) {
    isDisableMessageBox.value = false;
  }
  isFetching.value = false;
  await scrollToBottom();
  checkShouldShowRating();
});

watch(
  route,
  async (newRoute) => {
    // Reset streaming state when route changes
    isStreaming.value = false;
    streamingMessage.value = '';
    shouldStopStreaming.value = true;

    // Reset document preview when switching sessions
    resetDocumentPreview();

    isFetching.value = true;
    isDisableMessageBox.value = true;

    sessionId.value = getStringParam(newRoute.params.sessionId || '');

    selectedChatbotId.value = getStringParam(newRoute.params.chatbotId || '');

    const sessionNameValue = newRoute.query.sessionName as string;
    sessionName.value = sessionNameValue || 'New Session';

    const moduleTitleValue = newRoute.query.moduleTitle as string;
    moduleTitle.value = moduleTitleValue || 'Unknown Module';

    // Fetch the chatbot information and session information
    await fetchChatbotInfo(selectedChatbotId.value);
    // If the session_id is 'latest', do not fetch the session information
    if (sessionId.value !== 'latest') {
      await fetchSessionInfo(sessionId.value, selectedChatbot.value);
    }
    // If the chatbot is a CustomisedChatBot or GenericChatbot, enable the message box
    if (
      selectedChatbot.value.type_name === 'CustomisedChatbot' ||
      selectedChatbot.value.type_name === 'GenericChatbot'
    ) {
      isDisableMessageBox.value = false;
    }
    isFetching.value = false;
    await scrollToBottom();
    checkShouldShowRating();
  },
  { immediate: true },
);

// Function to scan all messages and add HTML documents to preview (for session load only)
const scanExistingMessagesForHTML = () => {
  console.log('[scanExistingMessagesForHTML] Starting scan, conversation length:', conversation.value.length);

  // Clear any existing documents first to avoid duplicates
  resetDocumentPreview();

  if (conversation.value.length === 0) {
    console.log('[scanExistingMessagesForHTML] No messages to scan');
    return;
  }

  const htmlMessages = conversation.value.filter(msg => {
    if (msg.name !== 'Chatbot') return false;

    const analysis = analyzeMessageForHTML(msg.text);
    return analysis.hasHTML;
  });

  console.log('[scanExistingMessagesForHTML] Found', htmlMessages.length, 'HTML messages');

  if (htmlMessages.length > 0) {
    let totalDocumentsAdded = 0;

    // Use the unified processMessageDocuments function for consistent behavior
    htmlMessages.forEach((message) => {
      const analysis = analyzeMessageForHTML(message.text);
      if (analysis.hasHTML && analysis.confidence > 0.5) { // Lower threshold for existing messages
        const addedCount = processMessageDocuments(message);
        totalDocumentsAdded += addedCount;
        console.log(`[scanExistingMessagesForHTML] Processed message ${message.id}, added ${addedCount} docs`);
      }
    });

    console.log('[scanExistingMessagesForHTML] Total documents added:', totalDocumentsAdded);

    // Show preview if any documents were added
    if (totalDocumentsAdded > 0) {
      previewState.isVisible = true;
    }
  }
};

watch(conversation, async (newConversation, oldConversation) => {
  await scrollToBottom();
  void addCopyButtons();

  // Handle different conversation change scenarios
  if (newConversation.length > 0 && (!oldConversation || oldConversation.length === 0)) {
    // Session load or chat switch - scan all existing messages with delay for better UX
    console.log('[conversation watcher] Session load/chat switch detected');
    setTimeout(() => {
      scanExistingMessagesForHTML();

      // Retry if no documents were found but conversation has content
      // This handles cases where conversation data loads asynchronously
      if (previewState.documents.length === 0 && newConversation.length > 0) {
        console.log('[conversation watcher] No documents found, retrying scan in 1 second');
        setTimeout(() => {
          scanExistingMessagesForHTML();
        }, 1000);
      }
    }, 1000); // Longer delay to ensure conversation data is fully loaded
  } else if (oldConversation && oldConversation.length > 0 && newConversation.length === 0) {
    // Chat switched to empty conversation - clear preview
    console.log('[conversation watcher] Switched to empty conversation, clearing preview');
    resetDocumentPreview();
  } else if (newConversation.length > (oldConversation?.length || 0)) {
    // New message added - enhanced auto-preview logic
    const lastMessage = newConversation[newConversation.length - 1];
    if (lastMessage && lastMessage.name === 'Chatbot') {
      console.log('[conversation watcher] New chatbot message detected, processing preview');
      // Debounce rapid message updates
      setTimeout(() => {
        handleNewMessagePreview(lastMessage);
      }, 300);
    }
  } else if (oldConversation && newConversation.length !== oldConversation.length) {
    // Conversation length changed in other ways (e.g., message deletion)
    console.log('[conversation watcher] Conversation length changed, rescanning');
    setTimeout(() => {
      scanExistingMessagesForHTML();
    }, 500);
  }
}, { deep: true });

// Enhanced function to handle new message preview
const handleNewMessagePreview = (message: Message) => {
  const analysis = analyzeMessageForHTML(message.text);

  // Enhanced confidence threshold and conditions
  const shouldAutoPreview = analysis.hasHTML && (
    analysis.confidence > 0.8 || // High confidence content
    (analysis.confidence > 0.6 && analysis.allDocuments && analysis.allDocuments.length > 0) || // Multiple docs with good confidence
    (analysis.confidence > 0.5 && message.text.includes('<!DOCTYPE')) // DOCTYPE indicates clear intent
  );

  if (shouldAutoPreview) {
    const addedCount = processMessageDocuments(message);
    cleanupStreamingDocuments();

    if (addedCount > 1) {
      $q.notify({
        type: 'positive',
        message: `${addedCount} HTML documents detected and added to preview`,
        position: 'top-right',
        timeout: 3000,
        actions: [
          {
            label: 'View',
            color: 'white',
            handler: () => { previewState.isVisible = true; }
          }
        ]
      });
    } else if (addedCount === 1) {
      $q.notify({
        type: 'positive',
        message: 'HTML document added to preview',
        position: 'top-right',
        timeout: 2000,
        actions: [
          {
            label: 'Show',
            color: 'white',
            handler: () => { previewState.isVisible = true; }
          }
        ]
      });
    }
    if (addedCount > 0) {
      previewState.isVisible = true;
    }
  }
};

// Helper function to clean up streaming documents
const cleanupStreamingDocuments = () => {
  const streamingDoc = previewState.documents.find(doc =>
    doc.source === 'streaming_current' ||
    doc.source.startsWith('stream_') ||
    doc.source.startsWith('stream_auto_')
  );
  if (streamingDoc) {
    removeDocument(streamingDoc.id);
  }
};

// Add these computed properties after other computed properties
const showMenuOption = computed(() => {
  const systemPrompt = selectedChatbot.value.system_prompt.toLowerCase();
  const welcomePrompt = selectedChatbot.value.welcome_prompt.toLowerCase();
  return systemPrompt.includes('menu') || welcomePrompt.includes('menu');
});

const showDoneOption = computed(() => {
  return selectedChatbot.value.type_name === 'ChecklistChatBot';
});

// Add this computed property after showDoneOption
const showQuickReplyButton = computed(() => {
  return showMenuOption.value || showDoneOption.value;
});

// Add this method after other method declarations
// Add fetchSummary ref at the top of setup function
interface ChatSessionDescription {
  checklist_progress: Array<{ item_id: string; item_content: string; completed: boolean }>;
  quantitative_report: {
    turn_count: number;
    user_word_count: number;
    chatbot_word_count: number;
    conversation_time: number;
  };
  qualitative_report: {
    session_summary: string;
  };
  user_feedback: {
    rating: number;
    text_feedback: string;
  };
}

const chatSessionDescription = inject<Ref<ChatSessionDescription>>('chatSessionDescription');
const fetchSummary = inject<() => Promise<void>>('fetchSessionSummary');
const generateScript = inject<() => Promise<void>>('generateScript');

// Watch for chat session description changes
watch(
  () => chatSessionDescription?.value,
  (newValue) => {
    if (
      newValue?.qualitative_report.session_summary === '' ||
      newValue?.qualitative_report.session_summary === null
    ) {
      isDisableMessageBox.value = false;
      checkShouldShowRating();
    }
  },
  { deep: true },
);

const handleQuickReply = async (reply: string) => {
  try {
    if (reply === 'done') {
      // Show confirmation dialog
      $q.dialog({
        title: 'Confirm Submission',
        message:
          'Are you sure you want to submit? Once submitted, you cannot send any more messages.',
        cancel: true,
        persistent: true,
      }).onOk(() => {
        void (async () => {
          try {
            if (fetchSummary) {
              await fetchSummary();
            }

            // Show completion message
            $q.notify({
              type: 'positive',
              message: 'Session submitted successfully. You can no longer send messages.',
            });

            // Disable input box
            isDisableMessageBox.value = true;

            // Add rating check
            checkShouldShowRating();
          } catch (error) {
            console.error('Error submitting session:', error);
            $q.notify({
              type: 'negative',
              message: 'Failed to submit session. Please try again.',
            });
          }
        })();
      });
      return;
    }
    if (reply === 'generate') {
      // Show confirmation dialog
      $q.dialog({
        title: 'Confirm Generation',
        message:
          'Are you sure you want to submit the script and generate a video? Once submitted, you cannot send any more messages.',
        cancel: true,
        persistent: true,
      }).onOk(() => {
        void (async () => {
          try {
            if (generateScript) await generateScript();
            // Show completion message
            $q.notify({
              type: 'positive',
              message: 'Session submitted successfully. You can no longer send messages.',
            });

            // Disable input box
            isDisableMessageBox.value = true;

            // Add rating check
            checkShouldShowRating();
          } catch (error) {
            console.error('Error submitting session:', error);
            $q.notify({
              type: 'negative',
              message: 'Failed to submit session. Please try again.',
            });
          }
        })();
      });
      return;
    }
    // Send quick reply message
    newMessage.value = reply;
    await onClickSendMessage();
  } catch (error) {
    console.error('Error handling quick reply:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to complete session. Please try again.',
    });
  }
};

const onClickAttachFile = () => {
  isShowAttachFile.value = true;
};

const onConfirmAttachFile = () => {
  isShowAttachFile.value = false;
};

// Inject the shared state with proper typing
const currentApiConversation = inject<Ref<ApiMessage[]>>('apiConversation');
const currentChatbotDetail = inject<Ref<ChatbotDetail>>('chatbotDetail');

// Add watchers to sync the state
watch(
  selectedChatbot,
  (newValue) => {
    if (currentChatbotDetail) {
      currentChatbotDetail.value = newValue;
    }
  },
  { deep: true },
);

watch(
  apiConversation,
  (newValue) => {
    if (currentApiConversation) {
      currentApiConversation.value = newValue;
    }
  },
  { deep: true },
);

const showRatingDialog = ref(false);
const userRating = ref(0);
const userTextFeedback = ref('');

const checkShouldShowRating = () => {
  // Ensure the session is finished and has a summary, and has not been rated
  if (
    !chatSessionDescription?.value?.qualitative_report?.session_summary ||
    chatSessionDescription?.value?.user_feedback?.rating !== 0
  ) {
    return;
  }

  // If the conditions are met, show the rating dialog
  showRatingDialog.value = true;
};

// Modify the submit rating method
const submitRating = async () => {
  try {
    await api.put('/chat-session-description', {
      session_id: sessionId.value,
      description: {
        user_feedback: {
          rating: userRating.value,
          text_feedback: userTextFeedback.value || '',
        },
      },
    });

    // Update the local session description data
    if (chatSessionDescription?.value) {
      chatSessionDescription.value.user_feedback = {
        rating: userRating.value,
        text_feedback: userTextFeedback.value || '',
      };
    }

    // Reset the form
    showRatingDialog.value = false;
    userRating.value = 0;
    userTextFeedback.value = '';

    $q.notify({
      type: 'positive',
      message: 'Thank you for your feedback!',
    });
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Failed to submit feedback. Please try again.',
    });
  }
};

const addCopyButtons = async () => {
  await nextTick();
  const codeBlocks = document.querySelectorAll('.conversation-container pre');

  codeBlocks.forEach((pre) => {
    // Only add button if it doesn't already exist
    if (!pre.querySelector('.copy-button')) {
      const button = document.createElement('button');
      button.className = 'copy-button';
      button.innerHTML = '<i class="material-icons">content_copy</i>';

      button.addEventListener('click', () => {
        void (async () => {
          const code = pre.querySelector('code')?.textContent || '';
          await navigator.clipboard.writeText(code);

          button.innerHTML = '<i class="material-icons">check</i>';
          setTimeout(() => {
            button.innerHTML = '<i class="material-icons">content_copy</i>';
          }, 2000);

          $q.notify({
            type: 'positive',
            message: 'Code copied to clipboard!',
            timeout: 1000,
          });
        })();
      });

      pre.appendChild(button);
    }
  });
};

const stopStreaming = () => {
  shouldStopStreaming.value = true;
  isStreaming.value = false;
  isStreamingButtonVisible.value = false;
  $q.notify({
    type: 'info',
    message: 'Stopping stream...',
    timeout: 1000,
  });
};

// Watch for route changes (chat switching) to trigger auto-preview
watch(() => route.params.sessionId, (newSessionId, oldSessionId) => {
  if (newSessionId && newSessionId !== oldSessionId) {
    console.log('[route watcher] Chat session changed from', oldSessionId, 'to', newSessionId);
    // Clear existing preview state when switching chats
    resetDocumentPreview();

    // Trigger auto-preview after a delay to ensure new conversation data is loaded
    setTimeout(() => {
      if (conversation.value.length > 0) {
        console.log('[route watcher] Triggering auto-preview for new chat session');
        scanExistingMessagesForHTML();
      }
    }, 1500); // Longer delay for chat switching
  }
}, { immediate: false });
</script>

<style scoped>
.q-banner {
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.conversation-wrapper {
  transition: height 0.3s ease;
}

.conversation-container {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  flex: 1;
  position: relative;
  margin-top: 0;
}

.input-wrapper {
  width: 100%;
  padding: 0 16px;
  position: relative;
  z-index: 1;
}

.input-container {
  border: 1px solid #e0e0e0;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.q-input {
  transition: all 0.3s ease;
}

.conversation-container pre {
  max-width: 100%;
  overflow-x: auto;
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem 0;
  position: relative;
}

.conversation-container pre .copy-button {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.25rem;
  border: none;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.conversation-container pre .copy-button i {
  font-size: 1rem;
  color: #666;
}

.conversation-container pre:hover .copy-button {
  opacity: 1;
}

.conversation-container pre .copy-button:hover {
  background: rgba(255, 255, 255, 1);
}

.conversation-container pre .copy-button:active {
  transform: scale(0.95);
}

.message-container {
  position: relative;
  padding-right: 10px;
}

.message-actions {
  position: absolute;
  top: 0;
  right: -8px;
  display: flex;
  align-items: center;
}

.message-container:hover .message-actions {
  opacity: 1;
}
</style>

<style>
.conversation-container h1 {
  font-size: 24px;
  font-weight: bold;
  line-height: 1.5rem;
  margin: 1.5rem 0;
}

.conversation-container h2 {
  font-size: 22px;
  font-weight: bold;
  line-height: 1.4rem;
  margin: 1.4rem 0;
}

.conversation-container h3 {
  font-size: 20px;
  font-weight: bold;
  line-height: 1.3rem;
  margin: 1.3rem 0;
}

.conversation-container h4 {
  font-size: 18px;
  font-weight: bold;
  line-height: 1.2rem;
  margin: 1.2rem 0;
}

.conversation-container h5 {
  font-size: 16px;
  font-weight: bold;
  line-height: 1.1rem;
  margin: 1.1rem 0;
}

.conversation-container h6 {
  font-size: 14px;
  font-weight: bold;
  line-height: 1rem;
  margin: 1rem 0;
}

/* Add these new styles for code blocks */
.conversation-container pre {
  max-width: 100%;
  overflow-x: auto;
  background: rgba(0, 0, 0, 0.15);
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem 0;
}

.conversation-container code {
  font-family: monospace;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* Style for inline code */
.conversation-container p code {
  background: #f5f5f5;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 0.9em;
}
</style>
