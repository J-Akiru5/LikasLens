import { NextRequest } from "next/server";

// ── SSE Proxy Route ────────────────────────────────────────────────────
// Proxies ticket activity from the Laravel backend as SSE events.
// Works on Vercel free tier (no WebSocket needed).

const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
const POLL_INTERVAL_MS = 5_000;

interface TicketSummary {
  id: string;
  display_id: string;
  title: string;
  status: string;
  urgency_score: number | null;
  ai_confidence: number | null;
  location: string;
  created_at: string;
}

export async function GET(_request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection event
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ time: Date.now() })}\n\n`)
      );

      let lastSeen: string | null = null;

      const poll = async () => {
        try {
          const params = new URLSearchParams({ per_page: "20" });
          if (lastSeen) params.set("since", lastSeen);

          const res = await fetch(`${BACKEND_URL}/api/tickets?${params.toString()}`, {
            headers: { Accept: "application/json" },
          });

          if (!res.ok) {
            controller.enqueue(
              encoder.encode(`event: error\ndata: ${JSON.stringify({ status: res.status })}\n\n`)
            );
            return;
          }

          const json = await res.json();
          const tickets: TicketSummary[] = json?.data ?? json?.tickets ?? [];

          if (tickets.length > 0) {
            // Send new tickets as individual events
            for (const ticket of tickets) {
              const event = {
                id: ticket.id,
                display_id: ticket.display_id,
                title: ticket.title,
                status: ticket.status,
                urgency_score: ticket.urgency_score,
                ai_confidence: ticket.ai_confidence,
                location: ticket.location,
                created_at: ticket.created_at,
              };
              controller.enqueue(
                encoder.encode(`event: ticket\ndata: ${JSON.stringify(event)}\n\n`)
              );
            }
            // Update cursor to most recent ticket
            lastSeen = tickets[0].created_at;

            // Send batch summary
            controller.enqueue(
              encoder.encode(
                `event: batch\ndata: ${JSON.stringify({ count: tickets.length, time: Date.now() })}\n\n`
              )
            );
          }

          // Keep-alive comment
          controller.enqueue(encoder.encode(`: keepalive\n\n`));
        } catch {
          controller.enqueue(
            encoder.encode(`event: error\ndata: ${JSON.stringify({ message: "Backend unreachable" })}\n\n`)
          );
        }
      };

      // Initial poll
      await poll();

      // Continue polling
      const interval = setInterval(poll, POLL_INTERVAL_MS);

      // Clean up on close
      const cleanup = () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      };

      // Listen for abort
      _request.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
