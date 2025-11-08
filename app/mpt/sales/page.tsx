"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"

type Item = {
  issuanceId: string
  holder: string
  units: string
  amount_drops?: string
  amount_xrp?: string
  paymentTx: string
  status: string
  createdAt: string
  updatedAt: string
}

// Lightweight client-side cache of holder authorization state (transient, not persisted)
const authCache: Record<string, boolean> = {}

export default function SalesPage() {
  const [items, setItems] = useState<Item[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const { toast } = useToast()

  async function load() {
    const r = await fetch("/api/mpt/sales/list", { cache: "no-store" })
    const j = await r.json()
    const list: Item[] = j.items || []
    setItems(list)
    // Opportunistically verify authorization for newly seen holders (if issuanceId present)
    for (const it of list) {
      const key = it.holder + ":" + it.issuanceId
      if (authCache[key] !== true && it.issuanceId && it.holder) {
        void verifyHolder(it.holder, it.issuanceId)
      }
    }
  }

  async function verifyHolder(holder: string, issuanceId: string) {
    try {
      // Placeholder for future enhancement if txid becomes part of list API.
    } catch {}
  }

  async function settle(paymentTx: string) {
    setBusy(paymentTx)
    try {
      const r = await fetch("/api/mpt/sales/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentTx }),
      })
      const t = await r.text()
      if (!r.ok) throw new Error(t)
      await load()
      toast({ title: "MPT sent", description: t })
    } catch (e: any) {
      toast({ title: "Settle failed", description: e?.message || String(e) })
    } finally {
      setBusy(null)
    }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 5000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="p-8 max-w-7xl mx-auto my-5">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2 tracking-tight">Sales Inbox</h1>
        <p className="text-base text-muted-foreground">Pending XRP payments to be settled as MPT units</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="lg:col-span-2">
          <Card className="border border-border bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-4 border-b border-border/50">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-semibold text-foreground">Pending Sales</CardTitle>
                  <CardDescription className="text-muted-foreground text-sm">Review and settle inbound payments</CardDescription>
                </div>
                {/* Restart/Rescan button removed per requirements */}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-3">
                {items.map((x) => (
                  <Card key={x.paymentTx} className="border border-border/60 bg-input/10">
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-2">
                        <div className="text-xs text-muted-foreground">{x.createdAt}</div>
                        <div className="font-mono text-xs break-all">
                          <span className="text-muted-foreground">PaymentTx:</span> {x.paymentTx}
                        </div>
                        <div className="text-sm flex items-center gap-2">
                          <span className="text-muted-foreground">Holder:</span> {x.holder}
                          {authCache[x.holder + ":" + x.issuanceId] && (
                            <Badge className="text-xs" variant="secondary">Holder authorized</Badge>
                          )}
                        </div>
                        <div className="text-sm"><span className="text-muted-foreground">Issuance:</span> {x.issuanceId}</div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Amount (XRP):</span> {x.amount_xrp ?? `${x.units} units`}
                        </div>
                        <div className="text-sm"><span className="text-muted-foreground">Status:</span> {x.status}</div>
                        <div className="pt-2">
                          <Button
                            size="sm"
                            onClick={() => settle(x.paymentTx)}
                            disabled={busy === x.paymentTx}
                            className="bg-accent hover:bg-accent/90 text-primary-foreground"
                          >
                            {busy === x.paymentTx ? "Settling..." : "Settle"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {items.length === 0 && (
                  <div className="opacity-70 text-sm">No pending sales.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
