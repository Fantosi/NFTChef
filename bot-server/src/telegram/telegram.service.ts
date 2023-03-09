import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as TelegramBot from 'node-telegram-bot-api'; // works after installing types
import * as path from 'path';
import { getCommand, getContentFromCommand } from 'src/util/parseText';
import {
  ADD_STICKER_TO_SET_COMMAND,
  CREATE_STICKER_COMMAND,
  ECHO_COMMAND,
  EMOTIONS,
  EMOTION_JOY,
  EMOTION_SADNESS,
  EMOTION_SURPRISE,
  GENERATE_STICKER_SET_COMMAND,
  NFTCHEF_LOGO_IMG,
  SEND_DOCUMENT_COMMAND,
  SEND_PHOTO_COMMAND,
  SOURCE_IMG,
  START_COMMAND,
} from './telegram.constants';
import * as fs from 'fs';
import { timeout } from 'rxjs';
import { sleep } from 'src/ton/utils/utils';

@Injectable()
export class TelegramService {
  private readonly bot: TelegramBot;

  // private readonly bot:TelegramBot // works after installing types
  private logger = new Logger(TelegramService.name);
  private userId = process.env.USER_ID;

  constructor() {
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
    sleep(50);
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(path.resolve('./src/assets/raw.png'));
    const blob = new Blob([fileBuffer], { type: 'image/png' });
    formData.append('image', blob);
    formData.append('project_name', 'youseop_test');
    formData.append('emotion_type', EMOTION_JOY);

    try {
      console.log('send post request to diffusion model api');
      const res = await axios.post(
        'https://rocky-atoll-41977.herokuapp.com/batch_predict_test',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data', charset: 'utf-8' },
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

    switch (command) {
      case START_COMMAND:
        this.bot.sendMessage(
          msg.chat.id,
          'Hi I am catinthebox chatbot\n/generatestickerset',
        );
        break;
      case GENERATE_STICKER_SET_COMMAND:
        const stickerName = getContentFromCommand(text);
        if (stickerName.length === 0) {
          this.bot.sendMessage(
            msg.chat.id,
            'please put stickerName after command',
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
      default:
        this.bot.sendMessage(msg.chat.id, 'this is not a command');
    }
  };

  sendMessageToUser = (userId: string, message: string) => {
    this.bot.sendMessage(userId, message);
  };
}
