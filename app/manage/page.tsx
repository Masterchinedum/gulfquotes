import Link from 'next/link'
import { Button } from "@/components/ui/button" 
import { 
  Users, 
  Quote,
  Settings,
  PlusCircle
} from "lucide-react"
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
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Content Management</h1>
        <p className="text-muted-foreground">
          Manage your quotes, author profiles and other content
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/manage/quotes/create">
          <Button variant="outline" size="lg" className="w-full justify-start">
            <PlusCircle className="mr-2 h-5 w-5" />
            Create New Quote
          </Button>
        </Link>

        <Link href="/manage/quotes">
          <Button variant="outline" size="lg" className="w-full justify-start">
            <Quote className="mr-2 h-5 w-5" />
            Manage Quotes
          </Button>
        </Link>

        <Link href="/manage/author-profiles/create">
          <Button variant="outline" size="lg" className="w-full justify-start">
            <PlusCircle className="mr-2 h-5 w-5" />
            Create Author Profile
          </Button>
        </Link>

        <Link href="/manage/author-profiles">
          <Button variant="outline" size="lg" className="w-full justify-start">
            <Users className="mr-2 h-5 w-5" />
            Manage Author Profiles
          </Button>
        </Link>

        <Link href="/users/settings">
          <Button variant="outline" size="lg" className="w-full justify-start">
            <Settings className="mr-2 h-5 w-5" />
            Account Settings
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default ManagementPage
