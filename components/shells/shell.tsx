// File: /components/shells/shell.tsx

export function Shell({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`
        w-full 
        h-full 
        min-h-screen
        flex 
        flex-col 
        ${className || ''}
      `}
      {...props}
    >
      {children}
    </div>
  );
}