import Link from "next/link";
import { Button } from "~/components/ui/button";
import { getServerSession } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";

export default async function Home() {
  const session = await getServerSession();

  return (
    <HydrateClient>
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="mx-auto w-full max-w-md px-4">
          <div className="text-center space-y-8">
            <div className="space-y-2">
              <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                GPT Battle
              </h1>
            </div>
            
            <div className="space-y-4">
              {!session ? (
                <div className="flex flex-col gap-3">
                  <Button asChild size="lg" className="w-full">
                    <Link href="/signin">Sign in</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="w-full">
                    <Link href="/signup">Sign up</Link>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Button asChild size="lg" className="w-full">
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="w-full">
                    <Link href="/api/auth/sign-out">Sign out</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
