# FOLD - Future Updates & Ideas

This document tracks upcoming features, enhancements, and brainstorming ideas for the FOLD application.

## 1. AI-Assisted Smart Messaging (Auto-Generated Prompts)
**Concept:** When a user sets a reminder linked to a specific connection (person), the system will automatically generate a contextual, ready-to-send message or email draft. 

**Scenarios:**
- **Birthdays:** Automatically drafts a thoughtful "Happy Birthday" message based on the relationship type or notes saved for that connection.
- **Hang-outs / Catch-ups:** Generates a quick text like, *"Hey [Name], are we still on for our coffee meet-up tomorrow?"*
- **Custom Scenarios:** If a reminder says "Check in on project" or "Congratulate on new job," the system drafts a suitable message.

**Potential Implementation:**
- A UI button on the reminder card: "✨ Generate Message"
- Display the drafted message in a small text box where the user can tweak it.
- Include quick-action buttons: "Copy to Clipboard", "Send via Email", or "Open in WhatsApp".
- Could be powered by a lightweight LLM API (like Gemini or OpenAI) to make the tone match the relationship (e.g., formal for colleagues, casual for close friends).

---

## 2. Natural Language Companion & "Ask FOLD" Interface
**Concept:** Transform FOLD into an interactive, real-time personal companion that allows users to query, update, and manage their journal, connections, and reminders using natural conversation—just like speaking to a personal assistant.

**Core Capabilities & Scenarios:**
- **Natural Queries & Recall:**
  - *"Who do I know at Stripe?"* → Filters connections by company, notes, or tags.
  - *"When did I last talk to Octopi?"* → Cross-references journal entries, reminders, and interaction logs.
  - *"Who am I meeting tomorrow?"* → Pulls tomorrow's schedule, reminders, and linked contacts.
- **Fast Person Creation & Updates:**
  - *"Add Sarah, she's an analyst at Myntra"* → Parses name, role, and company into a structured Connection record.
  - *"Add a note to Sarah: she's starting a nursery"* → Appends to Sarah's existing notes without needing to open form modals.
- **Natural Language Reminders:**
  - *"Remind me to call John on Tuesday about the next proposal"* → Extracts person (`John`), date (`next Tuesday`), time, and topic into a Reminder linked to that Connection.

**Potential Implementation:**
- **UI:** A floating command bar (`Cmd/Ctrl + K`) or an expandable bottom-corner conversational chat interface ("Ask FOLD").
- **Backend Architecture:** LLM-powered agent with structured Tool/Function Calling:
  - `queryConnections(filters)`
  - `createConnection({ name, company, role, notes })`
  - `appendConnectionNote({ connectionId, note })`
  - `createReminder({ title, date, connectionId })`
  - `searchJournal({ query, dateRange })`
- **Voice / Quick Capture:** Mobile voice input or speech-to-text for hands-free logging on the go.

---
*(Add new ideas below this line as they come up)*
