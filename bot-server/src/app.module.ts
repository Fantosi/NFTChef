import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PaymentModule } from './payment/payment.module';
import { TonModule } from './ton/ton.module';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [PaymentModule, TonModule, TelegramModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
