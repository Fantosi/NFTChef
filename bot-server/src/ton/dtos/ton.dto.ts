import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Address } from 'ton-core';
import { TonhubCreatedSession, TonhubWalletConfig } from 'ton-x';

type TransactionStatus =
  | 'rejected'
  | 'expired'
  | 'invalid_session'
  | 'success'
  | 'unknown';

export class GetAllNFTReq {
  @IsString()
  @IsNotEmpty()
  userAddress: Address;
}

export class ConfirmWalletSessionReq {
  @IsNotEmpty()
  session: TonhubCreatedSession;
}

export class PaymentWalletSessionReq {
  @IsNotEmpty()
  session: TonhubCreatedSession;
  @IsNotEmpty()
  wallet: TonhubWalletConfig;
}

export class GetAllNFTDto {
  userAddress: Address;
}

export class ConfirmWalletSessionDto {
  session: TonhubCreatedSession;
}

export class PaymentWalletSessionDto {
  session: TonhubCreatedSession;
  wallet: TonhubWalletConfig;
}

export class GetAllNFTRes {
  nftAddresses: string[];
}

export class CreateWalletSessionRes {
  session: TonhubCreatedSession;
}

export class ConfirmWalletSessionRes {
  wallet: TonhubWalletConfig;
}

export class PaymentWalletSessionRes {
  status: TransactionStatus;
  message?: string;
}
