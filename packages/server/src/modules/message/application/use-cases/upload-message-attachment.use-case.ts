import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { Attachment } from '../../domain/message.entity';
import { FILE_STORAGE } from '../../../../shared/storage/domain/file-storage.port';
import type { IFileStorage } from '../../../../shared/storage/domain/file-storage.port';

interface UploadFile {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
}

interface UploadMessageAttachmentInput {
    teamId: string;
    channelId: string;
    userId: string;
    file: UploadFile;
}

@Injectable()
export class UploadMessageAttachmentUseCase {
    constructor(@Inject(FILE_STORAGE) private readonly fileStorage: IFileStorage) {}

    async execute(input: UploadMessageAttachmentInput): Promise<Attachment> {
        const fileName = this.sanitizeName(input.file.originalname);
        const datePath = new Date().toISOString().slice(0, 10);
        const objectName = [
            'slacord',
            'chat',
            input.teamId,
            input.channelId,
            input.userId,
            datePath,
            `${Date.now()}-${randomUUID()}-${fileName}`,
        ].join('/');
        const stored = await this.fileStorage.upload({
            buffer: input.file.buffer,
            objectName,
            mimeType: input.file.mimetype || 'application/octet-stream',
            size: input.file.size,
        });
        return {
            url: stored.url,
            name: input.file.originalname,
            size: input.file.size,
            mimeType: stored.mimeType,
        };
    }

    private sanitizeName(name: string) {
        return name.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'file';
    }
}
