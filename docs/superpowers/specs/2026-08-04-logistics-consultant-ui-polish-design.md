# Logistics Consultant — UI Polish Design

## Overview

Refine the Logistics Consultant AI chat interface from a generic shadcn/neutral look to a distinctive "consulting report" aesthetic, inspired by high-end consulting publications (McKinsey, BCG).

## Aesthetic Direction

**Editorial Premium / 咨询报告风** — Light theme with warm ivory background, navy as primary brand color, crimson as accent. The interface should feel like a living consulting report: authoritative, refined, and editorially polished.

## Design Tokens

### Typography

| Role | Font | Source |
|------|------|--------|
| Display / Headings | Instrument Serif | Google Fonts |
| Body / UI | Plus Jakarta Sans | Google Fonts |

### Color Palette

| Token | Value | Purpose |
|-------|-------|---------|
| `--background` | `#faf9f7` (warm ivory) | Page background |
| `--foreground` | `#292524` (stone 900) | Body text |
| `--primary` | `#0c4a6e` (navy) | Brand color, user bubbles, buttons |
| `--primary-foreground` | `#ffffff` | Text on primary |
| `--secondary` | `#f5f0eb` (warm stone) | Subtle backgrounds |
| `--secondary-foreground` | `#292524` | Text on secondary |
| `--muted` | `#f5f0eb` | Muted backgrounds |
| `--muted-foreground` | `#78716c` (stone 500) | Secondary text |
| `--accent` | `#be123c` (crimson) | Accent/emphasis |
| `--accent-foreground` | `#ffffff` | Text on accent |
| `--border` | `#e7e5e4` (stone 200) | Borders |
| `--input` | `#e7e5e4` | Input borders |
| `--ring` | `#0c4a6e` | Focus rings |
| `--sidebar` | `#ffffff` | Sidebar background |
| `--sidebar-border` | `#e7e5e4` | Sidebar border |
| `--radius` | `0.625rem` | Base border radius |

## Component Changes

### NavBar
- Bottom border: 2px navy accent line instead of plain gray
- Title "Logistics Consultant" in Instrument Serif italic
- Button hover states with subtle background transition

### ChatWindow (Empty State)
- Title in Instrument Serif, larger (3xl)
- Decorative thin line below title
- Subtitle text refined for warmth
- Better vertical centering

### HumanMessage (User Bubble)
- Navy (`#0c4a6e`) background
- White text
- Subtle drop shadow
- `rounded-xl` (12px) with larger bottom-right radius

### AIMessage
- AI avatar on the left: navy circle with white "AI" initials
- Avatar subtly pulses on first appearance
- Wider prose content area

### MessageList
- Entry animation for new messages (framer-motion slide + fade)
- Loading indicator: three bouncing dots with "Thinking..." label
- AI avatar shown during loading state

### ChatInput
- Background: warm `#f5f0eb` inside the textarea
- Focus: navy border + subtle ring glow
- Larger border-radius (`rounded-2xl`)
- Send button: navy primary with hover darken

### ChatHistory (Sidebar)
- Active session: navy left border indicator (2px)
- Hover: warm `#f5f0eb` background
- Delete button: hidden until row hover
- Session title truncation with ellipsis

### Global
- Smooth transitions on theme-related properties
- Body background: warm ivory `#faf9f7`
- Card-like surfaces: white with subtle shadow
- Consistent spacing using Tailwind's spacing scale

## Files Modified

- `src/app/globals.css` — token overrides, custom utilities, animations
- `src/app/layout.tsx` — font configuration
- `src/components/chat/ChatWindow.tsx` — empty state, spacing
- `src/components/layout/NavBar.tsx` — accent line, serif title
- `src/components/chat/HumanMessage.tsx` — navy bubble
- `src/components/chat/AIMessage.tsx` — AI avatar
- `src/components/chat/MessageList.tsx` — animations, loading
- `src/components/chat/ChatInput.tsx` — warm bg, focus ring
- `src/components/chat/ChatHistory.tsx` — indicator, hover