import { Injectable, Logger } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api'; // works after installing types

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
    console.log('### ', msg);
    const text = msg.text;

    if (text.includes('/echo')) {
      const echoMsg = text.split(' ').slice(1).join(' ');
      console.log('echoMsg : ', echoMsg);
      this.bot.sendMessage(this.userId, echoMsg);
    } else {
      this.bot.sendMessage(this.userId, "Hi I'm cat in the box chatbot");
    }
  };

  sendMessageToUser = (userId: string, message: string) => {
    this.bot.sendMessage(userId, message);
  };
}
