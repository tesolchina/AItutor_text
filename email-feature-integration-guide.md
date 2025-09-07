# Email Integration Workflow Notes

## Overview for Email Feature Implementation

This document provides guidance on implementing email functionality in our ByteWise chatbot system, allowing users to send their session reports via email to both themselves and their teachers.

## Current Report Generation Flow

1. After a chat session, users click the "Finish & View Report" button (green checkmark).
2. This triggers the `showReport = true` state in `Chat.vue`, which displays the `ReportModal` component.
3. The `ReportModal` receives the chat history and generates a formatted report.

## Implementation Progress Report

### Phase 1: Basic Email Functionality (COMPLETED ✅)

**Date**: January 2025
**Status**: Successfully implemented and tested

#### Changes Made to ReportModal.vue

1. **Added Email Sending Button**
   - Integrated "📧 Send Report" button in the modal footer
   - Button triggers `sendReportByEmail()` function

2. **Implemented Core Email Functionality**
   ```javascript
   // Added reactive variables for email state management
   const student_email = ref("23257024@life.hkbu.edu.hk");
   const teacher_email = ref("2468668109@qq.com"); // Currently hardcoded
   const emailSending = ref(false);
   const emailSent = ref(false);

   // Implemented email sending function
   function sendReportByEmail() {
     const history = props.chatHistory;
     if (!history.length) {
       alert("No conversation to export");
       return;
     }
     emailSending.value = true;

     fetch("http://localhost:5001/api/sendEmail", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({
         student_email: student_email.value,
         teacher_email: teacher_email.value,
         report_md: createMarkdownReport(history),
         report_history: history,
       }),
     })
       .then((response) => {
         if (response.ok) {
           emailSent.value = true;
           alert("Report sent successfully!");
         } else {
           throw new Error("Failed to send email");
         }
       })
       .catch((error) => {
         alert(`Error: ${error.message}`);
       })
       .finally(() => {
         emailSending.value = false;
       });
   }
   ```

3. **Fixed Data Format Issues**
   - **Problem**: Initially passed Vue ref objects instead of their values
   - **Solution**: Used `.value` to access actual ref values
   - **Problem**: Backend expected array format for `report_history`, not stringified JSON
   - **Solution**: Passed `history` array directly instead of `JSON.stringify(history)`

4. **Backend Integration**
   - Successfully connected to `http://localhost:5001/api/sendEmail` endpoint
   - Confirmed API accepts the following request format:
     ```json
     {
       "student_email": "student@example.com",
       "teacher_email": "teacher@example.com",
       "report_md": "markdown content",
       "report_history": [{"role": "user", "content": "...", "timestamp": "..."}]
     }
     ```
   - API returns `{"message": "Email sent successfully!", "success": true}` on success

#### Testing Results
- ✅ Email sending functionality works correctly
- ✅ Backend API integration successful
- ✅ Error handling implemented
- ✅ Loading states managed properly

### Phase 2: User Input for Email Addresses (PLANNED 📋)

**Status**: Next implementation phase
**Priority**: High

#### Required Features

1. **Dynamic Email Input Form**
   - Replace hardcoded email addresses with user input fields
   - Add form validation for email format
   - Implement email address persistence (localStorage)

2. **UI/UX Enhancements**
   - Add email input section to ReportModal
   - Include form validation feedback
   - Add option to save email preferences
   - Improve loading states and success/error messaging

#### Proposed Implementation Plan

**Step 1: Add Email Input Form to ReportModal.vue**
```vue
<!-- Add this section before the button group -->
<div class="email-section mt-6 border-t border-gray-200 pt-4">
  <h3 class="text-lg font-semibold mb-4">📧 Send Report via Email</h3>

  <div class="space-y-4">
    <!-- Student Email Input -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Your Email Address
      </label>
      <input
        v-model="student_email"
        type="email"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Enter your email address"
        :class="{ 'border-red-500': !isValidStudentEmail && student_email }"
      />
      <p v-if="!isValidStudentEmail && student_email" class="text-red-500 text-xs mt-1">
        Please enter a valid email address
      </p>
    </div>

    <!-- Teacher Email Input -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Teacher's Email Address
      </label>
      <input
        v-model="teacher_email"
        type="email"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Enter teacher's email address"
        :class="{ 'border-red-500': !isValidTeacherEmail && teacher_email }"
      />
      <p v-if="!isValidTeacherEmail && teacher_email" class="text-red-500 text-xs mt-1">
        Please enter a valid email address
      </p>
    </div>

    <!-- Save Preference Checkbox -->
    <div class="flex items-center">
      <input
        v-model="saveEmailPreference"
        type="checkbox"
        id="saveEmails"
        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
      />
      <label for="saveEmails" class="ml-2 block text-sm text-gray-700">
        Remember these email addresses for future reports
      </label>
    </div>
  </div>
</div>
```

**Step 2: Add Reactive Variables and Validation**
```javascript
// Replace hardcoded emails with reactive inputs
const student_email = ref("");
const teacher_email = ref("");
const saveEmailPreference = ref(false);

// Add email validation
const isValidStudentEmail = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return !student_email.value || emailRegex.test(student_email.value);
});

const isValidTeacherEmail = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return !teacher_email.value || emailRegex.test(teacher_email.value);
});

const canSendEmail = computed(() => {
  return isValidStudentEmail.value &&
         isValidTeacherEmail.value &&
         student_email.value &&
         teacher_email.value;
});
```

**Step 3: Add Email Persistence**
```javascript
// Load saved email preferences on component mount
onMounted(() => {
  const savedStudentEmail = localStorage.getItem('student_email_pref');
  const savedTeacherEmail = localStorage.getItem('teacher_email_pref');

  if (savedStudentEmail) student_email.value = savedStudentEmail;
  if (savedTeacherEmail) teacher_email.value = savedTeacherEmail;
});

// Update sendReportByEmail function to save preferences
function sendReportByEmail() {
  if (!canSendEmail.value) {
    alert("Please enter valid email addresses for both student and teacher");
    return;
  }

  // Save email preferences if checkbox is checked
  if (saveEmailPreference.value) {
    localStorage.setItem('student_email_pref', student_email.value);
    localStorage.setItem('teacher_email_pref', teacher_email.value);
  }

  // ... rest of existing email sending logic
}
```

**Step 4: Update Send Button**
```vue
<button
  class="px-4 py-2 rounded-lg text-white"
  :class="canSendEmail ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'"
  :disabled="!canSendEmail || emailSending"
  @click="sendReportByEmail"
>
  <span v-if="emailSending">📤 Sending...</span>
  <span v-else>📧 Send Report</span>
</button>
```

#### Estimated Timeline
- **UI Implementation**: 2-3 hours
- **Validation Logic**: 1-2 hours
- **Testing & Refinement**: 1-2 hours
- **Total**: 4-7 hours

#### Benefits of Phase 2 Implementation
- ✨ **User Flexibility**: Users can specify any email addresses
- 💾 **Convenience**: Email preferences saved for future use
- ✅ **Validation**: Prevents errors from invalid email formats
- 🎨 **Better UX**: Clear visual feedback and intuitive interface
- 🔒 **Privacy**: Users control their own email data

---

## Summary

### Current Status
- **Phase 1**: ✅ **COMPLETED** - Basic email functionality with hardcoded addresses
- **Phase 2**: 📋 **PLANNED** - User input for email addresses

### Key Achievements
1. Successfully integrated email sending functionality into ReportModal
2. Fixed critical data format issues that caused 400 BAD REQUEST errors
3. Established working connection with backend API at `localhost:5001/api/sendEmail`
4. Implemented proper error handling and loading states

### Next Steps
1. Implement user input form for email addresses
2. Add email validation and persistence
3. Enhance UI/UX with better visual feedback
4. Test complete user workflow from chat to email delivery

### Technical Notes
- Backend API endpoint: `http://localhost:5001/api/sendEmail`
- Required request format: JSON with `student_email`, `teacher_email`, `report_md`, `report_history`
- Frontend framework: Vue.js 3 with Composition API
- State management: Vue reactive refs

---

## Legacy Documentation (Original Implementation Guide)

### User Flow
1. User completes a chatbot session
2. User views the report summary
3. User enters their email address
4. User confirms sending to themselves and the teacher
5. System sends emails and shows confirmation

### Key Files to Modify

#### 1. `src/components/ReportModal.vue`
This is the **primary file** you'll need to modify. It currently displays the session report and needs to be enhanced with email functionality.

```vue
<!-- Current structure (simplified) -->
<template>
  <div v-if="show" class="report-modal">
    <div class="report-content">
      <h2>Session Report</h2>
      <!-- Report summary section -->
      <div class="report-summary">...</div>
      
      <!-- Report conversation section -->
      <div class="report-conversation">...</div>
      
      <!-- Buttons -->
      <div class="button-group">
        <button @click="$emit('close')">Close</button>
        <!-- Add email form and button here -->
      </div>
    </div>
  </div>
</template>
```

#### Proposed Changes to ReportModal.vue

Add this form section before the button group:

```vue
<!-- Email form to add -->
<div class="email-section mt-6 border-t border-gray-200 pt-4">
  <h3 class="text-lg font-semibold mb-2">Send Report via Email</h3>
  
  <!-- Step 1: Email collection form (initially visible) -->
  <div v-if="emailStep === 'collection'">
    <div class="mb-3">
      <label class="block text-sm font-medium mb-1">Your Email Address</label>
      <input 
        type="email" 
        v-model="userEmail" 
        placeholder="Enter your email address" 
        class="w-full p-2 border border-gray-300 rounded"
      />
    </div>
    
    <div class="flex items-center mb-4">
      <input 
        type="checkbox" 
        id="saveEmail" 
        v-model="saveEmailPreference"
        class="mr-2"
      />
      <label for="saveEmail" class="text-sm text-gray-600">Remember my email for future sessions</label>
    </div>
    
    <button 
      @click="proceedToConfirmation" 
      :disabled="!isValidEmail" 
      class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400"
    >
      Continue
    </button>
  </div>
  
  <!-- Step 2: Confirmation screen -->
  <div v-if="emailStep === 'confirmation'">
    <p class="mb-4">This report will be sent to:</p>
    <ul class="list-disc ml-6 mb-4">
      <li>Your email: {{ userEmail }}</li>
      <li v-if="teacherEmail">Teacher's email: {{ teacherEmail }}</li>
    </ul>
    
    <div class="flex gap-3">
      <button 
        @click="sendReport" 
        :disabled="emailSending" 
        class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
      >
        {{ emailSending ? 'Sending...' : 'Confirm & Send' }}
      </button>
      <button 
        @click="emailStep = 'collection'" 
        class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
      >
        Back
      </button>
    </div>
  </div>
  
  <!-- Step 3: Success message -->
  <div v-if="emailStep === 'success'" class="text-center py-3">
    <div class="text-green-600 text-xl mb-2">✓</div>
    <p>Report successfully sent!</p>
  </div>
  
  <!-- Error message -->
  <div v-if="emailError" class="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
    {{ emailError }}
  </div>
</div>
```

Add these script sections:

```javascript
// Add to the existing script section
import { useChatbotStore } from "../components/chatbotStore";

// Add to the data section
const chatbotStore = useChatbotStore();
const userEmail = ref('');
const teacherEmail = ref(''); // This could be fetched from the bot config or API
const saveEmailPreference = ref(false);
const emailStep = ref('collection'); // collection, confirmation, success
const emailSending = ref(false);
const emailError = ref(null);

// Add these computed properties
const isValidEmail = computed(() => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail.value);
});

// Add these methods
function proceedToConfirmation() {
  if (!isValidEmail.value) return;
  
  // Get teacher's email - you might need to modify this logic
  // depending on how teacher emails are stored
  teacherEmail.value = selectedBot.value.teacherEmail || '';
  
  emailStep.value = 'confirmation';
}

async function sendReport() {
  if (emailSending.value) return;
  
  emailSending.value = true;
  emailError.value = null;
  
  try {
    // This is where your colleague's email sending module will be integrated
    const response = await fetch(
      "https://smartlessons-production.up.railway.app/api/email",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: userEmail.value,
          teacherEmail: teacherEmail.value,
          subject: `${selectedBot.value.name} Chat Report`,
          reportContent: generateEmailHTML(),
          apiKey: chatbotStore.apiKey,
        }),
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send email');
    }
    
    // Save user's email preference if selected
    if (saveEmailPreference.value) {
      chatbotStore.setUserEmail(userEmail.value);
    }
    
    // Show success message
    emailStep.value = 'success';
  } catch (error) {
    console.error('Email sending error:', error);
    emailError.value = error.message || 'Something went wrong. Please try again.';
  } finally {
    emailSending.value = false;
  }
}

function generateEmailHTML() {
  // You can reuse your existing report generation logic
  // or create a specific version for email
  return `
    <h1>${selectedBot.value.name} Session Report</h1>
    <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
    <p><strong>Duration:</strong> ${duration} minutes</p>
    <p><strong>Messages:</strong> ${props.chatHistory.length}</p>
    
    <h2>Conversation</h2>
    ${props.chatHistory.map(msg => `
      <div style="margin-bottom: 15px;">
        <strong>${msg.role === 'user' ? 'You' : 'Assistant'}:</strong>
        <p>${msg.content}</p>
        <small>${new Date(msg.timestamp).toLocaleString()}</small>
      </div>
    `).join('')}
  `;
}

// Add to onMounted or created hook
onMounted(() => {
  // Try to load saved email if available
  const savedEmail = chatbotStore.userPreferences?.email;
  if (savedEmail) {
    userEmail.value = savedEmail;
    saveEmailPreference.value = true;
  }
});
```

#### 2. `src/components/chatbotStore.js`

You'll need to enhance the store to save user email preferences. Add these properties and methods:

```javascript
// Add to the state object
state: () => ({
  // existing state properties...
  
  userPreferences: {
    email: null,
  }
}),

// Add these actions
actions: {
  // existing actions...
  
  setUserEmail(email) {
    this.userPreferences.email = email;
    localStorage.setItem('user_email_pref', email);
  },
  
  loadUserPreferences() {
    const email = localStorage.getItem('user_email_pref');
    if (email) {
      this.userPreferences.email = email;
    }
  }
}
```

#### 3. `src/botConfig/*.json` files

These contain bot configurations. You may want to add a `teacherEmail` field to these configuration files to specify the teacher's email address for each bot type:

```json
{
  "name": "IELTS Writing Tutor",
  "systemPrompt": "You are an IELTS Writing Tutor...",
  "welcomePrompt": "Hello! I am your IELTS...",
  "model": "gpt-4.1",
  "teacherEmail": "writing.teacher@example.com"
}
```

## Backend API Requirements

Your colleague will need to implement a backend endpoint to handle the email sending. The expected endpoint is:

```
POST https://smartlessons-production.up.railway.app/api/email
```

Expected request body:
```json
{
  "userEmail": "student@example.com",
  "teacherEmail": "teacher@example.com",
  "subject": "Chat Report: IELTS Writing Tutor",
  "reportContent": "<html>...</html>",
  "apiKey": "user_api_key_here"
}
```

Expected responses:
- `200 OK` - Email sent successfully
- `400 Bad Request` - Invalid email format or missing required fields
- `401 Unauthorized` - Invalid API key
- `500 Internal Server Error` - Server-side error

## Integration Notes

1. **Email Validation**: Implement client-side validation to ensure users enter valid email addresses.

2. **Storage Consideration**: If storing user emails, ensure compliance with privacy regulations.

3. **Error Handling**: Provide clear feedback to users if email sending fails.

4. **Teacher Emails**: Consider whether teacher emails should be hardcoded in bot configurations or managed through a separate admin interface.

5. **HTML Email Template**: Format the email content for readability, possibly using a more sophisticated template than the simple example provided.

6. **Accessibility**: Ensure the email form is accessible to all users, including those using screen readers.

## Testing Workflow

1. Complete a chat session
2. Click "Finish & View Report"
3. Enter email details
4. Confirm sending
5. Verify emails are received by both user and teacher
6. Check that the email format is correct and readable

## Additional Resources

- [Vue.js Form Validation](https://vuejs.org/guide/essentials/forms.html)
- [Email HTML Templates Best Practices](https://www.litmus.com/blog/email-design-best-practices/)
- [Client-side Email Validation Regex](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/email)

## Contact for Questions

If you have any questions about the frontend implementation or need clarification on how the current report generation works, please contact our team.

---

*Note: This document outlines the proposed implementation. The actual code may need adjustments based on your specific email sending module's requirements and capabilities.*
