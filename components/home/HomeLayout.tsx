import { cn } from "@/lib/utils";

interface HomeLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  className?: string;
}

export function HomeLayout({ children, sidebar, className }: HomeLayoutProps) {
  return (
    <div className={cn("container py-8 md:py-12", className)}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content */}
        <main className="col-span-1 lg:col-span-8 space-y-8">
          {children}
        </main>

        {/* Sidebar */}
        <aside className="col-span-1 lg:col-span-4 space-y-6">
          {sidebar}
        </aside>
      </div>
    </div>
  );
}