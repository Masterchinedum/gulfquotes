'use server'

import { currentRole } from "@/lib/auth"

export async function authorAction() {
  const role = await currentRole()

  if (role === 'ADMIN' || role === 'AUTHOR') {
    return { success: 'Allowed Server Action!' }
  }

  return { error: 'Forbidden Server Action!' }
}