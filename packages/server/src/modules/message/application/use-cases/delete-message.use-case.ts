import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import type { IMessageRepository } from '../../domain/message.port';
import { MESSAGE_REPOSITORY } from '../../domain/message.port';
import type { ITeamRepository } from '../../../team/domain/team.port';
import { TEAM_REPOSITORY } from '../../../team/domain/team.port';

/** 메시지 삭제 유스케이스 - 작성자 본인 또는 팀 오너/어드민 가능 */
@Injectable()
export class DeleteMessageUseCase {
    constructor(
        @Inject(MESSAGE_REPOSITORY) private readonly messageRepo: IMessageRepository,
        @Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository,
    ) {}

    async execute(messageId: string, userId: string): Promise<void> {
        const message = await this.messageRepo.findById(messageId);
        if (!message) throw new BadRequestException('존재하지 않는 메시지입니다.');

        if (message.authorId !== userId) {
            // 작성자가 아니면 팀 오너/어드민인지 확인
            const team = message.teamId ? await this.teamRepo.findById(message.teamId) : null;
            const isTeamAdmin = team?.isOwner(userId) ?? false;
            if (!isTeamAdmin) {
                throw new BadRequestException('메시지 작성자 또는 팀 관리자만 삭제할 수 있습니다.');
            }
        }

        await this.messageRepo.deleteById(messageId);
    }
}
