"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { UserCheck, Network, Archive } from "lucide-react"
import { mptApi } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { useOnline } from "../useOnline"

export default function SendMPTPage() {
  const [sending, setSending] = useState(false)
  const [destination, setDestination] = useState("")
  const [units, setUnits] = useState("")
  const [issuanceId, setIssuanceId] = useState<string | "">("")
  const [hash, setHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const online = useOnline()
  
  // prefill from localStorage
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("mptIssuanceId") : null
    if (saved) setIssuanceId(saved)
  }, [])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError(null)
    if (!online) {
      const msg = "Network offline. Please reconnect and retry."
      setError(msg)
      toast({ title: "Offline", description: msg })
      setSending(false)
      return
    }
    try {
      const id = issuanceId
      validateIssuance(id)
      validateAddress(destination)
      validateUnits(units)
      const json = await mptApi.send({ mptIssuanceId: id, destination, units })
      setDestination("")
      setUnits("")
      setHash(json.hash)
      toast({ title: "Sent", description: `Tx hash: ${json.hash}` })
    } catch (error) {
      console.error("Error sending MPT units:", error)
      const msg = normalizeErr(error)
      toast({ title: "Send failed", description: msg })
    } finally {
      setSending(false)
    }
  }

  function validateAddress(a: string) {
    if (!/^r[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(a)) throw new Error("Invalid XRPL address")
  }
  function validateUnits(v: string) {
    if (!/^[0-9]+$/.test(v)) throw new Error("Units must be a positive integer")
    if (v === "0") throw new Error("Units must be > 0")
  }
  function validateIssuance(id: string) {
    if (!id.trim()) throw new Error("mptIssuanceId is required")
  }
  function normalizeErr(e: any) {
    return String(e?.message || e || "Unknown error")
  }

  return (
    <div className="p-8 max-w-7xl mx-auto my-5">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2 tracking-tight">Issue (Send) MPT Units</h1>
        <p className="text-base text-muted-foreground">Distribute multi-purpose token units to authorized holders</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="border border-border bg-card/60 hover:bg-card/80 hover:border-accent/30 transition-all duration-300 hover:shadow-lg hover:shadow-accent/5 backdrop-blur-sm">
            <CardHeader className="pb-4 border-b border-border/50">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <span className="text-accent text-lg">↗</span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <CardTitle className="text-lg font-semibold text-foreground">Send Units</CardTitle>
                    {!online && <Badge variant="destructive" className="text-xs">Offline</Badge>}
                  </div>
                  <CardDescription className="text-muted-foreground text-sm">Allocate units to a holder wallet</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSend} className="space-y-6">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wide">Destination Address</label>
                  <Input
                    placeholder="r..."
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    required
                    className="border-border/50 bg-input focus:border-accent focus:ring-accent/30 text-foreground placeholder:text-muted-foreground/50 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wide">mptIssuanceId</label>
                  <Input
                    placeholder="mpt issuance id"
                    value={issuanceId}
                    onChange={(e) => setIssuanceId(e.target.value)}
                    required
                    className="border-border/50 bg-input focus:border-accent focus:ring-accent/30 text-foreground placeholder:text-muted-foreground/50 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wide">Units</label>
                  <Input
                    placeholder="1000"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={units}
                    onChange={(e) => setUnits(e.target.value)}
                    required
                    className="border-border/50 bg-input focus:border-accent focus:ring-accent/30 text-foreground placeholder:text-muted-foreground/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wide">Issuance ID (optional)</label>
                  <Input
                    placeholder="Leave blank to auto-resolve"
                    value={issuanceId}
                    onChange={(e) => setIssuanceId(e.target.value)}
                    className="border-border/50 bg-input focus:border-accent focus:ring-accent/30 text-foreground placeholder:text-muted-foreground/50 font-mono text-xs"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-accent hover:bg-accent/90 text-primary-foreground font-semibold transition-all duration-200 shadow-lg shadow-accent/20 hover:shadow-accent/30"
                >
                  {sending ? "Sending..." : "Send Units"}
                </Button>
                {error && <p className="text-destructive text-xs mt-2">{error}</p>}
              </form>
              {hash && (
                <div className="mt-6 p-4 border border-border/50 rounded-md bg-input/20 font-mono text-xs">
                  <span className="text-muted-foreground">Tx Hash:</span> {hash}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card className="border-border/50 bg-card/60 hover:bg-card/80 transition-all duration-300 backdrop-blur-sm border">
            <CardHeader>
              <CardTitle>Distribution Guide</CardTitle>
              <CardDescription>Key checks before allocating units.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                <UserCheck className="w-6 h-6 text-accent shrink-0" />
                <div>
                  <h3 className="font-bold text-foreground">Authorized Holder</h3>
                  <p className="text-sm text-muted-foreground">Ensure the destination is opted-in and authorized for this issuance.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Network className="w-6 h-6 text-blue-400 shrink-0" />
                <div>
                  <h3 className="font-bold text-foreground">Double-Check Address</h3>
                  <p className="text-sm text-muted-foreground">Transfers are final; verify the XRPL classic address carefully.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Archive className="w-6 h-6 text-amber-400 shrink-0" />
                <div>
                  <h3 className="font-bold text-foreground">Audit Trail</h3>
                  <p className="text-sm text-muted-foreground">All payments are recorded on-chain for compliance and review.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
