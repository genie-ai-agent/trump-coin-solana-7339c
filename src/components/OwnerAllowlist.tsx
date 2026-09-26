import { useCallback, useEffect, useState } from "react";
import { db } from "@/lib/db";

interface Row {
  id: number;
  name: string;
  email: string;
  wallet: string | null;
  ticket_size: string;
  note: string | null;
  created_at: string;
}

const SIZE_LABEL: Record<string, string> = {
  just_watching: "watching",
  under_100: "<$100",
  "100_1k": "$100–1k",
  "1k_10k": "$1k–10k",
  "10k_plus": "$10k+",
};

const field =
  "w-full min-h-[48px] border border-input bg-background px-3 py-2 text-sm " +
  "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
const btn =
  "min-h-[48px] w-full border border-primary bg-primary px-5 text-sm font-bold tracking-widest " +
  "text-primary-foreground uppercase disabled:opacity-60";
const ghost =
  "min-h-[44px] border border-border px-4 text-xs tracking-widest uppercase hover:border-primary hover:text-primary";

export default function OwnerAllowlist() {
  const [user, setUser] = useState<{ id: string; email?: string | null } | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await db.auth.getSession();
    const u = data?.user ?? null;
    setUser(u ? { id: u.id, email: u.email } : null);
    if (u) {
      const res = await db
        .from("allowlist")
        .select("id, name, email, wallet, ticket_size, note, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      setRows((res.data as Row[]) ?? []);
    } else {
      setRows([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const onMsg = (e: MessageEvent) => {
      if (e.origin === window.location.origin && e.data === "signed-in") refresh();
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [refresh]);

  async function google() {
    setErr("");
    const popup = window.open("about:blank", "signin", "width=480,height=640");
    const { data, error } = await db.auth.signIn.social({
      provider: "google",
      callbackURL: `${window.location.origin}/auth-callback.html`,
      errorCallbackURL: `${window.location.origin}/auth-callback.html`,
      disableRedirect: true,
    });
    if (error || !data?.url) {
      popup?.close();
      setErr(error?.message ?? "Google sign-in unavailable.");
      return;
    }
    if (popup) popup.location.href = data.url;
    else window.location.href = data.url;
  }

  async function email(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const em = String(fd.get("email") ?? "");
    const pw = String(fd.get("password") ?? "");
    setBusy(true);
    setErr("");
    try {
      const res =
        mode === "signup"
          ? await db.auth.signUp.email({ email: em, password: pw, name: em.split("@")[0] })
          : await db.auth.signIn.email({ email: em, password: pw });
      if (res.error) setErr(res.error.message ?? "That didn't work.");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function out() {
    await db.auth.signOut();
    await refresh();
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 animate-pulse border border-border bg-muted/40" />
        ))}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="border border-border bg-card/60 p-4 sm:p-6">
        <p className="text-[0.6rem] tracking-[0.22em] text-muted-foreground uppercase">
          restricted · sign in
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Allowlist entries are private. Nobody browsing this site can read them.
        </p>

        <button onClick={google} className={`${btn} mt-5`}>
          continue with google
        </button>

        <div className="my-5 flex items-center gap-3 text-[0.6rem] tracking-[0.2em] text-muted-foreground uppercase">
          <span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={email} className="space-y-3">
          <input name="email" type="email" required placeholder="email" className={field} />
          <input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="password (8+ chars)"
            className={field}
          />
          <button type="submit" disabled={busy} className={`${ghost} w-full`}>
            {busy ? "working…" : mode === "signup" ? "create account" : "sign in"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          className="mt-3 text-[0.7rem] text-muted-foreground underline hover:text-primary"
        >
          {mode === "signup" ? "have an account? sign in" : "need an account? sign up"}
        </button>

        {err && <p className="mt-3 text-xs text-destructive">{err}</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 border border-border bg-card/60 px-3 py-3 sm:px-4">
        <span className="text-[0.65rem] tracking-[0.18em] text-muted-foreground uppercase">
          signed in
        </span>
        <span className="text-sm text-primary">{user.email ?? user.id}</span>
        <button onClick={out} className={`${ghost} ml-auto`}>
          sign out
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="mt-4 border border-accent/50 bg-accent/5 p-4 sm:p-5">
          <p className="text-[0.6rem] tracking-[0.22em] text-accent uppercase">page locked</p>
          <p className="mt-3 text-sm leading-relaxed">
            This reads empty either because nobody has signed up yet, or because this account isn't
            authorised on the table yet. Send Genie the id below and it gets unlocked for you.
          </p>
          <code className="mt-4 block overflow-x-auto border border-border bg-background px-3 py-2 text-xs text-primary">
            {user.id}
          </code>
        </div>
      ) : (
        <>
          <p className="mt-4 text-[0.65rem] tracking-[0.18em] text-muted-foreground uppercase">
            {rows.length} {rows.length === 1 ? "entry" : "entries"}
          </p>
          <ul className="mt-2 divide-y divide-border border border-border bg-card/60">
            {rows.map((r) => (
              <li key={r.id} className="px-3 py-3 sm:px-4">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-sm font-bold">{r.name}</span>
                  <span className="text-xs text-muted-foreground">{r.email}</span>
                  <span className="ml-auto border border-primary/40 px-2 py-0.5 text-[0.6rem] tracking-widest text-primary uppercase">
                    {SIZE_LABEL[r.ticket_size] ?? r.ticket_size}
                  </span>
                </div>
                {r.wallet && (
                  <p className="mt-1 break-all text-[0.7rem] text-accent">{r.wallet}</p>
                )}
                {r.note && <p className="mt-1 text-xs text-muted-foreground">{r.note}</p>}
                <p className="mt-1 text-[0.65rem] text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
