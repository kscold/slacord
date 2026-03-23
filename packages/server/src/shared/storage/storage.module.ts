import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FILE_STORAGE } from './domain/file-storage.port';
import { MinioFileStorageAdapter } from './infrastructure/minio-file-storage.adapter';

@Module({
    imports: [ConfigModule],
    providers: [{ provide: FILE_STORAGE, useClass: MinioFileStorageAdapter }],
    exports: [FILE_STORAGE],
})
export class StorageModule {}
