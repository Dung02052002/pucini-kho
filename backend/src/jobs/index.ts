import type { Bindings } from "../env";

export async function scheduled(
  event: ScheduledEvent,
  _env: Bindings,
  _ctx: ExecutionContext,
): Promise<void> {
  console.log(
    JSON.stringify({
      job: "scheduled_cron",
      cron: event.cron,
      scheduledTime: event.scheduledTime,
    }),
  );
}
