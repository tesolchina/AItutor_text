# Outline Persistence & Evidence-Based Feedback - Test Log
Date: 2025-09-03
Branch: UI-enhancement

## Changes
- Persistent storage of student outlines during Review mode (and auto-detects outlines to switch to Review if needed).
- System prompt now always injects stored outline context across turns.
- Bot configs updated:
  - Feedback on Outline: requires short quoted snippets from Outline 1/2 with each comment.
  - IELTS Writing Tutor: requires short quoted excerpts for Protocols 2 & 3.

## Smoke Tests
1) Paste two outlines (numbered 1 and 2) → Bot generates comparison table with quotes.
2) Ask “How should I revise outline 1?” → Bot references stored outline without asking to resend.
3) Ask general improvement question → Bot includes brief quoted evidence in comments.

Result: PASS (quotes included; outline context retained across follow-ups)

## Notes
- Long outlines are truncated when embedded to avoid token bloat; raw text kept in state.
- Re-pasting outlines overwrites the stored context.

## Next UI Fixes (Deferred)
- Sidebar preview of captured Outline 1/2.
- "Replace outlines" action.
- Minor visual polish in chat bubbles.
