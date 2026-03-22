import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { IAnnouncementRepository } from '../../domain/announcement.port';
import type { AnnouncementEntity } from '../../domain/announcement.entity';
import { AnnouncementEntity as Entity } from '../../domain/announcement.entity';
import { Announcement, type AnnouncementDocument } from './announcement.schema';

@Injectable()
export class AnnouncementRepository implements IAnnouncementRepository {
    constructor(@InjectModel(Announcement.name) private readonly model: Model<AnnouncementDocument>) {}

    private toEntity(doc: AnnouncementDocument): AnnouncementEntity {
        return new Entity(
            (doc._id as any).toString(),
            doc.teamId,
            doc.title,
            doc.content,
            doc.isPinned,
            doc.createdBy,
            (doc as any).createdAt,
            (doc as any).updatedAt,
        );
    }

    async findByTeam(teamId: string): Promise<AnnouncementEntity[]> {
        // 핀 고정된 공지 먼저, 나머지는 최신 순
        const docs = await this.model.find({ teamId }).sort({ isPinned: -1, createdAt: -1 }).lean();
        return docs.map((d) => this.toEntity(d as AnnouncementDocument));
    }

    async findById(id: string): Promise<AnnouncementEntity | null> {
        const doc = await this.model.findById(id).lean();
        return doc ? this.toEntity(doc as AnnouncementDocument) : null;
    }

    async save(data: { teamId: string; title: string; content: string; createdBy: string }): Promise<AnnouncementEntity> {
        const doc = await this.model.create(data);
        return this.toEntity(doc);
    }

    async updatePin(id: string, isPinned: boolean): Promise<AnnouncementEntity | null> {
        const doc = await this.model.findByIdAndUpdate(id, { isPinned }, { new: true }).lean();
        return doc ? this.toEntity(doc as AnnouncementDocument) : null;
    }

    async deleteById(id: string): Promise<boolean> {
        const result = await this.model.findByIdAndDelete(id);
        return result !== null;
    }
}
