import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from './infrastructure/persistence/message.schema';
import { MessageRepository } from './infrastructure/persistence/message.repository';
import { MESSAGE_REPOSITORY } from './domain/message.port';
import { SendMessageUseCase } from './application/use-cases/send-message.use-case';
import { GetMessagesUseCase } from './application/use-cases/get-messages.use-case';
import { MessageController } from './infrastructure/http/message.controller';
import { MessageGateway } from './infrastructure/websocket/message.gateway';

@Module({
    imports: [MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }])],
    controllers: [MessageController],
    providers: [
        { provide: MESSAGE_REPOSITORY, useClass: MessageRepository },
        SendMessageUseCase,
        GetMessagesUseCase,
        MessageGateway,
    ],
})
export class MessageModule {}
