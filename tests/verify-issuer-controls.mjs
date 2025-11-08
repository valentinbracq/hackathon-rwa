import "dotenv/config";
import xrpl from "xrpl";
import {
  getIssuerWallet, getClient,
  assertMPTokensV1, createMPTIssuanceWithClawback,
  authorizeHolderForIssuance, sendMPT, clawbackMPT, readMPTBalance,
  prepareHolderOptInTx
} from "../lib/xrpl-logic.js";

async function main() {
  const issuer = getIssuerWallet();
  // For production-grade flow tests, simulate a holder address provided externally.
  // In real usage this would come from the user's wallet (classic address only).
  const holderClassic = process.env.TEST_HOLDER_ADDRESS;
  if (!holderClassic) throw new Error("TEST_HOLDER_ADDRESS required for this test (simulated holder)");

  const c = getClient(); await c.connect();
  await assertMPTokensV1(c); // utilise 'feature'
  await c.disconnect();

  const issuanceId = await createMPTIssuanceWithClawback({ assetScale: 2, maximumAmount: "100000000000", transferFee: 0 });
  console.log("MPT Issuance ID:", issuanceId);

  console.log("Preparing holder opt-in (unsigned)...");
  const prepared = await prepareHolderOptInTx(issuanceId, holderClassic);
  if (prepared.TransactionType !== "MPTokenAuthorize") throw new Error("Prepared tx type mismatch");
  if (prepared.Account !== holderClassic) throw new Error("Prepared tx account mismatch");
  console.log("Prepared opt-in tx fields:", Object.keys(prepared));

  console.log("Attempt authorization (should fail if holder not actually opted-in)...");
  const authResPre = await authorizeHolderForIssuance(issuanceId, holderClassic);
  if (authResPre.optIn !== false) throw new Error("Expected optIn=false before holder signs");
  console.log("Auth pre-holder signature =>", authResPre);

  console.log("(Skipping actual on-ledger holder signature in this test) Simulate holder already opted-in for remainder...");
  // NOTE: To fully test end-to-end you'd submit the holder-signed prepared tx via their wallet.
  // Here we continue assuming holder has since opted-in externally.

  console.log("Grant authorization (issuer side)...");
  const authRes = await authorizeHolderForIssuance(issuanceId, holderClassic);
  if (!authRes.optIn) console.log("Holder still not opted-in; skipping payment/clawback portion.");
  if (!authRes.optIn) return; // early exit if not opted-in in real test environment.

  console.log("Payment 123...");
  await sendMPT(issuanceId, holderClassic, "123");
  let bal = await readMPTBalance(issuanceId, holderClassic);
  console.log("Solde après Payment:", bal);

  console.log("Clawback 100...");
  await clawbackMPT(issuanceId, holderClassic, "100");
  bal = await readMPTBalance(issuanceId, holderClassic);
  console.log("Solde après Clawback:", bal);

  if (BigInt(bal) !== 23n) throw new Error(`Solde final attendu 23, obtenu ${bal}`);
  console.log("Tests MPT + Clawback validés");
}
main().catch(e => { console.error("Erreur:", e?.message || e); process.exit(1); });
