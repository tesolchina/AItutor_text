# Token Counter Feature - Big Picture Impact Analysis

## Overview
Implementation of basic session token counter underneath API configuration in sidebar.

## Files and Modules Impact Analysis

### 🆕 **NEW FILES TO BE CREATED**

#### None Required for Phase 1
The basic token counter will be implemented as integrated functionality within existing components. No new files needed for the minimal viable implementation.

**Rationale**: Keep implementation simple and avoid over-engineering for basic session counting.

---

### 📝 **EXISTING FILES TO BE MODIFIED**

#### 1. **`src/views/Chat.vue`** (PRIMARY MODIFICATION)

**Impact Level**: 🔴 **MAJOR**

**Changes Required**:
```javascript
// New reactive data
const sessionTokens = ref(0);
const MODEL_LIMITS = {
  'gpt-4.1': 3000000,
  'gpt-4.1-mini': 15000000,
  'gpt-5': 3000000,
  'gpt-5-mini': 15000000,
  'o1': 400000,
  'o3-mini': 5500000
};

// Modified sendMessage() function
// Add token extraction from API response

// New helper functions
function updateTokenCounter(tokens) { ... }
function formatNumber(num) { ... }
function getCurrentModelLimit() { ... }
```

**Template Changes**:
- Add token counter UI section in sidebar after API configuration
- Display session tokens and model limits
- Integrate with existing sidebar styling

**Affected Functionality**:
- ✅ API response processing (extract token data)
- ✅ Session management (reset tokens on new session)
- ✅ Model selection (update displayed limits)
- ✅ UI sidebar layout (new section added)

---

#### 2. **`src/components/chatbotStore.js`** (MINOR MODIFICATION)

**Impact Level**: 🟡 **MINOR**

**Changes Required**:
```javascript
// Optional: Add token tracking to global state
state: () => ({
  // ... existing state
  tokenLimits: {
    'gpt-4.1': 3000000,
    'gpt-4.1-mini': 15000000,
    // ... other limits
  }
}),

// Optional: Add token-related actions
actions: {
  // ... existing actions
  getModelLimit(modelName) {
    return this.tokenLimits[modelName] || 0;
  }
}
```

**Rationale**: Consider centralizing model limits in store for consistency, but not strictly necessary for Phase 1.

---

### 🔄 **MODULE INTEGRATION POINTS**

#### **API Response Handling**
```javascript
// Current flow:
User Message → API Call → Response Processing → UI Update

// Enhanced flow:
User Message → API Call → Response Processing → Token Extraction → UI Update
                                            ↓
                                     Update Token Counter
```

#### **State Management Flow**
```
Chat.vue Component State
├── sessionTokens (new)
├── chatHistory (existing)
├── apiKey (existing)
├── model (existing - now affects token limits)
└── isConnected (existing)
```

#### **UI Component Structure**
```
Chat.vue
├── Sidebar
│   ├── API Configuration (existing)
│   │   ├── API Key Input
│   │   ├── Model Selection
│   │   └── Connect/Clear buttons
│   └── Token Counter (NEW)
│       ├── Session tokens display
│       └── Model limit reference
├── Chat Area (existing - unchanged)
└── Report Modal (existing - unchanged)
```

---

### 🎯 **FUNCTIONAL IMPACT ANALYSIS**

#### **Core Features Affected**

1. **Message Sending Process** 🔴
   - **Before**: User message → API call → Response display
   - **After**: User message → API call → Response display + Token counting
   - **Risk**: Low (additive functionality)

2. **Session Management** 🟡
   - **Before**: New session clears chat history
   - **After**: New session clears chat history + resets token counter
   - **Risk**: Very low (simple addition)

3. **Model Selection** 🟡
   - **Before**: Model selection affects API calls
   - **After**: Model selection affects API calls + updates displayed limit
   - **Risk**: Very low (cosmetic addition)

4. **API Configuration** 🟡
   - **Before**: API key + model selection
   - **After**: API key + model selection + token usage display
   - **Risk**: Very low (UI addition only)

#### **Features NOT Affected** ✅

- Chat history management
- Conversation context retention (our recent fix)
- Report generation
- Bot configuration loading
- Router navigation
- Email integration (future feature)

---

### 📊 **DATA FLOW IMPACT**

#### **New Data Paths**
```
API Response → Token Data Extraction → Session Counter Update → UI Refresh
     ↓
Model Selection → Limit Lookup → Display Update
     ↓
New Session → Counter Reset → UI Update
```

#### **Existing Data Paths** (Unchanged)
```
User Input → Conversation State → API Call → Chat History → UI Update
     ↓
Bot Selection → Config Loading → State Update
     ↓
API Key → Connection Status → Feature Availability
```

---

### 🧪 **TESTING IMPACT**

#### **New Test Requirements**
1. **Unit Tests**:
   - Token extraction from API responses
   - Counter increment functionality
   - Model limit display accuracy
   - Session reset behavior

2. **Integration Tests**:
   - Token counter updates during conversations
   - Model selection affecting displayed limits
   - New session resetting counter

3. **UI Tests**:
   - Counter visibility in sidebar
   - Number formatting correctness
   - Responsive design with new component

#### **Existing Tests** (Minimal Impact)
- Most existing tests should continue to pass
- May need to update snapshots if UI structure changes
- Conversation flow tests unaffected

---

### 🔧 **DEPLOYMENT CONSIDERATIONS**

#### **Backward Compatibility**
- ✅ **100% Compatible**: No breaking changes
- ✅ **Progressive Enhancement**: Feature adds value without affecting existing functionality
- ✅ **Graceful Degradation**: If API doesn't return token data, counter shows "N/A"

#### **Performance Impact**
- ✅ **Minimal**: Simple numeric calculations
- ✅ **No Network Overhead**: Uses existing API response data
- ✅ **Memory Efficient**: Single reactive variable for session counting

#### **Browser Compatibility**
- ✅ **No New Dependencies**: Uses existing Vue.js reactive system
- ✅ **No Storage Requirements**: Session-only tracking for Phase 1
- ✅ **Standard JavaScript**: No advanced browser features required

---

### 🚀 **IMPLEMENTATION COMPLEXITY**

#### **Development Effort**
- **Time Estimate**: 2-3 hours
- **Complexity Level**: 🟢 **LOW**
- **Risk Level**: 🟢 **MINIMAL**

#### **Code Changes Summary**
```
Modified Files: 1 (Chat.vue)
New Files: 0
Deleted Files: 0
Dependencies Added: 0
Breaking Changes: 0
```

#### **Rollback Strategy**
- Simple revert of Chat.vue changes
- No database or storage cleanup needed
- No dependency rollback required

---

### 📋 **IMPLEMENTATION CHECKLIST**

#### **Pre-Implementation**
- [ ] Confirm API response includes token usage data
- [ ] Verify model name mappings in current system
- [ ] Test current sidebar layout capacity

#### **Implementation Steps**
1. [ ] Add reactive variables for token tracking
2. [ ] Modify sendMessage() to extract token data
3. [ ] Add token counter UI component to sidebar
4. [ ] Implement helper functions (formatting, limits)
5. [ ] Update session reset functionality
6. [ ] Test with various models and conversation lengths

#### **Post-Implementation**
- [ ] Verify counter accuracy with known token usage
- [ ] Test UI responsiveness with long numbers
- [ ] Validate session reset behavior
- [ ] Document feature for user guidance

---

### 🎯 **SUCCESS METRICS**

#### **Technical Metrics**
- Token counter displays correctly for all supported models
- Session reset clears counter to zero
- No performance degradation in message sending
- UI remains responsive and well-formatted

#### **User Experience Metrics**
- Users can see their session token usage
- Model limits are clearly displayed and accurate
- Counter provides useful information without being intrusive

This analysis shows the token counter feature has minimal impact on the existing codebase while providing valuable functionality for users to monitor their API usage against university quotas.
