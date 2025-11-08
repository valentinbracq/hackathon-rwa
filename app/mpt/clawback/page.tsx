"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Lock, ClipboardCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useOnline } from "../useOnline"

export default function MPTClawbackPage() {
  const [processing, setProcessing] = useState(false)
  const [holder, setHolder] = useState("")
  const [units, setUnits] = useState("")
  const [issuanceId, setIssuanceId] = useState<string | "">("")
  const [error, setError] = useState<string | null>(null)
  const online = useOnline()

  const handleClawback = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)
    setError(null)
    if (!online) {
      setProcessing(false)
      setError("Network offline. Please reconnect and retry.")
      return
    }
    try {
      const response = await fetch("/api/mpt/clawback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ holder, units, mptIssuanceId: issuanceId || undefined })
      })
      const json = await response.json()
      if (response.ok) {
        setHolder("")
        setUnits("")
        alert("Clawback executed successfully!")
      } else {
        alert(json.error || "Failed clawback")
      }
    } catch (error) {
      console.error("Error clawing back units:", error)
      alert("Failed to clawback units")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto my-5">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2 tracking-tight">Clawback MPT Units</h1>
        <p className="text-base text-muted-foreground">Recover units from a holder account</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="border border-border bg-card/60 hover:bg-card/80 hover:border-destructive/30 transition-all duration-300 hover:shadow-lg hover:shadow-destructive/5 backdrop-blur-sm">
            <CardHeader className="pb-4 border-b border-border/50">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <span className="text-destructive text-lg">↙</span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <CardTitle className="text-lg font-semibold text-foreground">Clawback Units</CardTitle>
                    {!online && <Badge variant="destructive" className="text-xs">Offline</Badge>}
                  </div>
                  <CardDescription className="text-muted-foreground text-sm">Recover units from holder wallet</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleClawback} className="space-y-6" suppressHydrationWarning>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wide">Holder Address</label>
                  <Input
                    placeholder="r..."
                    value={holder}
                    onChange={(e) => setHolder(e.target.value)}
                    required
                    className="border-border/50 bg-input focus:border-accent focus:ring-accent/30 text-foreground placeholder:text-muted-foreground/50 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wide">Units</label>
                  <Input
                    placeholder="1000"
                    type="number"
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
                  disabled={processing}
                  className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold transition-all duration-200 shadow-lg shadow-destructive/20 hover:shadow-destructive/30"
                >
                  {processing ? "Processing..." : "Clawback Units"}
                </Button>
                {error && <p className="text-destructive text-xs mt-2">{error}</p>}
              </form>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card className="border-destructive/50 bg-card/60 hover:bg-card/80 transition-all duration-300 backdrop-blur-sm border">
            <CardHeader>
              <CardTitle className="text-red-500">CRITICAL ACTION: WARNING</CardTitle>
              <CardDescription className="text-destructive/90">Sensitive & potentially irreversible.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
                <div>
                  <h3 className="font-bold text-foreground">Legal Authorization</h3>
                  <p className="text-sm text-muted-foreground">Proceed only with a valid legal or compliance mandate.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Lock className="w-6 h-6 text-red-500 shrink-0" />
                <div>
                  <h3 className="font-bold text-foreground">Permanent Effect</h3>
                  <p className="text-sm text-muted-foreground">Recovered units are moved or burned as per your policy.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <ClipboardCheck className="w-6 h-6 text-amber-400 shrink-0" />
                <div>
                  <h3 className="font-bold text-foreground">Verify Details</h3>
                  <p className="text-sm text-muted-foreground">Confirm address, units, and issuance context before submission.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
