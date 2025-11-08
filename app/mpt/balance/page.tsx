"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { mptApi } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useOnline } from "../useOnline"

export default function MPTBalancePage() {
  const [reading, setReading] = useState(false)
  const [account, setAccount] = useState("")
  const [mptIssuanceId, setMptIssuanceId] = useState("")
  const [balance, setBalance] = useState<string | null>(null)
  const [rows, setRows] = useState<Array<{ account: string; balance: string }>>([])
  const [error, setError] = useState<string | null>(null)
  const online = useOnline()

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("mptIssuanceId") : null
    if (saved) setMptIssuanceId(saved)
  }, [])

  const handleRead = async (e: React.FormEvent) => {
    e.preventDefault()
    setReading(true)
    setError(null)
    if (!online) {
      const msg = "Network offline. Please reconnect and retry."
      setError(msg)
      toast({ title: "Offline", description: msg })
      setReading(false)
      return
    }
    try {
      validateIssuance(mptIssuanceId)
      validateAddress(account)
      const json = await mptApi.balance({ account, mptIssuanceId })
      setBalance(json.balance)
      setRows([{ account, balance: json.balance }])
      toast({ title: "Balance fetched", description: json.balance })
    } catch (e) {
      const status = (e as any)?.status
      const serverMsg = (e as any)?.body || normalizeErr(e)
      const msg = serverMsg
      setBalance(null)
      setRows([])
      setError(msg)
      toast({ title: status === 400 ? "Input error" : "Balance error", description: msg })
    } finally {
      setReading(false)
    }
  }

  function validateAddress(a: string) {
    if (!/^r[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(a)) throw new Error("Invalid XRPL address")
  }
  function validateIssuance(id: string) {
    if (!id.trim()) throw new Error("mptIssuanceId is required")
  }
  function normalizeErr(e: any) { return String(e?.message || e || "Unknown error") }

  return (
    <div className="p-8 max-w-7xl mx-auto my-5">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2 tracking-tight">Read MPT Balance</h1>
        <p className="text-base text-muted-foreground">Query a holder's balance for a given issuance</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <Card className="border border-border bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-4 border-b border-border/50">
              <div className="flex items-center gap-3 flex-wrap">
                <div>
                  <CardTitle className="text-lg font-semibold text-foreground">Balance Lookup</CardTitle>
                  <CardDescription className="text-muted-foreground text-sm">Provide issuance & account details</CardDescription>
                </div>
                {!online && <Badge variant="destructive" className="text-xs">Offline</Badge>}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {balance !== null && (() => {
                try { return BigInt(balance) > BigInt(0) } catch { return false }
              })() && (
                <div className="mb-4">
                  <Alert className="border-border/60 bg-input/20">
                    <Info className="mt-0.5" />
                    <AlertDescription>
                      Existing balance detected for this issuance.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              <form onSubmit={handleRead} className="space-y-6">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wide">Issuance ID</label>
                  <Input
                    placeholder="mpt issuance id"
                    value={mptIssuanceId}
                    onChange={(e) => setMptIssuanceId(e.target.value)}
                    required
                    className="border-border/50 bg-input focus:border-accent focus:ring-accent/30 text-foreground placeholder:text-muted-foreground/50 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wide">Account Address</label>
                  <Input
                    placeholder="r..."
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    required
                    pattern="r[1-9A-HJ-NP-Za-km-z]{25,34}"
                    title="Enter a valid XRPL classic address (starts with r, 26-35 base58 chars)."
                    className="border-border/50 bg-input focus:border-accent focus:ring-accent/30 text-foreground placeholder:text-muted-foreground/50 font-mono text-sm"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={reading}
                  className="w-full bg-accent hover:bg-accent/90 text-primary-foreground font-semibold transition-all duration-200"
                >
                  {reading ? "Reading..." : "Read Balance"}
                </Button>
              </form>
              {error && <p className="text-destructive text-xs mt-2">{error}</p>}
              {rows.length > 0 && (
                <div className="mt-6 border border-border/50 rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-input/30 border-b border-border/50">
                      <tr>
                        <th className="text-left p-2 font-semibold text-foreground">Account</th>
                        <th className="text-left p-2 font-semibold text-foreground">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(r => (
                        <tr key={r.account} className="border-b border-border/30 hover:bg-input/20 transition-colors">
                          <td className="p-2 font-mono">{r.account}</td>
                          <td className="p-2 font-mono">{r.balance}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div>
          <Card className="border border-border bg-card/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Usage</CardTitle>
              <CardDescription>Balances reflect authorized holder state.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>Balances are queried directly from the XRPL ledger using the MPToken ledger entry format.</p>
              <p>The holder must be authorized and opted-in for the issuance to have a non-zero balance.</p>
              <p>Values are raw unit counts relative to the issuance's AssetScale.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
