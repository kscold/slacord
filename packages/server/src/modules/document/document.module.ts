import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Doc, DocumentSchema } from './infrastructure/persistence/document.schema';
import { DocVersion, DocumentVersionSchema } from './infrastructure/persistence/document-version.schema';
import { DocumentRepository } from './infrastructure/persistence/document.repository';
import { DOCUMENT_REPOSITORY } from './domain/document.port';
import { DOCUMENT_VERSION_REPOSITORY } from './domain/document-version.port';
import { DocumentVersionRepository } from './infrastructure/persistence/document-version.repository';
import { CreateDocumentUseCase } from './application/use-cases/create-document.use-case';
import { UpdateDocumentUseCase } from './application/use-cases/update-document.use-case';
import { GetDocumentsUseCase } from './application/use-cases/get-documents.use-case';
import { DeleteDocumentUseCase } from './application/use-cases/delete-document.use-case';
import { ArchiveDocumentUseCase } from './application/use-cases/archive-document.use-case';
import { RestoreDocumentUseCase } from './application/use-cases/restore-document.use-case';
import { UploadDocumentFileUseCase } from './application/use-cases/upload-document-file.use-case';
import { ImportConfluenceSpaceUseCase } from './application/use-cases/import-confluence-space.use-case';
import { GetDocumentVersionsUseCase } from './application/use-cases/get-document-versions.use-case';
import { RestoreDocumentVersionUseCase } from './application/use-cases/restore-document-version.use-case';
import { ConfluenceApiClient } from './infrastructure/external/confluence-api.client';
import { DocumentController } from './infrastructure/http/document.controller';
import { DocumentUploadController } from './infrastructure/http/document-upload.controller';
import { TeamModule } from '../team/team.module';
import { StorageModule } from '../../shared/storage/storage.module';

@Module({
    imports: [MongooseModule.forFeature([{ name: Doc.name, schema: DocumentSchema }, { name: DocVersion.name, schema: DocumentVersionSchema }]), TeamModule, StorageModule],
    controllers: [DocumentController, DocumentUploadController],
    providers: [
        { provide: DOCUMENT_REPOSITORY, useClass: DocumentRepository },
        { provide: DOCUMENT_VERSION_REPOSITORY, useClass: DocumentVersionRepository },
        CreateDocumentUseCase,
        UpdateDocumentUseCase,
        GetDocumentsUseCase,
        DeleteDocumentUseCase,
        ArchiveDocumentUseCase,
        RestoreDocumentUseCase,
        UploadDocumentFileUseCase,
        ImportConfluenceSpaceUseCase,
        GetDocumentVersionsUseCase,
        RestoreDocumentVersionUseCase,
        ConfluenceApiClient,
    ],
})
export class DocumentModule {}
