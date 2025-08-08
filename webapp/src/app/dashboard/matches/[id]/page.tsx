import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { HydrateClient, api } from "~/trpc/server";
import { ReplayViewer } from "~/components/tictactoe/replay-viewer";

export default async function MatchReplayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const matchId = Number(id);
  if (!Number.isFinite(matchId)) {
    notFound();
  }
  await api.match.getReplay.prefetch({ matchId });

  return (
    <HydrateClient>
      <main className="flex min-h-[calc(100dvh-0px)] items-start justify-center px-4 py-6">
        <div className="mx-auto w-full max-w-4xl">
          <Card className="p-2">
            <CardHeader>
              <CardTitle className="text-2xl">Match #{matchId} Replay</CardTitle>
            </CardHeader>
            <CardContent>
              <ReplayViewer matchId={matchId} />
            </CardContent>
          </Card>
        </div>
      </main>
    </HydrateClient>
  );
}


