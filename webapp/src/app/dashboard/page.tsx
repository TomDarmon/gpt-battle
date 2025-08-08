import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import Link from "next/link";
import { getServerSession } from "~/server/auth";

export default async function DashboardPage() {
  const session = await getServerSession();
  const displayName = session?.user?.name ?? session?.user?.email ?? "there";

  return (
    <main className="flex min-h-[calc(100dvh-0px)] items-center justify-center px-4">
      <div className="mx-auto w-full max-w-3xl">
        <Card className="p-2">
          <CardHeader>
            <CardTitle className="text-2xl">Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>Hello, {displayName}! Welcome to your dashboard.</p>
              <div>
                <Link
                  className="text-primary underline underline-offset-4"
                  href="/dashboard/matches"
                >
                  View TicTacToe matches and replays
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}


