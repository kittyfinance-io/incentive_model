export enum SupportedChainId {
  MAINNET = 56,
  TESTNET = 97,
  HEX_MAINNET = '0x38',
  HEX_TESTNET = '0x61',
}

export const NETWORKS = [
  {
    chainId: 1,
    networkName: 'mainnet',
    defaultProvider: ['https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
    ftmscanUrl: ['https://etherscan.io'],
  },
  {
    chainId: 42161,
    networkName: 'arbitrum',
    defaultProvider: ['https://arbitrum-mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
    ftmscanUrl: ['https://arbiscan.io', 'https://explorer.arbitrum.io'],
  },
  {
    chainId: 137,
    networkName: 'matic',
    defaultProvider: ['https://polygon-mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161', 'https://polygon-rpc.com/'],
    ftmscanUrl: ['https://polygonscan.com', 'https://polygon-explorer-mainnet.chainstacklabs.com'],
  },
  {
    chainId: 43114,
    networkName: 'avalanche',
    defaultProvider: ['https://api.avax.network/ext/bc/C/rpc'],
    ftmscanUrl: ['https://snowtrace.io', 'https://cchain.explorer.avax.network'],
  },
  {
    chainId: 100,
    networkName: 'xdai',
    defaultProvider: ['https://rpc.xdaichain.com', 'https://xdai.poanetwork.dev/', 'https://dai.poa.network/'],
    ftmscanUrl: ['https://blockscout.com/xdai/mainnet'],
  },
  {
    chainId: 250,
    networkName: 'fantom',
    defaultProvider: ['https://rpc.ftm.tools/', 'https://rpcapi.fantom.network'],
    ftmscanUrl: ['https://ftmscan.com'],
  },
  {
    chainId: 56,
    networkName: 'bsc',
    defaultProvider: [
      'https://bsc-dataseed.binance.org',
      'https://bsc-dataseed1.defibit.io',
      'https://bsc-dataseed1.ninicoin.io',
    ],
    ftmscanUrl: ['https://bscscan.com'],
  },
  {
    chainId: 4,
    networkName: 'rinkeby',
    defaultProvider: ['https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
    ftmscanUrl: ['https://rinkeby.etherscan.io'],
  },
  {
    chainId: 5,
    networkName: 'goerli',
    defaultProvider: ['https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
    ftmscanUrl: ['https://goerli.etherscan.io'],
  },
  {
    chainId: 42,
    networkName: 'kovan',
    defaultProvider: ['https://kovan.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
    ftmscanUrl: ['https://kovan.etherscan.io'],
  },
  {
    chainId: 80001,
    networkName: 'mumbai',
    defaultProvider: [
      'https://matic-mumbai.chainstacklabs.com',
      'https://rpc-mumbai.maticvigil.com/v1',
      'https://polygon-mumbai.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    ],
    ftmscanUrl: ['https://mumbai.polygonscan.com', 'https://polygon-explorer-mumbai.chainstacklabs.com'],
  }
];

export default NETWORKS;
