import db from "@/lib/db/db";
import { Role } from "@prisma/client";

export async function updateExistingUsers() {
  try {
    // Update users where role is not set
    await db.user.updateMany({
      where: {
        role: undefined
      },
      data: {
        role: "USER" as Role
      }
    });

    // Optional: Update any potential non-standard roles to USER
    await db.user.updateMany({
      where: {
        NOT: {
          role: {
            in: ["ADMINISTRATOR", "AUTHOR", "USER"]
          }
        }
      },
      data: {
        role: "USER" as Role
      }
    });

    console.log("Successfully updated existing users with default role");
  } catch (error) {
    console.error("Error updating existing users:", error);
    throw error;
  }
}