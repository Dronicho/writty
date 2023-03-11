import { CIDString, PutOptions, Web3File, Web3Storage } from 'web3.storage';
import * as Name from 'w3name';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { BaseApiException } from '../exceptions/base-api.exception';

type StorageResponse<T> = T | undefined;

export abstract class StorageService {
  constructor() {}

  abstract putSingle(data: any);

  abstract put(data: any[]);

  abstract get(url: string);
}

@Injectable()
export class IpfsStorage implements StorageService {
  private readonly client: Web3Storage;
  private readonly logger = new Logger();

  constructor(private readonly name: Name.Name) {
    this.client = new Web3Storage({ token: process.env.WEB3_API_TOKEN! });
  }

  async get(url: string): Promise<StorageResponse<string>> {
    this.logger.log(url);
    const res = await this.client.get(url);

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
    return await this.client.put([data], options);
  }
  async put(data: any[]): Promise<CIDString> {
    return await this.client.put(data);
  }

  public static async create() {
    const name = await Name.create();
    return new IpfsStorage(name);
  }
}
