import { Injectable } from '@nestjs/common';
import { PresenceEntity, PresenceStatus } from '../../domain/presence.entity';

/** 팀원 온라인 상태 관리 서비스 (in-memory Map 사용) */
@Injectable()
export class PresenceService {
    /** userId → { status, lastSeen } 맵 */
    private readonly store = new Map<string, { status: PresenceStatus; lastSeen: Date }>();

    setOnline(userId: string): void {
        this.store.set(userId, { status: 'online', lastSeen: new Date() });
    }

    setOffline(userId: string): void {
        this.store.set(userId, { status: 'offline', lastSeen: new Date() });
    }

    setStatus(userId: string, status: PresenceStatus): void {
        this.store.set(userId, { status, lastSeen: new Date() });
    }

    getAll(): PresenceEntity[] {
        return Array.from(this.store.entries()).map(
            ([userId, { status, lastSeen }]) => new PresenceEntity(userId, status, lastSeen),
        );
    }

    get(userId: string): PresenceEntity | null {
        const entry = this.store.get(userId);
        if (!entry) return null;
        return new PresenceEntity(userId, entry.status, entry.lastSeen);
    }
}
