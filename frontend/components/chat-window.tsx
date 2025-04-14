import { FC, useCallback, useEffect, useState } from 'react';
import { Card, Button, Form, Spinner, Badge } from 'react-bootstrap';
import { BigNumber } from 'ethers';
import { EciesCrypto } from '../crypto/ecies-crypto';
import { AesCrypto } from '../crypto/aes-crypto';
import { WalletCrypto } from '../crypto/wallet-crypto';
import { createRandomSecret } from '../crypto/secret-generator';
import { SimpleChat } from '../types/typechain';
import { MessageSentListener, MessageType } from '../types/message';

const ChatWindow: FC<{
  myWallet: string;
  contactWallet: string;
  chatSystem: SimpleChat;
  sessionCrypto: AesCrypto;
}> = ({ myWallet, contactWallet, chatSystem, sessionCrypto }) => {
  const [chatHistory, setChatHistory] = useState<MessageType[]>([]);
  const [newText, setNewText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const fetchChat: () => void = useCallback(async () => {
    const [sentByMe, sentToMe] = await Promise.all([
      chatSystem.queryFilter(chatSystem.filters.MessageTransmitted(myWallet, contactWallet)),
      chatSystem.queryFilter(chatSystem.filters.MessageTransmitted(contactWallet, myWallet)),
    ]);
    const rawEntries = (myWallet === contactWallet ? sentByMe : sentByMe.concat(sentToMe)).map(
      entry => entry.args
    );
    const sortedChat: MessageType[] = rawEntries
      .sort((a, b) => (a.timestamp.lt(b.timestamp) ? -1 : 1))
      .map(entry => ({
        own: entry.sender.toLowerCase() === myWallet.toLowerCase(),
        message: sessionCrypto.decryptPayload(Buffer.from(entry.encryptedData, 'hex')).toString(),
        time: entry.timestamp.toNumber(),
      }));
    setChatHistory(sortedChat);
  }, [sessionCrypto, chatSystem, myWallet, contactWallet]);

  const appendChat: MessageSentListener = useCallback(
    (sender: string, recipient: string, content: string, moment: BigNumber) => {
      setChatHistory(history => [
        ...history,
        {
          own: sender.toLowerCase() === myWallet.toLowerCase(),
          message: sessionCrypto.decryptPayload(Buffer.from(content, 'hex')).toString(),
          time: moment.toNumber(),
        },
      ]);
    },
    [sessionCrypto, myWallet]
  );

  useEffect(() => {
    fetchChat();

    if (contactWallet.toLowerCase() !== myWallet.toLowerCase()) {
      chatSystem.on(
        chatSystem.filters.MessageTransmitted(myWallet, contactWallet, null, null),
        appendChat
      );
    }
    chatSystem.on(
      chatSystem.filters.MessageTransmitted(contactWallet, myWallet, null, null),
      appendChat
    );

    return () => {
      chatSystem.removeAllListeners();
    };
  }, [chatSystem, fetchChat, myWallet, contactWallet, appendChat]);

  async function dispatchText() {
    if (newText === '') return;
    setIsSending(true);
    try {
      const action = await chatSystem.sendChatMessage(
        contactWallet,
        sessionCrypto.encryptPayload(Buffer.from(newText)).toString('hex'),
        BigNumber.from(Date.now())
      );
      await action.wait();
      setNewText('');
    } catch (err) {
      console.log(err);
      alert('Failed to dispatch message.');
    }
    setIsSending(false);
  }

  return (
    <div
      className="d-flex flex-column h-100"
      style={{ backgroundColor: '#f9f9f9' }}
    >
      {/* Chat Header */}
      <Card
        className="p-2"
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #ddd',
          position: 'sticky',
          top: 0,
          zIndex: 1,
        }}
      >
        <div className="d-flex align-items-center gap-2">
          <div className="fw-bold" style={{ fontSize: '1rem' }}>
            {contactWallet === myWallet
              ? 'Self Chat'
              : `${contactWallet.slice(0, 6)}...${contactWallet.slice(-4)}`}
          </div>
          <Badge bg="success" className="fs-6">
            Active
          </Badge>
        </div>
      </Card>

      <div
        className="flex-grow-1 p-3 overflow-auto d-flex flex-column gap-3"
      >
        {chatHistory.length > 0 ? (
          chatHistory.map((entry, idx) => (
            <div
              key={idx}
              className={`d-flex ${entry.own ? 'justify-content-end' : 'justify-content-start'}`}
              style={{ maxWidth: '70%' }}
            >
              <Card
                className="p-2"
                style={{
                  backgroundColor: entry.own ? '#007bff' : '#e9ecef',
                  color: entry.own ? '#ffffff' : '#000000',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                <div style={{ fontSize: '0.875rem' }}>{entry.message}</div>
                <div
                  className={entry.own ? 'text-white' : 'text-dark'}
                  style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '4px' }}
                >
                  {new Date(entry.time).toLocaleTimeString('ua')}
                </div>
              </Card>
            </div>
          ))
        ) : (
          <div className="h-100 d-flex align-items-center justify-content-center">
            <span className="text-muted" style={{ fontSize: '1rem' }}>
              No messages yet. Start the conversation!
            </span>
          </div>
        )}
      </div>

      <Card
        className="p-2"
        style={{
          backgroundColor: '#ffffff',
          borderTop: '1px solid #ddd',
          position: 'sticky',
          bottom: 0,
        }}
      >
        <div className="d-flex align-items-center gap-2">
          <Button variant="secondary" onClick={fetchChat}>
            Refresh
          </Button>
          <Form.Control
            placeholder="Write your message..."
            value={newText}
            onChange={e => setNewText(e.target.value)}
            disabled={isSending}
            className="flex-grow-1"
          />
          {isSending ? (
            <Spinner animation="border" size="sm" variant="primary" />
          ) : (
            <Button variant="primary" onClick={dispatchText}>
              Send
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ChatWindow;