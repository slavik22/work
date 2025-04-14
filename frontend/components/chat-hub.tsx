import { FC, useState } from 'react';
import { Container, Card, Button, Form, InputGroup } from 'react-bootstrap';
import { SimpleChat } from '../types/typechain';
import { EciesCrypto } from '../crypto/ecies-crypto';
import { AesCrypto } from '../crypto/aes-crypto';
import { WalletCrypto } from '../crypto/wallet-crypto';
import { createRandomSecret } from '../crypto/secret-generator';
import { ethers } from 'ethers';
import ChatWindow from './chat-window';

const ChatHub: FC<{
  myWallet: string;
  chatContract: SimpleChat;
  myCrypto: EciesCrypto;
  pastContacts: string[];
}> = ({ myWallet, chatContract, myCrypto, pastContacts }) => {
  const [contactInput, setContactInput] = useState<string>('');
  const [activeContact, setActiveContact] = useState<string>();
  const [sessionKey, setSessionKey] = useState<AesCrypto>();

  async function selectContact(contact: string) {
    if (!ethers.utils.isAddress(contact)) {
      alert(`${contact} is not a valid address.`);
      return;
    }
    setActiveContact(contact);

    setSessionKey(undefined);
    const hasChat = await chatContract.isActiveChat(myWallet, contact);
    if (hasChat) {
      const lockedSecret = await chatContract.chatLinks(myWallet, contact);
      const secretBytes = Buffer.from(lockedSecret.slice(2), 'hex');
      const unlockedSecret = myCrypto.decryptData(secretBytes);
      console.log(lockedSecret);
      console.log(secretBytes);
      setSessionKey(new AesCrypto(unlockedSecret));
    }
  }

  async function launchChat(contactWallet: string) {
    const newSecret = createRandomSecret();

    try {
      const contactInfo = await chatContract.userAccounts(contactWallet);
      // console.log(Buffer.from(contactInfo.pubKey, "hex"))
      const contactKey = Buffer.from(
        (contactInfo.pubKeyY ? '02' : '03') + contactInfo.pubKey.slice(2), 'hex');

      const secretForContact = EciesCrypto.encryptWithPublicKey(contactKey.toString("hex"), newSecret);
      const secretForMe = myCrypto.encryptData(newSecret);

      const transaction = await chatContract.createChatLink(
        contactWallet,
        secretForMe,
        secretForContact
      );
      alert('Chat launched!');
      setSessionKey(new AesCrypto(newSecret));
    } catch (err) {
      console.error('Chat launch error:', err);
      alert('Failed to launch chat.');
    }
  }

  return (
    <div className="d-flex min-vh-100" style={{ backgroundColor: '#f4f5f7' }}>
      <Card
        className="shadow-sm"
        style={{
          width: '300px',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e0e0e0',
        }}
      >
        <div className="p-3 border-bottom">
          <div className="d-flex align-items-center">
            <div>
              <div className="fw-medium" style={{ fontSize: '0.875rem' }}>
                You
              </div>
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                {myWallet}
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 border-top">
          <InputGroup>
            <Form.Control
              placeholder="Enter contact address"
              value={contactInput}
              onChange={e => setContactInput(e.target.value)}
              size="sm"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={() => selectContact(contactInput.toLowerCase())}
            >
              Add
            </Button>
          </InputGroup>
        </div>
      </Card>

      <div className="flex-grow-1 d-flex flex-column">
        {activeContact ? (
          <>
            <Card
              className="p-3"
              style={{
                backgroundColor: '#ffffff',
                borderBottom: '1px solid #e0e0e0',
              }}
            >
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div className="fw-medium" style={{ fontSize: '1rem' }}>
                    {activeContact === myWallet
                      ? 'Myself'
                      : `${activeContact.slice(0, 6)}...${activeContact.slice(-4)}`}
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {activeContact}
                  </div>
                </div>
                <div className="vr mx-3" />
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => launchChat(activeContact)}
                  disabled={!!sessionKey}
                >
                  {sessionKey ? 'Chat Active' : 'Start Chat'}
                </Button>
              </div>
            </Card>

            <div
              className="flex-grow-1"
              style={{ backgroundColor: '#fafafa', overflow: 'hidden' }}
            >
              {sessionKey ? (
                <ChatWindow
                  sessionCrypto={sessionKey}
                  chatSystem={chatContract}
                  myWallet={myWallet}
                  contactWallet={activeContact}
                />
              ) : (
                <div className="h-100 d-flex align-items-center justify-content-center">
                  <span className="text-muted" style={{ fontSize: '1.25rem' }}>
                    Press "Start Chat" to begin messaging
                  </span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="h-100 d-flex align-items-center justify-content-center">
            <span className="text-muted" style={{ fontSize: '1.25rem' }}>
              Select a contact to start messaging
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHub;