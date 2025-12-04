import { t } from "elysia";

export const IncomingEvent = t.Record(t.String(), t.Any());
export const TelemetryBatch = t.Union([t.Array(IncomingEvent), IncomingEvent]);
