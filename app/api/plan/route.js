import { Redis } from '@upstash/redis';

export const dynamic = 'force-dynamic';

const PLAN_KEY = 'shared-weekly-planner:june23';

function getRedis() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store' }
  });
}

export async function GET() {
  const redis = getRedis();
  if (!redis) {
    return json({ plan: null, configured: false });
  }

  const plan = await redis.get(PLAN_KEY);
  return json({ plan, configured: true });
}

export async function PUT(request) {
  const redis = getRedis();
  if (!redis) {
    return json({ error: 'Redis is not configured. Add KV_REST_API_URL and KV_REST_API_TOKEN in Vercel.' }, 500);
  }

  const body = await request.json();
  if (!Array.isArray(body.plan)) {
    return json({ error: 'Invalid plan payload.' }, 400);
  }

  await redis.set(PLAN_KEY, body.plan);
  return json({ ok: true });
}

export async function DELETE() {
  const redis = getRedis();
  if (!redis) {
    return json({ error: 'Redis is not configured. Add KV_REST_API_URL and KV_REST_API_TOKEN in Vercel.' }, 500);
  }

  await redis.del(PLAN_KEY);
  return json({ ok: true });
}
