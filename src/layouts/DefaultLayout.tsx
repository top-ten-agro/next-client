import { useEffect } from "react";
import type { ReactNode } from "react";
import { signOut, useSession } from "next-auth/react";

export const DefaultLayout = ({ children }: { children: ReactNode }) => {
  const { data: session } = useSession({ required: true });

  useEffect(() => {
    if (!!session?.error) {
      void signOut({ callbackUrl: "/", redirect: true });
    }
  }, [session]);

  return <div>{children}</div>;
};
