import UsersTable from "~/components/admin/users-table";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export default async function AdminDashboard() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="container mx-auto flex flex-col gap-4 px-4 py-16">
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage users and view system statistics
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <UsersTable />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
