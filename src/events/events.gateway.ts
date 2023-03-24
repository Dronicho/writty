import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { EventsService } from './events.service';
import { WebSocket } from 'ws';
import { LoginEventDto } from './dto/login-event.dto';
import {
  CreateArticleDto,
  UpdateArticleDto,
} from 'src/articles/dto/create-article.dto';
import { CollectArticleDto } from './dto/collect-article.dto';

@WebSocketGateway({ cors: true })
export class EventsGateway {
  constructor(private readonly eventsService: EventsService) {}

  @SubscribeMessage('LOGIN')
  async login(
    @MessageBody() payload: LoginEventDto | null,
    @ConnectedSocket() client: WebSocket,
  ) {
    return this.eventsService.login(payload, client);
  }

  @SubscribeMessage('REGISTER')
  async register(@MessageBody() payload, @ConnectedSocket() client: WebSocket) {
    const data = await this.eventsService.register(payload, client);
    return {
      event: 'USER_INFO',
      data,
    };
  }

  @SubscribeMessage('PUBLISH')
  async publish(
    @MessageBody() payload: CreateArticleDto,
    @ConnectedSocket() client: WebSocket,
  ) {
    try {
      await this.eventsService.publish(payload, client);
    } catch (e) {
      return {
        event: 'PUBLISH_RESULT',
        data: false,
      };
    }
  }

  @SubscribeMessage('MUTATE')
  async mutate(
    @MessageBody() payload: UpdateArticleDto,
    @ConnectedSocket() client: WebSocket,
  ) {
    try {
      await this.eventsService.mutate(payload, client);
      return {
        event: 'MUTATE',
        data: {
          result: true,
          internalUrl: payload.internalUrl,
        },
      };
    } catch (e) {
      return {
        event: 'MUTATE',
        data: {
          result: false,
        },
      };
    }
  }

  @SubscribeMessage('COLLECT')
  async collect(
    @MessageBody() payload: CollectArticleDto,
    @ConnectedSocket() client: WebSocket,
  ) {
    try {
      await this.eventsService.collect(payload, client);
    } catch (e) {
      return {
        event: 'PUBLISH_RESULT',
        data: false,
      };
    }
  }
}
