# Hackathon RWA

## XUMM (Xaman) API Keys

To enable XUMM signing in this project, you need API credentials from Xaman:

1. Go to https://apps.xumm.dev and sign in.
2. Create a new app to obtain an API Key and API Secret.
3. Add the following to your local `.env` (do not commit this file) or to your deployment secrets:

```
XUMM_API_KEY=your_xumm_api_key
XUMM_API_SECRET=your_xumm_api_secret
```

The server-side helper lives at `lib/xumm.ts` and exposes:
- `createSignRequest(txjson, { expiresIn? })` – creates a signing payload and returns QR/WebSocket references.
- `getPayloadStatus(uuid)` – returns minimal status: `{ uuid, resolved, signed, txid, account, dispatched_result? }`.

These functions throw on missing env or API errors and use native `fetch`. Only import them in server code (e.g., Route Handlers) to avoid leaking secrets.
