import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider, createTheme } from "@mui/material";
import { DefaultLayout } from "@/layouts/DefaultLayout";

import "@/styles/globals.css";

const queryClient = new QueryClient();
const theme = createTheme({});

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <SessionProvider session={session} refetchInterval={300}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <DefaultLayout>
            <Component {...pageProps} />
          </DefaultLayout>
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
};

export default MyApp;
