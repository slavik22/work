import {AppProps} from 'next/app';
import Head from 'next/head';
import {ChatContextWrapper} from '../context/chat.context';
import {WagmiConfig, createClient, defaultChains, configureChains} from 'wagmi';
import {publicProvider} from 'wagmi/providers/public';
import {MetaMaskConnector} from 'wagmi/connectors/metaMask';

const myChains = [
  {
    id: 31337,
    name: 'Hardhat Local',
    network: 'hardhat',
    nativeCurrency: {
      decimals: 18,
      name: 'Ethereum',
      symbol: 'ETH',
    },
    rpcUrls: {
      default: 'http://localhost:8545',
    },
    blockExplorers: {
      default: {name: '', url: ''},
    },
    testnet: true,
  },
  // {
  //   id: 84532,
  //   name: 'Base Sepolia',
  //   network: 'base-sepolia',
  //   nativeCurrency: {
  //     decimals: 18,
  //     name: 'Ethereum',
  //     symbol: 'ETH',
  //   },
  //   rpcUrls: {
  //     default: 'https://base-sepolia.g.alchemy.com/v2/gs_zMTWsr6FZcPTrBGwqkxJAr8yPnlea', // Make sure this is the correct RPC URL
  //   },
  //   blockExplorers: {
  //     default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' }, 
  //   },
  //   testnet: true,
  // },
  ...defaultChains,
];
const {chains, provider, webSocketProvider} = configureChains(myChains, [publicProvider()]);
const client = createClient({
  connectors: [new MetaMaskConnector({chains})],
  provider,
  webSocketProvider,
});

export default function App(props: AppProps) {
  const {Component, pageProps} = props;

  return (
    <>
      <Head>
        <title>Chat</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous"></link>
      </Head>

          <WagmiConfig client={client}>
            <ChatContextWrapper>
                <Component {...pageProps} />
            </ChatContextWrapper>
          </WagmiConfig>
    </>
  );
}
