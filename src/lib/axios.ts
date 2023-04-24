import axios from "axios";
import { env } from "@/env.mjs";

export default axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
});
export const axiosAuth = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
});
