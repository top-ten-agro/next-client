/* eslint-disable @typescript-eslint/restrict-template-expressions */

import { axiosAuth } from "../axios";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

const useAxiosAuth = () => {
  const { data: session } = useSession({ required: true });

  useEffect(() => {
    const requestIntercept = axiosAuth.interceptors.request.use(
      (config) => {
        if (!config.headers["Authorization"]) {
          config.headers["Authorization"] = `Bearer ${session?.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      axiosAuth.interceptors.request.eject(requestIntercept);
    };
  }, [session?.accessToken]);

  return axiosAuth;
};

export default useAxiosAuth;
