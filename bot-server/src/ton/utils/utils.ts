import { TonClient } from '@eversdk/core';

export const getTONEndpoint = (): string => {
  const endpoint =
    process.env.NETWORK === 'mainnet'
      ? 'https://toncenter.com/api/v2/jsonRPC'
      : 'https://testnet.toncenter.com/api/v2/jsonRPC';

  return endpoint;
};

export const isNFTAccount = async (
  client: TonClient,
  nftAddress: string,
  userAddress: string,
): Promise<boolean> => {
  // Check if the account is a non-zero balance wallet
  const account = await client.net.query_collection({
    collection: 'accounts',
    filter: { id: { eq: nftAddress } },
    result: 'id balance acc_type',
  });
  if (
    account.result.length === 0 ||
    account.result[0].balance?.toString() === '0' ||
    account.result[0].acc_type !== 'Active'
  ) {
    return false;
  }
  // Check if the account is a valid NFT account for the user
  const parts = nftAddress.split(':');
  return parts[0] === '-1' && parts[1].startsWith(userAddress.substr(2));
};
