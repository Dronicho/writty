import Redis from 'ioredis';
import { InjectionToken } from 'src/utils/injection';

export const Publisher = Symbol('EVENTS_IOREDIS_PUBLISHER');

export const Subscriber = Symbol('EVENTS_IOREDIS_SUBSCRIBER');

export interface ClientRegister {
  // Id of the payload to watch for
  payloadId: string;
}

export const EventRecieveTypes = {
  register: 'REGISTER',
  publish: 'PUBLISH',
};

export const EventSendTypes = {
  register: 'REGISTER',
  publish: 'PUBLISH_RESULT',
};
