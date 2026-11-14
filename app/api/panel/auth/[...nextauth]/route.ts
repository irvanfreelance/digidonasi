import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { query } from "@/lib/panel/db";

export const panelAuthOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/panel/login",
    error: "/panel/login",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user?.email) return false;
      try {
        const result = await query(
          `SELECT id, status, role FROM admins WHERE lower(email) = lower($1) LIMIT 1`,
          [user.email]
        );
        if (result.rowCount === 0) return false;
        const admin = result.rows[0];
        if (admin.status !== "ACTIVE") return false;
        if (admin.role !== "SUPERADMIN" && admin.role !== "WEBSITE_EDITOR") return false;
        return true;
      } catch (err) {
        console.error("[Panel NextAuth] signIn error:", err);
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user?.email) {
        try {
          const result = await query(
            `SELECT id, name, email, role FROM admins WHERE lower(email) = lower($1) AND status = 'ACTIVE' LIMIT 1`,
            [user.email]
          );
          if (result.rowCount && result.rowCount > 0) {
            const admin = result.rows[0];
            token.adminId = admin.id;
            token.role = admin.role;
            token.name = admin.name;
          }
        } catch (err) {
          console.error("[Panel NextAuth] jwt error:", err);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.adminId = token.adminId as number;
        session.user.role = token.role as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(panelAuthOptions);
export { handler as GET, handler as POST };

