import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Channel, ChannelSchema } from './infrastructure/persistence/channel.schema';
import { ChannelRead, ChannelReadSchema } from './infrastructure/persistence/channel-read.schema';
import { ChannelRepository } from './infrastructure/persistence/channel.repository';
import { CHANNEL_REPOSITORY } from './domain/channel.port';
import { CHANNEL_READ_REPOSITORY } from './domain/channel-read.port';
import { ChannelReadRepository } from './infrastructure/persistence/channel-read.repository';
import { CreateChannelUseCase } from './application/use-cases/create-channel.use-case';
import { GetChannelsUseCase } from './application/use-cases/get-channels.use-case';
import { MarkChannelAsReadUseCase } from './application/use-cases/mark-channel-as-read.use-case';
import { ChannelController } from './infrastructure/http/channel.controller';
import { ChannelReadController } from './infrastructure/http/channel-read.controller';
import { TeamModule } from '../team/team.module';
import { Message, MessageSchema } from '../message/infrastructure/persistence/message.schema';

@Module({
    imports: [
        TeamModule,
        MongooseModule.forFeature([
            { name: Channel.name, schema: ChannelSchema },
            { name: ChannelRead.name, schema: ChannelReadSchema },
            { name: Message.name, schema: MessageSchema },
        ]),
    ],
    controllers: [ChannelController, ChannelReadController],
    providers: [
        { provide: CHANNEL_REPOSITORY, useClass: ChannelRepository },
        { provide: CHANNEL_READ_REPOSITORY, useClass: ChannelReadRepository },
        CreateChannelUseCase,
        GetChannelsUseCase,
        MarkChannelAsReadUseCase,
    ],
    exports: [CHANNEL_REPOSITORY, CHANNEL_READ_REPOSITORY],
})
export class ChannelModule {}
