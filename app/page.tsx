"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const [creating, setCreating] = useState(false)
  const [issuing, setIssuing] = useState(false)
  const [clawingBack, setClawingBack] = useState(false)

  // Form state
  const [assetCode, setAssetCode] = useState("")
  const [totalSupply, setTotalSupply] = useState("")
  const [investorAddress, setInvestorAddress] = useState("")
  const [issueAmount, setIssueAmount] = useState("")
  const [clawbackAddress, setClawbackAddress] = useState("")
  const [clawbackAmount, setClawbackAmount] = useState("")

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
    <div className="p-6">
      <div className="grid grid-cols-3 gap-6">
        {/* Card 1: Tokenize a New Asset */}
        <Card>
          <CardHeader>
            <CardTitle>Tokenize a New Asset</CardTitle>
            <CardDescription>Create a new tokenized asset</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAsset} className="space-y-4">
              <Input
                placeholder="Asset Code"
                value={assetCode}
                onChange={(e) => setAssetCode(e.target.value)}
                required
              />
              <Input
                placeholder="Total Supply"
                type="number"
                value={totalSupply}
                onChange={(e) => setTotalSupply(e.target.value)}
                required
              />
              <Button type="submit" disabled={creating} className="w-full">
                {creating ? "Creating..." : "Create Asset"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Card 2: Issue Tokens */}
        <Card>
          <CardHeader>
            <CardTitle>Issue Tokens</CardTitle>
            <CardDescription>Issue tokens to an investor</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleIssueTokens} className="space-y-4">
              <Input
                placeholder="Investor Address"
                value={investorAddress}
                onChange={(e) => setInvestorAddress(e.target.value)}
                required
              />
              <Input
                placeholder="Amount"
                type="number"
                value={issueAmount}
                onChange={(e) => setIssueAmount(e.target.value)}
                required
              />
              <Button type="submit" disabled={issuing} className="w-full">
                {issuing ? "Issuing..." : "Issue"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Card 3: Clawback Tokens */}
        <Card>
          <CardHeader>
            <CardTitle>Clawback Tokens</CardTitle>
            <CardDescription>Clawback tokens from an investor</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleClawback} className="space-y-4">
              <Input
                placeholder="Investor Address"
                value={clawbackAddress}
                onChange={(e) => setClawbackAddress(e.target.value)}
                required
              />
              <Input
                placeholder="Amount"
                type="number"
                value={clawbackAmount}
                onChange={(e) => setClawbackAmount(e.target.value)}
                required
              />
              <Button type="submit" variant="destructive" disabled={clawingBack} className="w-full">
                {clawingBack ? "Processing..." : "Clawback Funds"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
