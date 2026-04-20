/**
 * 도메인 필드 길이 제한 모음.
 * 여기저기 흩어져 있던 `.slice(0, N)` / `truncate(x, N)` 매직 넘버 집계.
 */

/** 알림 본문 요약 최대 길이 — 목록/푸시에서 가볍게 보여줄 정도 */
export const NOTIFICATION_CONTENT_MAX = 160;

/** 스레드 답글 알림 본문 요약 (멘션보다 짧게) */
export const THREAD_REPLY_CONTENT_MAX = 100;

/** 문서 코멘트 anchor text — 하이라이트된 문장 단편의 최대 길이 */
export const DOCUMENT_ANCHOR_TEXT_MAX = 280;

/** Slack webhook block 설명 최대 길이 (Slack 공식 제한 3000자보다 여유) */
export const SLACK_EMBED_DESCRIPTION_MAX = 2800;

/** Discord embed description 최대 길이 (Discord 공식 제한 4096자보다 여유) */
export const DISCORD_EMBED_DESCRIPTION_MAX = 3500;

/** 네이티브 Notification 제목 (Electron main 프로세스에서 사용) */
export const NATIVE_NOTIFICATION_TITLE_MAX = 200;

/** 네이티브 Notification 본문 */
export const NATIVE_NOTIFICATION_BODY_MAX = 500;
