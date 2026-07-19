import { requireAdmin } from "@/lib/auth/session";
import { getUsers } from "@/lib/queries/users";
import { UserForm } from "@/components/users/user-form";
import { UserList } from "@/components/users/user-list";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  // Admin-only. Redirects non-admins to the dashboard.
  const admin = await requireAdmin();
  const users = await getUsers();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          Create accounts and manage who can access the tracker.
        </p>
      </div>

      <section className="glass space-y-4 rounded-2xl border border-border/60 p-6">
        <h2 className="text-base font-semibold">Add a user</h2>
        <UserForm />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">
          All users
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {users.length}
          </span>
        </h2>
        <UserList users={users} currentUserId={admin.id} />
      </section>
    </div>
  );
}
