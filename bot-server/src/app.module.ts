import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TonModule } from './ton/ton.module';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [TonModule, TelegramModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
