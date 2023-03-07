import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { HttpApi, fromNano, toNano } from 'ton';
import {
  ConfirmWalletSessionDto,
  ConfirmWalletSessionRes,
  CreateWalletSessionRes,
  GetAllNFTDto,
  GetAllNFTRes,
  LinkRes,
  TransactionDto,
  VerifyRes,
} from './dtos/ton.dto';
// import { TonClient } from '@eversdk/core';
// import { libNode } from '@eversdk/lib-node';
import {
  TonhubConnector,
  TonhubCreatedSession,
  TonhubSessionAwaited,
  TonhubSessionState,
  TonhubWalletConfig,
} from 'ton-x';
import { getTONEndpoint, isNFTAccount } from './utils/utils';

@Injectable()
export class TonService {
  constructor(private readonly httpService: HttpService) {}

  async createWalletSession(): Promise<CreateWalletSessionRes> {
    const connector = new TonhubConnector({ network: 'mainnet' }); //Set network "sandbox" for testnet
    let session: TonhubCreatedSession = await connector.createNewSession({
      name: 'NFTChef',
      url: 'https://www.google.com/',
    });

    // Session ID, Seed and Auth Link
    const sessionId = session.id;
    const sessionSeed = session.seed;
    const sessionLink = session.link;

    console.log(sessionId);
    console.log(sessionLink);

    return { sessionId, sessionSeed, sessionLink };
  }

  async confirmWalletSession(
    req: ConfirmWalletSessionDto,
  ): Promise<ConfirmWalletSessionRes> {
    const connector = new TonhubConnector({ network: 'mainnet' }); //Set network "sandbox" for testnet
    const sessionState: TonhubSessionState = await connector.getSessionState(
      req.sessionId,
    );
    console.log(sessionState);
    const session: TonhubSessionAwaited = await connector.awaitSessionReady(
      req.sessionId,
      5 * 60 * 1000,
    ); // 5 min timeout

    console.log('Link connected!');
    console.log(session);

    if (session.state === 'revoked' || session.state === 'expired') {
      throw Error('BotServerError: Expired Link Error');
    } else if (session.state === 'ready') {
      // Handle session
      const wallet: TonhubWalletConfig = session.wallet;
      const correctConfig: boolean = TonhubConnector.verifyWalletConfig(
        req.sessionId,
        wallet,
      );

      if (correctConfig) return { walletAddress: wallet.address };
    } else {
      throw Error('BotServerError: Wallet Confirmation Error');
    }
  }

  async getAllNFT(req: GetAllNFTDto): Promise<GetAllNFTRes> {
    // TonClient.useBinaryLibrary(libNode);
    // const client = new TonClient({
    //   network: { endpoints: [getTONEndpoint()] },
    // });

    // const accounts = await client.net.query_collection({
    //   collection: 'accounts',
    //   // filter: { id: { eq: req.userAddress } },
    //   result: 'balance',
    // });

    // Filter NFT accounts owned by user
    let nftAddresses: string[];

    /* mocking code */
    nftAddresses = ['EQAFLucjRjYqDhdRs4NmjO9M7uTgq4OBlDjSRU1eRX7UanCz'];
    // for (const nftAddress of accounts.result) {
    //   if (await isNFTAccount(client, nftAddress, req.userAddress.toString())) {
    //     nftAddresses.push(nftAddress);
    //   }
    // }

    return { nftAddresses };
  }

  async verifyTransaction(req: TransactionDto): Promise<VerifyRes> {
    const httpClient = new HttpApi(getTONEndpoint(), {
      apiKey: process.env.TONCENTER_TOKEN,
    });

    const transactions = await httpClient.getTransactions(req.address, {
      limit: 100,
    });

    const incomingTransactions = transactions.filter(
      (tx) => Object.keys(tx.out_msgs).length === 0,
    );

    for (let i = 0; i < incomingTransactions.length; i++) {
      const tx = incomingTransactions[i];
      // Skip the transaction if there is no comment in it
      if (!tx.in_msg.msg_data) {
        continue;
      }
      console.log(tx);
      // Convert transaction value from nano
      const txValue = fromNano(tx.in_msg.value);
      // Get transaction comment
      let txComment: string;
      //@ts-ignore
      txComment = tx.in_msg.message;

      console.log('TxComment: ', txComment);

      if (txComment === req.comment && txValue === req.amount.toString()) {
        return { isVerified: true };
      }
    }

    return { isVerified: false };
  }

  generatePayLink(req: TransactionDto): LinkRes {
    const tonHubLink = `https://tonhub.com/transfer/${
      req.address
    }?amount=${toNano(req.amount)}&text=${req.comment}`;
    const tonKeeperLink = `https://app.tonkeeper.com/transfer/${
      req.address
    }?amount=${toNano(req.amount)}&text=${req.comment}`;
    return { links: [tonHubLink, tonKeeperLink] };
  }
}
