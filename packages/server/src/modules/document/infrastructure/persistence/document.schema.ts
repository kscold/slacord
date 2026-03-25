import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DocumentDocument = Doc & Document;

@Schema({ timestamps: true, collection: 'documents' })
export class Doc {
    static readonly name = 'Document';

    @Prop({ required: true, index: true })
    teamId: string;

    @Prop({ required: true })
    title: string;

    @Prop({ default: '' })
    content: string;

    @Prop({ type: String, enum: ['plain', 'html', 'json'], default: 'plain' })
    contentFormat: 'plain' | 'html' | 'json';

    @Prop({ type: String, default: null })
    parentId: string | null;

    @Prop({ required: true })
    createdBy: string;

    @Prop({ required: true })
    updatedBy: string;

    @Prop({ type: String, default: null })
    externalSource: string | null;

    @Prop({ type: String, default: null })
    externalId: string | null;

    @Prop({ type: String, default: null })
    externalUrl: string | null;

    /** 열람 권한: team(팀 전원) | restricted(지정된 멤버만) */
    @Prop({ type: String, enum: ['team', 'restricted'], default: 'team' })
    visibility: 'team' | 'restricted';

    /** 편집 권한: owner_admin(소유자+관리자) | all(팀 전원) | restricted(지정된 멤버만) */
    @Prop({ type: String, enum: ['owner_admin', 'all', 'restricted'], default: 'all' })
    editPolicy: 'owner_admin' | 'all' | 'restricted';

    /** visibility가 restricted일 때 열람 가능한 멤버 ID */
    @Prop({ type: [String], default: [] })
    allowedViewerIds: string[];

    /** editPolicy가 restricted일 때 편집 가능한 멤버 ID */
    @Prop({ type: [String], default: [] })
    allowedEditorIds: string[];

    @Prop({ type: Date, default: null })
    archivedAt: Date | null;

    @Prop({ type: String, default: null })
    archivedBy: string | null;
}

export const DocumentSchema = SchemaFactory.createForClass(Doc);

// 팀별 문서 조회를 위한 인덱스
DocumentSchema.index({ teamId: 1, parentId: 1 });
DocumentSchema.index({ teamId: 1, externalSource: 1, externalId: 1 });
DocumentSchema.index({ teamId: 1, archivedAt: 1 });
