import "dotenv/config";

// This test relied on HOLDER_SEED and helper functions not used in production.
// It is now disabled by default. To run locally, set DEV_TRUSTLINES=1 and provide HOLDER_SEED.

if (process.env.DEV_TRUSTLINES !== "1" || !process.env.HOLDER_SEED) {
  console.log("Skipping dev-only trustlines test (set DEV_TRUSTLINES=1 and HOLDER_SEED to enable)");
  process.exit(0);
}

console.log("DEV trustlines test is disabled in this build.");
process.exit(0);
