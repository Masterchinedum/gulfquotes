// app/users/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Shell } from "@/components/users/shell"; 
import { UsersList } from "@/components/users/users-list";

interface UsersPageProps {
  searchParams: {
    page?: string;
    search?: string;
    limit?: string;
  };
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const page = Math.max(1, Number(searchParams.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.limit) || 10));
  const search = searchParams.search?.trim();

  return (
    <Shell>
      <div className="flex flex-col gap-8 p-8">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <UsersList 
            initialPage={page} 
            initialLimit={limit}
            initialSearch={search}
          />
        </div>
      </div>
    </Shell>
  );
}