import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  secret: process.env.AUTH_SECRET || "dealflow360-super-secret-key-offline-demo-2026",
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;
      const { pathname } = nextUrl;

      const isPublicRoute =
        pathname === "/login" || pathname.startsWith("/api/auth");
      const isCustomerRoute = pathname === "/portal" || pathname.startsWith("/portal/");
      const isInternalRoute =
        pathname === "/dashboard" ||
        pathname.startsWith("/dashboard/") ||
        pathname === "/quotations" ||
        pathname.startsWith("/quotations/") ||
        pathname === "/approvals" ||
        pathname.startsWith("/approvals/") ||
        pathname === "/fulfillment" ||
        pathname.startsWith("/fulfillment/") ||
        pathname === "/subscriptions" ||
        pathname.startsWith("/subscriptions/") ||
        pathname === "/invoices" ||
        pathname.startsWith("/invoices/") ||
        pathname === "/deal-health" ||
        pathname.startsWith("/deal-health/") ||
        pathname === "/reports" ||
        pathname.startsWith("/reports/") ||
        pathname === "/products" ||
        pathname.startsWith("/products/") ||
        pathname === "/settings" ||
        pathname.startsWith("/settings/") ||
        pathname === "/discount-approval-setup" ||
        pathname.startsWith("/discount-approval-setup/") ||
        pathname === "/admin" ||
        pathname.startsWith("/admin/");

      // Root path '/' is public for visitors, but redirects logged in users to their respective home
      if (pathname === "/") {
        if (isLoggedIn) {
          if (role === "CUSTOMER") {
            return Response.redirect(new URL("/portal", nextUrl));
          }
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      // Public routes: redirect logged in users to their respective home
      if (isPublicRoute) {
        if (isLoggedIn) {
          if (role === "CUSTOMER") {
            return Response.redirect(new URL("/portal", nextUrl));
          }
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      // Developer test harnesses
      if (pathname.startsWith("/test")) {
        return true;
      }

      // If accessing protected routes without login
      if (!isLoggedIn) {
        let callbackUrl = pathname;
        if (nextUrl.search) {
          callbackUrl += nextUrl.search;
        }
        return Response.redirect(
          new URL(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`, nextUrl)
        );
      }

      // Customer route guard:
      if (role === "CUSTOMER") {
        if (isInternalRoute || !isCustomerRoute) {
          // Block customers from all internal surfaces
          return Response.redirect(new URL("/portal", nextUrl));
        }
        return true;
      }

      // Internal user trying to access customer portal
      if (isCustomerRoute && role !== "CUSTOMER") {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      // Role-specific granular checks for internal staff
      if (pathname === "/unauthorized") {
        return true;
      }

      if (
        (pathname === "/settings" ||
          pathname.startsWith("/settings/") ||
          pathname === "/admin" ||
          pathname.startsWith("/admin/")) &&
        role !== "ADMIN"
      ) {
        return Response.redirect(new URL("/unauthorized", nextUrl));
      }

      if (
        (pathname === "/discount-approval-setup" ||
          pathname.startsWith("/discount-approval-setup/")) &&
        role !== "MANAGER" &&
        role !== "ADMIN"
      ) {
        return Response.redirect(new URL("/unauthorized", nextUrl));
      }

      return true;
    },
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
  providers: [],
} satisfies NextAuthConfig;
