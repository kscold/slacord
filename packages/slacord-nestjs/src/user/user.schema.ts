import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

/**
 * 사용자 스키마
 * - 팀에 초대되어 참여하는 일반 사용자
 */
@Schema({ timestamps: true })
export class User {
    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true })
    password: string; // bcrypt 해싱된 비밀번호

    @Prop({ required: true })
    username: string;

    @Prop()
    profileImage?: string;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'Team' }], default: [] })
    joinedTeams: Types.ObjectId[]; // 참여 중인 팀 목록

    @Prop({ default: true })
    isActive: boolean;

    @Prop()
    lastLoginAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
