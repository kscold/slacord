import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from './infrastructure/persistence/message.schema';
import { MessageRepository } from './infrastructure/persistence/message.repository';
import { MESSAGE_REPOSITORY } from './domain/message.port';
import { SendMessageUseCase } from './application/use-cases/send-message.use-case';
import { GetMessagesUseCase } from './application/use-cases/get-messages.use-case';
import { GetMessageSearchUseCase } from './application/use-cases/get-message-search.use-case';
import { GetPinnedMessagesUseCase } from './application/use-cases/get-pinned-messages.use-case';
import { GetThreadMessagesUseCase } from './application/use-cases/get-thread-messages.use-case';
import { EditMessageUseCase } from './application/use-cases/edit-message.use-case';
import { DeleteMessageUseCase } from './application/use-cases/delete-message.use-case';
import { PinMessageUseCase } from './application/use-cases/pin-message.use-case';
import { ReactMessageUseCase } from './application/use-cases/react-message.use-case';
import { UploadMessageAttachmentUseCase } from './application/use-cases/upload-message-attachment.use-case';
import { MessageController } from './infrastructure/http/message.controller';
import { MessageSearchController } from './infrastructure/http/message-search.controller';
import { MessageUploadController } from './infrastructure/http/message-upload.controller';
import { MessageGateway } from './infrastructure/websocket/message.gateway';
import { MessageBroadcastListener } from './application/listeners/message-broadcast.listener';
import { AuthModule } from '../auth/auth.module';
import { ChannelModule } from '../channel/channel.module';
import { TeamModule } from '../team/team.module';
import { StorageModule } from '../../shared/storage/storage.module';
import { MessageAccessService } from './application/services/message-access.service';

@Module({
    imports: [
        AuthModule,
        ChannelModule,
        TeamModule,
        StorageModule,
        MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
    ],
    controllers: [MessageController, MessageSearchController, MessageUploadController],
    providers: [
        { provide: MESSAGE_REPOSITORY, useClass: MessageRepository },
        SendMessageUseCase,
        GetMessagesUseCase,
        GetMessageSearchUseCase,
        GetPinnedMessagesUseCase,
        GetThreadMessagesUseCase,
        EditMessageUseCase,
        DeleteMessageUseCase,
        PinMessageUseCase,
        ReactMessageUseCase,
        UploadMessageAttachmentUseCase,
        MessageAccessService,
        MessageGateway,
        MessageBroadcastListener,
    ],
    exports: [MESSAGE_REPOSITORY, SendMessageUseCase, MessageGateway],
})
export class MessageModule {}
