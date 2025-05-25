import { connect, NatsConnection, StringCodec } from 'nats';

let nc: NatsConnection | null = null;
const sc = StringCodec();

export const getBus = async (): Promise<NatsConnection> => {
  if (nc) return nc;
  const url = process.env.NATS_URL || 'nats://localhost:4222';
  nc = await connect({ servers: url, name: 'user-service' });
  console.log('[User EventBus] connected to', url);
  return nc;
};

export const subscribe = async (subject: string, handler: (data: any) => void) => {
  const bus = await getBus();
  const sub = bus.subscribe(subject);
  (async () => {
    for await (const msg of sub) {
      try {
        const json = JSON.parse(sc.decode(msg.data));
        handler(json);
      } catch (err) {
        console.error('[User EventBus] parse error', err);
      }
    }
  })();
};

export const busPublish = async (topic: string, payload: any) => {
  const bus = await getBus();
  bus.publish(topic, sc.encode(JSON.stringify(payload)));
}; 