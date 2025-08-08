"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { type AuthUserType } from "~/server/auth";
import { authClient } from "~/server/auth/client";
// import ImpersonateUser from "./impersonate-user";

export default function UsersTable() {
  const {
    isLoading,
    data: users,
    error,
  } = useQuery({
    queryKey: ["admin_list_user"],
    queryFn: async () =>
      await authClient.admin.listUsers({
        query: { limit: 10 },
      }),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <span>Loading users...</span>
      </div>
    );
  }

  if (error || !users?.data?.users) {
    return (
      <div className="flex justify-center p-4">
        <span className="text-red-500">
          Error: {error?.message ?? "Fetch Failed!!!"}
        </span>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Verified</TableHead>
          <TableHead>Premium</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(users.data.users as AuthUserType[]).map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.role}</TableCell>
            <TableCell>{user.emailVerified ? "Yes" : "No"}</TableCell>
            <TableCell>{user.isPremium ? "Yes" : "No"}</TableCell>
            <TableCell>
              {user.banned ? (
                <span className="text-red-500">Banned</span>
              ) : (
                <span className="text-green-500">Active</span>
              )}
            </TableCell>
            <TableCell>
              {new Date(user.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell>{/* <ImpersonateUser userId={user.id} /> */}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
