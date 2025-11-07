// Token symbol to Defuse Asset ID mapping
export const TOKEN_MAPPINGS: Record<string, Record<string, string>> = {
  near: {
    'WNEAR': 'nep141:wrap.near',
    'NEAR': 'nep141:wrap.near',
    'USDC': 'nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1',
    'USDT': 'nep141:usdt.tether-token.near',
    'DAI': 'nep141:6b175474e89094c44da98b954eedeac495271d0f.factory.bridge.near'
  },
  ethereum: {
    'ETH': 'erc20:native',
    'USDC': 'erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    'USDT': 'erc20:0xdAC17F958D2ee523a2206206994597C13D831ec7',
    'DAI': 'erc20:0x6B175474E89094C44Da98b954EedeAC495271d0F',
    'WETH': 'erc20:0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
  },
  solana: {
    'SOL': 'spl:native',
    'USDC': 'spl:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    'USDT': 'spl:Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
  },
  bitcoin: {
    'BTC': 'btc:native'
  }
};

export function convertToDefuseAssetId(chain: string, token: string): string {
  const chainLower = chain.toLowerCase();
  const tokenUpper = token.toUpperCase();
  
  if (!TOKEN_MAPPINGS[chainLower]) {
    throw new Error(`Unsupported chain: ${chain}`);
  }
  
  const assetId = TOKEN_MAPPINGS[chainLower][tokenUpper];
  
  if (!assetId) {
    throw new Error(`Unsupported token ${token} on chain ${chain}`);
  }
  
  return assetId;
}
