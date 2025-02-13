import { auth } from "@/auth";
import { SessionProvider } from "next-auth/react";
import { Navbar } from "@/components/general/Navbar";
import { Toaster } from "sonner";
import { Footer } from "@/components/general/Footer";


export default async function ProtectedLayout({ 
  children 
}: { 
  children: React.ReactNode
}) {
  const session = await auth()
  return (
    <SessionProvider session={session}>
      <div className="min-h-screen bg-background">
        <div className="flex flex-col py-4 gap-10 items-center justify-center">
          <Navbar />
          {children}
          <Footer />
          <Toaster  richColors closeButton />
        </div>
      </div>
    </SessionProvider>
  )
}