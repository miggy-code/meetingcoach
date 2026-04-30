import { fetchDashboardData } from "@/lib/queries";
import { HeroStats } from "@/components/dashboard/HeroStats";
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
    <main className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-12 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-subtle">
            Throttl · AI brain
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Meeting Intelligence
          </h1>
          <p className="mt-2 max-w-prose text-sm text-muted">
            Post-mortems, scoring, and signals across every meeting. All data
            lives in Airtable; AI analysis runs on DeepSeek.
          </p>
        </div>
        <NewMeetingDialog />
      </header>

      <ReviewQueue count={data.reviewQueueCount} />

      <section className="mb-12">
        <HeroStats stats={data.weekStats} />
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-lg font-medium tracking-tight">
          Recent meetings
        </h2>
        <MeetingFeed
          meetings={data.meetings}
          allMeetings={data.allMeetings}
        />
      </section>

      <section className="mb-16">
        <h2 className="mb-4 text-lg font-medium tracking-tight">This month</h2>
        <TrendPanels trends={data.monthlyTrends} />
      </section>

      <footer className="border-t pt-6 text-xs text-subtle">
        Connected to base{" "}
        <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono">
          ThrottlInternal
        </code>{" "}
        · Data refreshes every 60s · Detail views fetch live on expand.
      </footer>
    </main>
  );
}
