import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { XummSdk, XummTypes } from 'xumm-sdk';
import {
  CreatedPayload,
  XummJsonTransaction,
  XummPostPayloadBodyBlob,
  XummPostPayloadBodyJson,
} from 'xumm-sdk/dist/src/types';

@Injectable()
export class XummService {
  public readonly sdk: XummSdk;

  constructor() {
    this.sdk = new XummSdk(
      'de321219-87c2-4201-8bac-741b980ce180',
      '80d6cdc3-0d6d-4ca4-ac8e-8275dc89fc11',
    );
  }

  async createPayload(
    payload:
      | XummPostPayloadBodyJson
      | XummPostPayloadBodyBlob
      | XummJsonTransaction,
    returnErrors?: boolean,
  ): Promise<CreatedPayload | null> {
    return this.sdk.payload.create(payload, returnErrors);
  }

  async createAuthPayload(
    returnErrors?: boolean,
  ): Promise<CreatedPayload | null> {
    return this.createPayload(
      {
        txjson: {
          TransactionType: 'SignIn',
        },
      },
      returnErrors,
    );
  }
}
