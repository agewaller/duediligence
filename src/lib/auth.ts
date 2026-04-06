import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";

const ADMIN_EMAILS = ["agewaller@gmail.com"];

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  events: {
    async createUser({ user }) {
      if (user.email && ADMIN_EMAILS.includes(user.email)) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "admin" },
        });
      }
    },
    async signIn({ user }) {
      if (user.email && ADMIN_EMAILS.includes(user.email)) {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (dbUser && dbUser.role !== "admin") {
          await prisma.user.update({
            where: { id: user.id },
            data: { role: "admin" },
          });
        }
      }
    },
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id = user.id;
        (session.user as Record<string, unknown>).role = (user as unknown as Record<string, unknown>).role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};
