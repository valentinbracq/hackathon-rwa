# MPToken Holder Opt-In QR Demo (Devnet)

This short guide shows how to:
1. Generate a QR code for a holder to authorize (opt-in) an MPT issuance via Xaman (XUMM) on Devnet.
2. Poll the payload status.
3. Optionally verify the resulting on-ledger transaction.

> All endpoints assume local dev at `http://localhost:3000` and `XRPL_NETWORK=devnet`.
> Never expose seeds or API secrets in curl commands.

---
## 1. Create QR Payload
Send a POST with the holder's XRPL address (classic) and the MPT issuance id.

```bash
curl -sX POST http://localhost:3000/api/mpt/authorize/qr \
  -H 'content-type: application/json' \
  -d '{ "holderAddress":"rXXXX...", "issuanceId":"xxxxxxxx-...." }' | jq
```
Response fields of interest:
- `uuid`: Unique XUMM payload identifier (use for polling)
- `qr_png` / `qr_svg`: Embeddable QR image sources
- `websocket_status`: XUMM status stream endpoint
- `txjson`: The unsigned transaction (do not modify)

Open the QR in a browser or embed in UI. Holder scans & signs in Xaman (Devnet profile).

---
## 2. Poll Payload Status
Use the `uuid` from step 1:

```bash
curl -s http://localhost:3000/api/mpt/authorize/status/<uuid> | jq
```
Important response fields:
- `resolved`: Payload resolved (signed or declined)
- `signed`: Holder actually signed
- `txid`: On-ledger transaction hash (present once dispatched & validated)
- `account`: Holder account that signed

Poll until `signed=true` and `txid` is present. (You can also use the websocket for real-time updates.)

---
## 3. Optional Verify On-Ledger Transaction
Once you have `txid`, you can assert it matches expectations (`MPTokenAuthorize` type, account & issuance id) via server helper:

```bash
curl -sX POST http://localhost:3000/api/mpt/authorize/verify \
  -H 'content-type: application/json' \
  -d '{ "txid":"<hash>", "account":"rXXXX...", "issuanceId":"...." }' | jq
```
Response:
- `{ "ok": true }` if verification passed.
- Error JSON otherwise.

---
## Devnet Checklist
Before proceeding to grant access or send tokens, confirm:
- [ ] `XRPL_NETWORK=devnet` enforced (server throws otherwise)
- [ ] QR payload created (`uuid` received)
- [ ] Holder scanned QR in Xaman (Devnet) and signed
- [ ] Status shows `resolved=true` & `signed=true`
- [ ] `txid` present and visible on Devnet explorer (e.g., https://devnet.xrpl.org/tx/<txid>)
- [ ] Optional verify endpoint returns `{ ok: true }`

If any box is unchecked, remediate before continuing (e.g., reissue QR, ensure holder uses Devnet profile).

---
## Troubleshooting
| Symptom | Possible Cause | Action |
|---------|----------------|-------|
| `signed=false` after long wait | Holder declined or hasn\'t approved | Regenerate QR / ask holder to sign |
| `txid` missing but `signed=true` | Dispatch pending | Poll again; usually resolves quickly |
| Verify endpoint mismatch error | Wrong account or issuance id | Re-check issuance id and holder address |
| Network error contacting endpoints | Dev server not running | Start Next.js dev server (`pnpm dev`) |

---
## Security Notes
- Never log seeds or API secrets. The logging system redacts potential seeds.
- Only run with Devnet credentials; production networks are explicitly blocked by startup checks.

---
## Next Steps
After successful opt-in verification, the issuer can proceed to authorize/grant if needed or process incoming payment memos to settle sales.

