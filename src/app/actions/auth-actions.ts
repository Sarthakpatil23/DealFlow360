"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

export async function loginWithCredentials(
  prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  try {
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const password = formData.get("password") as string;
    const rawCallbackUrl = (formData.get("callbackUrl") as string)?.trim();

    if (!email || !password) {
      return { error: "Email and password are required." };
    }

    // Determine proper destination: respect specific callbackUrl if not root or login, otherwise route by role
    let callbackUrl = rawCallbackUrl;
    if (!callbackUrl || callbackUrl === "/" || callbackUrl.startsWith("/login")) {
      const internalUser = await prisma.user.findUnique({ where: { email } });
      callbackUrl = internalUser ? "/dashboard" : "/portal";
    }

    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password. Please verify credentials." };
        default:
          return { error: "Authentication failed. Please check your credentials." };
      }
    }
    // In Next.js Server Actions, redirect() throws a NEXT_REDIRECT error which must be rethrown
    throw error;
  }
}

export async function signupAction(
  prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  try {
    const accountType = (formData.get("accountType") as string) || "INTERNAL";
    const name = (formData.get("name") as string)?.trim();
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const password = formData.get("password") as string;
    const roleString = (formData.get("role") as string) || "REP";
    const companyName = (formData.get("companyName") as string)?.trim();

    if (!email || !password || !name) {
      return { error: "Name, email, and password are all required." };
    }

    if (password.length < 6) {
      return { error: "Password must be at least 6 characters." };
    }

    // Check if email is already registered in either table
    const existingInternal = await prisma.user.findUnique({ where: { email } });
    if (existingInternal) {
      return { error: "An account with this email already exists." };
    }

    const existingCustomerUser = await prisma.customerUser.findUnique({ where: { email } });
    if (existingCustomerUser) {
      return { error: "An account with this email already exists." };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    if (accountType === "CUSTOMER") {
      const customerCompName = companyName || `${name}'s Organization`;
      // Find or create customer
      let customer = await prisma.customer.findFirst({
        where: { name: customerCompName },
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            name: customerCompName,
            tier: "BRONZE",
            preferredCurrency: "USD",
          },
        });
      }

      await prisma.customerUser.create({
        data: {
          email,
          passwordHash,
          customerId: customer.id,
        },
      });

      await signIn("credentials", {
        email,
        password,
        redirectTo: "/portal",
      });
    } else {
      // Internal staff
      const validRole = (Object.values(UserRole).includes(roleString as UserRole)
        ? roleString
        : "REP") as UserRole;

      await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: validRole,
        },
      });

      await signIn("credentials", {
        email,
        password,
        redirectTo: "/dashboard",
      });
    }

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Failed to automatically sign in after registration." };
    }
    // Next.js redirect errors must be rethrown
    if ((error as any)?.message?.includes("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("Signup error:", error);
    return { error: "An unexpected error occurred during account creation." };
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

/**
 * 1-Click Persona Switcher for seamless testing and demonstration of the
 * complete approval and customer negotiation lifecycle (project.md).
 */
export async function switchPersonaAction(targetEmail: string, redirectUrl?: string) {
  let normalizedEmail = targetEmail.trim().toLowerCase();
  if (normalizedEmail === "rep.rao@dealflow.com" || normalizedEmail === "rao@dealflow.com") {
    normalizedEmail = "jrao@dealflow.com";
  }

  // Determine appropriate redirect destination
  let destination = redirectUrl;
  if (!destination || destination === "/" || destination === "/login") {
    if (normalizedEmail === "procurement@acme.com" || normalizedEmail.includes("acme")) {
      destination = "/portal";
    } else {
      destination = "/dashboard";
    }
  }

  // If switching from portal to internal user, prevent redirecting back to /portal
  if (normalizedEmail !== "procurement@acme.com" && destination.startsWith("/portal")) {
    destination = "/dashboard";
  }

  // If switching from internal to customer user, prevent redirecting to internal dashboard
  if (normalizedEmail === "procurement@acme.com" && !destination.startsWith("/portal")) {
    destination = "/portal";
  }

  try {
    await signIn("credentials", {
      email: normalizedEmail,
      password: "password123",
      redirectTo: destination,
    });
  } catch (error) {
    if ((error as any)?.message?.includes("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("switchPersonaAction error:", error);
    throw error;
  }
}

