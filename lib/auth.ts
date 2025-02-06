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

// Near the top of auth.ts, improve the CustomJWT interface
interface CustomJWT extends JWT {
  role: Role;          // Make role required instead of optional
  sub?: string;        // Explicitly define sub
  credentials?: boolean;
}

const adapter = PrismaAdapter(db);

// Define auth config with proper typing
const authConfig = {
  adapter,
  callbacks: {
    // Update the jwt callback with better error handling and validation
    async jwt({ token, user, account, trigger }): Promise<CustomJWT> {
      try {
        // Handle credential provider sign in
        if (account?.provider === "credentials") {
          token.credentials = true;
        }

        // Handle initial sign in
        if (user) {
          if (!user.id) {
            throw new Error("User ID is required");
          }
          
          return {
            ...token,
            sub: user.id,
            role: (user as CustomUser).role ?? "USER",
          };
        }

        // Handle role updates
        if (trigger === "update" && token.sub) {
          const dbUser = await db.user.findUnique({
            where: { id: token.sub },
            select: { role: true }
          });

          if (!dbUser) {
            throw new Error(`User not found: ${token.sub}`);
          }

          return {
            ...token,
            role: dbUser.role
          };
        }

        // Ensure role is always set
        if (!token.role) {
          token.role = "USER";
        }

        return token as CustomJWT;
      } catch (error) {
        console.error("JWT callback error:", error);
        // Always ensure we return a valid token with at least a default role
        return {
          ...token,
          role: "USER"
        } as CustomJWT;
      }
    },

    async session({ session, token }): Promise<Session> {
      if (!token.sub) {
        throw new Error("No user ID found in token");
      }

      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
          role: token.role as Role,
          permissions: RolePermissions[token.role as Role] 
        } as UserSession,
      };
    },

    // Simplified signIn callback - only using user parameter
    async signIn({ user, account}) {
      try {
        // For OAuth providers (GitHub, Google, etc.)
        if (account && account.provider) {
          const existingUser = await db.user.findFirst({
            where: {
              email: user.email
            }
          });

          if (existingUser) {
            return true; // Allow sign in
          }

          // Create new user with provider data and default role
          const newUser = await db.user.create({
            data: {
              email: user.email,
              name: user.name,
              image: user.image,
              role: "USER", // Add default role here
              accounts: {
                create: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  type: account.type
                }
              }
            }
          });

          return !!newUser;
        }

        // For credentials provider
        if (user) {
          return true;
        }

        return false; // Reject sign in if no valid provider or user
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
