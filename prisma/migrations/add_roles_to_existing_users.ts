// (prisma/migrations/add_roles_to_existing_users.ts)
export async function updateExistingUsers() {
    try {
      await db.user.updateMany({
        where: {
          role: null
        },
        data: {
          role: "USER" // Set default role for all existing users
        }
      });
      console.log("Successfully updated existing users with default role");
    } catch (error) {
      console.error("Error updating existing users:", error);
      throw error;
    }
  }