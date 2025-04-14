import type {NextPage} from 'next';
import {useAccount} from 'wagmi';
import WalletConnection from '../components/wallet-connection';
import Init from '../components/init';

const Home: NextPage = () => {
  const {address} = useAccount();

  return address ? (
    <Init address={address} />
  ) : (
      <WalletConnection />
  );
};

export default Home;
