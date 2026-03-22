import { Inject, Injectable } from '@nestjs/common';
import type { IAnnouncementRepository } from '../../domain/announcement.port';
import { ANNOUNCEMENT_REPOSITORY } from '../../domain/announcement.port';
import type { AnnouncementEntity } from '../../domain/announcement.entity';

@Injectable()
export class CreateAnnouncementUseCase {
    constructor(@Inject(ANNOUNCEMENT_REPOSITORY) private readonly repo: IAnnouncementRepository) {}

    async execute(data: { teamId: string; title: string; content: string; createdBy: string }): Promise<AnnouncementEntity> {
        return this.repo.save(data);
    }
}
