export type PendingSale = {
  issuanceId: string;
  holder: string;
  units: string;        // integer string
  nonce: string;
  // Native XRP amounts (drops and pretty XRP string). Optional for backward compat.
  amount_drops?: string;
  amount_xrp?: string;  // derived display from drops
  paymentTx: string;    // XRPL hash
  status: "received" | "validated" | "granted" | "mpt_sent" | "failed";
  createdAt: string;
  updatedAt: string;
};

class SalesStore {
  pendingSales = new Map<string, PendingSale>(); // key = paymentTx
  usedNonces = new Set<string>();
  whitelist = new Set<string>(); // classic addresses allowed

  addPending(ps: PendingSale) {
    this.pendingSales.set(ps.paymentTx, ps);
    this.usedNonces.add(ps.nonce);
    return ps;
  }

  getSize() { return this.pendingSales.size; }
}

// Normalize singleton location to globalThis.salesStore
// Support migration from older __salesStore__ if present
if ((globalThis as any).__salesStore__ && !(globalThis as any).salesStore) {
  (globalThis as any).salesStore = (globalThis as any).__salesStore__;
}
(globalThis as any).salesStore ??= new SalesStore();
export const salesStore = (globalThis as any).salesStore as SalesStore;
console.log("[pending-sales] initialized", { pid: process.pid });

export function isWhitelisted(addr: string) {
  return salesStore.whitelist.has(addr);
}
export function whitelistAdd(addr: string) {
  salesStore.whitelist.add(addr);
}
export function nonceSeen(nonce: string) {
  return salesStore.usedNonces.has(nonce);
}
