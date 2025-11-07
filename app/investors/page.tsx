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
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Investor Management</CardTitle>
          <CardDescription>Manage investor requests and approvals</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pending">Pending Requests</TabsTrigger>
              <TabsTrigger value="approved">Approved Investors</TabsTrigger>
            </TabsList>

            {/* Pending Requests Tab */}
            <TabsContent value="pending" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Investor Address</TableHead>
                    <TableHead>Request Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pending.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                        No pending requests
                      </TableCell>
                    </TableRow>
                  ) : (
                    pending.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-mono text-sm">{request.address}</TableCell>
                        <TableCell>{request.date}</TableCell>
                        <TableCell className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApprove(request.id, request.address)}
                            disabled={approving === request.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {approving === request.id ? "Approving..." : "Approve"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(request.id, request.address)}
                            disabled={rejecting === request.id}
                          >
                            {rejecting === request.id ? "Rejecting..." : "Reject"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            {/* Approved Investors Tab */}
            <TabsContent value="approved" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Investor Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedInvestors.map((investor) => (
                    <TableRow key={investor.id}>
                      <TableCell className="font-mono text-sm">{investor.address}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
