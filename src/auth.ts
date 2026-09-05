import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = (credentials.email as string).trim().toLowerCase();
        const password = credentials.password as string;

        // 1. Check internal staff User
        const internalUser = await prisma.user.findUnique({
          where: { email },
        });

        if (internalUser && internalUser.passwordHash) {
          const isValid = await bcrypt.compare(password, internalUser.passwordHash);
          if (isValid) {
            return {
              id: internalUser.id,
              name: internalUser.name,
              email: internalUser.email,
              role: internalUser.role,
              customerId: null,
            };
          }
        }

        // 2. Check CustomerUser
        const customerUser = await prisma.customerUser.findUnique({
          where: { email },
          include: { customer: true },
        });

        if (customerUser && customerUser.passwordHash) {
          const isValid = await bcrypt.compare(password, customerUser.passwordHash);
          if (isValid) {
            return {
              id: customerUser.id,
              name: customerUser.customer.name,
              email: customerUser.email,
              role: "CUSTOMER",
              customerId: customerUser.customerId,
            };
          }
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.customerId = user.customerId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.customerId = token.customerId as string | null;
      }
      return session;
    },
  },
});
