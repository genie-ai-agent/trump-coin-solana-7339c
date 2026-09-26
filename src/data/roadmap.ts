export interface Phase {
  id: string;
  label: string;
  status: "done" | "active" | "queued";
  lines: string[];
}

export const phases: Phase[] = [
  {
    id: "00",
    label: "Pick the cause, publish the pledge",
    status: "active",
    lines: [
      "Name the nonprofit and link its public filings: [nonprofit name + link]",
      "Publish the split in writing before a single token exists",
      "Get the nonprofit's written OK to be named — uninvited charity branding is its own lawsuit",
    ],
  },
  {
    id: "01",
    label: "Treasury and transparency rails",
    status: "queued",
    lines: [
      "Multisig treasury on Solana (Squads), not a single signer",
      "Publish the treasury address so anyone can audit it: [treasury wallet address]",
      "Fixed payout cadence to the nonprofit, every transfer linkable",
    ],
  },
  {
    id: "02",
    label: "Mint and liquidity",
    status: "queued",
    lines: [
      "SPL mint, authority revoked after launch, supply fixed and public",
      "LP seeded and locked — an unlocked pool is the rug everyone checks for first",
      "Allowlist gets the address before the public post",
    ],
  },
  {
    id: "03",
    label: "Launch and account for it",
    status: "queued",
    lines: [
      "Public launch: [target launch date]",
      "Live dashboard: raised, sent to the nonprofit, remaining in treasury",
      "Quarterly receipt from the nonprofit, posted as a jelly",
    ],
  },
];
