import { useEffect } from "react";
import Head from "next/head";
import Router from "next/router";
import NextLink from "next/link";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { signIn, useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Grid from "@mui/material/Unstable_Grid2";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import LoadingButton from "@mui/lab/LoadingButton";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import LinearProgress from "@mui/material/LinearProgress";
import AuthLayout from "@/layouts/AuthLayout";
import { AxiosError } from "axios";
import { toast } from "react-toastify";
import axios from "@/lib/axios";
import type { NextPageWithLayout } from "./_app";
import type { User } from "next-auth";

const schema = z
  .object({
    first_name: z.string({ required_error: "First Name is required." }).max(30),
    last_name: z.string({ required_error: "Last Name is required." }).max(30),
    email: z
      .string({ required_error: "Email is required." })
      .email("Invalid email format"),
    phone: z
      .string({ required_error: "Phone Number is required." })
      .min(11, "Phone Number is too short")
      .regex(/^(\+)?(88)?01[0-9]{9}$/, "Please enter a valid phone number."),
    password: z
      .string({ required_error: "Password is required." })
      .min(8, "Password is too short"),
    confirm: z
      .string({ required_error: "Confirm Password is required." })
      .min(8, "Password is too short"),
  })
  .refine(({ password, confirm }) => password === confirm, {
    message: "Passwords don't match.",
    path: ["confirm"],
  });

const RegisterUser: NextPageWithLayout = () => {
  const { status } = useSession();

  const { control, formState, handleSubmit } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      first_name: "",
      last_name: "",
      phone: "",
      password: "",
      confirm: "",
    },
  });
  const { mutate: registeruser, isLoading } = useMutation({
    mutationKey: ["register"],
    mutationFn: async (data: z.infer<typeof schema>) => {
      await axios.post<User>("api/auth/register/", {
        ...data,
        confirm: undefined,
      });
      return data;
    },
    onSuccess: async (data) => {
      await signIn("credentials", {
        redirect: true,
        email: data.email,
        password: data.password,
      });
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.data) {
        const data = error.response.data as Record<string, Array<string>>;
        Object.keys(data).forEach((key) =>
          toast.error(`${data[key]?.join(", ") ?? ""}`)
        );
      }
    },
  });

  useEffect(() => {
    if (status === "authenticated") {
      void Router.push("/");
    }
  }, [status]);

  const performRegister = handleSubmit((data) => registeruser(data));

  return (
    <>
      <Head>
        <title>{`Employee Registration | Top Ten`}</title>
        <meta name="description" content={"user registration"} />
      </Head>
      <Container sx={{ pt: 2 }}>
        <Box sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
          <Typography fontSize={24} fontWeight={"bold"} mb={2}>
            Employee Registration
          </Typography>
          {status === "loading" ? <LinearProgress /> : null}
          {status === "unauthenticated" ? (
            <Box
              component={"form"}
              onSubmit={(e) => void performRegister(e)}
              sx={{ mb: 1 }}
            >
              <Grid container spacing={2}>
                <Grid xs={12} sm={6}>
                  <Controller
                    control={control}
                    name="first_name"
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="First Name"
                        helperText={formState.errors.first_name?.message}
                        error={!!formState.errors.first_name}
                      />
                    )}
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <Controller
                    control={control}
                    name="last_name"
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Last Name"
                        helperText={formState.errors.last_name?.message}
                        error={!!formState.errors.last_name}
                      />
                    )}
                  />
                </Grid>
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
                    name="phone"
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Phone Number"
                        type="tel"
                        helperText={formState.errors.phone?.message}
                        error={!!formState.errors.phone}
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
                <Grid xs={12}>
                  <Controller
                    control={control}
                    name="confirm"
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Confirm Password"
                        type="password"
                        helperText={formState.errors.confirm?.message}
                        error={!!formState.errors.confirm}
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
                    Register
                  </LoadingButton>
                </Grid>
              </Grid>
              <Box sx={{ mt: 2 }} />
              <Link component={NextLink} href="/signin">
                Already have an account? Sign in instead.
              </Link>
            </Box>
          ) : null}
        </Box>
      </Container>
      ;
    </>
  );
};

RegisterUser.getLayout = (page) => <AuthLayout>{page}</AuthLayout>;

export default RegisterUser;
