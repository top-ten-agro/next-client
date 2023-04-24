import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { DefaultLayout } from "@/layouts/DefaultLayout";

import "@/styles/globals.css";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <SessionProvider session={session} refetchInterval={300}>
      <DefaultLayout>
        <Component {...pageProps} />
      </DefaultLayout>
    </SessionProvider>
  );
};

export default MyApp;
