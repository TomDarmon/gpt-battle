import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { api, HydrateClient } from "~/trpc/server";
import { MatchesList } from "../../../components/tictactoe/matches-list";

export default async function MatchesPage() {
  await api.match.listMatches.prefetch();

  return (
    <HydrateClient>
      <main className="flex min-h-[calc(100dvh-0px)] items-start justify-center px-4 py-6">
        <div className="mx-auto w-full max-w-4xl">
          <Card className="p-2">
            <CardHeader>
              <CardTitle className="text-2xl">TicTacToe Matches</CardTitle>
            </CardHeader>
            <CardContent>
              <MatchesList />
            </CardContent>
          </Card>
        </div>
      </main>
    </HydrateClient>
  );
}


