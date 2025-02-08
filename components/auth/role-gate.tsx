'use client'

import { useCurrentRole } from "@/hooks/use-current-role"
import { FormError } from "../form-error"
import { UserRole } from "@prisma/client"

interface RoleGateProps {
  children: React.ReactNode
  allowedRole: UserRole | UserRole[]
}

export function RoleGate({children, allowedRole}: RoleGateProps) {
  const role = useCurrentRole()

  if (!role) {
    return <FormError message="You do not have permission to view this content!" />
  }

  const isAllowed = Array.isArray(allowedRole) 
    ? allowedRole.includes(role)
    : role === allowedRole

  if (!isAllowed) {
    return <FormError message="You do not have permission to view this content!" />
  }

  return <>{children}</>
}