import { Module } from '@nestjs/common';
import { TonService } from './ton.service';
import { HttpModule } from '@nestjs/axios';
import { TonController } from './ton.controller';

@Module({
  providers: [TonService],
  imports: [HttpModule],
  controllers: [TonController],
})
export class TonModule {}
