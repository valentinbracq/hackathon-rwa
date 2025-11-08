import "dotenv/config";
import { checkAcceptanceCriteria } from "../lib/xrpl-logic.js";

checkAcceptanceCriteria()
  .then(() => { process.exit(0); })
  .catch((e) => { console.error(e?.message || e); process.exit(1); });
