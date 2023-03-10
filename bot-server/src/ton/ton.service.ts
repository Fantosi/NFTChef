import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { HttpApi, fromNano, toNano } from 'ton';
import {
  ConfirmWalletSessionDto,
  ConfirmWalletSessionRes,
  CreateWalletSessionRes,
  GetAllNFTDto,
  GetAllNFTRes,
  PaymentWalletSessionDto,
  PaymentWalletSessionRes,
} from './dtos/ton.dto';
import {
  TonhubConnector,
  TonhubCreatedSession,
  TonhubSessionAwaited,
  TonhubSessionState,
  TonhubTransactionRequest,
  TonhubTransactionResponse,
  TonhubWalletConfig,
} from 'ton-x';
import { getTONEndpoint } from './utils/utils';

@Injectable()
export class TonService {
  constructor(private readonly httpService: HttpService) {}

  async createWalletSession(): Promise<CreateWalletSessionRes> {
    const connector = new TonhubConnector({ network: 'mainnet' }); //Set network "sandbox" for testnet
    let session: TonhubCreatedSession = await connector.createNewSession({
      name: 'NFTChef',
      url: 'https://www.google.com/',
    });

    return { session };
  }

  async confirmWalletSession(
    req: ConfirmWalletSessionDto,
  ): Promise<ConfirmWalletSessionRes> {
    const connector = new TonhubConnector({ network: 'mainnet' }); //Set network "sandbox" for testnet
    const sessionState: TonhubSessionState = await connector.getSessionState(
      req.session.id,
    );
    console.log(sessionState);
    const session: TonhubSessionAwaited = await connector.awaitSessionReady(
      req.session.id,
      5 * 60 * 1000,
    ); // 5 min timeout

    console.log('Connected!');
    console.log(session);

    if (session.state === 'revoked' || session.state === 'expired') {
      throw Error('BotServerError: Expired Link Error');
    } else if (session.state === 'ready') {
      // Handle session
      const wallet: TonhubWalletConfig = session.wallet;
      const correctConfig: boolean = TonhubConnector.verifyWalletConfig(
        req.session.id,
        wallet,
      );

      if (correctConfig) return { wallet };
    } else {
      throw Error('BotServerError: Wallet Confirmation Error');
    }
  }

  async paymentWalletSession(
    req: PaymentWalletSessionDto,
  ): Promise<PaymentWalletSessionRes> {
    const connector = new TonhubConnector({ network: 'mainnet' }); //Set network "sandbox" for testnet

    // Request body
    const request: TonhubTransactionRequest = {
      seed: req.session.seed, // Session Seed
      appPublicKey: req.wallet.appPublicKey, // Wallet's app public key
      to: process.env.OWNER_WALLET, // Destination
      value: '10000000', // Amount in nano-tons, 0.01 ton
      timeout: 5 * 60 * 1000, // 5 minut timeout
      text: 'Payment needed to buy your personalized emoji.', // Optional comment. If no payload specified - sends actual content, if payload is provided this text is used as UI-only hint
    };

    const response: TonhubTransactionResponse =
      await connector.requestTransaction(request);

    if (response.type === 'success') {
      // Handle successful transaction
      const externalMessage = response.response; // Signed body of external message that was sent to the network
      return { status: response.type, message: externalMessage };
    } else {
      return { status: response.type };
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
}
