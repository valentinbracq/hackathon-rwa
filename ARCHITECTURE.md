# Simple Codebase Layout

A minimal, copy-paste friendly directory tree focusing on the requested folders: `app`, `components`, `hooks`, and `lib`.

```
app/
  globals.css
  layout.tsx
  page.tsx
  api/
    create-asset/
      route.ts
    issue-tokens/
      route.ts
    approve-investor/
      route.ts
    reject-investor/
      route.ts
    clawback/
      route.ts
  clawback/
    page.tsx
  investors/
    page.tsx
  issue/
    page.tsx
  tokenize/
    page.tsx

components/
  theme-provider.tsx
  ui/
    accordion.tsx
    alert-dialog.tsx
    alert.tsx
    aspect-ratio.tsx
    avatar.tsx
    badge.tsx
    breadcrumb.tsx
    button-group.tsx
    button.tsx
    calendar.tsx
    card.tsx
    carousel.tsx
    chart.tsx
    checkbox.tsx
    collapsible.tsx
    command.tsx
    context-menu.tsx
    dialog.tsx
    drawer.tsx
    dropdown-menu.tsx
    empty.tsx
    field.tsx
    form.tsx
    hover-card.tsx
    input-group.tsx
    input-otp.tsx
    input.tsx
    item.tsx
    kbd.tsx
    label.tsx
    menubar.tsx
    navigation-menu.tsx
    pagination.tsx
    popover.tsx
    progress.tsx
    radio-group.tsx
    resizable.tsx
    scroll-area.tsx
    select.tsx
    separator.tsx
    sheet.tsx
    sidebar.tsx
    skeleton.tsx
    slider.tsx
    sonner.tsx
    spinner.tsx
    switch.tsx
    table.tsx
    tabs.tsx
    textarea.tsx
    toast.tsx
    toaster.tsx
    toggle-group.tsx
    toggle.tsx
    tooltip.tsx
    use-mobile.tsx
    use-toast.ts

hooks/
  use-mobile.ts
  use-toast.ts

lib/
  utils.ts
  xrpl-logic.js
```

Notes:
- This is a compact tree to paste as context. It mirrors the workspace files and important entry points.
- `app/api/*/route.ts` are server API routes that call into `lib/xrpl-logic.js`.
- `components/ui/*` contains numerous small presentational components used across pages.
- `hooks` expose small reusable client-side hooks (toasts, mobile detection).
- `lib` holds XRPL integration and utilities (wallets, client, MPT ops).

End of layout.

## XUMM Integration

To enable XUMM (Xaman) signing flows set the following environment variables in a local `.env` (never commit this file):

```
XUMM_API_KEY=your_xumm_api_key
XUMM_API_SECRET=your_xumm_api_secret
```

Acquire these credentials by registering an app at https://apps.xumm.dev. After creating a new app, copy the API Key and Secret. Treat them as sensitive and add them only to your deployment secrets or local `.env`.

Server-side helper functions live in `lib/xumm.ts`:

- `createSignRequest(txjson, { expiresIn? })` creates a signing payload and returns QR & WebSocket refs plus a redirect link.
- `getPayloadStatus(uuid)` fetches minimal payload status (`uuid, resolved, signed, txid, account, dispatched_result?`).

They throw if env vars are missing or the API returns an error. Only import them in server code (e.g. Next.js Route Handlers) to avoid leaking secrets.
