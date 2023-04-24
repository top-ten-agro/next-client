import { type GetServerSidePropsContext } from "next";
import jwtDecode from "jwt-decode";
import {
  getServerSession,
  type NextAuthOptions,
  type DefaultSession,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { env } from "@/env.mjs";

type TokenObject = {
  exp: number;
  user_id: number;
  email: string;
};
type TokenResponse = {
  refresh: string;
  access: string;
};

declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken: string;
    refreshToken: string;
    error?: string;
    user: {
      id: number;
      email: string;
    };
  }
  interface User {
    id: number;
    email: string;
    accessToken: string;
    refreshToken: string;
  }
}

export const authOptions: NextAuthOptions = {
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.email = user.email;
        token.id = user.id;
      }

      const { exp } = jwtDecode<TokenObject>(token.accessToken as string);

      if (exp * 1000 > Date.now()) {
        return token;
      }
      const data = await refreshAccessToken(token.refreshToken as string);

      if (!data) {
        token.error = "RefreshTokenError";
        return token;
      }
      token.error = null;
      token.accessToken = data.access;
      token.refreshToken = data.refresh;
      return token;
    },
    session: ({ session, token }) => {
      session.user = {
        id: token.id as number,
        email: token.email as string,
      };
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      session.error = token.error as string | undefined;

      return session;
    },
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", required: true },
        password: { label: "Password", type: "password", required: true },
      },
      authorize: async (credentials) => {
        try {
          const res = await fetch(env.NEXT_PUBLIC_API_URL + "api/auth/token/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials),
            next: { revalidate: 0 },
          });

          if (!res.ok) {
            return null;
          }
          const data = (await res.json()) as TokenResponse;
          const { user_id, email } = jwtDecode<TokenObject>(data.access);
          return {
            id: user_id,
            email,
            accessToken: data.access,
            refreshToken: data.refresh,
          };
        } catch (e) {
          console.error(e);
          if (e && typeof e === "object" && "message" in e)
            throw new Error(e.message as string);
          return null;
        }
      },
    }),
  ],
  secret: env.NEXTAUTH_SECRET,
  theme: {
    colorScheme: "light",
  },
};

export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};

async function refreshAccessToken(token: string) {
  const res = await fetch(env.NEXT_PUBLIC_API_URL + "api/auth/token/refresh/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: token }),
  });

  if (!res.ok) {
    return null;
  }
  return (await res.json()) as TokenResponse;
}
