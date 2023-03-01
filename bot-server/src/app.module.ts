import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PaymentModule } from './payment/payment.module';
import { TonModule } from './ton/ton.module';

@Module({
  imports: [PaymentModule, TonModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
