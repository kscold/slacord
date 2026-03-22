import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

/** 사용자 MongoDB 스키마 */
@Schema({ timestamps: true, collection: 'users' })
export class User {
    @Prop({ required: true, unique: true, index: true })
    email: string;

    @Prop({ required: true })
    username: string;

    @Prop({ required: true })
    passwordHash: string;

    @Prop({ type: String, default: null })
    avatarUrl: string | null;

    createdAt: Date;
    updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
