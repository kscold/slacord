/**
 * `@username` 멘션 토큰 추출 및 userId 해석 공용 로직.
 *
 * 기존에 send-message.use-case.ts와 create-document-comment.use-case.ts에
 * 각각 동일한 구현이 있었음 — 두 곳에서 같이 쓰도록 추출.
 */

const MENTION_PATTERN = /@([^\s@]+)/g;
const TRAILING_PUNCTUATION = /[.,!?;:]+$/g;

/**
 * `@강경민안녕` 같이 구두점이 붙은 토큰을 정리해 소문자 토큰 배열 반환.
 * 중복 제거는 하지 않음 — 호출부에서 Set으로 처리.
 */
export function extractMentionTokens(content: string): string[] {
    const tokens: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = MENTION_PATTERN.exec(content)) !== null) {
        tokens.push(match[1].replace(TRAILING_PUNCTUATION, '').toLowerCase());
    }
    return tokens;
}

/**
 * 토큰들을 팀 멤버 username과 매칭해 userId 배열로 변환.
 * 작성자 본인과 중복은 제외.
 *
 * @param tokens `extractMentionTokens`로 얻은 토큰들
 * @param members `{ userId, username }` 구조 (혹은 호환되는 객체)
 * @param authorId 작성자 본인 userId (자기 자신 멘션 제거용)
 */
export function resolveMentionUserIds<T extends { userId: string; username: string }>(
    tokens: string[],
    members: T[],
    authorId: string,
): string[] {
    if (tokens.length === 0) return [];
    const userIdByUsername = new Map(members.map((m) => [m.username.toLowerCase(), m.userId]));
    return [
        ...new Set(
            tokens
                .map((token) => userIdByUsername.get(token))
                .filter((userId): userId is string => Boolean(userId) && userId !== authorId),
        ),
    ];
}
