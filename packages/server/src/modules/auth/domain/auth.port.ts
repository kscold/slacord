import type { UserEntity } from './user.entity';

export interface UserSaveData {
    email: string;
    username: string;
    passwordHash: string;
    avatarUrl: string | null;
}

/**
 * Auth Port (인터페이스)
 * - 인프라 계층이 구현해야 하는 계약
 */
export interface IUserRepository {
    findById(id: string): Promise<UserEntity | null>;
    findByIds(ids: string[]): Promise<UserEntity[]>;
    findByEmail(email: string): Promise<UserEntity | null>;
    save(user: UserSaveData): Promise<UserEntity>;
    existsByEmail(email: string): Promise<boolean>;
}

export const USER_REPOSITORY = Symbol('IUserRepository');
