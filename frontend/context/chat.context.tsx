import {SimpleChat__factory, SimpleChat as ChatContract} from '../types/typechain/';
import {createContext, FC, ReactNode, useContext, useEffect, useState} from 'react';
import {useNetwork, useSigner} from 'wagmi';
import {hardhat} from 'wagmi/chains';

const ChatContext = createContext<{contract: ChatContract | undefined}>({contract: undefined});

const contractAddresses = {
  // [84532]: '0x9F498bB6F6418a09053BA088E588182809705cba',
  [hardhat.id]: '0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82',
};

export const ChatContextWrapper: FC<{children: ReactNode}> = ({children}) => {
  const {data} = useSigner();
  const {chain} = useNetwork();
  const [contract, setContract] = useState<ChatContract>();

  useEffect(() => {
    if (data && data.provider && chain) {
      try {
        const contractAddress = contractAddresses[chain.id];;
        const contract: ChatContract = SimpleChat__factory.connect(contractAddress, data);
        data.provider.getCode(contract.address).then(code => {
          if (code != '0x') {
            setContract(contract);
          } else {
            alert('Contract Not Deployed Could not find any code at ' + contractAddress);
          }
        });
      } catch (e: any) {
        alert('Contract Not Found');
      }
    }

    return () => {
      setContract(undefined);
    };
  }, [data, chain]);

  return <ChatContext.Provider value={{contract}}>{children}</ChatContext.Provider>;
};

export function useChatContext() {
  return useContext(ChatContext);
}
