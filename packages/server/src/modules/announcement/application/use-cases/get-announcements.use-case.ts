import { Inject, Injectable } from '@nestjs/common';
import type { IAnnouncementRepository } from '../../domain/announcement.port';
import { ANNOUNCEMENT_REPOSITORY } from '../../domain/announcement.port';
import type { AnnouncementEntity } from '../../domain/announcement.entity';

@Injectable()
export class GetAnnouncementsUseCase {
    constructor(@Inject(ANNOUNCEMENT_REPOSITORY) private readonly repo: IAnnouncementRepository) {}

    async execute(teamId: string): Promise<AnnouncementEntity[]> {
        return this.repo.findByTeam(teamId);
    }
}
