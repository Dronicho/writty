import { Injectable, Logger } from '@nestjs/common';
import { IpfsStorage } from 'src/common/services/ipfs';
import { PrismaService } from 'src/common/services/prisma.service';
import { XummService } from 'src/common/services/xumm.service';
import { File } from 'web3.storage';
import { WebSocket } from 'ws';
import { ChannelService } from './channel.service';
import { LoginEventDto } from './dto/login-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { generateImage } from './utils/placeholder';
import { SearchService } from 'src/common/search/search.service';
import {
  CreateArticleDto,
  UpdateArticleDto,
} from 'src/articles/dto/create-article.dto';
import XRPLService from 'src/common/services/xrpl.service';
import { convertStringToHex } from 'xrpl';
import { CreatePayload } from 'xumm-sdk/dist/src/types';
import { BaseApiException } from 'src/common/exceptions/base-api.exception';
import { CollectArticleDto } from './dto/collect-article.dto';
import * as Name from 'w3name';
import {
  computeUrl,
  getCurrency,
  getDescription,
} from './utils/string.helpers';
import * as fs from 'fs';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly xumm: XummService,
    private readonly xrpl: XRPLService,
    private storage: IpfsStorage,
    private readonly channel: ChannelService,
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
    return await this.prisma.user.update({
      where: {
        address,
      },
      data: { ...payload, imageUrl },
    });
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
    this.logger.debug(data);
    if (user) {
      const userToken = user?.token;

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
              {
                Memo: {
                  MemoType: convertStringToHex('Supply'),
                  MemoData: convertStringToHex(data.supply.toString()),
                },
              },
            ],
          },
        };

        const payload = await this.xumm.createPayload(tx);
        if (!payload) {
          throw new BaseApiException('poshel nahuy', 503);
        }

        this.channel.registerClient({ payloadId: payload.uuid }, client);
      }
    }
  }

  async collect(data: CollectArticleDto, client: WebSocket) {
    const user = await this.prisma.getUser(data.address);
    if (!user) {
      throw new BaseApiException('no user', 400);
    }
    const post = await this.prisma.post.findFirst({
      where: {
        internalUrl: data.url,
      },
    });
    if (!post) {
      throw new BaseApiException('no user', 400);
    }
    await this.xrpl.createSellOffer(post.currency);
    const payload = await this.xrpl.createBuyOffer(
      data.address,
      user.token!,
      data.url,
      post.currency,
    );
    this.channel.registerClient({ payloadId: payload.uuid }, client);

    // await this.xrpl.mintNft(data);
    // const id = await this.xrpl.createSellNftOffer(data);
    // await this.xrpl.acceptSellNftOffer(data, id.toString());
  }

  async publish(data: CreateArticleDto, client: WebSocket) {
    const file = new File([JSON.stringify(data.body)], `${data.title}.json`);
    const name = await Name.create();
    this.sendTransaction(data, client, name.toString());
    const cid = await this.storage.putSingle(file);
    const url = `${cid}`;
    const revision = await Name.v0(name, url);
    console.log(name.toString());
    console.log(url);

    await Name.publish(revision, name.key);
    await this.prisma.post.create({
      data: {
        author: {
          connect: {
            address: data.address,
          },
        },
        description: getDescription(data.body.blocks),
        currency: getCurrency(data.title),
        title: data.title,
        internalUrl: computeUrl(data.address, data.title),
        url: name.toString(),
        maxAmount: data.supply,
        signingKey: Buffer.from(name.bytes),
      },
    });
    await fs.promises.writeFile(`${data.title}.key`, name.key.bytes);
  }

  async mutate(data: UpdateArticleDto, client: WebSocket) {
    const post = await this.prisma.post.update({
      where: {
        internalUrl: data.internalUrl,
      },
      data: {
        description: getDescription(data.body.blocks),
      },
    });
    if (!post) {
      throw new BaseApiException('no post found', 400);
    }
    if (!post.signingKey) {
      throw new BaseApiException('can not mutate this post', 400);
    }
    const key = await fs.promises.readFile(`${post.title}.key`);
    const name = await Name.from(key);
    this.logger.debug('got name: ' + name.toString());
    const file = new File([JSON.stringify(data.body)], `${post.title}.json`);
    const cid = await this.storage.putSingle(file);
    this.logger.debug('new cid: ' + cid);
    const previousRevision = await Name.resolve(name);
    const revision = await Name.increment(previousRevision, cid);
    this.logger.debug('new revision number: ' + revision.sequence);
    await Name.publish(revision, name.key);
  }
}
