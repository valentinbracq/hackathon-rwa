import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { MPTIssuanceId, TxHash } from '@/types/mpt'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- MPT client-side fetch helpers ---


async function api<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(text || `HTTP ${res.status}`);
    // Attach response metadata so callers can branch on status codes
    Object.assign(err, { status: res.status, body: text });
    throw err;
  }
  return res.json() as Promise<T>;
}

export const mptApi = {
  createIssuance: (payload: { assetScale?: number; maximumAmount?: string; transferFee?: number; metadataHex?: string }) =>
    api<{ mptIssuanceId: MPTIssuanceId }>("/api/mpt/create-issuance", payload),
  authorizeHolder: (payload: { mptIssuanceId: MPTIssuanceId; holder: string }) =>
    api<{ optIn: boolean; granted: boolean; skipped?: boolean }>("/api/mpt/authorize-holder", payload),
  prepareOptIn: (payload: { mptIssuanceId: MPTIssuanceId; holder: string }) =>
    api<{ txJSON: any }>("/api/mpt/optin/prepare", payload),
  send: (payload: { mptIssuanceId: MPTIssuanceId; destination: string; units: string }) =>
    api<{ hash: TxHash }>("/api/mpt/send", payload),
  clawback: (payload: { mptIssuanceId: MPTIssuanceId; holder: string; units: string }) =>
    api<{ hash: TxHash }>("/api/mpt/clawback", payload),
  balance: (payload: { mptIssuanceId: MPTIssuanceId; account: string }) =>
    api<{ balance: string }>("/api/mpt/balance", payload),
};
