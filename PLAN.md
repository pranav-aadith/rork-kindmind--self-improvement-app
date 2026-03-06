# Kora notifies you when you're out of XP


## What's changing

When you try to send a message to Kora but have fewer than 20 XP, instead of silently failing or sending anyway, **Kora herself will respond** in the chat with a friendly message explaining you're out of XP and telling you how to earn more.

## Features

- **XP check before sending** — before any message (typed, voice, or quick prompt) goes through, your current XP is checked
- **Kora's in-chat response** — if you don't have enough XP, a message from Kora appears in the chat saying something like: *"You don't have enough XP to chat right now 🐨 Earn more by completing a daily check-in, journaling, or finishing a breathing session!"*
- **No XP deducted** — since the message isn't sent, no XP is spent
- **Works for all message types** — typed messages, quick prompts (Gentle reply, Repair, etc.), and voice recordings all go through the same check

## Design

- The low-XP notice appears as a normal Kora bubble in the chat — same look as any other Kora response
- Friendly and encouraging tone, not punishing
- The chat scrolls down to show the message automatically
