import { fetchAllGoals, fetchAllOffers } from "@/lib/queries";
import { GoalsBoard } from "@/components/goals/GoalsBoard";
import { OffersBoard } from "@/components/goals/OffersBoard";

export const revalidate = 60;

export default async function GoalsPage() {
  const [goals, offers] = await Promise.all([fetchAllGoals(), fetchAllOffers()]);

  // Partition goals by status
  const todo = goals.filter((g) => g.status === "Todo" || !g.status);
  const inProgress = goals.filter((g) => g.status === "In progress");
  const blocked = goals.filter((g) => g.status === "Blocked");
  const done = goals.filter((g) => g.status === "Done");

  // Offer pipeline stats
  const wonOffers = offers.filter((o) => o.status === "Closed Won").length;
  const lostOffers = offers.filter((o) => o.status === "Closed Lost").length;
  const activeOffers = offers.filter(
    (o) => o.status === "Presented" || o.status === "Accepted",
  ).length;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-10">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-subtle">
          Throttl · AI brain
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Goals &amp; Offers
        </h1>
        <p className="mt-2 max-w-prose text-sm text-muted">
          Action items promoted from meetings, tracked to completion. Offer
          pipeline shows every offer logged across all meetings.
        </p>
      </header>

      {/* Offer pipeline stats */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-medium tracking-tight">
          Offer Pipeline
        </h2>
        <div className="mb-6 grid grid-cols-3 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-surface-2/40 p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{activeOffers}</p>
            <p className="mt-1 text-xs text-muted">Active</p>
          </div>
          <div className="rounded-xl border bg-green-50 p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{wonOffers}</p>
            <p className="mt-1 text-xs text-green-600">Closed Won</p>
          </div>
          <div className="rounded-xl border bg-red-50 p-4 text-center">
            <p className="text-2xl font-bold text-red-700">{lostOffers}</p>
            <p className="mt-1 text-xs text-red-600">Closed Lost</p>
          </div>
        </div>
        <OffersBoard offers={offers} />
      </section>

      {/* Goals kanban */}
      <section className="mb-16">
        <h2 className="mb-4 text-lg font-medium tracking-tight">
          Goals Tracker
        </h2>
        <GoalsBoard
          todo={todo}
          inProgress={inProgress}
          blocked={blocked}
          done={done}
        />
      </section>

      <footer className="border-t pt-6 text-xs text-subtle">
        Goals are promoted from meeting next steps. Offers are logged in the
        meeting detail panel.{" "}
        <a href="/" className="underline hover:text-foreground">
          ← Back to Meetings
        </a>
      </footer>
    </main>
  );
}
