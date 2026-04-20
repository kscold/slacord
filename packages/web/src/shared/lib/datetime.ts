/**
 * 프로젝트 공용 한국어 날짜/시간 포맷 유틸.
 *
 * 기존에 new Date(x).toLocaleString('ko-KR', {...}) / new Intl.DateTimeFormat('ko-KR')
 * 가 컴포넌트마다 약간씩 다른 옵션으로 흩어져 있어 화면마다 형식이 미묘하게 달랐음.
 *
 * 모든 포맷 함수는 Date | string | number를 받는다 — API 응답의 ISO 문자열을
 * 그대로 넘길 수 있음.
 */

type DateInput = Date | string | number;

function toDate(input: DateInput): Date {
    return input instanceof Date ? input : new Date(input);
}

/** "4월 20일 14:30" — 알림/메시지 미리보기용 짧은 형식 */
export function formatShortDateTime(input: DateInput): string {
    return toDate(input).toLocaleString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/** "2026. 4. 20. 오후 2:30" — 일반 toLocaleString 동등 (기본 한국어 포맷) */
export function formatDateTime(input: DateInput): string {
    return toDate(input).toLocaleString('ko-KR');
}

/** "오후 2:30" — 시간만 (채팅 메시지 등에서 사용) */
export function formatTime(input: DateInput): string {
    return toDate(input).toLocaleString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

/** "2026-04-20 14:30" — 감사 로그·타임스탬프 정렬 친화적 형식 */
export function formatSortableDateTime(input: DateInput): string {
    return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(toDate(input));
}
