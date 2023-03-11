import { Redis } from 'ioredis';
import { Inject, Logger } from '@nestjs/common';
import {
  ClientRegister,
  EventRecieveTypes,
  EventSendTypes,
  Publisher,
  Subscriber,
} from './event.types';
import { WebSocket } from 'ws';

class MessageContext {
  socket: WebSocket;
  type: string;
  payload: string;
}

export class ChannelService {
  private readonly logger = new Logger(ChannelService.name);

  constructor(
    @Inject(Publisher) private readonly publisher: Redis,
    @Inject(Subscriber) private readonly subscriber: Redis,
  ) {}

  registerClient = async (
    event: ClientRegister,
    socket: WebSocket,
  ): Promise<void> => {
    const context = { payload: event.payloadId, socket, type: '' };

    this.subscriber.on('message', this.handleMessage(context));

    this.subscriber.subscribe(`payload:${event.payloadId}`, (err, _count) => {
      if (err) {
        this.logger.error(
          `Error during Redis subscribe for profileId - ${event.payloadId}, channel - "payload:${event.payloadId}"`,
          err,
        );

        return;
      }
    });
  };

  async sendMessage(id: string, message: string) {
    this.publisher.publish(`payload:${id}`, message);
  }

  async unregister(id: string) {
    this.subscriber.unsubscribe(`payload:${id}`);
  }

  /**
   * Handle Redis pub/sub events for the given WebSocket client.
   */
  handleMessage =
    (context: MessageContext) =>
    async (event, data): Promise<void> => {
      const { type, payload, socket } = context;
      // const data = JSON.parse(`${payload}`);

      this.logger.debug(data);

      socket.send(data);
      this.unregister(payload);
    };
}
