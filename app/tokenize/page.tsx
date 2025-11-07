"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ShieldCheck, FileText, Info } from "lucide-react"

export default function TokenizePage() {
  const [creating, setCreating] = useState(false)
  const [assetCode, setAssetCode] = useState("")
  const [totalSupply, setTotalSupply] = useState("")

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const response = await fetch("/api/create-asset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetCode, totalSupply }),
      })
      if (response.ok) {
        setAssetCode("")
        setTotalSupply("")
        alert("Asset created successfully!")
      }
    } catch (error) {
      console.error("Error creating asset:", error)
      alert("Failed to create asset")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto my-5">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2 tracking-tight text-center">Tokenize Asset</h1>
        <p className="text-base text-muted-foreground text-center">Create a new tokenized RWA</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="border-border bg-card/60 hover:bg-card/80 hover:border-accent/30 transition-all duration-300 hover:shadow-lg hover:shadow-accent/5 backdrop-blur-sm px-0 border">
            <CardHeader className="pb-4 border-b border-border/50">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <span className="text-accent text-lg">◆</span>
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-foreground">Create New Asset</CardTitle>
                  <CardDescription className="text-muted-foreground text-sm">
                    Enter asset details to tokenize
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleCreateAsset} className="space-y-6">
            <div>
              <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wide">
                Asset Code
              </label>
              <Input
                placeholder="e.g., GOLD-2024"
                value={assetCode}
                onChange={(e) => setAssetCode(e.target.value)}
                required
                className="border-border/50 bg-input focus:border-accent focus:ring-accent/30 text-foreground placeholder:text-muted-foreground/50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wide">
                Total Supply
              </label>
              <Input
                placeholder="1000000"
                type="number"
                value={totalSupply}
                onChange={(e) => setTotalSupply(e.target.value)}
                required
                className="border-border/50 bg-input focus:border-accent focus:ring-accent/30 text-foreground placeholder:text-muted-foreground/50"
              />
            </div>
            <Button
              type="submit"
              disabled={creating}
              className="w-full bg-accent hover:bg-accent/90 text-primary-foreground font-semibold transition-all duration-200 shadow-lg shadow-accent/20 hover:shadow-accent/30"
            >
              {creating ? "Creating..." : "Create Asset"}
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>

      <div className="lg:col-span-1">
        <Card className="border-border/50 bg-card/60 hover:bg-card/80 transition-all duration-300 backdrop-blur-sm border">
          <CardHeader>
            <CardTitle>Compliance Checklist</CardTitle>
            <CardDescription>Best practices for tokenization.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4">
              <ShieldCheck className="w-6 h-6 text-accent shrink-0" />
              <div>
                <h3 className="font-bold text-foreground">Legal Structure</h3>
                <p className="text-sm text-muted-foreground">
                  Ensure the off-chain asset is legally bound to this token via a finalized prospectus.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <FileText className="w-6 h-6 text-blue-400 shrink-0" />
              <div>
                <h3 className="font-bold text-foreground">Naming Convention</h3>
                <p className="text-sm text-muted-foreground">
                  Use a standardized Asset Code. This cannot be changed later.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Info className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <h3 className="font-bold text-foreground">Issuer Wallet</h3>
                <p className="text-sm text-muted-foreground">
                  This action will be executed by the primary institutional wallet. All RequireAuth and Clawback flags will be set by default.
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
