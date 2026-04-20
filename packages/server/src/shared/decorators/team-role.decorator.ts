import { SetMetadata } from '@nestjs/common';

export type TeamAccessLevel = 'member' | 'writable' | 'admin' | 'owner';

export const TEAM_ROLE_KEY = 'team:role';

/**
 * 팀 스코프 엔드포인트의 필요 권한 선언.
 *
 * - `member`: 모든 팀 멤버 (guest 포함)
 * - `writable`: 쓰기 권한 있는 멤버 (guest 제외)
 * - `admin`: 관리자 이상
 * - `owner`: 오너만
 *
 * TeamAccessGuard가 이 메타데이터를 읽어 TeamAccessService를 호출하고,
 * 해결된 TeamAccess 객체를 req.teamAccess에 주입한다.
 * 컨트롤러에서는 @TeamAccess() 파라미터 데코레이터로 접근할 수 있다.
 */
export const TeamRole = (level: TeamAccessLevel) => SetMetadata(TEAM_ROLE_KEY, level);
