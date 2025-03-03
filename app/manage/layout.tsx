import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ManageNavbar } from "./ManageNavbar";

export default async function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication and authorization
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/login");
  }

  // Only allow ADMIN and AUTHOR roles
  if (session.user.role !== "ADMIN" && session.user.role !== "AUTHOR") {
    redirect("/unauthorized");
  }

  // Check if user is admin
  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="min-h-screen flex">
      {/* Sidebar Navigation - Pass isAdmin prop from server */}
      <ManageNavbar isAdmin={isAdmin} />
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}