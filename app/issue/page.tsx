"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { UserCheck, Network, Archive } from "lucide-react"

export default function IssuePage() {
  const [issuing, setIssuing] = useState(false)
  const [investorAddress, setInvestorAddress] = useState("")
  const [issueAmount, setIssueAmount] = useState("")

  const handleIssueTokens = async (e: React.FormEvent) => {
    e.preventDefault()
    setIssuing(true)
    try {
      const response = await fetch("/api/issue-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ investorAddress, amount: issueAmount }),
      })
      if (response.ok) {
        setInvestorAddress("")
        setIssueAmount("")
        alert("Tokens issued successfully!")
      }
    } catch (error) {
      console.error("Error issuing tokens:", error)
      alert("Failed to issue tokens")
    } finally {
      setIssuing(false)
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto my-5">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2 tracking-tight">Issue Tokens</h1>
        <p className="text-base text-muted-foreground">Distribute tokens to investors</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="border border-border bg-card/60 hover:bg-card/80 hover:border-accent/30 transition-all duration-300 hover:shadow-lg hover:shadow-accent/5 backdrop-blur-sm">
            <CardHeader className="pb-4 border-b border-border/50">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <span className="text-accent text-lg">↗</span>
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-foreground">Issue Tokens</CardTitle>
                  <CardDescription className="text-muted-foreground text-sm">
                    Allocate tokens to investor wallet
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleIssueTokens} className="space-y-6">
            <div>
              <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wide">
                Investor Address
              </label>
              <Input
                placeholder="0x..."
                value={investorAddress}
                onChange={(e) => setInvestorAddress(e.target.value)}
                required
                className="border-border/50 bg-input focus:border-accent focus:ring-accent/30 text-foreground placeholder:text-muted-foreground/50 font-mono text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wide">Amount</label>
              <Input
                placeholder="1000"
                type="number"
                value={issueAmount}
                onChange={(e) => setIssueAmount(e.target.value)}
                required
                className="border-border/50 bg-input focus:border-accent focus:ring-accent/30 text-foreground placeholder:text-muted-foreground/50"
              />
            </div>
            <Button
              type="submit"
              disabled={issuing}
              className="w-full bg-accent hover:bg-accent/90 text-primary-foreground font-semibold transition-all duration-200 shadow-lg shadow-accent/20 hover:shadow-accent/30"
            >
              {issuing ? "Issuing..." : "Issue Tokens"}
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>

      <div className="lg:col-span-1">
        <Card className="border-border/50 bg-card/60 hover:bg-card/80 transition-all duration-300 backdrop-blur-sm border">
          <CardHeader>
            <CardTitle>Whitelist & Issuance Guide</CardTitle>
            <CardDescription>Key checks before distributing tokens.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4">
              <UserCheck className="w-6 h-6 text-accent shrink-0" />
              <div>
                <h3 className="font-bold text-foreground">Verified Investor</h3>
                <p className="text-sm text-muted-foreground">
                  Confirm this investor's address has passed KYC/KYB and is on the official whitelist.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Network className="w-6 h-6 text-blue-400 shrink-0" />
              <div>
                <h3 className="font-bold text-foreground">Double-Check Address</h3>
                <p className="text-sm text-muted-foreground">
                  Issuance is final. Verify the investor address is correct to prevent loss of funds.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Archive className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <h3 className="font-bold text-foreground">Audit Trail</h3>
                <p className="text-sm text-muted-foreground">
                  This transaction will be recorded on-chain as the primary distribution event for this batch.
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
