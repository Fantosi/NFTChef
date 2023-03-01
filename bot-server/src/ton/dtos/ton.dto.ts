import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Address } from 'ton-core';

export class TransactionReq {
  @IsString()
  @IsNotEmpty()
  address: Address;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  comment: string;
}

export class TransactionDto {
  address: Address;
  amount: number;
  comment: string;
}

export class VerifyRes {
  isVerified: boolean;
}

export class LinkRes {
  links: string[];
}
