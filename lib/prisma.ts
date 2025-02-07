// import { PrismaClient } from '@prisma/client'

// declare global {
//   var prisma: PrismaClient | undefined
// }

// export const db = globalThis.prisma || new PrismaClient({
//   log: ['info', 'warn', 'error']
// })

// if (process.env.NODE_ENV !== 'production') globalThis.prisma = db

import { PrismaClient } from "@prisma/client";


const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const db = globalThis.prismaGlobal ?? prismaClientSingleton();

export default db;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = db;