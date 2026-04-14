# Slacord Capability Matrix

Slacord is not targeting a 1:1 vendor API clone.
The target is to reproduce the collaboration workflows users expect from Slack, Discord, and Flex inside one internal tool.

## Current Core Surface

| Slacord capability                    | Slack-like             | Discord-like         | Flex-like         | Status         |
| ------------------------------------- | ---------------------- | -------------------- | ----------------- | -------------- |
| Workspace and channel model           | Workspace / channel    | Server / channel     | Team room         | Live           |
| Cookie auth and member identity       | Login / member profile | Member identity      | Employee identity | Live           |
| Realtime channel chat                 | Channel timeline       | Text channel chat    | Realtime room     | Live           |
| Threaded replies                      | Message thread         | Forum-style replies  | Follow-up thread  | Live           |
| Pinned messages                       | Channel pins           | Pin board            | Important posts   | Live           |
| Direct messages and small group rooms | DM / group DM          | DM / group DM        | Ad-hoc room       | Live           |
| Emoji reactions                       | Reacji                 | Reactions            | Quick feedback    | Live           |
| Typing indicator                      | Typing state           | Typing state         | Presence cue      | Live           |
| Mentions and unread counters          | Mentions / inbox       | Mentions / badges    | Activity inbox    | Live           |
| Announcements                         | Posts / notices        | Announcement channel | Broadcast panel   | Live           |
| Documents and wiki                    | Canvas / docs          | Shared notes         | Knowledge area    | Live           |
| Issues / kanban                       | Lists / tasks          | Project board        | Work tracker      | Live           |
| File attachments                      | File share             | Attachment upload    | Asset share       | Live via MinIO |
| Rich upload workflows                 | Image preview / DnD    | Multi-file upload    | Asset staging     | Live           |
| Voice / huddle style rooms            | Slack huddle           | Discord voice room   | Quick sync room   | Live           |
| Role-based permissions                | Workspace roles        | Server roles         | Team access lanes | Live           |
| External bridge workers               | Workflow bridge        | Webhook relay        | Event relay       | Live           |

## Next Parity Targets

All currently tracked large parity targets are now live in the product surface.

## Storage Rule

- Binary assets use MinIO through the Slacord storage port.
- Public asset URLs are exposed through `https://bucket.kscold.com/<bucket>/<object>`.
- Chat attachments are stored under `slacord/chat/<team>/<channel>/<user>/<date>/...`.
