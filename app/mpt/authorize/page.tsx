"use client"

import { useEffect, useRef, useState } from "react"
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

  // XUMM QR flow state
  const [qrPng, setQrPng] = useState<string>("")
  const [nextUrl, setNextUrl] = useState<string>("")
  const [xummUuid, setXummUuid] = useState<string>("")
  const [signed, setSigned] = useState(false)
  const [resolved, setResolved] = useState(false)
  const [txid, setTxid] = useState<string | undefined>(undefined)
  const [account, setAccount] = useState<string | undefined>(undefined)
  const intervalRef = useRef<any>(null)
  const [xummStatus, setXummStatus] = useState<{ resolved?: boolean; signed?: boolean; txid?: string | null; account?: string | null; error?: string } | null>(null)

  const UUID36 = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("mptIssuanceId") : null
    if (saved) setIssuanceId(saved)
  }, [])

  // Robust polling loop for XUMM status
  useEffect(() => {
    if (!xummUuid || !UUID36.test(xummUuid)) return
    let timer: any = null
    let cancelled = false
    const tick = async () => {
      try {
        const res = await fetch(`/api/mpt/authorize/status/${xummUuid}`, { cache: "no-store" })
        if (res.status >= 400) {
          clearInterval(timer)
          timer = null
          const err = `status_${res.status}`
          setXummStatus({ error: err })
          toast({ title: "Opt-in status error", description: err })
          return
        }
        const data = await res.json()
        setXummStatus(data)
        setResolved(!!data.resolved)
        setSigned(!!data.signed)
        setTxid(data.txid ?? undefined)
        setAccount(data.account ?? undefined)
        if (data.resolved) {
          clearInterval(timer)
          timer = null
        }
      } catch {
        clearInterval(timer)
        timer = null
        setXummStatus({ error: "network_error" })
        toast({ title: "Network error", description: "network_error" })
      }
    }
    timer = setInterval(() => { if (!cancelled) tick() }, 2000)
    tick()
    return () => { cancelled = true; if (timer) clearInterval(timer) }
  }, [xummUuid])

  const handleGenerateQr = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)
    setQrPng("")
    setNextUrl("")
    setXummUuid("")
    setResolved(false)
    setSigned(false)
    setTxid(undefined)
    setAccount(undefined)
    setXummStatus(null)
    if (!online) {
      const msg = "Network offline. Please reconnect and retry."
      setError(msg)
      toast({ title: "Offline", description: msg })
      return
    }
    try {
      validateIssuance(issuanceId)
      validateAddress(holder)
      const resp = await fetch("/api/mpt/authorize/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issuanceId, holderAddress: holder })
      })
      if (!resp.ok) {
        const js = await resp.json().catch(() => ({}))
        throw new Error(js.error || `Request failed (${resp.status})`)
      }
      const js = await resp.json()
      setQrPng(js.qr_png)
      setNextUrl(js.next_url)
      setXummUuid(js.uuid)
      toast({ title: "QR ready", description: "Scan with XUMM to sign opt-in." })
    } catch (err: any) {
      const msg = normalizeErr(err)
      setError(msg)
      toast({ title: "QR failed", description: msg })
    }
  }

  // Cleanup interval on unmount (safety)
  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

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
        {/* Opt-in from wallet (Replaced by QR flow) */}
        <Card className="border border-border bg-card/60 backdrop-blur-sm">
          <CardHeader className="border-b border-border/50 pb-6">
            <div className="flex items-center gap-3 flex-wrap">
              <div>
                <CardTitle className="text-xl font-semibold text-foreground">Opt-in via QR</CardTitle>
                <CardDescription className="text-muted-foreground text-sm">Generate a XUMM signing request</CardDescription>
              </div>
              {!online && <Badge variant="destructive" className="text-xs">Offline</Badge>}
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <p className="text-xs text-muted-foreground">Opt-in must be signed by the holder’s wallet. The server never sees holder secrets. Scan with XUMM (or open link on mobile).</p>
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
            <form onSubmit={handleGenerateQr} className="space-y-4" suppressHydrationWarning>
              <Button type="submit" className="bg-accent hover:bg-accent/90">Generate QR</Button>
              {error && <p className="text-destructive text-xs mt-1">{error}</p>}
            </form>
            {qrPng && (
              <div className="space-y-3">
                <img src={qrPng} alt="XUMM QR" className="w-40 h-40 border border-border/40 rounded bg-white p-2" />
                {nextUrl && (
                  <a href={nextUrl} target="_blank" rel="noopener noreferrer" className="text-xs underline text-accent">Open in XUMM (mobile)</a>
                )}
                {xummStatus?.error && (
                  <p className="text-destructive text-xs">{xummStatus.error}</p>
                )}
                <div className="text-xs space-y-1">
                  {signed && (<Badge variant="default" className="bg-green-600 hover:bg-green-600">Opt-in signed</Badge>)}
                  {resolved && !signed && (<Badge variant="secondary">Rejected</Badge>)}
                  {txid && (
                    <p className="mt-2">Tx: <a className="underline" href={`https://devnet.xrpl.org/transactions/${txid}`} target="_blank" rel="noopener noreferrer">{txid}</a></p>
                  )}
                </div>
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
            <form onSubmit={handleAuthorize} className="space-y-6" suppressHydrationWarning>
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
              <Button type="submit" disabled={loading} className="w-full bg-accent hover:bg-accent/90">
                {loading ? "Authorizing..." : "Authorize Holder"}
              </Button>
              {error && <p className="text-destructive text-xs mt-2">{error}</p>}
            </form>
            {status && (
              <div className="mt-6 flex items-center gap-2">
                <Badge variant={status === "Authorized" ? "default" : status === "Already authorized" ? "secondary" : "outline"}>{status}</Badge>
              </div>
            )}
            <p className="text-sm opacity-70 mt-6">After opt-in, send an XRP Payment to the issuer with memo <span className="font-mono">PAY-CROWN|&lt;issuanceId&gt;|&lt;nonce&gt;|&lt;units&gt;</span>. The XRP amount must be an integer equal to <span className="font-mono">units</span>.</p>
          </CardContent>
        </Card>
        <Card className="border border-border bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Workflow</CardTitle>
            <CardDescription>States of authorization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p><strong>Opt-in required</strong>: Holder scans QR & signs MPTokenAuthorize once to create token object.</p>
            <p><strong>Authorized</strong>: Issuer granted permission; payments will succeed.</p>
            <p><strong>Already authorized</strong>: Holder was previously granted; no change applied.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
