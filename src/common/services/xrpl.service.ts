import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { CreateArticleDto } from 'src/articles/dto/create-article.dto';
import { IpfsStorage } from 'src/common/services/ipfs';
import { PrismaService } from 'src/common/services/prisma.service';
import { CollectArticleDto } from 'src/events/dto/collect-article.dto';
import { File } from 'web3.storage';
import {
  AccountSetAsfFlags,
  AccountSetTfFlags,
  Client,
  convertStringToHex,
  OfferCreateFlags,
  Transaction,
  TransactionMetadata,
  TxResponse,
  Wallet,
  xrpToDrops,
} from 'xrpl';
import {
  CreatedPayload,
  CreatePayload,
  XummPostPayloadBodyJson,
  XummPostPayloadResponse,
} from 'xumm-sdk/dist/src/types';
import { BaseApiException } from '../exceptions/base-api.exception';
import { XummService } from './xumm.service';

@Injectable()
export default class XRPLService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(XRPLService.name);
  client: Client;
  wallet: Wallet;
  constructor(
    private xumm: XummService,
    private storage: IpfsStorage,
    private prisma: PrismaService,
  ) {
    this.client = new Client('wss://s.altnet.rippletest.net:51233');
    this.client.connect();
    this.wallet = Wallet.fromSeed(process.env.COLD_SECRET!);
  }

  async prepareColdWallet(account: string) {
    const cold_settings_tx: Transaction = {
      TransactionType: 'AccountSet',
      Account: this.wallet.address,
      TransferRate: 0,
      TickSize: 5,
      Domain: '626570726F6A6563746D6F6E69746F72696E672E70726F', // "example.com"
      SetFlag: AccountSetAsfFlags.asfDefaultRipple,
      NFTokenMinter: account,
      // Using tf flags, we can enable more flags in one transaction
      Flags:
        AccountSetTfFlags.tfDisallowXRP | AccountSetTfFlags.tfRequireDestTag,
    };

    const cst_prepared = await this.client.autofill(cold_settings_tx);
    const cst_signed = this.wallet.sign(cst_prepared);
    console.log('Sending cold address AccountSet transaction...');
    const cst_result = await this.client.submitAndWait(cst_signed.tx_blob);
    if (
      cst_result &&
      (cst_result.result.meta as TransactionMetadata).TransactionResult ==
        'tesSUCCESS'
    ) {
      console.log(
        `Transaction succeeded: https://testnet.xrpl.org/transactions/${cst_signed.hash}`,
      );
    } else {
      throw `Error sending transaction: ${cst_result}`;
    }
  }

  async createTrustLine(
    destination: string,
    userToken: string,
    supply: string,
  ) {
    // Create trust line from hot to cold address --------------------------------
    const currency_code = 'FOO';
    const trust_set_tx: Transaction = {
      TransactionType: 'TrustSet',
      Account: destination,
      LimitAmount: {
        currency: currency_code,
        issuer: this.wallet.address,
        value: '500', // Large limit, arbitrarily chosen
      },
    };
    const xumm_tx: XummPostPayloadBodyJson = {
      //@ts-ignore
      txjson: trust_set_tx,
      user_token: userToken,
      custom_meta: {
        blob: {
          supply,
        },
      },
    };
    const s = await this.xumm.createPayload(xumm_tx);
    const ts_prepared = await this.client.autofill(trust_set_tx);
    const ts_signed = this.wallet.sign(ts_prepared);
    console.log('Creating trust line from hot address to issuer...');
    const ts_result = await this.client.submitAndWait(ts_signed.tx_blob);
    if (
      ts_result &&
      (ts_result.result.meta as TransactionMetadata).TransactionResult ==
        'tesSUCCESS'
    ) {
      console.log(
        `Transaction succeeded: https://testnet.xrpl.org/transactions/${ts_signed.hash}`,
      );
    } else {
      throw `Error sending transaction: ${ts_result.result.meta}`;
    }
  }

  async sendTokens(destination: string, amount: number) {
    // Send token ----------------------------------------------------------------
    const currency_code = 'FOO';
    const send_token_tx: Transaction = {
      TransactionType: 'Payment',
      Account: this.wallet.address,
      Amount: {
        currency: currency_code,
        value: amount.toString(),
        issuer: this.wallet.address,
      },
      Destination: destination, // Needed since we enabled Require Destination Tags
      // on the hot account earlier.
    };

    const pay_prepared = await this.client.autofill(send_token_tx);
    const pay_signed = this.wallet.sign(pay_prepared);
    console.log(`Sending ${amount} ${currency_code} to ${destination}...`);
    const pay_result = await this.client.submitAndWait(pay_signed.tx_blob);
    console.log(pay_result);
    if (
      pay_result &&
      (pay_result.result.meta as TransactionMetadata).TransactionResult ==
        'tesSUCCESS'
    ) {
      console.log(
        `Transaction succeeded: https://testnet.xrpl.org/transactions/${pay_signed.hash}`,
      );
    } else {
      throw `Error sending transaction: ${pay_result.result.meta?.toString()}`;
    }
  }

  async createSellNftOffer(data: CollectArticleDto) {
    console.log('selling offer--------------------------------');
    const post = await this.prisma.post.findUnique({
      where: {
        internalUrl: data.url,
      },
    });
    if (!post) {
      throw new BaseApiException('', 503);
    }
    const tx: Transaction = {
      TransactionType: 'NFTokenCreateOffer',
      Account: this.wallet.address,
      NFTokenID: post?.tokenId,
      Flags: 1,
      Amount: '1',
    };
    const result = await this.processTransaction(tx);
    console.log(result);
    console.log('done--------------------------------');
    return result.id;
  }

  async acceptSellNftOffer(data: CollectArticleDto, id: string) {
    const user = await this.prisma.getUser(data.address);
    const tx: Transaction = {
      TransactionType: 'NFTokenAcceptOffer',
      Account: data.address,
      NFTokenSellOffer: id,
      Fee: '12',
    };
    // @ts-ignore
    const result = await this.xumm.createPayload({
      txjson: tx,
      user_token: user!.token,
    });
  }

  async mintNft(data: CollectArticleDto) {
    const post = await this.prisma.post.findUnique({
      where: {
        internalUrl: data.url,
      },
      include: {
        author: true,
      },
    });
    if (post) {
      await this.prepareColdWallet(post.author.address);
      console.log('minting nft--------------------------------');
      const tx: Transaction = {
        TransactionType: 'NFTokenMint',
        Issuer: this.wallet.address,
        Account: post.author.address,
        NFTokenTaxon: 0,
        URI: convertStringToHex('https://${cid}.ipfs.w3s.link'),
        Flags: 8,
      };
      //@ts-ignore
      const ss = await this.xumm.createPayload({
        txjson: tx,
        user_token: post.author.token,
      });
      console.log(ss);
      console.log('done--------------------------------');
      // return ss.id;
    }
  }

  async createSellOffer(currency: string) {
    // const wallet = Wallet.fromSecret('snd7kY1qNuNM2fUF7NdageKgEvtDd');
    const tx: Transaction = {
      TransactionType: 'OfferCreate',
      Account: this.wallet.classicAddress,
      Flags: OfferCreateFlags.tfSell,
      TakerGets: {
        currency,
        issuer: this.wallet.classicAddress,
        value: '1',
      },
      TakerPays: '1',
    };
    this.logger.debug('Sending sell offer');
    try {
      const txFilled = await this.client.autofill(tx);
      console.log(txFilled);
      const txSigned = await this.wallet.sign(txFilled);
      console.log(txSigned);
      const result = await this.client.submitAndWait(txSigned.tx_blob);
      console.log(result);
    } catch (err) {
      this.logger.error(err);
    }
  }

  async createBuyOffer(
    address: string,
    userToken: string,
    url: string,
    currency: string,
  ): Promise<CreatedPayload> {
    const tx: Transaction = {
      TransactionType: 'OfferCreate',
      Account: address,
      Flags: OfferCreateFlags.tfImmediateOrCancel,
      TakerPays: {
        currency,
        issuer: this.wallet.address,
        value: '1',
      },
      TakerGets: '1',
    };
    this.logger.debug('Sending buy offer');
    // @ts-ignore
    const payload = await this.xumm.createPayload({
      txjson: tx,
      user_token: userToken,
      custom_meta: {
        blob: { url },
      },
    });

    return payload!;
  }

  async create(data: CreateArticleDto): Promise<any> {
    const file = new File([JSON.stringify(data.body)], `${data.title}.json`);
    await this.storage.putSingle(file, {
      onRootCidReady: (cid) => {
        console.log('sheeehs ' + cid);
      },
    });

    const user = await this.prisma.user.findUnique({
      where: {
        address: data.address,
      },
    });
    console.log('got user: ' + user);
    if (user) {
      const userToken = user.token;
      console.log('got user token: ' + userToken);
      if (userToken) {
        const tx: CreatePayload = {
          user_token: userToken,
          txjson: {
            TransactionType: 'NFTokenMint',
            NFTokenTaxon: 0,
            URI: convertStringToHex('https://${cid}.ipfs.w3s.link'),
            Flags: 8,
          },
        };
        const payload = await this.xumm.createPayload(tx);
        console.log(payload);
      }
    }
  }

  async onModuleInit(): Promise<void> {
    await this.client.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.disconnect();
  }

  private async processTransaction(tx: Transaction): Promise<TxResponse> {
    const txFilled = await this.client.autofill(tx);
    const txSigned = await this.wallet.sign(txFilled);
    const result = await this.client.submitAndWait(txSigned.tx_blob);
    return result;
  }
}
