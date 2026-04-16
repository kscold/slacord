# Product Roadmap

Slacord already covers the current large parity surface.
The next phase is product hardening, navigation polish, and scaling the current
UX without growing accidental complexity.

## Phase 1: Product Polish Sprint

### Goals

- reduce duplicate team/workspace fetches
- replace browser-native `confirm` / `alert` patterns
- stabilize document actions and settings state flow
- remove the most visible UX rough edges before new features land

### Scope

- introduce a shared team workspace data layer for client screens
- migrate settings panels, sidebar state, issue board state, and channel room
  bootstrap to the shared workspace snapshot
- replace document archive / restore / delete confirms with in-app dialogs
- replace document attachment upload alerts with inline error feedback

### Current Status

- `in_progress`
- shared workspace hook/store introduced
- document destructive actions moved to in-app confirmation dialogs
- settings, sidebar, issue board, and channel bootstrap now read from the shared
  workspace snapshot
- background refresh no longer tears down the settings page during save flows

## Phase 2: Search And History

### Goals

- move message search from dashboard-only helper flow to product-level search
- support deeper message history browsing inside channels
- stop treating recent-message sampling as a long-term search solution

### Scope

- workspace-level command palette / search entry
- server-backed message search endpoint
- channel message pagination and jump-to-context UX
- unread anchor / recent position restore

### Current Status

- `in_progress`
- dashboard message search is now backed by a server API instead of client-side
  workspace scraping
- channel pages can load older history on demand and deep-link to searched
  messages outside the initial 50-message window
- workspace sidebar and dashboard now expose a `mod+k` quick search palette
- channel pages restore unread anchors or the last viewed older message when
  re-entering the conversation

## Phase 3: Navigation And Accessibility

### Goals

- align desktop and mobile workspace navigation
- improve overlay semantics and keyboard flow
- reduce interaction friction for notifications and secondary panels

### Scope

- consolidate duplicated sidebar / mobile nav structures
- add focus trap and keyboard handling to notification and modal overlays
- refine message list auto-scroll behavior
- improve empty, loading, and error states for workspace pages

### Current Status

- `in_progress`
- notification overlay now closes with `Esc`, traps focus, restores focus, and
  closes on outside click
- message and thread panes no longer force-scroll readers away from older
  history and provide a jump-to-latest affordance
- team settings now split into delivery, access, and import sections with a
  workspace summary deck instead of a single long scroll page

## Phase 4: Collaboration Depth

### Goals

- deepen the product after current parity features stabilize
- build workflows that make documents, chat, and issues feel truly connected

### Scope

- audit log for admin actions and bridge operations
- richer document collaboration flows such as comments and inline discussion
- command-style quick actions across issues, docs, and channels
- stronger bridge observability and replay tools

### Current Status

- `in_progress`
- team settings now expose an operations section with admin audit logs for delivery,
  access, and bridge retry flows
- GitHub, bridge config, invite link, member access, and bridge retry actions now
  append team-scoped audit entries
- `mod+k` palette now layers command-style quick actions for channels, docs, and
  issues on top of global message search
- document detail pages now support quoted discussion starters, threaded comments,
  resolve flows, and document-targeted notification routing
