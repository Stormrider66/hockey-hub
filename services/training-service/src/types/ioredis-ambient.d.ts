declare module 'ioredis' {
  export class Redis {
    constructor(...args: any[]);
    on(event: string, listener: (...args: any[]) => void): this;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ...args: any[]): Promise<'OK' | null>;
    del(...keys: string[]): Promise<number>;
    keys(pattern: string): Promise<string[]>;
    expire(key: string, seconds: number): Promise<number>;
    ttl(key: string): Promise<number>;
    lrange(key: string, start: number, stop: number): Promise<string[]>;
    lpush(key: string, ...values: string[]): Promise<number>;
    rpush(key: string, ...values: string[]): Promise<number>;
    publish(channel: string, message: string): Promise<number>;
    subscribe(channel: string): Promise<number>;
    quit(): Promise<'OK' | null>;
  }
  export default Redis;
}






