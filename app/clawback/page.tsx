"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Lock, ClipboardCheck } from "lucide-react"

export default function ClawbackPage() {
  const [clawingBack, setClawingBack] = useState(false)
  const [clawbackAddress, setClawbackAddress] = useState("")
  const [clawbackAmount, setClawbackAmount] = useState("")

  const handleClawback = async (e: React.FormEvent) => {
    e.preventDefault()
    setClawingBack(true)
    try {
      const response = await fetch("/api/clawback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ investorAddress: clawbackAddress, amount: clawbackAmount }),
      })
      if (response.ok) {
        setClawbackAddress("")
        setClawbackAmount("")
        alert("Clawback executed successfully!")
      }
    } catch (error) {
      console.error("Error clawing back tokens:", error)
      alert("Failed to clawback tokens")
    } finally {
      setClawingBack(false)
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto my-5">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2 tracking-tight">Clawback Tokens</h1>
        <p className="text-base text-muted-foreground">Retrieve tokens from investor</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="border border-border bg-card/60 hover:bg-card/80 hover:border-destructive/30 transition-all duration-300 hover:shadow-lg hover:shadow-destructive/5 backdrop-blur-sm">
            <CardHeader className="pb-4 border-b border-border/50">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <span className="text-destructive text-lg">↙</span>
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-foreground">Clawback Tokens</CardTitle>
                  <CardDescription className="text-muted-foreground text-sm">
                    Retrieve tokens from investor wallet
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleClawback} className="space-y-6">
            <div>
              <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wide">
                Investor Address
              </label>
              <Input
                placeholder="0x..."
                value={clawbackAddress}
                onChange={(e) => setClawbackAddress(e.target.value)}
                required
                className="border-border/50 bg-input focus:border-accent focus:ring-accent/30 text-foreground placeholder:text-muted-foreground/50 font-mono text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wide">Amount</label>
              <Input
                placeholder="1000"
                type="number"
                value={clawbackAmount}
                onChange={(e) => setClawbackAmount(e.target.value)}
                required
                className="border-border/50 bg-input focus:border-accent focus:ring-accent/30 text-foreground placeholder:text-muted-foreground/50"
              />
            </div>
            <Button
              type="submit"
              disabled={clawingBack}
              className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold transition-all duration-200 shadow-lg shadow-destructive/20 hover:shadow-destructive/30"
            >
              {clawingBack ? "Processing..." : "Clawback Funds"}
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>

      <div className="lg:col-span-1">
        <Card className="border-destructive/50 bg-card/60 hover:bg-card/80 transition-all duration-300 backdrop-blur-sm border">
          <CardHeader>
            <CardTitle className="text-red-500">CRITICAL ACTION: WARNING</CardTitle>
            <CardDescription className="text-destructive/90">This is a sensitive, irreversible operation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4">
              <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
              <div>
                <h3 className="font-bold text-foreground">Legal Authorization</h3>
                <p className="text-sm text-muted-foreground">
                  Only proceed with this action if you have a legal order or explicit authorization.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Lock className="w-6 h-6 text-red-500 shrink-0" />
              <div>
                <h3 className="font-bold text-foreground">Irreversible Action</h3>
                <p className="text-sm text-muted-foreground">
                  This action is final and cannot be undone. The tokens will be retrieved and burned or returned to the issuer.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <ClipboardCheck className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <h3 className="font-bold text-foreground">Verify All Details</h3>
                <p className="text-sm text-muted-foreground">
                  Confirm the address and amount are 100% accurate before submitting.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </div>
  )
}
