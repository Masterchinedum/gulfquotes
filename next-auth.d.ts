import { type DefaultSession } from "next-auth"
// import { JWT } from "next-auth/jwt"
// import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null
      email?: string | null
      image?: string | null
      role: "ADMIN" | "AUTHOR" | "USER"
      isTwoFactorEnabled: boolean
      isOAuth: boolean
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "ADMIN" | "AUTHOR" | "USER"
    isTwoFactorEnabled: boolean
    isOAuth: boolean
  }
}