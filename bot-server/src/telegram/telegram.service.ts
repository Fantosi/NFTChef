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
  ADD_STICKER_TO_SET_COMMAND,
} from './telegram.constants';
import * as fs from 'fs';
import { sleep } from 'src/ton/utils/utils';
import { TonService } from 'src/ton/ton.service';
import { Address } from 'ton-core';
import { TonhubCreatedSession, TonhubWalletConfig } from 'ton-x';

@Injectable()
export class TelegramService {
  private readonly bot: TelegramBot;

  // private readonly bot:TelegramBot // works after installing types
  private logger = new Logger(TelegramService.name);
  private userId = process.env.USER_ID;
  private sessionIdOfWallet: undefined | TonhubCreatedSession = undefined;
  private verifiedWallet: undefined | TonhubWalletConfig = undefined;

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
    formData.append('emotion_type', emotion);

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
          'Wassup, This is Catinthebox bot, ser. You can generate NFT pegged stickers with me.\nFirst connect your Ton wallet.\n/connectwallet',
        );
        break;
      case CONNECT_ACCOUNT:
        const { session } = await this.tonService.createWalletSession();
        this.sessionIdOfWallet = session;
        this.bot.sendMessage(
          msg.chat.id,
          'Copy that, click the link below to connect your account.\nWhen wallet connection is completed, send /verifywallet to literally verify your wallet!\n\n' +
            session.link,
        );
        break;
      case VERIFY_ACCOUNT:
        const res = await this.tonService.confirmWalletSession({
          session: this.sessionIdOfWallet,
        });
        if (res.wallet) {
          this.verifiedWallet = res.wallet;
          this.bot.sendMessage(
            msg.chat.id,
            `Fantastic! 🚀🚀🚀\nYour Wallet is successfully connected!\n*Wallet address : ${this.verifiedWallet.address}\nNext, send me /listupproject and choose NFT collection.`,
          );
        }
        break;
      case LISTUP_PROJECT:
        this.bot.sendMessage(
          msg.chat.id,
          `Following is the list of the collections you have:\n1. [----]\n2. [----]\n3. [----]\nType /selectproject <the number of collection> if you have made up your mind!`,
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
            `Roger, collection#${content} is selected!\nFollowing is the list of the NFTs in the collection#${content}\n1. [----]\n2. [----]\n3. [----]\n\nPut /selectnft <the number of NFT> to confirm your choice and start generating sticker.`,
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
            `Coool, NFT#${content} is selected! 😎\nAre you ready to start generating sicker set with NFT#${content}? 0.1 TON is all you need!\n\nTo proceed payment, please send the command below.\n/checkout`,
          );
        }
        break;
      case CHECKOUT:
        const checkoutResult = await this.tonService.paymentWalletSession({
          session: this.sessionIdOfWallet,
          wallet: this.verifiedWallet,
        });
        console.log('checkoutResult: ', checkoutResult);
        if (checkoutResult.status === 'success') {
          this.bot.sendMessage(
            msg.chat.id,
            `Transaction is successfully completed!\nLet’s do this. 🔥\nSend /generatestickerset <name of your sticker> command to generate NFT sticker!`,
          );
        } else {
          this.bot.sendMessage(
            msg.chat.id,
            `Transaction is rejected. Please make your account balance enough and try again.`,
          );
        }
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
            `The name of sticker is ${stickerName}.\nThank you for your patience in advance, ser !\nHave a break and come back in 5min. ☕️ `,
          );
          await this.generateStickerSet(stickerName, msg.chat.id);

          await this.sendMsg(
            `Your sticker is out now! 👩🏻‍🍼👩🏻‍🍼👩🏻‍🍼 \nClick the link below to use your sticker.\n\nEnjoy your time with your babies. 👶🏻❣️\n\nhttps://t.me/addstickers/${stickerName}_by_testyouseop_bot`,
            msg.chat.id,
          );
        }
        break;
      case CREATE_STICKER_COMMAND:
        const test = await this.generateStickerImg(EMOTION_JOY);
        console.log('created! ', test);
        this.bot.sendMessage(msg.chat.id, 'generated! ' + test);

        await this.sendMsg(
          `Your sticker is out now! 👩🏻‍🍼👩🏻‍🍼👩🏻‍🍼 \nClick the link below to use your sticker.\n\nEnjoy your time with your babies. 👶🏻❣️\n\nhttps://t.me/addstickers/${'stickername'}_by_testyouseop_bot`,
          msg.chat.id,
        );
        break;
      case ADD_STICKER_TO_SET_COMMAND:
        const originalStickerName = getContentFromCommand(text);

        this.addImgToStickerSet(
          originalStickerName,
          'https://replicate.delivery/pbxt/gle2RaNj4TS0DK0g9tVmRS83C9wi6feoJF1UMp9odqDxzOMhA/out-0.png',
          msg.chat.id,
        );
        break;
      default:
        this.bot.sendMessage(msg.chat.id, 'this is not a command');
    }
  };

  sendMessageToUser = (userId: string, message: string) => {
    this.bot.sendMessage(userId, message);
  };
}
