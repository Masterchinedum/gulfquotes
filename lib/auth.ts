import { v4 as uuid } from "uuid";
import { encode as defaultEncode } from "next-auth/jwt";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Role, RolePermissions } from "@/lib/constants/roles";
import type { Session, UserSession } from "@/lib/session";
import type { JWT } from "next-auth/jwt";
import type { AdapterUser } from "@auth/core/adapters";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import db from "@/lib/db/db";
import { schema } from "@/lib/schema";
import { NextAuthConfig } from "next-auth";

// Define custom types
type CustomUser = AdapterUser & {
  role: Role;
};

interface CustomJWT extends JWT {
  role?: Role;
  credentials?: boolean;
}

const adapter = PrismaAdapter(db);

// Define auth config with proper typing
const authConfig = {
  adapter,
  session: {
    strategy: "database", // Change from "jwt" to "database" since you're using Prisma adapter
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, trigger }): Promise<CustomJWT> {
      if (user) {
        const customUser = user as CustomUser; // Cast to CustomUser type
        token.role = customUser.role ?? "USER";
        token.id = customUser.id;
      }

      // Handle role updates
      if (trigger === "update" && token.sub) {
        const dbUser = await db.user.findUnique({
          where: { id: token.sub },
          select: { role: true },
        }) as CustomUser | null;
        token.role = dbUser?.role ?? "USER";
      }

      return token as CustomJWT;
    },

    async session({ session, token, user }): Promise<Session> {
      // Use token role as source of truth
      const role = token.role ?? user?.role ?? "USER";

      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub ?? user.id,
          role,
          permissions: RolePermissions[role],
        } as UserSession,
      };
    },

    async signIn({ user, account }) {
      try {
        if (!user?.email) {
          console.error("No email provided");
          return false;
        }

        if (account?.provider) {
          const existingUser = await db.user.findFirst({
            where: { email: user.email },
            select: { id: true, role: true },
          });

          if (existingUser) {
            // Update role if not set
            if (!existingUser.role) {
              await db.user.update({
                where: { id: existingUser.id },
                data: { role: "USER" },
              });
            }
            return true;
          }

          // Create new user with provider data and default role
          try {
            const newUser = await db.user.create({
              data: {
                email: user.email,
                name: user.name ?? "",
                image: user.image ?? "",
                role: "USER",
                accounts: {
                  create: {
                    provider: account.provider,
                    providerAccountId: account.providerAccountId,
                    type: account.type,
                  },
                },
              },
            });

            return !!newUser;
          } catch (createError) {
            console.error("Error creating new user:", createError);
            return false;
          }
        }

        // For credentials provider
        return true;
      } catch (error) {
        console.error("Sign in error:", error);
        return false;
      }
    },
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    GitHub({
      allowDangerousEmailAccountLinking: true,
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
    signIn: "/login",
    error: "/error",
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
} satisfies NextAuthConfig;

// Export auth handlers with config
export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);

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
