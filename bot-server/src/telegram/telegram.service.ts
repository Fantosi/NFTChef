import { Injectable, Logger } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api'; // works after installing types
import {
  getCommand,
  getContentFromCommand,
  isCommand,
} from 'src/util/parseText';
import { ECHO_COMMAND, START_COMMAND } from './telegram.constants';

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

  onReceiveMessage = (msg: TelegramBot.Message) => {
    this.logger.debug(msg);
    const text = msg.text;
    const command = getCommand(text);

    switch (command) {
      case START_COMMAND:
        this.bot.sendMessage(
          msg.chat.id,
          'Hi I am catinthebox chatbot\n/echo : reply with same text',
        );
        break;
      case ECHO_COMMAND:
        const content = getContentFromCommand(text);
        this.bot.sendMessage(msg.chat.id, content);
        break;
      default:
        this.bot.sendMessage(msg.chat.id, 'this is not a command');
    }
  };

  sendMessageToUser = (userId: string, message: string) => {
    this.bot.sendMessage(userId, message);
  };
}
