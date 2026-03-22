/**
 * User 도메인 엔티티
 * - 인프라 의존성 없는 순수 도메인 객체
 */
export class UserEntity {
    constructor(
        public readonly id: string,
        public readonly email: string,
        public readonly username: string,
        public readonly passwordHash: string,
        public readonly avatarUrl: string | null,
        public readonly createdAt: Date,
    ) {}

    /** 이메일이 유효한 형식인지 검증 */
    isValidEmail(): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
    }

    /** 공개 가능한 사용자 정보 (비밀번호 제외) */
    toPublic() {
        return {
            id: this.id,
            email: this.email,
            username: this.username,
            avatarUrl: this.avatarUrl,
            createdAt: this.createdAt,
        };
    }
}
