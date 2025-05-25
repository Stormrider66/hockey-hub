import { connect, NatsConnection, StringCodec } from 'nats';

let nc: NatsConnection | null = null;
const sc = StringCodec();

export const getBus = async (): Promise<NatsConnection> => {
  if (nc) return nc;
  const url = process.env.NATS_URL || 'nats://localhost:4222';
  nc = await connect({ servers: url, name: 'admin-service' });
  console.log('[EventBus] connected to', url);
  return nc;
};

export const busPublish = async (topic: string, payload: any) => {
  const bus = await getBus();
  bus.publish(topic, sc.encode(JSON.stringify(payload)));
}; 