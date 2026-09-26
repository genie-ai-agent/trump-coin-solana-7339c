import { useEffect, useState } from "react";

interface Row {
  id: string;
  ticker: string;
  name: string;
  chain: string;
}

const ROWS: Row[] = [
  { id: "official-trump", ticker: "TRUMP", name: "Official Trump", chain: "solana / spl" },
  { id: "solana", ticker: "SOL", name: "Solana", chain: "solana / native" },
  { id: "ethereum", ticker: "ETH", name: "Ethereum", chain: "ethereum / native" },
];

type Quote = { usd: number; usd_24h_change?: number; usd_market_cap?: number };
type Payload = Record<string, Quote>;

const ENDPOINT =
  "https://api.coingecko.com/api/v3/simple/price?ids=official-trump,solana,ethereum" +
  "&vs_currencies=usd&include_24hr_change=true&include_market_cap=true";

function cacheKey() {
  return `mkt:${new Date().toISOString().slice(0, 10)}`;
}

function money(n: number) {
  if (n >= 1000) return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
}

function cap(n?: number) {
  if (!n) return "—";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return money(n);
}

export default function MarketStrip() {
  const [data, setData] = useState<Payload | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    const cached = localStorage.getItem(cacheKey());
    if (cached) {
      try {
        setData(JSON.parse(cached));
        setState("ok");
      } catch {
        localStorage.removeItem(cacheKey());
      }
    }
    let live = true;
    fetch(ENDPOINT)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json: Payload) => {
        if (!live) return;
        localStorage.setItem(cacheKey(), JSON.stringify(json));
        setData(json);
        setState("ok");
      })
      .catch(() => {
        if (!live) return;
        setState((s) => (s === "ok" ? "ok" : "error"));
      });
    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="border border-border bg-card/60">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2 sm:px-4">
        <span className="text-[0.65rem] tracking-[0.2em] text-muted-foreground uppercase">
          live tape · coingecko
        </span>
        <span className="text-[0.65rem] tracking-[0.2em] uppercase">
          {state === "loading" && <span className="text-muted-foreground">syncing…</span>}
          {state === "ok" && <span className="text-primary">● connected</span>}
          {state === "error" && <span className="text-destructive">● offline</span>}
        </span>
      </div>

      {state === "error" && !data ? (
        <div className="px-3 py-6 text-sm text-muted-foreground sm:px-4">
          market data unavailable right now. the numbers below are the only thing on this page that
          needs a network — everything else still reads fine.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {ROWS.map((row) => {
            const q = data?.[row.id];
            const chg = q?.usd_24h_change;
            return (
              <li
                key={row.id}
                className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 px-3 py-3 sm:grid-cols-[8rem_1fr_auto_auto] sm:px-4"
              >
                <div className="flex flex-col">
                  <span className="font-bold tracking-wider">{row.ticker}</span>
                  <span className="text-[0.65rem] text-muted-foreground">{row.chain}</span>
                </div>
                <span className="hidden text-xs text-muted-foreground sm:block">{row.name}</span>
                <div className="text-right">
                  {q ? (
                    <span className="text-base font-bold tabular-nums">{money(q.usd)}</span>
                  ) : (
                    <span className="inline-block h-4 w-20 animate-pulse bg-muted align-middle" />
                  )}
                  <div className="text-[0.65rem] text-muted-foreground">mcap {cap(q?.usd_market_cap)}</div>
                </div>
                <div className="col-start-2 row-start-1 text-right sm:col-auto sm:row-auto sm:w-24">
                  {typeof chg === "number" ? (
                    <span
                      className={`text-sm font-bold tabular-nums ${chg >= 0 ? "tick-up" : "tick-down"}`}
                    >
                      {chg >= 0 ? "▲" : "▼"} {Math.abs(chg).toFixed(2)}%
                    </span>
                  ) : (
                    <span className="inline-block h-4 w-14 animate-pulse bg-muted align-middle" />
                  )}
                  <div className="text-[0.65rem] text-muted-foreground">24h</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
