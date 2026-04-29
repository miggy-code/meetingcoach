import { Pill } from "@/components/ui/Badges";
import type { ObjectionType, BuyingSignalType } from "@/lib/constants";

export function SignalsSection({
  objections,
  buyingSignals,
}: {
  objections: ObjectionType[];
  buyingSignals: BuyingSignalType[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border bg-surface p-5">
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-subtle">
          Objections detected
        </h3>
        {objections.length === 0 ? (
          <p className="text-sm text-muted">
            No objections detected — clean call.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {objections.map((o) => (
              <Pill key={o} tone="objection">
                {o}
              </Pill>
            ))}
          </div>
        )}
      </div>
      <div className="rounded-xl border bg-surface p-5">
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-subtle">
          Buying signals detected
        </h3>
        {buyingSignals.length === 0 ? (
          <p className="text-sm text-muted">No buying signals detected.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {buyingSignals.map((s) => (
              <Pill key={s} tone="signal">
                {s}
              </Pill>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
