import { v4 as uuid } from "uuid";
import { encode as defaultEncode } from "next-auth/jwt";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Role } from "@/lib/constants/roles";
import type { Session, UserSession } from "@/lib/session";
// import type { User as PrismaUser } from "@prisma/client";
import type { JWT } from "next-auth/jwt";
import type { AdapterUser } from "@auth/core/adapters";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import db from "@/lib/db/db";
import { schema } from "@/lib/schema";

// Define custom types
type CustomUser = AdapterUser & {
  role: Role;
};

interface CustomJWT extends JWT {
  role?: Role;
  credentials?: boolean;
}

const adapter = PrismaAdapter(db);

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true
    }),
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET,
      allowDangerousEmailAccountLinking: true
    }),
    GitHub({
      allowDangerousEmailAccountLinking: true
    }),
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const validatedCredentials = schema.parse(credentials);

        const user = await db.user.findFirst({
          where: {
            email: validatedCredentials.email,
            password: validatedCredentials.password,
          },
        });

        if (!user) {
          throw new Error("Invalid credentials.");
        }

        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, trigger }): Promise<CustomJWT> {
      if (account?.provider === "credentials") {
        token.credentials = true;
      }
      
      // Include role in the token when user signs in
      if (user) {
        token.role = (user as CustomUser).role;
      }

      // Handle role updates
      if (trigger === "update" && token.sub) {
        const userFromDb = await db.user.findUnique({
          where: { id: token.sub }
        });
        if (userFromDb) {
          token.role = userFromDb.role;
        }
      }

      return token as CustomJWT;
    },

    async session({ session, token, user }): Promise<Session> {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub ?? user.id,
          role: (token as CustomJWT).role ?? (user as CustomUser).role ?? "USER",
        } as UserSession,
      };
    },

    // Simplified signIn callback - only using user parameter
    async signIn({ user }) {
      if (!(user as CustomUser).role) {
        try {
          await db.user.update({
            where: { id: user.id },
            data: { role: "USER" },
          });
        } catch (error) {
          console.error("Error assigning default role:", error);
          return false;
        }
      }
      return true;
    },
  },
  events: {
    async createUser({ user }) {
      // Set default role for new users
      await db.user.update({
        where: { id: user.id },
        data: { role: "USER" },
      });
    },
  },
  pages: {
    signIn: '/login',
    error: '/error',
  },
  jwt: {
    encode: async function (params) {
      if (params.token?.credentials) {
        const sessionToken = uuid();

        if (!params.token.sub) {
          throw new Error("No user ID found in token");
        }

        const createdSession = await adapter?.createSession?.({
          sessionToken: sessionToken,
          userId: params.token.sub,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });

        if (!createdSession) {
          throw new Error("Failed to create session");
        }

        return sessionToken;
      }
      return defaultEncode(params);
    },
  },
});

// Update helper functions with proper types
export async function verifyRole(userId: string, role: Role): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return user?.role === role;
}

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
    },
  });
}
