// Create new file: lib/db/migrations/ensure-user-roles.ts
import db from '../db';  // Change from import { db } to import db
import { Role } from '@prisma/client';

export async function ensureUserRoles() {
  try {
    // Update users with undefined or invalid roles
    const updated = await db.user.updateMany({
      where: {
        OR: [
          { role: { not: { in: ['ADMINISTRATOR', 'AUTHOR', 'USER'] } } },
          { role: undefined }
        ]
      },
      data: {
        role: 'USER' as Role
      }
    });
    
    console.log(`Updated ${updated.count} users with default role`);
    return true;
  } catch (error) {
    console.error('Failed to update user roles:', error);
    return false;
  }
}