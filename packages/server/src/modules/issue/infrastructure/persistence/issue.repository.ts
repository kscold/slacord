import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IIssueRepository } from '../../domain/issue.port';
import { IssueEntity, IssueStatus, IssuePriority } from '../../domain/issue.entity';
import { Issue, IssueDocument } from './issue.schema';

/** Issue Repository Adapter - MongoDB 구현체 */
@Injectable()
export class IssueRepository implements IIssueRepository {
    constructor(@InjectModel(Issue.name) private readonly issueModel: Model<IssueDocument>) {}

    async findByTeam(teamId: string, status?: IssueStatus): Promise<IssueEntity[]> {
        const query: any = { teamId };
        if (status) query.status = status;
        const docs = await this.issueModel.find(query).sort({ createdAt: -1 }).lean();
        return docs.map((d) => this.toEntity(d));
    }

    async findById(id: string): Promise<IssueEntity | null> {
        const doc = await this.issueModel.findById(id).lean();
        return doc ? this.toEntity(doc) : null;
    }

    async save(data: {
        teamId: string;
        title: string;
        description: string;
        priority: IssuePriority;
        assigneeIds: string[];
        labels: string[];
        createdBy: string;
    }): Promise<IssueEntity> {
        const doc = await this.issueModel.create(data);
        return this.toEntity(doc.toObject());
    }

    async update(id: string, data: Partial<{
        title: string;
        description: string;
        status: IssueStatus;
        priority: IssuePriority;
        assigneeIds: string[];
        labels: string[];
    }>): Promise<IssueEntity | null> {
        const doc = await this.issueModel.findByIdAndUpdate(id, data, { new: true }).lean();
        return doc ? this.toEntity(doc) : null;
    }

    async deleteById(id: string): Promise<boolean> {
        const result = await this.issueModel.findByIdAndDelete(id);
        return result !== null;
    }

    private toEntity(doc: any): IssueEntity {
        return new IssueEntity(
            doc._id.toString(),
            doc.teamId.toString(),
            doc.title,
            doc.description ?? '',
            doc.status as IssueStatus,
            doc.priority as IssuePriority,
            doc.assigneeIds ?? [],
            doc.labels ?? [],
            doc.createdBy,
            doc.createdAt,
            doc.updatedAt,
        );
    }
}
