import { getPayloadStatus } from "@/lib/xumm";

const UUID36 = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ uuid: string }> }
) {
  // Hoist uuid for catch diagnostics without re-awaiting params twice.
  let uuid: string | undefined;
  try {
    ({ uuid } = await ctx.params); // params is a Promise in Next 14
    if (!uuid || !UUID36.test(uuid)) {
      return Response.json({ error: "invalid_uuid" }, { status: 400 });
    }

    const st = await getPayloadStatus(uuid);
    const payload = {
      uuid: st.uuid,
      resolved: !!st.resolved,
      signed: !!st.signed,
      txid: st.txid ?? null,
      account: st.account ?? null,
      dispatched_result: st.dispatched_result ?? null,
    };
    console.info(
      JSON.stringify({
        event: "optin_status",
        uuid,
        resolved: payload.resolved,
        signed: payload.signed,
      })
    );
    // Always return 200 even if not resolved to allow polling logic upstream.
    return Response.json(payload, { status: 200 });
  } catch (e: any) {
    const code = e?.status ?? 500;
    console.warn(
      JSON.stringify({
        event: "optin_status_error",
        uuid,
        code,
        reason: e?.message || "unknown",
      })
    );
    if (code === 404 || code === 410) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }
    if (code === 429) {
      return Response.json({ error: "rate_limited" }, { status: 429 });
    }
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}
