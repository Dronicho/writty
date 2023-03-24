import { CIDString, PutOptions, Web3File, Web3Storage } from 'web3.storage';
import * as Name from 'w3name';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { BaseApiException } from '../exceptions/base-api.exception';
import { Post } from '@prisma/client';
import * as fs from 'fs';

type StorageResponse<T> = T | undefined;

export abstract class StorageService {
  constructor() {}

  abstract putSingle(data: any);

  abstract put(data: any[]);
}

@Injectable()
export class IpfsStorage implements StorageService {
  private readonly client: Web3Storage;
  private readonly logger = new Logger();

  constructor(private readonly name: Name.WritableName) {
    this.client = new Web3Storage({ token: process.env.WEB3_API_TOKEN! });
  }

  async get(article: Post): Promise<StorageResponse<string>> {
    var res;
    if (!article.signingKey) {
      res = await this.client.get(article.url);
    } else {
      const buffer = await fs.promises.readFile(`${article.title}.key`);
      const name = await Name.from(buffer);
      const rev = await Name.resolve(name);
      console.log(rev)

      res = await this.client.get(rev.value);
    }

    const files = await res?.files();
    if (!files) {
      throw new BaseApiException('data not found', 401);
    }
    // const fetch = makeIpfsFetch({ ipfs: this.node });
    // const data = this.node.get(files[0].cid);
    // const td = new TextDecoder();
    // var result = '';
    // for await (const chunk of data) {
    //   result += td.decode(chunk, {
    //     stream: true,
    //   });
    // }
    // const data = await fetch('ipfs://' + files[0].cid);
    const a = await (files[0] as unknown as Blob).text();
    return a;
  }
  async putSingle(data, options?: PutOptions): Promise<CIDString> {
    const cid = await this.client.put([data], options);

    return cid;
  }
  async put(data: any[]): Promise<CIDString> {
    return await this.client.put(data);
  }

  public static async create() {
    const name = await Name.create();
    return new IpfsStorage(name);
  }
}
