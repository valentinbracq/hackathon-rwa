"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ShieldCheck, FileText, Info } from "lucide-react"
import { mptApi } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import { useOnline } from "../useOnline"
import { Badge } from "@/components/ui/badge"

export default function CreateIssuancePage() {
  const [creating, setCreating] = useState(false)
  const [assetScale, setAssetScale] = useState("2")
  const [maximumAmount, setMaximumAmount] = useState("1000000000")
  const [transferFee, setTransferFee] = useState<string>("0")
  const [metadataHex, setMetadataHex] = useState<string>("")
  const [issuanceId, setIssuanceId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const online = useOnline()

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("mptIssuanceId") : null
    if (saved) setIssuanceId(saved)
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError(null)
    if (!online) {
      const msg = "Network offline. Please reconnect and retry."
      setError(msg)
      toast({ title: "Offline", description: msg })
      setCreating(false)
      return
    }
    try {
      // Keep track of any previously saved issuance to inform users about residual balances.
      let previousIssuanceId: string | null = null
      try {
        previousIssuanceId = typeof window !== "undefined" ? localStorage.getItem("mptIssuanceId") : null
      } catch {}
  const payload: any = { assetScale: Number(assetScale), maximumAmount }
  if (transferFee !== "") payload.transferFee = Number(transferFee)
  if (metadataHex.trim() !== "") payload.metadataHex = metadataHex.trim()
      const json = await mptApi.createIssuance(payload)
      setIssuanceId(json.mptIssuanceId)
      try { localStorage.setItem("mptIssuanceId", json.mptIssuanceId) } catch {}
      toast({ title: "Issuance ready", description: json.mptIssuanceId })
      // Show a non-intrusive note if the issuance changed to avoid confusion with prior balances.
      if (previousIssuanceId && previousIssuanceId !== json.mptIssuanceId) {
        toast({
          description: "Note: you created a new issuance. Prior balances on older issuances won't reset.",
        })
      }
    } catch (e) {
      const msg = normalizeErr(e)
      toast({ title: "Creation failed", description: msg })
    } finally {
      setCreating(false)
    }
  }

  function normalizeErr(e: any) { return String(e?.message || e || "Unknown error") }

  return (
    <div className="p-8 max-w-7xl mx-auto my-5">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2 tracking-tight">Create MPT Issuance</h1>
        <p className="text-base text-muted-foreground">Establish an issuance with auth + clawback flags</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="border-border bg-card/60 hover:bg-card/80 hover:border-accent/30 transition-all duration-300 hover:shadow-lg hover:shadow-accent/5 backdrop-blur-sm">
            <CardHeader className="pb-4 border-b border-border/50">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <span className="text-accent text-lg">◆</span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <CardTitle className="text-lg font-semibold text-foreground">Issuance Parameters</CardTitle>
                    {!online && <Badge variant="destructive" className="text-xs">Offline</Badge>}
                  </div>
                  <CardDescription className="text-muted-foreground text-sm">Configure supply limits & scaling</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleCreate} className="space-y-6" suppressHydrationWarning>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wide">Asset Scale</label>
                  <Input
                    type="number"
                    min={0}
                    max={18}
                    value={assetScale}
                    onChange={(e) => setAssetScale(e.target.value)}
                    required
                    className="border-border/50 bg-input focus:border-accent focus:ring-accent/30 text-foreground placeholder:text-muted-foreground/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wide">Maximum Amount</label>
                  <Input
                    type="text"
                    value={maximumAmount}
                    onChange={(e) => setMaximumAmount(e.target.value)}
                    required
                    className="border-border/50 bg-input focus:border-accent focus:ring-accent/30 text-foreground placeholder:text-muted-foreground/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wide">Transfer Fee (bps)</label>
                  <Input
                    type="number"
                    min={0}
                    max={50000}
                    value={transferFee}
                    onChange={(e) => setTransferFee(e.target.value)}
                    className="border-border/50 bg-input focus:border-accent focus:ring-accent/30 text-foreground placeholder:text-muted-foreground/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wide">Metadata (hex, optional)</label>
                  <Input
                    type="text"
                    value={metadataHex}
                    onChange={(e) => setMetadataHex(e.target.value)}
                    placeholder="0x... or hex string"
                    className="border-border/50 bg-input focus:border-accent focus:ring-accent/30 text-foreground placeholder:text-muted-foreground/50 font-mono text-xs"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={creating}
                  className="w-full bg-accent hover:bg-accent/90 text-primary-foreground font-semibold transition-all duration-200 shadow-lg shadow-accent/20 hover:shadow-accent/30"
                >
                  {creating ? "Processing..." : "Create / Resolve Issuance"}
                </Button>
                {error && <p className="text-destructive text-xs mt-2">{error}</p>}
              </form>
              {issuanceId && (
                <div className="mt-6">
                  <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wide">mptIssuanceId</label>
                  <Input readOnly value={issuanceId} className="font-mono text-xs border-border/50 bg-input" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card className="border-border/50 bg-card/60 hover:bg-card/80 transition-all duration-300 backdrop-blur-sm border">
            <CardHeader>
              <CardTitle>Compliance Checklist</CardTitle>
              <CardDescription>Best practices for issuance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                <ShieldCheck className="w-6 h-6 text-accent shrink-0" />
                <div>
                  <h3 className="font-bold text-foreground">Auth & Clawback Flags</h3>
                  <p className="text-sm text-muted-foreground">These are set automatically to enforce holder authorization and recovery capability.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <FileText className="w-6 h-6 text-blue-400 shrink-0" />
                <div>
                  <h3 className="font-bold text-foreground">Document Supply Logic</h3>
                  <p className="text-sm text-muted-foreground">Maintain an off-chain registry describing how maximum supply maps to real-world units.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Info className="w-6 h-6 text-amber-400 shrink-0" />
                <div>
                  <h3 className="font-bold text-foreground">Issuer Wallet Control</h3>
                  <p className="text-sm text-muted-foreground">The issuer wallet signs the creation transaction. Store seeds securely.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
