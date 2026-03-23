import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import { IFileStorage, StoredFile, UploadBinaryInput } from '../domain/file-storage.port';

@Injectable()
export class MinioFileStorageAdapter implements IFileStorage {
    private readonly logger = new Logger(MinioFileStorageAdapter.name);
    private readonly bucket: string;
    private readonly publicUrl: string;
    private readonly client: Client;
    private bucketReady: Promise<void> | null = null;

    constructor(private readonly config: ConfigService) {
        const endpoint = new URL(this.config.get<string>('MINIO_ENDPOINT') ?? 'http://host.docker.internal:9000');
        this.bucket = this.config.get<string>('MINIO_BUCKET') ?? 'slacord';
        this.publicUrl = (this.config.get<string>('MINIO_PUBLIC_URL') ?? 'https://bucket.kscold.com').replace(/\/$/, '');
        this.client = new Client({
            endPoint: endpoint.hostname,
            port: endpoint.port ? Number(endpoint.port) : endpoint.protocol === 'https:' ? 443 : 80,
            useSSL: endpoint.protocol === 'https:',
            accessKey: this.config.get<string>('MINIO_ACCESS_KEY') ?? 'minioadmin',
            secretKey: this.config.get<string>('MINIO_SECRET_KEY') ?? 'minioadmin',
        });
    }

    async upload(input: UploadBinaryInput): Promise<StoredFile> {
        await this.ensureBucket();
        await this.client.putObject(this.bucket, input.objectName, input.buffer, input.size, {
            'Content-Type': input.mimeType,
        });
        return {
            key: input.objectName,
            url: `${this.publicUrl}/${this.bucket}/${this.encodePath(input.objectName)}`,
            mimeType: input.mimeType,
            size: input.size,
        };
    }

    private ensureBucket() {
        if (!this.bucketReady) {
            this.bucketReady = this.prepareBucket();
        }
        return this.bucketReady;
    }

    private async prepareBucket() {
        const exists = await this.client.bucketExists(this.bucket);
        if (!exists) {
            await this.client.makeBucket(this.bucket);
            this.logger.log(`Created MinIO bucket: ${this.bucket}`);
        }
        await this.client.setBucketPolicy(this.bucket, JSON.stringify({
            Version: '2012-10-17',
            Statement: [{
                Effect: 'Allow',
                Principal: { AWS: ['*'] },
                Action: ['s3:GetObject'],
                Resource: [`arn:aws:s3:::${this.bucket}/*`],
            }],
        }));
    }

    private encodePath(path: string) {
        return path.split('/').map((part) => encodeURIComponent(part)).join('/');
    }
}
