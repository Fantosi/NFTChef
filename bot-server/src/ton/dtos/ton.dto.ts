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

export class GetAllNFTReq {
  @IsString()
  @IsNotEmpty()
  userAddress: Address;
}

export class ConfirmWalletSessionReq {
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}

export class TransactionDto {
  address: Address;
  amount: number;
  comment: string;
}

export class GetAllNFTDto {
  userAddress: Address;
}

export class ConfirmWalletSessionDto {
  sessionId: string;
}

export class VerifyRes {
  isVerified: boolean;
}

export class LinkRes {
  links: string[];
}

export class GetAllNFTRes {
  nftAddresses: string[];
}

export class CreateWalletSessionRes {
  sessionId: string;
  sessionSeed: string;
  sessionLink: string;
}

export class ConfirmWalletSessionRes {
  walletAddress: string;
}
