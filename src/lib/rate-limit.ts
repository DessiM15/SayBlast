import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const limiters = {
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "15 s"),
    prefix: "rl:auth",
  }),
  voice: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "60 s"),
    prefix: "rl:voice",
  }),
  send: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "60 s"),
    prefix: "rl:send",
  }),
  upload: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "60 s"),
    prefix: "rl:upload",
  }),
};

export async function rateLimit(
  key: string,
  _limit?: number,
  _windowMs?: number,
): Promise<{ success: boolean; remaining: number }> {
  const prefix = key.split(":")[0] as keyof typeof limiters;
  const limiter = limiters[prefix] ?? limiters.auth;

  const result = await limiter.limit(key);
  return { success: result.success, remaining: result.remaining };
}
