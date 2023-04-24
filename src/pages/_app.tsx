import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { DefaultLayout } from "@/layouts/DefaultLayout";

import "@/styles/globals.css";

const queryClient = new QueryClient();
const lightTheme = createTheme({
  components: {
    MuiCard: { defaultProps: { variant: "outlined" } },
  },
});

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <SessionProvider session={session} refetchInterval={300}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={lightTheme}>
          <CssBaseline />
          <DefaultLayout>
            <Component {...pageProps} />
          </DefaultLayout>
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
};

export default MyApp;
