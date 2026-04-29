"use client";

import { useState } from "react";
import { Copy, RefreshCw, Mail } from "lucide-react";
import { Collapsible } from "@/components/ui/Collapsible";

export function FollowupEmailSection({
  email,
  meetingId,
  onRefresh,
}: {
  email: string | null;
  meetingId: string;
  onRefresh: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function regen() {
    setBusy(true);
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId }),
      });
      if (!res.ok) throw new Error("Failed");
      onRefresh();
    } catch {
      alert("Failed to regenerate email.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!email) return;
    await navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Collapsible
      icon={<Mail className="h-4 w-4 text-subtle" />}
      label="Follow-up email draft"
      defaultOpen={false}
    >
      {!email ? (
        <p className="text-sm text-muted">No email drafted yet.</p>
      ) : (
        <>
          <pre className="mb-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-lg border bg-surface-2 p-4 text-xs leading-relaxed scroll-pane">
            {email}
          </pre>
          <p className="mb-3 text-xs text-subtle">
            Copy and paste into your email client. Edit before sending.
          </p>
        </>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!email}
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-surface-2 disabled:opacity-50"
        >
          <Copy className="h-3.5 w-3.5" />
          {copied ? "Copied!" : "Copy"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={regen}
          className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-surface-2 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
          {busy ? "Regenerating…" : "Regenerate"}
        </button>
      </div>
    </Collapsible>
  );
}
