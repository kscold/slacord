import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { ITeamRepository } from '../../domain/team.port';
import {
    TeamEntity,
    TeamInviteLink,
    TeamMember,
    createDefaultBridgeWorkerConfig,
    type TeamAuditLogEntry,
    type BridgeWorkerConfig,
    type GitHubConfig,
} from '../../domain/team.entity';
import { Team, TeamDocument } from './team.schema';

/** Team Repository Adapter - MongoDB 구현체 */
@Injectable()
export class TeamRepository implements ITeamRepository {
    constructor(@InjectModel(Team.name) private readonly teamModel: Model<TeamDocument>) {}

    private static readonly MAX_AUDIT_LOGS = 120;

    async findById(id: string): Promise<TeamEntity | null> {
        if (!isValidObjectId(id)) return null;
        const doc = await this.teamModel.findById(id).lean();
        return doc ? this.toEntity(doc) : null;
    }

    async findBySlug(slug: string): Promise<TeamEntity | null> {
        const doc = await this.teamModel.findOne({ slug }).lean();
        return doc ? this.toEntity(doc) : null;
    }

    async findByInviteCode(code: string): Promise<TeamEntity | null> {
        const doc = await this.teamModel.findOne({ 'inviteLinks.code': code }).lean();
        return doc ? this.toEntity(doc) : null;
    }

    async findByGithubRepo(repoFullName: string): Promise<TeamEntity | null> {
        // repoFullName은 "owner/repo" 형태. repoUrl에 이 문자열이 포함된 팀을 MongoDB에서 직접 검색
        const escapedName = repoFullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const doc = await this.teamModel.findOne({
            'githubConfig.repoUrl': { $regex: escapedName, $options: 'i' },
        }).lean();
        return doc ? this.toEntity(doc) : null;
    }

    async findByMember(userId: string): Promise<TeamEntity[]> {
        const docs = await this.teamModel.find({ 'members.userId': userId }).lean();
        return docs.map((doc) => this.toEntity(doc));
    }

    async save(data: {
        name: string;
        slug: string;
        description: string | null;
        iconUrl: string | null;
        members: TeamMember[];
        inviteLinks?: TeamInviteLink[];
    }): Promise<TeamEntity> {
        const doc = await this.teamModel.create(data);
        return this.toEntity(doc.toObject());
    }

    async addMember(teamId: string, member: TeamMember, auditLog?: TeamAuditLogEntry): Promise<TeamEntity> {
        const auditLogUpdate = this.buildAuditLogUpdate(auditLog);
        const doc = await this.teamModel
            .findByIdAndUpdate(
                teamId,
                {
                    $push: {
                        members: member,
                        ...(auditLogUpdate.$push ?? {}),
                    },
                },
                { new: true },
            )
            .lean();
        if (!doc) throw new NotFoundException(`팀을 찾을 수 없습니다: ${teamId}`);
        return this.toEntity(doc);
    }

    async replaceAccess(
        teamId: string,
        members: TeamMember[],
        inviteLinks: TeamInviteLink[],
        auditLog?: TeamAuditLogEntry,
    ): Promise<TeamEntity | null> {
        const doc = await this.teamModel
            .findByIdAndUpdate(teamId, { $set: { members, inviteLinks }, ...this.buildAuditLogUpdate(auditLog) }, { new: true })
            .lean();
        return doc ? this.toEntity(doc) : null;
    }

    async existsBySlug(slug: string): Promise<boolean> {
        return !!(await this.teamModel.exists({ slug }));
    }

    async updateGithubConfig(teamId: string, config: GitHubConfig, auditLog?: TeamAuditLogEntry): Promise<TeamEntity | null> {
        const doc = await this.teamModel
            .findByIdAndUpdate(teamId, { $set: { githubConfig: config }, ...this.buildAuditLogUpdate(auditLog) }, { new: true })
            .lean();
        return doc ? this.toEntity(doc) : null;
    }

    async updateBridgeConfig(teamId: string, config: BridgeWorkerConfig, auditLog?: TeamAuditLogEntry): Promise<TeamEntity | null> {
        const doc = await this.teamModel
            .findByIdAndUpdate(teamId, { $set: { bridgeConfig: config }, ...this.buildAuditLogUpdate(auditLog) }, { new: true })
            .lean();
        return doc ? this.toEntity(doc) : null;
    }

    async appendAuditLog(teamId: string, auditLog: TeamAuditLogEntry): Promise<TeamEntity | null> {
        const doc = await this.teamModel.findByIdAndUpdate(teamId, this.buildAuditLogUpdate(auditLog), { new: true }).lean();
        return doc ? this.toEntity(doc) : null;
    }

    private toEntity(doc: any): TeamEntity {
        return new TeamEntity(
            doc._id.toString(),
            doc.name,
            doc.slug,
            doc.description,
            doc.iconUrl,
            doc.members.map((m: any) => ({
                userId: m.userId,
                role: m.role,
                joinedAt: m.joinedAt,
                canManageInvites: !!m.canManageInvites,
            })),
            (doc.inviteLinks ?? []).map((invite: any) => ({
                code: invite.code,
                label: invite.label ?? null,
                createdBy: invite.createdBy,
                defaultRole: invite.defaultRole,
                expiresAt: invite.expiresAt ?? null,
                maxUses: invite.maxUses ?? null,
                useCount: invite.useCount ?? 0,
                revokedAt: invite.revokedAt ?? null,
                createdAt: invite.createdAt,
            })),
            doc.githubConfig ?? null,
            {
                ...createDefaultBridgeWorkerConfig(),
                ...(doc.bridgeConfig ?? {}),
                slack: {
                    ...createDefaultBridgeWorkerConfig().slack,
                    ...(doc.bridgeConfig?.slack ?? {}),
                },
                discord: {
                    ...createDefaultBridgeWorkerConfig().discord,
                    ...(doc.bridgeConfig?.discord ?? {}),
                },
            },
            doc.createdAt,
            (doc.auditLogs ?? []).map((auditLog: any) => ({
                id: auditLog.id,
                actorId: auditLog.actorId,
                category: auditLog.category,
                action: auditLog.action,
                summary: auditLog.summary,
                target: auditLog.target ?? null,
                metadata: auditLog.metadata ?? {},
                createdAt: auditLog.createdAt,
            })),
        );
    }

    private buildAuditLogUpdate(auditLog?: TeamAuditLogEntry) {
        if (!auditLog) return {};

        return {
            $push: {
                auditLogs: {
                    $each: [auditLog],
                    $position: 0,
                    $slice: TeamRepository.MAX_AUDIT_LOGS,
                },
            },
        };
    }
}
