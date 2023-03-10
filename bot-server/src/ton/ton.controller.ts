import { Body, Controller, Get } from '@nestjs/common';
import { TonService } from './ton.service';
import { Address } from 'ton-core';
import {
  ConfirmWalletSessionDto,
  ConfirmWalletSessionReq,
  ConfirmWalletSessionRes,
  CreateWalletSessionRes,
  GetAllNFTDto,
  GetAllNFTReq,
  GetAllNFTRes,
  PaymentWalletSessionDto,
  PaymentWalletSessionReq,
  PaymentWalletSessionRes,
} from './dtos/ton.dto';

@Controller('ton')
export class TonController {
  constructor(private readonly tonService: TonService) {}

  @Get('createSession')
  async createWalletSession(): Promise<CreateWalletSessionRes> {
    return this.tonService.createWalletSession();
  }

  @Get('confirmSession')
  async confirmWalletSession(
    @Body() req: ConfirmWalletSessionReq,
  ): Promise<ConfirmWalletSessionRes> {
    const reqDto = Object.assign(new ConfirmWalletSessionDto(), req);
    return this.tonService.confirmWalletSession(reqDto);
  }

  @Get('paymentSession')
  async paymentWalletSession(
    @Body() req: PaymentWalletSessionReq,
  ): Promise<PaymentWalletSessionRes> {
    const reqDto = Object.assign(new PaymentWalletSessionDto(), req);
    return this.tonService.paymentWalletSession(reqDto);
  }

  @Get('allNFT')
  async getAllNFT(@Body() req: GetAllNFTReq): Promise<GetAllNFTRes> {
    const reqDto = Object.assign(new GetAllNFTDto(), req);
    return this.tonService.getAllNFT(reqDto);
  }
}
