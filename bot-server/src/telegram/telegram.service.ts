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
  private readonly bot: any;
  // private readonly bot:TelegramBot // works after installing types
  private logger = new Logger(TelegramService.name);
  private userId = '5239333551';

  constructor() {
    this.bot = new TelegramBot(
      '6284154928:AAGH9Et303317lf2f5EcB4NJHKnvmC9qbFY',
      { polling: true },
    );

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
          this.userId,
          'Hi I am catinthebox chatbot\n/echo : reply with same text',
        );
        break;
      case ECHO_COMMAND:
        const content = getContentFromCommand(text);
        this.bot.sendMessage(this.userId, content);
        break;
      default:
        this.bot.sendMessage(this.userId, 'this is not a command');
    }
  };

  sendMessageToUser = (userId: string, message: string) => {
    this.bot.sendMessage(userId, message);
  };
}
