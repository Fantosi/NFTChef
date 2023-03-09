import { Module } from '@nestjs/common';
import { TonModule } from 'src/ton/ton.module';
import { TonService } from 'src/ton/ton.service';
import { TelegramService } from './telegram.service';

@Module({
  providers: [TelegramService],
  imports: [TonModule],
})
export class TelegramModule {}
