# Integration Plan: Email Notification Module

## Current Status of ByteWise Chatbot (2025-09-03)

### System Overview
We've successfully implemented and deployed the conversation memory enhancement for the ByteWise chatbot application. The system now maintains context throughout brainstorming sessions and other conversation flows, significantly improving user experience.

### Key Components
1. **Frontend**: Vue.js 3 application with Vite
2. **Backend**: API hosted on Railway (smartlessons-production.up.railway.app)
3. **State Management**: Pinia for global state, local state for conversation tracking
4. **Chat Flow**: Structured conversation modes (welcome, menu, brainstorm, review, feedback)
5. **Report Generation**: Built-in report modal for summarizing sessions

### Recent Achievements
- Fixed critical conversation memory issue where context was lost after topic selection
- Implemented robust state tracking with enhanced message context markers
- Deployed solution to production branch (main)
- Verified functionality with user testing

## Email Module Integration Plan

### Integration Points

1. **Report Generation**
   - Current functionality: The `ReportModal.vue` component displays session reports on-screen
   - Integration opportunity: Add "Email Report" button within this modal
   - File location: `/src/components/ReportModal.vue`

2. **User Information Collection**
   - Current state: No email collection mechanism exists
   - Needed: Add email input field to ReportModal or User Settings
   - Consider: Optional vs. required email field based on user experience goals

3. **API Integration**
   - Current API endpoint: `https://smartlessons-production.up.railway.app/api/chat`
   - New endpoint needed: `https://smartlessons-production.up.railway.app/api/email` (to be confirmed with backend team)
   - Authentication: Should use same API key mechanism for consistency

### Implementation Steps

1. **Frontend Changes**
   ```javascript
   // Add to ReportModal.vue - Email controls
   const userEmail = ref('');
   const emailSending = ref(false);
   const emailSent = ref(false);
   
   async function sendReportByEmail() {
     if (!userEmail.value) {
       notify("Please enter an email address", "error");
       return;
     }
     
     emailSending.value = true;
     
     try {
       const response = await fetch(
         "https://smartlessons-production.up.railway.app/api/email",
         {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({
             to: userEmail.value,
             subject: `Chat Report: ${props.botName} Session`,
             content: generateEmailHTML(),
             apiKey: apiKey.value,
           }),
         }
       );
       
       if (response.ok) {
         emailSent.value = true;
         notify("Report sent successfully!", "success");
       } else {
         throw new Error("Failed to send email");
       }
     } catch (error) {
       notify(`Error: ${error.message}`, "error");
     } finally {
       emailSending.value = false;
     }
   }
   
   function generateEmailHTML() {
     // Generate HTML content for email based on report data
     // Can leverage existing report generation code
   }
   ```

2. **HTML Template Updates**
   ```html
   <!-- Add to ReportModal.vue template -->
   <div class="mt-6 border-t pt-4">
     <h3 class="text-lg font-semibold mb-2">Email this report</h3>
     <div class="flex gap-2">
       <input 
         type="email" 
         v-model="userEmail" 
         placeholder="Enter your email address" 
         class="flex-grow p-2 border rounded"
         :disabled="emailSending || emailSent"
       />
       <button 
         @click="sendReportByEmail" 
         :disabled="emailSending || emailSent || !userEmail" 
         class="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400"
       >
         {{ emailSending ? 'Sending...' : emailSent ? 'Sent ✓' : 'Send Report' }}
       </button>
     </div>
   </div>
   ```

3. **Store Updates**
   ```javascript
   // Update chatbotStore.js to store user email preference
   state: () => ({
     selectedBot: null,
     availableBots: [],
     currentState: {
       mode: null,
       context: null,
     },
     userPreferences: {
       email: null,
       saveEmailPreference: false
     }
   }),
   
   // Add actions to manage email preferences
   actions: {
     // ... existing actions
     
     setUserEmail(email, savePreference = false) {
       this.userPreferences.email = email;
       this.userPreferences.saveEmailPreference = savePreference;
       
       if (savePreference) {
         localStorage.setItem('user_email', email);
       }
     },
     
     loadUserPreferences() {
       const savedEmail = localStorage.getItem('user_email');
       if (savedEmail) {
         this.userPreferences.email = savedEmail;
         this.userPreferences.saveEmailPreference = true;
       }
     }
   }
   ```

### Backend Requirements

Your colleague's email module will need to:

1. Create an API endpoint at `/api/email` that accepts:
   - `to`: Email address
   - `subject`: Email subject
   - `content`: HTML content of the email
   - `apiKey`: For authentication

2. Implement:
   - Email validation
   - HTML sanitization
   - Rate limiting to prevent abuse
   - Error handling with clear response codes
   - Logging for debugging and analytics

3. Use a reliable email delivery service:
   - SendGrid or Mailgun recommended for production
   - SMTP fallback option

### Security Considerations

1. **Data Privacy**:
   - Ensure emails are stored securely if at all
   - Implement clear privacy policy for email usage
   - Add checkbox for consent to store email address

2. **API Security**:
   - Protect email endpoint with same API key validation
   - Implement CORS restrictions
   - Add request limiting to prevent spam

3. **Content Security**:
   - Sanitize HTML to prevent injection attacks
   - Validate email addresses

### Testing Plan

1. **Unit Tests**:
   - Verify email validation
   - Test report HTML generation
   - Mock API responses

2. **Integration Tests**:
   - Test email sending with test accounts
   - Verify content rendering in various email clients

3. **User Testing**:
   - Test the complete flow from chat to email delivery
   - Verify mobile compatibility

## Timeline & Resources

### Estimated Timeline
- Frontend Integration: 2-3 days
- Testing & QA: 1-2 days
- Deployment: 1 day

### Required Resources
- Frontend developer (1-2 days)
- API documentation from your colleague's module
- Access to email service credentials

## Next Steps

1. Request technical documentation for the email module from your colleague
2. Schedule a brief meeting to discuss API specifications and requirements
3. Create a feature branch `feature/email-integration` for implementation
4. Set up test environment with email service credentials
5. Implement frontend changes with API mocking
6. Coordinate final integration when both systems are ready

---

*Note: This plan assumes your colleague's email module will be implemented as a server-side component with an API endpoint. If it's a client-side implementation using a service like EmailJS, we'll need to adjust the integration approach accordingly.*
