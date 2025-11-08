import core from "@/lib/xrpl-logic";
import { safeLog } from "@/lib/log";

type Body = {
  txid: string;
  account: string;
  issuanceId: string;
};

export async function POST(req: Request) {
  try {
    const { txid, account, issuanceId }: Body = await req.json();
    if (!txid || !account || !issuanceId) {
      return Response.json({ ok: false, error: "txid, account & issuanceId required" }, { status: 200 });
    }

    // Enforce Devnet explicitly at the route level (in addition to library guard)
    const net = process.env.XRPL_NETWORK || "devnet";
    if (net !== "devnet") {
      return Response.json({ ok: false, error: `XRPL_NETWORK must be 'devnet' (found: ${net})` }, { status: 200 });
    }

    core.assertAddress(account);
    core.assertUuidish(issuanceId);

  const r = await core.verifySignedOptInOnDevnet({ txid, expectedAccount: account, expectedIssuanceId: issuanceId });
  safeLog({ event: "optin_verify", txid, ok: r.ok === true });
    return Response.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || "verification_failed" }, { status: 200 });
  }
}
