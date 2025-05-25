import { connect, NatsConnection, StringCodec } from 'nats';
let nc: NatsConnection | null = null;
const sc = StringCodec();
export const getBus = async (): Promise<NatsConnection> => {
  if (nc) return nc;
  nc = await connect({ servers: process.env.NATS_URL || 'nats://localhost:4222', name: 'payment-service' });
  console.log('[Payment EventBus] connected');
  return nc;
};
export const subscribe = async (subject: string, handler: (d:any)=>void) => {
  const bus = await getBus();
  const sub = bus.subscribe(subject);
  (async () => {
    for await (const m of sub) {
      handler(JSON.parse(sc.decode(m.data)));
    }
  })();
};
export const busPublish = async (topic: string, payload: any) => {
  const bus = await getBus();
  bus.publish(topic, sc.encode(JSON.stringify(payload)));
}; 