import { FC, useEffect, useState } from 'react';
import { Card, Button, ProgressBar, Spinner, Container } from 'react-bootstrap';
import { useChatContext } from '../context/chat.context';
import { EciesCrypto } from '../crypto/ecies-crypto';
import { WalletCrypto } from '../crypto/wallet-crypto';
import { createRandomSecret } from '../crypto/secret-generator';
import ChatHub from './chat-hub';

enum SetupPhase {
  VALIDATING = 0,
  SETUP = 1,
  LOADING_CHATS = 2,
  READY = 3,
}

const Init: FC<{ address: string }> = ({ address }) => {
  const { contract } = useChatContext();
  const [phase, setPhase] = useState<SetupPhase>(SetupPhase.VALIDATING);
  const [isRegistered, setIsRegistered] = useState<boolean | undefined>(undefined);
  const [encryptionScheme, setEncryptionScheme] = useState<EciesCrypto | undefined>(undefined);
  const [chatPartners, setChatPartners] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    if (isOnboarded) return;
    console.log('Resetting state for address:', address);
    setPhase(SetupPhase.VALIDATING);
    setIsRegistered(undefined);
    setEncryptionScheme(undefined);
    setChatPartners([]);
    setIsProcessing(true);
  }, [address, isOnboarded]);

  useEffect(() => {
    if (!contract || isOnboarded) return;

    async function validateUser() {
      console.log('Validating user for address:', address);
      await new Promise(resolve => setTimeout(resolve, 1000));
      try {
        const exists = await contract.isUserExist(address);
        setIsRegistered(exists);
        setPhase(SetupPhase.SETUP);

        if (exists) {
          const accountData = await contract.userAccounts(address);
          const encryptedKey = Buffer.from(accountData.encryptedPrivateKey.slice(2), 'hex');
          setIsProcessing(true);
          const decryptedKey = await new WalletCrypto(address, window.ethereum).decryptData(encryptedKey);
          setEncryptionScheme(new EciesCrypto(decryptedKey));
          setPhase(SetupPhase.LOADING_CHATS);
        }
      } catch (error) {
        alert('Failed to validate user');
      } finally {
        setIsProcessing(false);
      }
    }

    validateUser();
  }, [contract, address, isOnboarded]);

  const startSetup = async () => {
    if (!contract) return;

    setIsProcessing(true);
    const newKey = createRandomSecret();
    const ecies = new EciesCrypto(newKey);
    const pubKey = Buffer.from(ecies.getPublicKeyHex(), 'hex'); 

    try {
      const encryptedKey = await new WalletCrypto(address, window.ethereum).encryptData(newKey);
      const tx = await contract.joinChat(
        encryptedKey.toJSON().data,
        pubKey.slice(1).toJSON().data,
        pubKey[0] == 2,
      );
      alert('Setup complete!');
      setEncryptionScheme(new EciesCrypto(newKey));
      setPhase(SetupPhase.LOADING_CHATS);
    } catch (error) {
      console.error('Setup error:', error);
      alert('Setup failed');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (phase !== SetupPhase.LOADING_CHATS || !contract || isOnboarded) return;

    async function fetchChatPartners() {
      console.log('Fetching chat partners for:', address);
      setIsProcessing(true);
      try {
        const latestBlock = await contract.provider.getBlockNumber();
        const chunkSize = 2000;
        const startBlock = 24293581;
        const logs: any[] = [];

        for (let block = startBlock; block <= latestBlock; block += chunkSize) {
          const end = Math.min(block + chunkSize - 1, latestBlock);
          const [initiated, received] = await Promise.all([
            contract.queryFilter(contract.filters.ChatLinkCreated(address, null), block, end),
            contract.queryFilter(contract.filters.ChatLinkCreated(null, address), block, end),
          ]);
          logs.push(...initiated, ...received);
        }

        const partners = [
          ...new Set(
            logs
              .map(log =>
                log.args.initializer.toLowerCase() === address.toLowerCase()
                  ? log.args.peer.toLowerCase()
                  : log.args.initializer.toLowerCase()
              )
              .filter(peer => peer !== address.toLowerCase())
          ),
        ];
        setChatPartners(partners);
        setPhase(SetupPhase.READY);
        setIsOnboarded(true);
      } catch (error) {
        alert('Failed to load chat history');
        setPhase(SetupPhase.SETUP);
      } finally {
        setIsProcessing(false);
      }
    }

    fetchChatPartners();
  }, [phase, contract, address, isOnboarded]);

  const progress = {
    [SetupPhase.VALIDATING]: 25,
    [SetupPhase.SETUP]: 50,
    [SetupPhase.LOADING_CHATS]: 75,
    [SetupPhase.READY]: 100,
  }[phase];

  const LoadingOverlay = () => (
    <div
      className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ backgroundColor: 'rgba(128, 128, 128, 0.5)', borderRadius: '16px' }}
    >
      <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
    </div>
  );

  const OnboardingCard = () => (
    <Card
      className="shadow w-100 p-4"
      style={{ maxWidth: '400px', borderRadius: '16px', position: 'relative' }}
    >
      <div className="d-flex flex-column align-items-center gap-4">
        <h4 className="text-center mb-0">Welcome to Secure Chat</h4>
        <ProgressBar
          now={progress}
          className="w-75 rounded"
          variant={phase === SetupPhase.READY ? 'success' : 'primary'}
          style={{ height: '20px' }}
        />
        <p className="text-muted text-center mb-0" style={{ fontSize: '0.875rem' }}>
          {phase === SetupPhase.VALIDATING && 'Verifying your account...'}
          {phase === SetupPhase.SETUP &&
            (isRegistered ? 'Welcome back' : 'New here? Let’s get you started!')}
          {phase === SetupPhase.LOADING_CHATS && 'Fetching your chat history...'}
        </p>
        {phase === SetupPhase.SETUP && isRegistered === false && (
          <Button
            variant="primary"
            size="lg"
            className="rounded"
            onClick={startSetup}
            disabled={isProcessing}
            style={{ background: 'linear-gradient(to right, #4b0082, #00b7eb)', border: 'none' }}
          >
            Start Chatting
          </Button>
        )}
      </div>
      {isProcessing && <LoadingOverlay />}
    </Card>
  );

  console.log('Current phase:', phase, 'Is onboarded:', isOnboarded);

  return (
    <Container
      fluid
      className="min-vh-100 d-flex align-items-center justify-content-center"
    >
      {isOnboarded ? (
        <ChatHub
          myWallet={address}
          chatContract={contract!}
          myCrypto={encryptionScheme!}
          pastContacts={chatPartners}
        />
      ) : (
        <OnboardingCard />
      )}
    </Container>
  );
};

export default Init;