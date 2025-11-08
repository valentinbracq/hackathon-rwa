import 'dotenv/config';
import xrpl from 'xrpl';

const url = process.env.XRPL_WS_URL || process.env.XRPL_RPC_URL || 'wss://s.altnet.rippletest.net:51233';
const timeout = Number(process.env.NETWORK_TIMEOUT_MS ?? 20000);

console.log('connecting to', url, 'timeout', timeout);
const client = new xrpl.Client(url, { timeout });

const t0 = Date.now();
try {
  await client.connect();
  console.log('connected in', Date.now() - t0, 'ms');
  const r = await client.request({ command: 'ping' });
  console.log('ping status:', r.status);
} catch (e) {
  console.error('connect/ping error:', e?.message || e);
} finally {
  try { await client.disconnect(); console.log('disconnected'); } catch {}
}
