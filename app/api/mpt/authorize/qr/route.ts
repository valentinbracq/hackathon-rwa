import core from "@/lib/xrpl-logic";
import { createSignRequest } from "@/lib/xumm";

type Body = {
  holderAddress: string;
  issuanceId: string;
  expiresIn?: number;
};

export async function POST(req: Request) {
  try {
    const { holderAddress, issuanceId, expiresIn }: Body = await req.json();

    // Basic input validation
    if (!holderAddress || !issuanceId) {
      return Response.json(
        { error: "holderAddress and issuanceId are required" },
        { status: 400 }
      );
    }
    core.assertAddress(holderAddress);
    core.assertUuidish(issuanceId);

    // Build pure txjson for holder opt-in
    const txjson = core.buildHolderAuthorizeTx({ holderAddress, issuanceId });

    // Create a XUMM sign request (default 5 minutes)
    const exp = typeof expiresIn === "number" && isFinite(expiresIn) && expiresIn > 0
      ? Math.floor(expiresIn)
      : 300;
    const x = await createSignRequest(txjson, { expiresIn: exp });

    // Helper: build SVG from matrix if needed
    function matrixToSVG(matrix: number[][], scale = 6, margin = 2): string {
      const n = matrix.length;
      const size = (n + margin * 2) * scale;
      let rects = "";
      for (let y = 0; y < n; y++) {
        for (let x2 = 0; x2 < n; x2++) {
          if (matrix[y][x2]) {
            const rx = (x2 + margin) * scale;
            const ry = (y + margin) * scale;
            rects += `<rect x="${rx}" y="${ry}" width="${scale}" height="${scale}" />`;
          }
        }
      }
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">${rects}</svg>`;
    }

    const refs = x.refs;
    const nextAlways = x.next?.always || null;
    let qr_png: string | null = null;
    let qr_svg: string | null = null;

    if (refs?.qr_png) {
      qr_png = refs.qr_png;
    } else if (refs?.qr_svg) {
      qr_svg = refs.qr_svg;
    } else if (refs?.qr_matrix && Array.isArray(refs.qr_matrix)) {
      try {
        const svg = matrixToSVG(refs.qr_matrix as any);
        qr_svg = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
      } catch {
        // ignore fallback failure
      }
    }

    if (!qr_png && !qr_svg) {
      return Response.json({ error: "xumm_qr_unavailable" }, { status: 502 });
    }

    console.info(
      JSON.stringify({ event: "optin_qr_created", holder: holderAddress, issuanceId, uuid: x.uuid })
    );

    return Response.json(
      {
        uuid: x.uuid,
        qr_png,
        qr_svg,
        websocket_status: refs?.websocket_status || null,
        next_url: nextAlways,
        txjson,
      },
      { status: 200 }
    );
  } catch (e: any) {
    const message = e?.message || "Request failed";
    const code = typeof e?.code === "string" ? e.code : undefined;
    return Response.json({ error: message, code }, { status: 400 });
  }
}
