import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/common/services/prisma.service';
import { XummService } from 'src/common/services/xumm.service';
import { XummWebhookBody } from 'xumm-sdk/dist/src/types';
import WebSocket = require('ws');
import { Server } from 'ws';
import { WebSocketServer } from '@nestjs/websockets';
import { ChannelService } from 'src/events/channel.service';
import { convertHexToString } from 'xrpl';
import axios from 'axios';
import XRPLService from 'src/common/services/xrpl.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  @WebSocketServer()
  server: Server<WebSocket>;
  constructor(
    private readonly prisma: PrismaService,
    private readonly xumm: XummService,
    private readonly publisher: ChannelService,
    private readonly xrpl: XRPLService,
  ) {}

  async completeAuth(data: XummWebhookBody): Promise<void> {
    const uuid = data.payloadResponse.payload_uuidv4;
    const url = `https://xumm.app/api/v1/platform/payload/${uuid}`;
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'X-API-Key': process.env.XUMM_API_KEY,
        'X-API-Secret': process.env.XUMM_API_SECRET,
      },
    };
    const response = await (await axios(url, options)).data;
    const address = response.response.account;
    console.log(response);

    if (response.payload.tx_type === 'OfferCreate') {
      const url = data.custom_meta.blob?.url as string;
      await this.publisher.sendMessage(
        uuid,
        JSON.stringify({
          event: 'COLLECT',
          data: data.payloadResponse.signed,
        }),
      );
      await this.prisma.post.update({
        where: {
          internalUrl: url,
        },
        data: {
          collectors: {
            connect: {
              address: address,
            },
          },
        },
      });
    }
    if (response.payload.tx_type === 'TrustSet') {
      await this.publisher.sendMessage(
        uuid,
        JSON.stringify({
          event: 'PUBLISH_RESULT',
          data: data.payloadResponse.signed,
        }),
      );
      this.xrpl.sendTokens(address, +(data.custom_meta.blob?.supply as string));
    }
    if (response.payload.tx_type === 'NFTokenMint') {
      const url = convertHexToString(response.payload.request_json['URI']);
      const cid = url.split('://')[1].split('.')[0];
      await this.prisma.post.update({
        where: {
          url: cid,
        },
        data: {
          transactionId: response.response.txid,
        },
      });
      await this.publisher.sendMessage(
        uuid,
        JSON.stringify({
          event: 'PUBLISH_RESULT',
          data: data.payloadResponse.signed,
        }),
      );
    }
    if (response.payload.tx_type === 'SignIn') {
      const user = await this.prisma.getUser(address);
      const userToken = data.userToken?.user_token;

      if (!user) {
        this.publisher.sendMessage(
          uuid,
          JSON.stringify({
            event: 'REGISTER',
            data: address,
          }),
        );
        await this.prisma.user.create({
          data: {
            address: address,
            token: userToken,
            name: '_NONE',
          },
        });
      } else {
        this.publisher.sendMessage(
          uuid,
          JSON.stringify({
            event: 'USER_INFO',
            data: {
              ...user,
            },
          }),
        );
      }
    }
  }
}
