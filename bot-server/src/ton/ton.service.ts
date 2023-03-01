import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { HttpApi, fromNano, toNano } from 'ton';
import { LinkRes, TransactionDto, VerifyRes } from './dtos/ton.dto';

@Injectable()
export class TonService {
  constructor(private readonly httpService: HttpService) {}

  async verifyTransaction(req: TransactionDto): Promise<VerifyRes> {
    const endpoint =
      process.env.NETWORK === 'mainnet'
        ? 'https://toncenter.com/api/v2/jsonRPC'
        : 'https://testnet.toncenter.com/api/v2/jsonRPC';

    const httpClient = new HttpApi(endpoint, {
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
