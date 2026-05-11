import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { TEAM_REPOSITORY, type ITeamRepository } from '../../domain/team.port';
import { createTeamAuditLogEntry, type TeamInviteRole } from '../../domain/team.entity';
import { CLOCK, type Clock } from '../../../../shared/lib/clock';

export interface CreateInviteLinkInput {
    teamId: string;
    userId: string;
    label?: string;
    defaultRole?: TeamInviteRole;
    maxUses?: number | null;
    expiresInDays?: number | null;
}

@Injectable()
export class CreateInviteLinkUseCase {
    constructor(
        @Inject(TEAM_REPOSITORY) private readonly teamRepo: ITeamRepository,
        @Inject(CLOCK) private readonly clock: Clock,
    ) {}

    async execute(input: CreateInviteLinkInput) {
        const team = await this.teamRepo.findById(input.teamId);
        if (!team || !team.canManageInvites(input.userId)) throw new BadRequestException('초대를 관리할 수 없습니다.');
        const expiresAt = input.expiresInDays ? new Date(this.clock.now().getTime() + input.expiresInDays * 86400000) : null;
        const next = {
            code: randomBytes(9).toString('base64url'),
            label: input.label?.trim() || null,
            createdBy: input.userId,
            defaultRole: input.defaultRole ?? 'member',
            expiresAt,
            maxUses: input.maxUses ?? null,
            useCount: 0,
            revokedAt: null,
            createdAt: this.clock.now(),
        } as const;
        const updated = await this.teamRepo.replaceAccess(
            input.teamId,
            team.members,
            [next, ...team.inviteLinks],
            createTeamAuditLogEntry({
                actorId: input.userId,
                category: 'access',
                action: 'invite_link_created',
                summary: '초대 링크를 생성함',
                target: next.label ?? next.code,
                metadata: {
                    code: next.code,
                    defaultRole: next.defaultRole,
                    expiresAt: next.expiresAt?.toISOString() ?? null,
                    maxUses: next.maxUses,
                },
            }),
        );
        if (!updated) throw new BadRequestException('초대 링크 생성에 실패했습니다.');
        return next;
    }
}
