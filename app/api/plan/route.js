import { Redis } from '@upstash/redis';

export const dynamic = 'force-dynamic';

const KEY_PREFIX = 'shared-weekly-planner:week:';
const WEEK_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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

function keyForWeek(week) {
  return `${KEY_PREFIX}${week}`;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const week = searchParams.get('week');
  if (!week || !WEEK_PATTERN.test(week)) {
    return json({ error: 'A valid week (YYYY-MM-DD) query param is required.' }, 400);
  }

  const redis = getRedis();
  if (!redis) {
    return json({ plan: null, configured: false });
  }

  const plan = await redis.get(keyForWeek(week));
  return json({ plan, configured: true });
}

export async function PUT(request) {
  const redis = getRedis();
  if (!redis) {
    return json({ error: 'Redis is not configured. Add KV_REST_API_URL and KV_REST_API_TOKEN in Vercel.' }, 500);
  }

  const body = await request.json();
  if (!body.week || !WEEK_PATTERN.test(body.week)) {
    return json({ error: 'A valid week (YYYY-MM-DD) is required.' }, 400);
  }
  if (!Array.isArray(body.plan)) {
    return json({ error: 'Invalid plan payload.' }, 400);
  }

  await redis.set(keyForWeek(body.week), body.plan);
  return json({ ok: true });
}

export async function DELETE(request) {
  const redis = getRedis();
  if (!redis) {
    return json({ error: 'Redis is not configured. Add KV_REST_API_URL and KV_REST_API_TOKEN in Vercel.' }, 500);
  }

  const { searchParams } = new URL(request.url);
  const week = searchParams.get('week');
  if (!week || !WEEK_PATTERN.test(week)) {
    return json({ error: 'A valid week (YYYY-MM-DD) query param is required.' }, 400);
  }

  await redis.del(keyForWeek(week));
  return json({ ok: true });
}
