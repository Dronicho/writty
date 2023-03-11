import { Injectable } from '@nestjs/common';
import { IpfsStorage } from 'src/common/services/ipfs';
import { PrismaService } from 'src/common/services/prisma.service';
import { XummService } from 'src/common/services/xumm.service';
import { File } from 'web3.storage';
import { WebSocket } from 'ws';
import { convertStringToHex } from 'xrpl';
import { CreatePayload } from 'xumm-sdk/dist/src/types';
import { ChannelService } from './channel.service';
import { LoginEventDto } from './dto/login-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { generateImage } from './utils/placeholder';
import { SearchService } from 'src/common/search/search.service';
import { nanoid } from 'nanoid';
import { CreateArticleDto } from 'src/articles/dto/create-article.dto';
import XRPLService from 'src/common/services/xrpl.service';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly xumm: XummService,
    private readonly xrpl: XRPLService,
    private storage: IpfsStorage,
    private readonly channel: ChannelService,
    private readonly search: SearchService,
  ) {}

  async login(payload: LoginEventDto | null, client: WebSocket) {
    if (payload?.token) {
      const data = await this.prisma.user.findFirst({
        where: {
          token: payload.token,
        },
      });
      return {
        event: 'USER_INFO',
        data,
      };
    }
    const data = await this.xumm.createAuthPayload();
    if (!data) {
      return { message: 'can not create auth payload' };
    }
    this.channel.registerClient({ payloadId: data.uuid }, client);
    return { event: 'LOGIN', data: data.refs.qr_png };
  }

  async register(payload, client: WebSocket) {
    const address = payload.address;
    delete payload.address;
    const imageUrl = generateImage(payload.name);
    const data = await this.prisma.user.update({
      where: {
        address,
      },
      data: { ...payload, imageUrl },
    });
    // this.channel.registerClient({ socket: client, id:  })
  }

  async sendTransaction(
    data: CreateArticleDto,
    client: WebSocket,
    cid: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: {
        address: data.address,
      },
    });
    if (user) {
      const userToken = user.token;

      if (userToken) {
        const tx: CreatePayload = {
          user_token: userToken,
          txjson: {
            TransactionType: 'NFTokenMint',
            NFTokenTaxon: 0,
            URI: convertStringToHex(`https://${cid}.ipfs.w3s.link`),
            Flags: 8,
            Memos: [
              {
                Memo: {
                  MemoType: convertStringToHex('Title'),
                  MemoData: convertStringToHex(data.title),
                },
              },
            ],
          },
        };
        // const payload = await this.xumm.createPayload(tx);
        // if (!payload) {
        //   throw new BaseApiException('could not create payload', 503);
        // }
        // this.channel.registerClient({ payloadId: payload.uuid }, client);

        await this.xrpl.prepareColdWallet();
        await this.xrpl.createTrustLine(data.address);
        // const xumm_trust_tx: CreatePayload = {
        //   txjson: trust_tx,
        //   user_token: userToken,
        // }
        // const response = await this.xumm.createPayload();
        await this.xrpl.sendTokens(data.address, 500);
      }
    }
  }

  async publish(data: CreateArticleDto, client: WebSocket) {
    const file = new File([JSON.stringify(data.body)], `${data.title}.json`);
    this.sendTransaction(data, client, 'cid');
    // await this.storage.putSingle(file, {
    //   onRootCidReady: async (cid) => {

    //     await this.prisma.post.create({
    //       data: {
    //         author: {
    //           connect: {
    //             address: data.address,
    //           },
    //         },
    //         title: data.title,
    //         internalUrl: this.computeUrl(data.address, data.title),
    //         url: cid,
    //       },
    //     });
    //     await this.search.indexData({ ...data, body: undefined });
    //   },
    // });
  }

  computeUrl(address: string, title: string): string {
    return (
      title
        .split(' ')
        .map((e) => e.toLowerCase())
        .join('-') +
      '-' +
      nanoid()
    );
  }

  update(id: number, updateEventDto: UpdateEventDto) {
    return `This action updates a #${id} event`;
  }

  remove(id: number) {
    return `This action removes a #${id} event`;
  }
}

function a() {
  return (a) => a;
}

function boot() {
  a()('1');
}
