import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { ToastContainer } from "react-toastify";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { DefaultLayout } from "@/layouts/DefaultLayout";
import type { ReactNode, ReactElement } from "react";
import type { NextPage } from "next";
import type { AppProps } from "next/app";
import type { Session } from "next-auth";

import "react-toastify/dist/ReactToastify.css";
import "@/styles/globals.css";

const queryClient = new QueryClient();
const lightTheme = createTheme({
  palette: {
    primary: { main: "#548070" },
  },
  components: {
    MuiCard: { defaultProps: { variant: "outlined" } },
    MuiTextField: {
      defaultProps: { fullWidth: true, variant: "outlined" },
    },
    MuiButton: {
      defaultProps: { variant: "contained", disableElevation: true },
    },
    MuiPaper: {
      defaultProps: { variant: "outlined" },
    },
  },
});

export type NextPageWithLayout<Props = NonNullable<unknown>> =
  NextPage<Props> & {
    getLayout?: (page: ReactElement) => ReactNode;
  };

type AppPropsWithLayout = AppProps<{ session: Session | null }> & {
  Component: NextPageWithLayout;
};

export default function MyApp({
  Component,
  pageProps: { session, ...pageProps },
}: AppPropsWithLayout) {
  const getLayout =
    Component.getLayout ?? ((page) => <DefaultLayout>{page}</DefaultLayout>);
  return (
    <SessionProvider session={session} refetchInterval={29 * 60}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={lightTheme}>
          <CssBaseline />
          {getLayout(<Component {...pageProps} />)}
        </ThemeProvider>
        <ToastContainer />
      </QueryClientProvider>
    </SessionProvider>
  );
}
