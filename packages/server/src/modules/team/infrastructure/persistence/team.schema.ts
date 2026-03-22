import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TeamDocument = Team & Document;

@Schema({ _id: false })
class TeamMemberSchema {
    @Prop({ required: true })
    userId: string;

    @Prop({ required: true, enum: ['owner', 'admin', 'member'], default: 'member' })
    role: string;

    @Prop({ default: () => new Date() })
    joinedAt: Date;
}

const TeamMemberSchemaFactory = SchemaFactory.createForClass(TeamMemberSchema);

/** GitHub Webhook 설정 서브도큐먼트 */
@Schema({ _id: false })
class GitHubConfigSchema {
    @Prop({ required: true })
    repoUrl: string;

    @Prop({ required: true })
    webhookSecret: string;

    @Prop({ required: true })
    notifyChannelId: string;
}

const GitHubConfigSchemaFactory = SchemaFactory.createForClass(GitHubConfigSchema);

/** 팀(워크스페이스) MongoDB 스키마 */
@Schema({ timestamps: true, collection: 'teams' })
export class Team {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true, unique: true, index: true })
    slug: string;

    @Prop({ type: String, default: null })
    description: string | null;

    @Prop({ type: String, default: null })
    iconUrl: string | null;

    @Prop({ type: [TeamMemberSchemaFactory], default: [] })
    members: TeamMemberSchema[];

    @Prop({ type: GitHubConfigSchemaFactory, default: null })
    githubConfig: GitHubConfigSchema | null;

    createdAt: Date;
    updatedAt: Date;
}

export const TeamSchema = SchemaFactory.createForClass(Team);
