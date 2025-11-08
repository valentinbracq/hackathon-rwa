"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { mptApi } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import { useOnline } from "../useOnline"

export default function AuthorizePage() {
  const [issuanceId, setIssuanceId] = useState("")
  const [holder, setHolder] = useState("")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [txJSON, setTxJSON] = useState<any>(null)
  const [optInDone, setOptInDone] = useState(false)
  const [grantHash, setGrantHash] = useState<string>("")
  const online = useOnline()

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("mptIssuanceId") : null
    if (saved) setIssuanceId(saved)
  }, [])

  const handlePrepareOptIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)
    setStatus("")
    setTxJSON(null)
    setOptInDone(false)
    if (!online) {
      const msg = "Network offline. Please reconnect and retry."
      setError(msg)
      toast({ title: "Offline", description: msg })
      return
    }
    try {
      validateIssuance(issuanceId)
      validateAddress(holder)
      const { txJSON } = await mptApi.prepareOptIn({ mptIssuanceId: issuanceId, holder })
      setTxJSON(txJSON)
      toast({ title: "Opt-in prepared", description: "Unsigned transaction is ready to sign in your wallet." })
    } catch (err: any) {
      const msg = normalizeErr(err)
      setError(msg)
      toast({ title: "Prepare failed", description: msg })
    }
  }

  // Placeholder: later wire to real wallet provider (e.g., window.xrpl / injected signer)
  const handleMockSigned = () => {
    setOptInDone(true)
    toast({ title: "Marked as signed", description: "Assuming your wallet broadcasted the opt-in transaction." })
  }

  const handleAuthorize = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus("")
    setError(null)
    if (!online) {
      const msg = "Network offline. Please reconnect and retry."
      setError(msg)
      toast({ title: "Offline", description: msg })
      setLoading(false)
      return
    }
    try {
      validateIssuance(issuanceId)
      validateAddress(holder)
      const res = await mptApi.authorizeHolder({ mptIssuanceId: issuanceId, holder })
      if (res.skipped) {
        setStatus("Already authorized")
      } else if (res.granted) {
        setStatus("Authorized")
      } else if (!res.optIn) {
        setStatus("Opt-in required")
      } else {
        setStatus("Authorization unchanged")
      }
      toast({ title: "Authorization processed", description: res.skipped ? "Already authorized" : res.granted ? "Authorized" : !res.optIn ? "Opt-in required" : "Authorization unchanged" })
      // Best-effort: if backend returns hash in a compatible shape later, capture it.
      // setGrantHash((res as any)?.hash || "")
    } catch (err: any) {
      const msg = normalizeErr(err)
      setStatus(msg)
      toast({ title: "Authorization failed", description: msg })
    } finally {
      setLoading(false)
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
        <h1 className="text-4xl font-bold text-foreground mb-2 tracking-tight">Authorize Holder</h1>
        <p className="text-base text-muted-foreground">Grant access for an opted-in holder to receive MPT units</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Opt-in from wallet */}
        <Card className="border border-border bg-card/60 backdrop-blur-sm">
          <CardHeader className="border-b border-border/50 pb-6">
            <div className="flex items-center gap-3 flex-wrap">
              <div>
                <CardTitle className="text-xl font-semibold text-foreground">Opt-in from wallet</CardTitle>
                <CardDescription className="text-muted-foreground text-sm">Prepare an unsigned MPTokenAuthorize for the holder to sign</CardDescription>
              </div>
              {!online && <Badge variant="destructive" className="text-xs">Offline</Badge>}
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <p className="text-xs text-muted-foreground">Opt-in must be signed by the holder’s wallet. The server never sees holder secrets.</p>
            <div>
              <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wide">mptIssuanceId</label>
              <Input
                value={issuanceId}
                onChange={(e) => setIssuanceId(e.target.value)}
                placeholder="mpt issuance id"
                className="font-mono text-xs border-border/50 bg-input"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wide">Holder Address</label>
              <Input
                value={holder}
                onChange={(e) => setHolder(e.target.value)}
                placeholder="r..."
                className="font-mono text-sm border-border/50 bg-input"
                required
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={handlePrepareOptIn} className="bg-accent hover:bg-accent/90">Prepare Opt-in</Button>
              {txJSON && (
                <>
                  <Button type="button" variant="secondary" onClick={() => navigator.clipboard.writeText(JSON.stringify(txJSON))}>Copy txJSON</Button>
                  <Button type="button" variant="outline" onClick={handleMockSigned}>I have signed & submitted</Button>
                </>
              )}
            </div>
            {txJSON && (
              <div className="mt-2">
                <pre className="text-xs whitespace-pre-wrap break-words bg-muted/30 p-3 rounded border border-border/40 max-h-64 overflow-auto">{JSON.stringify(txJSON, null, 2)}</pre>
                <p className="text-xs text-muted-foreground mt-2">After your wallet broadcasts the opt-in, click “Authorize Holder” below.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border bg-card/60 backdrop-blur-sm">
          <CardHeader className="border-b border-border/50 pb-6">
            <div className="flex items-center gap-3 flex-wrap">
              <div>
                <CardTitle className="text-xl font-semibold text-foreground">Authorization Form</CardTitle>
                <CardDescription className="text-muted-foreground text-sm">Enter issuance and holder details</CardDescription>
              </div>
              {!online && <Badge variant="destructive" className="text-xs">Offline</Badge>}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleAuthorize} className="space-y-6">
              <div>
                <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wide">mptIssuanceId</label>
                <Input
                  value={issuanceId}
                  onChange={(e) => setIssuanceId(e.target.value)}
                  placeholder="mpt issuance id"
                  className="font-mono text-xs border-border/50 bg-input"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wide">Holder Address</label>
                <Input
                  value={holder}
                  onChange={(e) => setHolder(e.target.value)}
                  placeholder="r..."
                  className="font-mono text-sm border-border/50 bg-input"
                  required
                />
              </div>
              <Button type="submit" disabled={loading || (!optInDone && status !== "Already authorized")} className="w-full bg-accent hover:bg-accent/90">
                {loading ? "Authorizing..." : "Authorize Holder"}
              </Button>
              {error && <p className="text-destructive text-xs mt-2">{error}</p>}
            </form>
            {status && (
              <div className="mt-6 flex items-center gap-2">
                <Badge variant={status === "Authorized" ? "default" : status === "Already authorized" ? "secondary" : "outline"}>{status}</Badge>
              </div>
            )}
            {grantHash && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground">Grant hash: <span className="font-mono">{grantHash}</span></p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border border-border bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Workflow</CardTitle>
            <CardDescription>States of authorization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p><strong>Opt-in required</strong>: Holder must first submit an on-ledger MPTokenAuthorize from their own wallet to create the token object.</p>
            <p><strong>Authorized</strong>: Issuer granted permission; payments will succeed.</p>
            <p><strong>Already authorized</strong>: Holder was previously granted; no change applied.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
