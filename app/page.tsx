import { fetchDashboardData } from "@/lib/queries";
import { BusinessHealthPanel } from "@/components/dashboard/BusinessHealthPanel";
import { MeetingFeed } from "@/components/dashboard/MeetingFeed";
import { TrendPanels } from "@/components/dashboard/TrendPanels";
import { ReviewQueue } from "@/components/dashboard/ReviewQueue";
import { NewMeetingDialog } from "@/components/dashboard/NewMeetingDialog";

// Revalidate the cached dashboard every 60s. Server Actions that write to
// Airtable also call revalidatePath("/") to invalidate immediately.
export const revalidate = 60;

export default async function DashboardPage() {
  const data = await fetchDashboardData();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-subtle">
            Throttl · AI Brain
          </p>
          <h1 className="mt-1.5 text-3xl font-semibold tracking-tight">
            Business Intelligence
          </h1>
          <p className="mt-1.5 max-w-prose text-sm text-muted">
            Pipeline health, coaching performance, and meeting intelligence — all in one place.
          </p>
        </div>
        <NewMeetingDialog />
      </header>

      <ReviewQueue count={data.reviewQueueCount} />

      {/* Business health panel: pipeline funnel + per-person scores + offer stats */}
      <section className="mb-10">
        <BusinessHealthPanel stats={data.weekStats} funnelCounts={data.funnelCounts} />
      </section>

      {/* Meeting feed */}
      <section className="mb-10">
        <h2 className="mb-4 text-base font-semibold tracking-tight">
          Recent Meetings
        </h2>
        <MeetingFeed
          meetings={data.meetings}
          allMeetings={data.allMeetings}
        />
      </section>

      {/* Monthly signal trends */}
      <section className="mb-14">
        <h2 className="mb-4 text-base font-semibold tracking-tight">
          Monthly Signals
        </h2>
        <TrendPanels trends={data.monthlyTrends} />
      </section>

      <footer className="border-t pt-5 text-xs text-subtle">
        Connected to{" "}
        <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono">
          ThrottlInternal
        </code>{" "}
        · Refreshes every 60s · Detail views fetch live on expand.
      </footer>
    </main>
  );
}
