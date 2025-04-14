import type {HardhatUserConfig} from 'hardhat/types';

import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import '@nomiclabs/hardhat-etherscan';

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  solidity: {
    compilers: [{version: '0.8.8', settings: {}}],
  },
  typechain: {
    outDir: './types/typechain',
  },
  networks: {
    hardhat: {}
    // baseSepolia: { 
    //   url: 'https://base-sepolia.g.alchemy.com/v2/gs_zMTWsr6FZcPTrBGwqkxJAr8yPnlea', // Replace with your Infura project URL or equivalent
    //   accounts: ['45572fe6f8524cef886bdaee011bd4c83b0f6fd58d1b9779a60f6ab09abe8e7a'], // Replace with the private key of your test wallet
    // },
  },
};

export default config;
