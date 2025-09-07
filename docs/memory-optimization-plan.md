# Memory Optimization Plan

## Current Status
- Date: September 3, 2025
- Branch: fix/memory-optimization
- Focus: Resolving memory usage issues in the ByteWise chatbot

## Identified Memory Issues
1. **Long Chat History**: Potential memory leaks when chat history becomes very long
2. **State Management**: Inefficient handling of conversation state objects
3. **DOM Recycling**: Potential rendering performance issues with large chat histories
4. **Protocol Memory Drift**: Mode/step not consistently embedded causing the assistant to revert to welcome/menu unexpectedly

## Optimization Strategies

### 1. Chat History Pagination
- Implement virtual scrolling for chat messages
- Only render visible messages in the DOM
- Store full history but paginate display
	- Implemented: capped rendered messages at 200; persisted max 1000 messages with pruning

### 2. Memory-Efficient State Management
- Review Pinia store implementation
- Optimize state objects structure
- Implement cleanup for unused state
	- Implemented: standardized augmented system prompt to include mode/step/topic across all protocols; added lightweight state banner for quick verification

### 3. Resource Cleanup
- Add proper cleanup in component lifecycle hooks
- Review event listener management
- Implement garbage collection helpers
	- Implemented: history pruning helper and save-time pruning

## Implementation Plan
1. Profile current memory usage patterns
2. Implement chat history virtualization [DONE]
3. Optimize state management [IN PROGRESS]
4. Add memory monitoring utilities [TODO]
5. Test with long conversations [IN PROGRESS]

## Progress Tracking
- [ ] Memory usage baseline established
- [x] Chat history virtualization implemented (render cap 200; storage cap 1000)
- [x] State prompt augmentation across modes (brainstorm/review/feedback)
- [ ] Memory leak detection tools added
- [ ] Performance testing completed

## Debugging Guide

When memory/context issues occur (e.g., assistant reverts to welcome/menu, sluggish UI with long chats):

1) Validate Mode/Step/Topic
- Use the new on-screen banner in Chat view to confirm mode, step, and topic.
- Confirm the system prompt augmentation includes CURRENT MODE/STEP/TOPIC.

2) Check History Size and Pruning
- Open DevTools console and check for "🧹 Pruning X old messages" logs.
- Confirm that localStorage has at most ~1000 messages for the current bot key.

3) Token Counter Side Effects
- Verify token updates don’t excessively log to window.tokenLogs (download if needed).
- Large token logs can be downloaded and cleared by refreshing.

4) API Response Consistency
- Inspect the console for the "API RESPONSE DEBUG" block to ensure usage fields are detected.
- If missing, fallback estimation is used; consider adding a server-side usage field.

5) Reproduction Script
- Start with 'menu' -> choose 2 (review) -> paste a long outline (>200 chars).
- Ensure the assistant stays in review mode and doesn’t ask what you want again.
- Repeat for 1 (brainstorm) and 3 (feedback) with multi-turn exchanges (20+ turns).

## Next Steps
- Add intersection observer-based virtual list for true virtualization.
- Persist conversationState separately with versioning to survive reloads.
- Add a memory baseline script using Chrome Performance API snapshots.
- Integrate a lightweight leak detector (e.g., watch for detached nodes).

## Notes
Memory optimization will focus on both reducing the overall memory footprint and preventing memory leaks during extended usage sessions.

This work builds on our previous conversation context fixes by ensuring that the enhanced functionality doesn't negatively impact performance or memory usage.
