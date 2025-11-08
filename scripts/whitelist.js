// scripts/whitelist.js
import { whitelistAdd } from "@/lib/pending-sales"
whitelistAdd(process.argv[2])
console.log("whitelisted:", process.argv[2])
