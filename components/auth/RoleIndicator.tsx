"use client";

import { Badge } from "@/components/ui/badge";
import { Role } from "@/lib/constants/roles";
import { cn } from "@/lib/utils";

interface RoleIndicatorProps {
  role: Role;
  className?: string;
}

const roleColors: Record<Role, string> = {
  ADMINISTRATOR: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  AUTHOR: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  USER: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
};

export function RoleIndicator({ role, className }: RoleIndicatorProps) {
  return (
    <Badge 
      variant="secondary" 
      className={cn(
        "font-medium",
        roleColors[role],
        className
      )}
    >
      {role.charAt(0) + role.slice(1).toLowerCase()}
    </Badge>
  );
}