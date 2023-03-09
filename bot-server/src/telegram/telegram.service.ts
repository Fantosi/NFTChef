import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as TelegramBot from 'node-telegram-bot-api'; // works after installing types
import * as path from 'path';
import { getCommand, getContentFromCommand } from 'src/util/parseText';
import {
  CONNECT_ACCOUNT,
  EMOTIONS,
  EMOTION_JOY,
  GENERATE_STICKER_SET_COMMAND,
  CREATE_STICKER_COMMAND,
  LISTUP_PROJECT,
  NFTCHEF_LOGO_IMG,
  SELECT_NFT,
  SELECT_PROJECT,
  SOURCE_IMG,
  START_COMMAND,
  VERIFY_ACCOUNT,
  CHECKOUT,
} from './telegram.constants';
import * as fs from 'fs';
import { sleep } from 'src/ton/utils/utils';
import { TonService } from 'src/ton/ton.service';
import { Address } from 'ton-core';

@Injectable()
export class TelegramService {
  private readonly bot: TelegramBot;

  // private readonly bot:TelegramBot // works after installing types
  private logger = new Logger(TelegramService.name);
  private userId = process.env.USER_ID;
  private sessionIdOfWallet: undefined | string = undefined;
  private verifiedWalletAddress: undefined | string = undefined;

  constructor(private readonly tonService: TonService) {
    this.bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
    this.bot.on('message', this.onReceiveMessage);

    this.sendMessageToUser(this.userId, `Server started at ${new Date()}`);
  }

  private createNewStickerSet = async (
    stickerName: string,
    imgUrl: string,
    chatId: string,
  ) => {
    console.log('createNewStickerSet function start');
    sleep(50);
    const res = await this.bot.createNewStickerSet(
      chatId,
      stickerName + '_by_testyouseop_bot',
      stickerName + '_by_testyouseop_bot',
      imgUrl,
      '👩🏻‍🍳',
    );
    return;
  };

  private addImgToStickerSet = (
    stickerName: string,
    imgUrl: string,
    chatId: string,
  ): Promise<void> =>
    new Promise((resolve, reject) => {
      setTimeout(() => {
        console.log('addImgToStickerSet function start');
        this.bot.addStickerToSet(
          chatId,
          stickerName + '_by_testyouseop_bot',
          imgUrl,
          '👩🏻‍🍳',
        );
        console.log('addImgToStickerSet function end');

        resolve();
      }, 50000);
    });

  private sendMsg = (text: string, chatId: string): Promise<void> =>
    new Promise((resolve, reject) => {
      setTimeout(() => {
        this.bot.sendMessage(chatId, text);
        resolve();
      }, 50000);
    });

  private generateStickerImg = async (emotion: string) => {
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(path.resolve('./src/assets/raw.png'));
    const blob = new Blob([fileBuffer], { type: 'image/png' });

    formData.append('image', blob);
    formData.append('project_name', 'youseop_test');
    formData.append('emotion_type', EMOTION_JOY);

    try {
      console.log('send post request to diffusion model api');
      const res = await axios.post(
        'https://rocky-atoll-41977.herokuapp.com/batch_predict',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            charset: 'utf-8',
          },
        },
      );

      const generatedImgUrl = res.data[0];

      return generatedImgUrl;
    } catch (error) {
      this.logger.error('ERROR IN [generateStickerImg] : ', error);
    }
  };

  private generateStickerSet = async (stickerName: string, chatId: string) => {
    await this.createNewStickerSet(stickerName, NFTCHEF_LOGO_IMG, chatId);
    await this.addImgToStickerSet(stickerName, SOURCE_IMG, chatId);

    try {
      for (let i = 0; i < EMOTIONS.length; i++) {
        console.log(`start to generate #${i + 1} img`);
        sleep(50);
        const generatedImgUrl = await this.generateStickerImg(EMOTIONS[i]);
        console.log(`#${i + 1} generatedImgUrl: `, generatedImgUrl);
        await this.addImgToStickerSet(stickerName, generatedImgUrl, chatId);
      }

      await this.sendMsg(
        `sticker generated!\nhttps://t.me/addstickers/${stickerName}_by_testyouseop_bot`,
        chatId,
      );
    } catch (e) {
      this.logger.error('ERROR IN [generateStickerSet] : ', e);
    }
  };

  onReceiveMessage = async (msg: TelegramBot.Message) => {
    this.logger.debug('from: ', msg.from.id);
    this.logger.debug('text: ', msg.text);
    const text = msg.text;
    const command = getCommand(text);
    const content = text ? getContentFromCommand(text) : '';

    switch (command) {
      case START_COMMAND:
        this.bot.sendMessage(
          msg.chat.id,
          'Hi I am catinthebox chatbot\nto generate stickers, you should connect your ton wallet first. /connectwallet',
        );
        break;
      case CONNECT_ACCOUNT:
        const { sessionId, sessionLink, sessionSeed } =
          await this.tonService.createWalletSession();
        this.sessionIdOfWallet = sessionId;
        this.bot.sendMessage(
          msg.chat.id,
          'Please connect your account. Click the link below\n' +
            sessionLink +
            '\nAfter wallet connection is completed, please send /verifywallet to verify your wallet',
        );
        break;
      case VERIFY_ACCOUNT:
        const res = await this.tonService.confirmWalletSession({
          sessionId: this.sessionIdOfWallet,
        });
        if (res.walletAddress) {
          this.verifiedWalletAddress = res.walletAddress;
          this.bot.sendMessage(
            msg.chat.id,
            `Congratulation! 👏👏👏\nWallet is successfully connected!\nAddress of the connected wallet is\n${this.verifiedWalletAddress}\n\nNow, put /listupproject command to choose NFT project.`,
          );
        }
        break;
      case LISTUP_PROJECT:
        this.bot.sendMessage(
          msg.chat.id,
          `Here is the list of the projects in your wallet\n1. project1\n2. project2\n3. project3\n4. project4\n\nPut the command below to select project\n/selectproject <the number of project>`,
        );
        break;
      case SELECT_PROJECT:
        if (content.length === 0) {
          this.bot.sendMessage(
            msg.chat.id,
            `Please put <the number of project> after /selectproject command.\n/selectproject <the number of project>`,
          );
        } else {
          this.bot.sendMessage(
            msg.chat.id,
            `Great project#${content} is selected! 👍\n\nHere is the list of the NFT in the project${content}\n1. nft1\n2. nft2\n3. nft3\n4. nft4\n\nPut the command below to select nft\n/selectnft <the number of nft>`,
          );
        }
        break;
      case SELECT_NFT:
        if (content.length === 0) {
          this.bot.sendMessage(
            msg.chat.id,
            `Please put <the number of nft> after /selectnft command.\n/selectnft <the number of nft>`,
          );
        } else {
          this.bot.sendMessage(
            msg.chat.id,
            `Great nft#${content} is selected! 👍\n\nDo you want to generate sticker set with this nft? You should checkout 20 USD to generate sticker set.\n\nTo proceed payment, please send the command below.\n/checkout`,
          );
        }
        break;
      case CHECKOUT:
        // this.tonService.verifyTransaction({
        //   address: new Address(this.verifiedWalletAddress),
        //   amount:0.01,
        //   comment:
        // })
        this.bot.sendMessage(
          msg.chat.id,
          'Transaction is successfully completed!💪💪\n\nPut /generatestickerset <name of your sticker> command to generate sticker with your nft. 🥰',
        );
        break;
      case GENERATE_STICKER_SET_COMMAND:
        const stickerName = getContentFromCommand(text);
        if (stickerName.length === 0) {
          this.bot.sendMessage(
            msg.chat.id,
            'please put stickerName after command\n/generatestickerset <name of your sticker>',
          );
        } else {
          this.bot.sendMessage(
            msg.chat.id,
            'It will take sometime to generate sticker set, please wait.... \nThe name of the sticker is ' +
              stickerName,
          );
          await this.generateStickerSet(stickerName, msg.chat.id);
        }
        break;
      case CREATE_STICKER_COMMAND:
        const test = await this.generateStickerImg(EMOTION_JOY);
        console.log('created! ', test);
        this.bot.sendMessage(msg.chat.id, 'generated! ' + test);
        break;
      default:
        this.bot.sendMessage(msg.chat.id, 'this is not a command');
    }
  };

  sendMessageToUser = (userId: string, message: string) => {
    this.bot.sendMessage(userId, message);
  };
}
