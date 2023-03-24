import { FactoryProvider, Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsGateway } from './events.gateway';
import { XummService } from 'src/common/services/xumm.service';
import { Redis } from 'ioredis';
import { Publisher, Subscriber } from './event.types';
import { ChannelService } from './channel.service';

export interface EventsOptions {
  url?: string;
}

export interface RedisSettings {
  publisher?: boolean;
}

const redisProvider = (
  options: EventsOptions = {},
  settings: RedisSettings = {},
): FactoryProvider<Redis> => ({
  provide: settings.publisher ? Publisher : Subscriber,
  useFactory: () => new Redis(process.env.REDIS_URL ?? ''),
});

@Module({
  providers: [
    redisProvider({}),
    redisProvider({}, { publisher: true }),
    EventsGateway,
    EventsService,
    XummService,
    ChannelService,
  ],
  exports: [EventsGateway, EventsService, ChannelService],
})
export class EventsModule {}
