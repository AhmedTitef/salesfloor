import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { useMemoryDb } from "@/db";
import { memoryDb } from "@/db/memory";

async function getSessionData() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("sf_session")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export default async function ContactsPage() {
  const session = await getSessionData();
  if (!session?.userId) redirect("/");

  const contacts = useMemoryDb ? memoryDb.getContactHistory(session.userId, session.teamId) : [];

  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto w-full pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Contacts</h1>
          <p className="text-xs text-muted-foreground">Your activity history by contact</p>
        </div>
        <Link href="/log" className="text-xs text-muted-foreground hover:text-foreground underline">
          Back to Log
        </Link>
      </div>

      {contacts.length === 0 ? (
        <Card>
          <CardContent className="pt-6 pb-6 text-center">
            <p className="text-3xl mb-2">📇</p>
            <p className="text-sm text-muted-foreground">
              No contacts yet. Long-press an activity button to attach a contact name.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {contacts.map((c) => {
            const timeAgo = getTimeAgo(c.lastActivity);
            return (
              <Card key={c.contactName}>
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{c.contactName}</p>
                      <p className="text-xs text-muted-foreground">{c.activities} activities &middot; {timeAgo}</p>
                    </div>
                    <div className="flex gap-1">
                      {Object.entries(c.types).slice(0, 3).map(([type, count]) => (
                        <span key={type} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                          {type}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
