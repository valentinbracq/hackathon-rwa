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
