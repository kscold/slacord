import type { AnnouncementEntity } from './announcement.entity';

/** 공지사항 레포지토리 포트 */
export interface IAnnouncementRepository {
    findByTeam(teamId: string): Promise<AnnouncementEntity[]>;
    findById(id: string): Promise<AnnouncementEntity | null>;
    save(data: {
        teamId: string;
        title: string;
        content: string;
        createdBy: string;
    }): Promise<AnnouncementEntity>;
    updatePin(id: string, isPinned: boolean): Promise<AnnouncementEntity | null>;
    deleteById(id: string): Promise<boolean>;
}

export const ANNOUNCEMENT_REPOSITORY = Symbol('ANNOUNCEMENT_REPOSITORY');
