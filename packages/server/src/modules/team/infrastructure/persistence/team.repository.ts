import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { ITeamRepository } from '../../domain/team.port';
import { TeamEntity, TeamInviteLink, TeamMember, type GitHubConfig } from '../../domain/team.entity';
import { Team, TeamDocument } from './team.schema';
import { normalizeGitHubRepo } from '../../../../shared/lib/normalize-github-repo';

/** Team Repository Adapter - MongoDB 구현체 */
@Injectable()
export class TeamRepository implements ITeamRepository {
    constructor(@InjectModel(Team.name) private readonly teamModel: Model<TeamDocument>) {}

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
        const docs = await this.teamModel.find({ githubConfig: { $ne: null } }).lean();
        const doc = docs.find((item) => normalizeGitHubRepo(item.githubConfig?.repoUrl ?? '') === repoFullName);
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

    async addMember(teamId: string, member: TeamMember): Promise<TeamEntity> {
        const doc = await this.teamModel
            .findByIdAndUpdate(teamId, { $push: { members: member } }, { new: true })
            .lean();
        return this.toEntity(doc!);
    }

    async replaceAccess(teamId: string, members: TeamMember[], inviteLinks: TeamInviteLink[]): Promise<TeamEntity | null> {
        const doc = await this.teamModel.findByIdAndUpdate(teamId, { $set: { members, inviteLinks } }, { new: true }).lean();
        return doc ? this.toEntity(doc) : null;
    }

    async existsBySlug(slug: string): Promise<boolean> {
        return !!(await this.teamModel.exists({ slug }));
    }

    async updateGithubConfig(teamId: string, config: GitHubConfig): Promise<TeamEntity | null> {
        const doc = await this.teamModel
            .findByIdAndUpdate(teamId, { $set: { githubConfig: config } }, { new: true })
            .lean();
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
            doc.createdAt,
        );
    }
}
