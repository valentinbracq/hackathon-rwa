"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

// Mock data
const pendingRequests = [
  { id: 1, address: "0x1234567890123456789012345678901234567890", date: "2024-01-15" },
  { id: 2, address: "0x0987654321098765432109876543210987654321", date: "2024-01-16" },
  { id: 3, address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd", date: "2024-01-17" },
]

const approvedInvestors = [
  { id: 1, address: "0xfedcbafedcbafedcbafedcbafedcbafedcbafedcba" },
  { id: 2, address: "0x1111111111111111111111111111111111111111" },
  { id: 3, address: "0x2222222222222222222222222222222222222222" },
]

export default function InvestorsPage() {
  const [approving, setApproving] = useState<number | null>(null)
  const [rejecting, setRejecting] = useState<number | null>(null)
  const [pending, setPending] = useState(pendingRequests)

  const handleApprove = async (id: number, address: string) => {
    setApproving(id)
    try {
      const response = await fetch("/api/approve-investor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      })
      if (response.ok) {
        setPending(pending.filter((r) => r.id !== id))
        alert("Investor approved!")
      }
    } catch (error) {
      console.error("Error approving investor:", error)
      alert("Failed to approve investor")
    } finally {
      setApproving(null)
    }
  }

  const handleReject = async (id: number, address: string) => {
    setRejecting(id)
    try {
      const response = await fetch("/api/reject-investor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      })
      if (response.ok) {
        setPending(pending.filter((r) => r.id !== id))
        alert("Investor rejected!")
      }
    } catch (error) {
      console.error("Error rejecting investor:", error)
      alert("Failed to reject investor")
    } finally {
      setRejecting(null)
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto my-5">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2 tracking-tight">Investor Management</h1>
        <p className="text-base text-muted-foreground">Review, approve, and manage institutional investor access</p>
      </div>

      <Card className="border border-border bg-card/60 backdrop-blur-sm mx-auto">
        <CardHeader className="border-b border-border/50 pb-6">
          <CardTitle className="text-xl font-semibold text-foreground">Investor Directory</CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Manage investor onboarding and access credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-input border border-border/50 p-1 mb-6 rounded-md">
              <TabsTrigger
                value="pending"
                className="data-[state=active]:bg-accent/10 data-[state=active]:text-accent data-[state=active]:shadow-sm rounded-sm transition-all duration-200"
              >
                Pending Requests
              </TabsTrigger>
              <TabsTrigger
                value="approved"
                className="data-[state=active]:bg-accent/10 data-[state=active]:text-accent data-[state=active]:shadow-sm rounded-sm transition-all duration-200"
              >
                Approved Investors
              </TabsTrigger>
            </TabsList>

            {/* Pending Requests Tab */}
            <TabsContent value="pending" className="mt-4">
              <div className="border border-border/50 rounded-md overflow-hidden">
                <Table>
                  <TableHeader className="bg-input/30 border-b border-border/50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-foreground font-semibold">Investor Address</TableHead>
                      <TableHead className="text-foreground font-semibold">Request Date</TableHead>
                      <TableHead className="text-foreground font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pending.length === 0 ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                          No pending requests
                        </TableCell>
                      </TableRow>
                    ) : (
                      pending.map((request) => (
                        <TableRow
                          key={request.id}
                          className="hover:bg-input/30 border-b border-border/50 transition-colors duration-200"
                        >
                          <TableCell className="font-mono text-sm text-foreground">{request.address}</TableCell>
                          <TableCell className="text-muted-foreground">{request.date}</TableCell>
                          <TableCell className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(request.id, request.address)}
                              disabled={approving === request.id}
                              className="bg-accent hover:bg-accent/90 text-primary-foreground font-medium transition-all duration-200 shadow-sm"
                            >
                              {approving === request.id ? "Approving..." : "Approve"}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleReject(request.id, request.address)}
                              disabled={rejecting === request.id}
                              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium transition-all duration-200 shadow-sm"
                            >
                              {rejecting === request.id ? "Rejecting..." : "Reject"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Approved Investors Tab */}
            <TabsContent value="approved" className="mt-4">
              <div className="border border-border/50 rounded-md overflow-hidden">
                <Table>
                  <TableHeader className="bg-input/30 border-b border-border/50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-foreground font-semibold">Investor Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedInvestors.map((investor) => (
                      <TableRow
                        key={investor.id}
                        className="hover:bg-input/30 border-b border-border/50 transition-colors duration-200"
                      >
                        <TableCell className="font-mono text-sm text-foreground">{investor.address}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
