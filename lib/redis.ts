import { Redis } from "@upstash/redis";

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const noopRedis = new Proxy({} as Redis, {
  get(_target, prop) {
    if (prop === "get" || prop === "hgetall") return async () => null;
    if (prop === "del" || prop === "incrby" || prop === "decrby" || prop === "hincrby" || prop === "hsetnx" || prop === "hset" || prop === "lpush") {
      return async () => 0;
    }
    return async () => "OK";
  },
});

export const redis: Redis = url && token ? new Redis({ url, token }) : noopRedis;
