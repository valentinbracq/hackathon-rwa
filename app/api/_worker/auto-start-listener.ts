// Server-side auto boot for XRPL payments listener
// This module is safe to import for its side-effects in Node.js route handlers.

import { startPaymentsListener } from "@/app/api/_worker/payments-listener";

// Detect Edge runtime (Vercel/Next edge) vs Node.js
const isEdge = typeof (globalThis as any).EdgeRuntime !== "undefined";
const isBrowser = typeof window !== "undefined";

// Use a separate global guard for autostart trigger messages to avoid log noise in dev
// while startPaymentsListener itself has its own idempotent guard.
// eslint-disable-next-line no-var
declare global { var __paymentsListenerAutostarted: boolean | undefined }

async function maybeStart() {
  try {
    if (isBrowser || isEdge) return; // never run in browsers or edge
    if (globalThis.__paymentsListenerAutostarted) return;
    globalThis.__paymentsListenerAutostarted = true;

    const nodeEnv = process.env.NODE_ENV || "development";
    const network = process.env.XRPL_NETWORK || "devnet";
    console.info(
      JSON.stringify({
        event: "listener_autostart_triggered",
        nodeEnv,
        xrplNetwork: network,
        timestamp: new Date().toISOString(),
      })
    );

    await startPaymentsListener();
  } catch (e: any) {
    console.error(
      JSON.stringify({
        event: "listener_autostart_error",
        error: e?.message || String(e),
      })
    );
  }
}

// Fire and forget; don't block the route module import
void maybeStart();
