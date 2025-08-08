"use client";

import Link from "next/link";
import { api } from "~/trpc/react";

export function MatchesList() {
  const utils = api.useUtils();
  const { data, isLoading } = api.match.listMatches.useQuery();

  if (isLoading) return <div>Loading matches…</div>;
  if (!data || data.length === 0) return <div>No matches yet.</div>;

  return (
    <ul className="divide-y rounded-md border">
      {data.map((m) => (
        <li key={m.id} className="flex items-center justify-between p-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">
              Match #{m.id} — {m.status}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {new Date(m.createdAt as unknown as string).toLocaleString()} — seed {m.seed}
            </div>
          </div>
          <Link
            href={`/dashboard/matches/${m.id}`}
            onMouseEnter={() => utils.match.getReplay.prefetch({ matchId: m.id })}
            className="text-primary underline underline-offset-4"
          >
            Watch replay
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default MatchesList;


