import { useEffect } from "react";
import Head from "next/head";
import Router, { useRouter } from "next/router";
import NextLink from "next/link";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { signIn, useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Grid from "@mui/material/Unstable_Grid2";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import LoadingButton from "@mui/lab/LoadingButton";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import LinearProgress from "@mui/material/LinearProgress";
import AuthLayout from "@/layouts/AuthLayout";
import type { NextPageWithLayout } from "./_app";

const schema = z.object({
  email: z
    .string({ required_error: "Email is required." })
    .email("Invalid email format"),
  password: z.string({ required_error: "Password is required." }),
});

const SignIn: NextPageWithLayout = () => {
  const { status } = useSession();
  const router = useRouter();

  const { control, formState, handleSubmit } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const { mutate: signinUser, isLoading } = useMutation({
    mutationKey: ["signin"],
    mutationFn: async (data: z.infer<typeof schema>) => {
      await signIn("credentials", {
        redirect: true,
        email: data.email,
        password: data.password,
      });
    },
  });

  useEffect(() => {
    if (status === "authenticated") {
      void Router.push("/");
    }
  }, [status]);

  const performSignin = handleSubmit((data) => signinUser(data));

  return (
    <>
      <Head>
        <title>{`Employee Sign In | Top Ten`}</title>
        <meta name="description" content={"employee sign in."} />
      </Head>
      <Container sx={{ pt: 2 }}>
        <Box sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
          <Typography fontSize={24} fontWeight={"bold"} mb={2}>
            Employee Sign In
          </Typography>
          {router.query.error === "CredentialsSignin" ? (
            <Typography color={"error"}>
              Could not find an active account with your email and password.
            </Typography>
          ) : null}
          {status === "loading" ? <LinearProgress /> : null}
          {status === "unauthenticated" ? (
            <Box
              component={"form"}
              onSubmit={(e) => void performSignin(e)}
              sx={{ mb: 1 }}
            >
              <Grid container spacing={2}>
                <Grid xs={12}>
                  <Controller
                    control={control}
                    name="email"
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Email"
                        type="email"
                        helperText={formState.errors.email?.message}
                        error={!!formState.errors.email}
                      />
                    )}
                  />
                </Grid>

                <Grid xs={12}>
                  <Controller
                    control={control}
                    name="password"
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Password"
                        type="password"
                        helperText={formState.errors.password?.message}
                        error={!!formState.errors.password}
                      />
                    )}
                  />
                </Grid>

                <Grid>
                  <LoadingButton
                    variant="contained"
                    size="large"
                    type="submit"
                    loading={isLoading}
                  >
                    Sign In
                  </LoadingButton>
                </Grid>
              </Grid>
              <Box sx={{ mt: 2 }} />
              <Link component={NextLink} href="/register">
                {"Don't have an account? Register now."}
              </Link>
            </Box>
          ) : null}
        </Box>
      </Container>
      ;
    </>
  );
};

SignIn.getLayout = (page) => <AuthLayout>{page}</AuthLayout>;

export default SignIn;
