import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import type { IAnnouncementRepository } from '../../domain/announcement.port';
import { ANNOUNCEMENT_REPOSITORY } from '../../domain/announcement.port';
import type { AnnouncementEntity } from '../../domain/announcement.entity';

@Injectable()
export class PinAnnouncementUseCase {
    constructor(@Inject(ANNOUNCEMENT_REPOSITORY) private readonly repo: IAnnouncementRepository) {}

    async execute(id: string, isPinned: boolean): Promise<AnnouncementEntity> {
        const result = await this.repo.updatePin(id, isPinned);
        if (!result) throw new BadRequestException('존재하지 않는 공지사항입니다.');
        return result;
    }
}
