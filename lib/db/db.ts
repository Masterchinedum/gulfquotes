import { PrismaClient } from "@prisma/client";
import { ensureUserRoles } from './migrations/ensure-user-roles'; // Add this import

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const db = globalThis.prismaGlobal ?? prismaClientSingleton();

export default db;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = db;

async function verifyConnection() {
  try {
    await db.$connect();
    // Test query
    await db.user.findFirst();
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  } finally {
    await db.$disconnect();
  }
}

// Export the verification function
export { verifyConnection };

export async function initializeDatabase() {
  try {
    // Verify connection
    const isConnected = await verifyConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }

    // Ensure user roles are set
    await ensureUserRoles();

    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    return false;
  }
}
