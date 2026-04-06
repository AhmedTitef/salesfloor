import { NextRequest } from "next/server";
import { addListener, removeListener } from "@/lib/events";

export async function GET(request: NextRequest) {
  const raw = request.cookies.get("sf_session")?.value;
  if (!raw) {
    return new Response("Unauthorized", { status: 401 });
  }

  let teamId: string;
  try {
    teamId = JSON.parse(raw).teamId;
  } catch {
    return new Response("Invalid session", { status: 401 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send heartbeat every 30s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30000);

      function onEvent(data: string) {
        try {
          controller.enqueue(encoder.encode(data));
        } catch {
          cleanup();
        }
      }

      function cleanup() {
        clearInterval(heartbeat);
        removeListener(teamId, onEvent);
      }

      addListener(teamId, onEvent);

      // Clean up when client disconnects
      request.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
