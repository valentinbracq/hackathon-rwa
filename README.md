# Hackathon RWA – Devnet MPT Demo

Concise overview of a Next.js (App Router) application showcasing XRPL MP Tokens (MPTokensV1) on Devnet. It lets an issuer:

* Create (or reuse) an MPToken issuance with authorization + clawback flags.
* Allow holders to opt-in (MPTokenAuthorize) via a XUMM (Xaman) QR signing flow – no holder secrets server-side.
* Authorize holders after opt-in (issuer-signed grant).
* Send and claw back MPToken units.
* Inspect balances and verify signed opt-in transactions.
* Parse simple payment memos ("PAY-CROWN|<issuanceId>|<nonce>|<units>") and assert pricing in whole XRP units.

The code hard‑enforces `XRPL_NETWORK=devnet` to avoid accidental use of main/test networks.

## Stack
* Next.js 16 (App Router) + React 19
* TailwindCSS + Radix UI components
* XRPL JS SDK (`xrpl`)
* XUMM platform API (server-side only)
* TypeScript + ESLint

## Key Directories
* `app/` – Pages & API route handlers (`/api/mpt/*`) for issuance, opt-in QR, authorization, balances, send, clawback.
* `lib/xrpl-logic.js` – Core XRPL + MPT helpers (create issuance, authorize, send, clawback, balance, scaling).
* `lib/xumm.ts` – Minimal XUMM payload create/status helpers (QR + polling).
* `components/ui/` – Reusable UI primitives.
* `docs/qr-optin-demo.md` – Extended walkthrough of the opt‑in flow.

## Environment Variables (`.env`)
Copy `.env.example` to `.env` and fill:
```
XRPL_WS_URL=wss://clio.devnet.rippletest.net:51233
XRPL_NETWORK=devnet
ISSUER_SEED=YOUR_ISSUER_SEED
ISSUER_ADDRESS=rsameasderivedoptional
NETWORK_TIMEOUT_MS=20000
XUMM_API_KEY=your_xumm_api_key
XUMM_API_SECRET=your_xumm_api_secret
```
Notes:
* `ISSUER_ADDRESS` can be omitted; derived from `ISSUER_SEED` if not set.
* Never commit real seeds or XUMM secrets.
* App will refuse to start if `XRPL_NETWORK` != `devnet`.

## Install & Run
Requires Node 20+ (recommended) and pnpm.

```bash
pnpm install --legacy-peer-deps    # install deps
pnpm install xrpl@latest --legacy-peer-deps #install xrpl dep
pnpm dev        # start Next.js dev server (http://localhost:3000)
```

Build & production start:
```bash
pnpm build
pnpm start
```

Optional lint:
```bash
pnpm lint
```

## Core Flows (High-Level)
1. Issuance: Server creates (or reuses) an issuance with required flags.
2. Holder Opt-In: Frontend requests `/api/mpt/authorize/qr` to produce a XUMM QR; holder signs MPTokenAuthorize.
3. Poll Status: Frontend polls `/api/mpt/authorize/status/:uuid` until `signed=true` & `txid` present.
4. Verify: `/api/mpt/authorize/verify` can assert the ledger transaction matches expected account + issuance id.
5. Grant: Issuer authorizes holder (unless already authorized).
6. Send / Clawback: Payments (`Payment` with MPT Amount) or `Clawback` submitted by issuer.

## Pricing & MPT Scaling
`MPT_ASSET_SCALE` (default 2) defines decimal scaling: human "1" -> ledger "100". Helpers: `toMptLedgerValue`, `fromMptLedgerValue` in `lib/xrpl-logic.js`.

## Security & Safety
* Seeds & API keys only loaded server-side; UI never exposes them.
* Logging uses `safeLog` to avoid leaking sensitive data.
* Network restricted to Devnet. Feature flag check `assertMPTokensV1` ensures protocol support.

## XUMM Helpers
`lib/xumm.ts` exports:
* `createSignRequest(txjson, { expiresIn? })` → QR + uuid + redirect link.
* `getPayloadStatus(uuid)` → `{ uuid, resolved, signed, txid?, account? }`.
Use only in route handlers / server code.

## Troubleshooting Quick Tips
| Symptom | Hint |
|---------|------|
| `XRPL_NETWORK must be 'devnet'` | Set `XRPL_NETWORK=devnet` in `.env` |
| Issuance creation fails | Ensure MPTokensV1 is active (Devnet normally enabled) |
| `tecNO_AUTH` on Payment | Holder not opt‑in or not authorized yet |
| XUMM status stuck unsigned | Holder hasn’t scanned or declined; regenerate QR |
| `xumm_not_found` | Expired or wrong payload uuid |

## License
Hackathon / demo use. Add a formal license if this evolves beyond prototype.

