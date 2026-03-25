import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { FILE_STORAGE } from '../../../../shared/storage/domain/file-storage.port';
import type { IFileStorage } from '../../../../shared/storage/domain/file-storage.port';

interface UploadFile {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
}

export interface DocumentFileResult {
    url: string;
    name: string;
    size: number;
    mimeType: string;
}

@Injectable()
export class UploadDocumentFileUseCase {
    constructor(@Inject(FILE_STORAGE) private readonly fileStorage: IFileStorage) {}

    async execute(input: { teamId: string; documentId?: string; file: UploadFile }): Promise<DocumentFileResult> {
        const fileName = input.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-') || 'file';
        const datePath = new Date().toISOString().slice(0, 10);
        const subPath = input.documentId ? `doc/${input.documentId}` : 'inline';
        const objectName = `slacord/docs/${input.teamId}/${subPath}/${datePath}/${Date.now()}-${randomUUID()}-${fileName}`;

        const stored = await this.fileStorage.upload({
            buffer: input.file.buffer,
            objectName,
            mimeType: input.file.mimetype || 'application/octet-stream',
            size: input.file.size,
        });

        return { url: stored.url, name: input.file.originalname, size: input.file.size, mimeType: stored.mimeType };
    }
}
