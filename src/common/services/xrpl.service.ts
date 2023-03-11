import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { CreateArticleDto } from 'src/articles/dto/create-article.dto';
import { IpfsStorage } from 'src/common/services/ipfs';
import { PrismaService } from 'src/common/services/prisma.service';
import { File } from 'web3.storage';
import {
  AccountSetAsfFlags,
  AccountSetTfFlags,
  Client,
  convertStringToHex,
  Transaction,
  TransactionMetadata,
  Wallet,
} from 'xrpl';
import { CreatePayload } from 'xumm-sdk/dist/src/types';
import { XummService } from './xumm.service';

@Injectable()
export default class XRPLService implements OnModuleInit, OnModuleDestroy {
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

  async prepareColdWallet() {
    const cold_settings_tx: Transaction = {
      TransactionType: 'AccountSet',
      Account: this.wallet.address,
      TransferRate: 0,
      TickSize: 5,
      Domain: '626570726F6A6563746D6F6E69746F72696E672E70726F', // "example.com"
      SetFlag: AccountSetAsfFlags.asfDefaultRipple,
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

  async createTrustLine(destination: string) {
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
    const issue_quantity = '3840';
    const currency_code = 'FOO';
    const send_token_tx: Transaction = {
      TransactionType: 'Payment',
      Account: this.wallet.address,
      Amount: {
        currency: currency_code,
        value: amount.toString(),
        issuer: this.wallet.address,
      },
      Destination: destination,
      DestinationTag: 1, // Needed since we enabled Require Destination Tags
      // on the hot account earlier.
    };

    const pay_prepared = await this.client.autofill(send_token_tx);
    const pay_signed = this.wallet.sign(pay_prepared);
    console.log(
      `Sending ${issue_quantity} ${currency_code} to ${destination}...`,
    );
    const pay_result = await this.client.submitAndWait(pay_signed.tx_blob);
    if (
      pay_result &&
      (pay_result.result.meta as TransactionMetadata).TransactionResult ==
        'tesSUCCESS'
    ) {
      console.log(
        `Transaction succeeded: https://testnet.xrpl.org/transactions/${pay_signed.hash}`,
      );
    } else {
      throw `Error sending transaction: ${pay_result.result.meta}`;
    }
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
}
