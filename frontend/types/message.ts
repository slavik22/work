import {TypedListener} from './typechain/common';
import {MessageTransmittedEvent} from './typechain/contracts/SimpleChat';

export type MessageSentListener = TypedListener<MessageTransmittedEvent>;

export type MessageType = {
  own: boolean; 
  message: string; 
  time: number; 
};
