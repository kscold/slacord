import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Channel, ChannelSchema } from './infrastructure/persistence/channel.schema';
import { ChannelRepository } from './infrastructure/persistence/channel.repository';
import { CHANNEL_REPOSITORY } from './domain/channel.port';
import { CreateChannelUseCase } from './application/use-cases/create-channel.use-case';
import { GetChannelsUseCase } from './application/use-cases/get-channels.use-case';
import { ChannelController } from './infrastructure/http/channel.controller';
import { TeamModule } from '../team/team.module';

@Module({
    imports: [TeamModule, MongooseModule.forFeature([{ name: Channel.name, schema: ChannelSchema }])],
    controllers: [ChannelController],
    providers: [{ provide: CHANNEL_REPOSITORY, useClass: ChannelRepository }, CreateChannelUseCase, GetChannelsUseCase],
    exports: [CHANNEL_REPOSITORY],
})
export class ChannelModule {}
