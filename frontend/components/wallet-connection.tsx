import { Container, Card, Stack, Image, Button, Badge } from 'react-bootstrap';
import type { FC } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

const CryptoChatEntry: FC = () => {
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const handleAuth = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect({ connector: connectors[0] });
    }
  };

  return (
    <Container
      fluid
      className="min-vh-100 d-flex align-items-center justify-content-center p-4"
      style={{
        background: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)',
      }}
    >
      <Card
        className="shadow w-100"
        style={{
          maxWidth: '500px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
        }}
      >
        <Card.Body className="p-4">
          <Stack gap={4} className="text-center">
            {/* Header */}
            <h2 className="text-primary mb-0">Welcome to CryptoChat</h2>

            <Image
              src="/brands/metamask.svg"
              alt="MetaMask Logo"
              width={80}
              height={80}
              className="mx-auto shadow-sm"
            />

            <p className="text-muted mb-0" style={{ lineHeight: '1.6' }}>
              CryptoChat is a secure, decentralized messaging app powered by blockchain technology. Connect your wallet to
              send encrypted messages directly on-chain, ensuring privacy and authenticity. No servers, no middlemen—just
              you and your contacts.
            </p>

            <Button
              onClick={handleAuth}
              size="lg"
              variant={isConnected ? 'danger' : 'primary'}
              className="w-75 mx-auto"
              style={{ borderRadius: '8px', transition: 'all 0.3s ease' }}
            >
              Connect with MetaMask
            </Button>

            <div className="d-flex justify-content-center gap-2 mt-2">
              <Badge bg="teal" className="bg-teal text-white">
                End-to-End Encryption
              </Badge>
              <Badge bg="cyan" className="bg-cyan text-white">
                Blockchain-Based
              </Badge>
            </div>
          </Stack>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CryptoChatEntry;