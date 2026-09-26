import { useState } from "react";

const SUBMIT_URL = "https://api.genie.jellyjelly.com/forms/BJDfcsT48BJY5MJyNvzvIeTBrLDCoiAz";

const SIZES = [
  { value: "just_watching", label: "Just watching" },
  { value: "under_100", label: "Under $100" },
  { value: "100_1k", label: "$100 – $1k" },
  { value: "1k_10k", label: "$1k – $10k" },
  { value: "10k_plus", label: "$10k+" },
];

const field =
  "w-full min-h-[48px] border border-input bg-background px-3 py-2 text-sm text-foreground " +
  "placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
const labelCls = "block text-[0.6rem] tracking-[0.18em] text-muted-foreground uppercase mb-1.5";

export default function AllowlistForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const wallet = String(fd.get("wallet") ?? "").trim();
    const note = String(fd.get("note") ?? "").trim();

    setStatus("sending");
    setMessage("");

    try {
      const res = await fetch(SUBMIT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          name: String(fd.get("name") ?? "").trim(),
          email: String(fd.get("email") ?? "").trim(),
          wallet: wallet || undefined,
          ticket_size: String(fd.get("ticket_size") ?? ""),
          note: note || undefined,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!json.ok) {
        setStatus("error");
        setMessage(json.error ?? "That didn't go through. Try again.");
        return;
      }
      form.reset();
      setStatus("done");
    } catch {
      setStatus("error");
      setMessage("Network error — nothing was saved. Try again in a moment.");
    }
  }

  if (status === "done") {
    return (
      <div className="border border-primary/60 bg-primary/5 p-6">
        <p className="text-[0.6rem] tracking-[0.22em] text-primary uppercase">entry recorded</p>
        <p className="mt-3 text-sm leading-relaxed">
          You're on the list. The mint address goes to allowlist emails before it goes public, along
          with the treasury address so you can verify the pledge yourself.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-4 min-h-[44px] border border-border px-4 text-xs tracking-widest uppercase hover:border-primary hover:text-primary"
        >
          add another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="border border-border bg-card/60 p-4 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="al-name">name</label>
          <input id="al-name" name="name" required maxLength={100} className={field} placeholder="who are you" />
        </div>
        <div>
          <label className={labelCls} htmlFor="al-email">email</label>
          <input id="al-email" name="email" type="email" required className={field} placeholder="you@domain.com" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls} htmlFor="al-wallet">solana wallet <span className="normal-case">(optional)</span></label>
          <input
            id="al-wallet"
            name="wallet"
            minLength={32}
            maxLength={64}
            className={field}
            placeholder="base58 address — 32 to 44 characters"
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls} htmlFor="al-size">how much are you thinking</label>
          <select id="al-size" name="ticket_size" required defaultValue="just_watching" className={field}>
            {SIZES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls} htmlFor="al-note">
            which cause should this fund? <span className="normal-case">(optional)</span>
          </label>
          <textarea
            id="al-note"
            name="note"
            maxLength={500}
            rows={3}
            className={field}
            placeholder="the nonprofit isn't locked in yet — say your piece"
          />
        </div>
      </div>

      {status === "error" && (
        <p className="mt-4 border border-destructive/60 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-5 min-h-[48px] w-full border border-primary bg-primary px-6 text-sm font-bold tracking-widest text-primary-foreground uppercase transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60 sm:w-auto"
      >
        {status === "sending" ? "sending…" : "request access"}
      </button>

      <p className="mt-3 text-[0.65rem] text-muted-foreground">
        No wallet connection, no signature, no seed phrase — ever. A page that asks you to connect
        before a token exists is a drain.
      </p>
    </form>
  );
}
