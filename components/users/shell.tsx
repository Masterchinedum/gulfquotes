interface ShellProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Shell({ children, className, ...props }: ShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <main
        className={cn(
          "container flex w-full flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8",
          className
        )}
        {...props}
      >
        {children}
      </main>
    </div>
  );
}