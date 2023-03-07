import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as TelegramBot from 'node-telegram-bot-api'; // works after installing types
import * as path from 'path';
import { getCommand, getContentFromCommand } from 'src/util/parseText';
import {
  ADD_STICKER_TO_SET_COMMAND,
  CREATE_STICKER_COMMAND,
  ECHO_COMMAND,
  GENERATE_STICKER_SET_COMMAND,
  NFTCHEF_LOGO_IMG,
  SEND_DOCUMENT_COMMAND,
  SEND_PHOTO_COMMAND,
  SOURCE_IMG,
  START_COMMAND,
} from './telegram.constants';
import * as fs from 'fs';

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
    const res = await this.bot.createNewStickerSet(
      chatId,
      stickerName + '_by_nftchef_bot',
      stickerName + '_by_nftchef_bot',
      imgUrl,
      '👩🏻‍🍳',
    );
    return;
  };

  private addImgToStickerSet = async (
    stickerName: string,
    imgUrl: string,
    chatId: string,
  ) => {
    await this.bot.addStickerToSet(
      chatId,
      stickerName + '_by_nftchef_bot',
      imgUrl,
      '👩🏻‍🍳',
    );
  };

  private generateStickerSet = async (stickerName: string, chatId: string) => {
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(path.resolve('./src/assets/raw.png'));
    const blob = new Blob([fileBuffer], { type: 'image/png' });
    formData.append('image', blob);
    formData.append('project_name', 'youseop_test');

    try {
      const res = await axios.post(
        'https://rocky-atoll-41977.herokuapp.com/batch_predict_test',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data', charset: 'utf-8' },
        },
      );
      const generatedImgs = res.data;
      if (generatedImgs.length > 0) {
        await this.createNewStickerSet(stickerName, NFTCHEF_LOGO_IMG, chatId);
        this.bot.sendMessage(
          chatId,
          'sticker set is successfully generated. We should add four more image to the sticker set. Please wait...\n [1/5]...',
        );
        await this.addImgToStickerSet(stickerName, SOURCE_IMG, chatId);
        this.bot.sendMessage(chatId, '[2/5]...');
        for (let i = 0; i < generatedImgs.length; i++) {
          await this.addImgToStickerSet(stickerName, generatedImgs[i], chatId);
          this.bot.sendMessage(chatId, `[${i + 3}/5]...`);
        }
        this.bot.sendMessage(
          chatId,
          `sticker generated!\nhttps://t.me/addstickers/${stickerName}_by_nftchef_bot`,
        );
      } else {
        this.logger.error(
          'ERROR IN [generateStickerSet] : ',
          "there isn't any png link in the response",
        );
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
