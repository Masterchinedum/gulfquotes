// app/(general)/users/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Shell } from "@/components/users/shell"; 
import { UsersList } from "@/components/users/users-list";

// Next.js Page Props interface
interface SearchParams {
  search?: string;
  limit?: string;
}

interface PageProps {
  searchParams: SearchParams;
}

export default async function UsersPage({ searchParams }: PageProps) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  // Extract and validate search params
  const limit = Math.min(50, Math.max(1, Number(searchParams.limit) || 10));
  const search = searchParams.search?.trim();

  return (
    <Shell>
      <div className="flex flex-col gap-8 p-8">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <UsersList 
            initialLimit={limit}
            pageSize={10}
            initialSearch={search}
          />
        </div>
      </div>
    </Shell>
  );
}