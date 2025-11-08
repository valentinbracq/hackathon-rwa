import 'dotenv/config';
import xrpl from 'xrpl';
import { getIssuerWallet, getClient, submitAndWait, toCurrency, getIssuerAddress } from '../lib/xrpl-logic.js';

const DEADLINE_MS = Number(process.env.NETWORK_TIMEOUT_MS ?? 20000) + 5000;
const deadline = Date.now() + DEADLINE_MS;
const checkDeadline = (label) => {
  if (Date.now() > deadline) throw new Error(`timeout global atteint pendant: ${label}`);
};

function log(...a){ console.log('[verify]', ...a); }

async function main() {
  log('start');
  checkDeadline('start');

  const wallet = getIssuerWallet();
  log('wallet', wallet.classicAddress);

  const client = getClient();
  log('connecting...');
  await client.connect();
  log('connected');
  checkDeadline('after connect');

  const pingResp = await client.request({ command: 'ping' });
  log('ping', pingResp.status);

  const domainHex = xrpl.convertStringToHex('example.com');
  const tx = { TransactionType: 'AccountSet', Account: wallet.classicAddress, Domain: domainHex };

  log('submitAndWait...');
  const resp = await submitAndWait(client, tx, wallet);
  log('tx result', resp?.result?.meta?.TransactionResult);

  // utils
  log('toCurrency USD ->', toCurrency('USD'));
  log('issuer addr ->', getIssuerAddress());

  await client.disconnect();
  log('done');
}

main().catch(async (e) => {
  console.error('[verify] ERROR:', e?.stack || e);
  process.exit(1);
});
