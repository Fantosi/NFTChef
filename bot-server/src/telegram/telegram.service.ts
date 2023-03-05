import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as TelegramBot from 'node-telegram-bot-api'; // works after installing types
import * as path from 'path';
import { getCommand, getContentFromCommand } from 'src/util/parseText';
import {
  ADD_STICKER_TO_SET_COMMAND,
  CREATE_STICKER_COMMAND,
  ECHO_COMMAND,
  GENERATE_STICKERS_COMMAND,
  SEND_DOCUMENT_COMMAND,
  SEND_PHOTO_COMMAND,
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

  private generateStickers = async () => {
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
      console.log('batch_predict_test res: ', res);
    } catch (e) {
      this.logger.error('ERROR IN [generateStickers] : ', e);
    }
  };

  onReceiveMessage = async (msg: TelegramBot.Message) => {
    this.logger.debug(msg);
    const text = msg.text;
    const command = getCommand(text);

    switch (command) {
      case START_COMMAND:
        this.bot.sendMessage(
          msg.chat.id,
          'Hi I am catinthebox chatbot\n/echo : reply with same text\n/createsticker\n/sendphoto\n/senddocument\n/addstickertoset\n/generatestickers',
        );
        break;
      case ECHO_COMMAND:
        const content = getContentFromCommand(text);
        this.bot.sendMessage(msg.chat.id, content);
        break;
      case CREATE_STICKER_COMMAND:
        const res = await this.bot.createNewStickerSet(
          msg.chat.id,
          'test1_by_nftchef_bot',
          'test1_by_nftchef_bot',
          'https://replicate.delivery/pbxt/h5QCoOtMG8aNNFKUKldey2WfLOf3oXsg7pFebAi89BGR5TSCB/out-0.png',
          '🌼',
        );
        console.log('res: ', res);
        break;
      case ADD_STICKER_TO_SET_COMMAND:
        const resAddSticker = await this.bot.addStickerToSet(
          msg.chat.id,
          'test1_by_nftchef_bot',
          'https://replicate.delivery/pbxt/h5QCoOtMG8aNNFKUKldey2WfLOf3oXsg7pFebAi89BGR5TSCB/out-0.png',
          '2️⃣',
        );
        console.log(resAddSticker);
        break;

      case SEND_PHOTO_COMMAND:
        const resPhoto = await this.bot.sendPhoto(
          msg.chat.id,
          'https://user-images.githubusercontent.com/66366941/222963251-fb7b3016-0d17-460e-895f-7309920418f2.png',
        );
        const photoFileId = resPhoto.photo[0].file_id;
        console.log('fileId', photoFileId);
        console.log('resPhoto', resPhoto);
        this.bot.sendMessage(msg.chat.id, 'file_id is\n' + photoFileId);
        break;
      case SEND_DOCUMENT_COMMAND:
        const resDoc = await this.bot.sendDocument(
          msg.chat.id,
          'https://user-images.githubusercontent.com/66366941/222963251-fb7b3016-0d17-460e-895f-7309920418f2.png',
        );
        console.log('resDoc', resDoc);
        const docFileId = resDoc.document.thumb.file_id;
        this.bot.sendMessage(msg.chat.id, 'file_id is\n' + docFileId);
        break;
      case GENERATE_STICKERS_COMMAND:
        this.generateStickers();
        this.bot.sendMessage(msg.chat.id, 'sticker generated!');

        break;
      default:
        this.bot.sendMessage(msg.chat.id, 'this is not a command');
    }
  };

  sendMessageToUser = (userId: string, message: string) => {
    this.bot.sendMessage(userId, message);
  };
}
