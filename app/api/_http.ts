export function toHttpError(e: any) {
  const msg = (e && typeof e === 'object' && 'message' in e) ? (e as any).message : String(e);
  const isInput = /Invalid XRPL address|Amount must be > 0|non-negative integer|mptIssuanceId required|destination required|holder required/i.test(msg || '');
  return { status: isInput ? 400 : 500, body: msg };
}
