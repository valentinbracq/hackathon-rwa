"use client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PackagePlus, Send, Undo2, Users } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto my-5">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2 tracking-tight text-center">Dashboard</h1>
        <p className="text-base text-muted-foreground text-center">Institutional RWA Tokenization Platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tokenize Card */}
        <Card className="border border-border/50 hover:bg-card/60 transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-2">
              <PackagePlus className="w-5 h-5 text-primary" />
              <CardTitle>Tokenize Asset</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center mb-6">
              <PackagePlus className="w-16 h-16 text-blue-500" />
            </div>
            <CardDescription>
              Create a new compliant, on-chain representation of a real-world asset. Define its code, supply, and rules.
            </CardDescription>
          </CardContent>
          <CardFooter>
            <Link href="/mpt/create-issuance" className="w-full">
              <Button className="w-full">Go to Tokenize</Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Issue Card */}
        <Card className="border border-border/50 hover:bg-card/60 transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              <CardTitle>Issue Tokens</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center mb-6">
              <Send className="w-16 h-16 text-blue-500" />
            </div>
            <CardDescription>
              Distribute your newly tokenized assets to an approved, whitelisted investor. This is the primary distribution step.
            </CardDescription>
          </CardContent>
          <CardFooter>
            <Link href="/mpt/send" className="w-full">
              <Button className="w-full">Go to Issue</Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Clawback Card */}
        <Card className="border border-border/50 hover:bg-card/60 transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Undo2 className="w-5 h-5 text-destructive" />
              <CardTitle>Clawback Tokens</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center mb-6">
              <Undo2 className="w-16 h-16 text-red-500" />
            </div>
            <CardDescription>
              Retrieve tokens from an investor's wallet in case of a legal order, compliance failure, or critical error.
            </CardDescription>
          </CardContent>
          <CardFooter>
            <Link href="/mpt/clawback" className="w-full">
              <Button variant="destructive" className="w-full">Go to Clawback</Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Investor Directory Card */}
        <Card className="md:col-span-3 mt-6 border border-border/50 hover:bg-card/60 transition-all duration-300">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <Users className="w-10 h-10 text-blue-500" />
              <div>
                <CardTitle>Investor Directory</CardTitle>
                <CardDescription>
                  Manage your whitelisted investors. Approve new requests and review access.
                </CardDescription>
              </div>
            </div>
            <Link href="/mpt/authorize">
              <Button>Go to Directory</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      
    </div>
  )
}
