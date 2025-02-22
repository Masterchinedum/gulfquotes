import { auth } from "@/auth"
import { redirect } from "next/navigation"

async function ManagementPage() {
  // Check authentication and authorization
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/login");
  }

  // Only allow ADMIN and AUTHOR roles
  if (session.user.role !== "ADMIN" && session.user.role !== "AUTHOR") {
    redirect("/unauthorized");
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Content Management</h1>
        <p className="text-muted-foreground">
          Welcome to the management dashboard. Use the sidebar to navigate through different sections.
        </p>
      </div>

      {/* Add dashboard stats/overview here */}
    </div>
  );
}

export default ManagementPage
