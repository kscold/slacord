import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IUserRepository } from '../../domain/auth.port';
import { UserEntity } from '../../domain/user.entity';
import { User, UserDocument } from './user.schema';

/** User Repository Adapter - MongoDB 구현체 */
@Injectable()
export class UserRepository implements IUserRepository {
    constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

    async findById(id: string): Promise<UserEntity | null> {
        const doc = await this.userModel.findById(id).lean();
        return doc ? this.toEntity(doc) : null;
    }

    async findByEmail(email: string): Promise<UserEntity | null> {
        const doc = await this.userModel.findOne({ email }).lean();
        return doc ? this.toEntity(doc) : null;
    }

    async save(data: Omit<UserEntity, 'id' | 'createdAt'>): Promise<UserEntity> {
        const doc = await this.userModel.create(data);
        return this.toEntity(doc.toObject());
    }

    async existsByEmail(email: string): Promise<boolean> {
        return !!(await this.userModel.exists({ email }));
    }

    private toEntity(doc: any): UserEntity {
        return new UserEntity(
            doc._id.toString(),
            doc.email,
            doc.username,
            doc.passwordHash,
            doc.avatarUrl,
            doc.createdAt,
        );
    }
}
