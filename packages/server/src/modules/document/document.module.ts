import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Doc, DocumentSchema } from './infrastructure/persistence/document.schema';
import { DocumentRepository } from './infrastructure/persistence/document.repository';
import { DOCUMENT_REPOSITORY } from './domain/document.port';
import { CreateDocumentUseCase } from './application/use-cases/create-document.use-case';
import { UpdateDocumentUseCase } from './application/use-cases/update-document.use-case';
import { GetDocumentsUseCase } from './application/use-cases/get-documents.use-case';
import { DeleteDocumentUseCase } from './application/use-cases/delete-document.use-case';
import { ImportConfluenceSpaceUseCase } from './application/use-cases/import-confluence-space.use-case';
import { ConfluenceApiClient } from './infrastructure/external/confluence-api.client';
import { DocumentController } from './infrastructure/http/document.controller';
import { TeamModule } from '../team/team.module';

@Module({
    imports: [MongooseModule.forFeature([{ name: Doc.name, schema: DocumentSchema }]), TeamModule],
    controllers: [DocumentController],
    providers: [
        { provide: DOCUMENT_REPOSITORY, useClass: DocumentRepository },
        CreateDocumentUseCase,
        UpdateDocumentUseCase,
        GetDocumentsUseCase,
        DeleteDocumentUseCase,
        ImportConfluenceSpaceUseCase,
        ConfluenceApiClient,
    ],
})
export class DocumentModule {}
