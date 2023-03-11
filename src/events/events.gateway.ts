import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { EventsService } from './events.service';
import { WebSocket } from 'ws';
import { LoginEventDto } from './dto/login-event.dto';
import { CreateArticleDto } from 'src/articles/dto/create-article.dto';

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
    return this.eventsService.register(payload, client);
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
}
