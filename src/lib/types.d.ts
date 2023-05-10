import { User } from "next-auth";

export type Store = {
  id: number;
  name: string;
  address: string;
  created_at: string;
  updated_at: string;
};

export type ListResponse<T extends Record<string, unknown>> = {
  count: number;
  next: number | null;
  previous: number | null;
  results: Array<T>;
};

export type Product = {
  id: number;
  name: string;
  group_name: string;
  price: string;
  published: boolean;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

export type Stock = {
  id: number;
  product: Product;
  store: number;
  quantity: number;
  created_at: string;
  updated_at: string;
};

export type Role = {
  id: number;
  role: "MANAGER" | "DIRECTOR" | "OFFICER";
  store: number;
  user: number;
  created_at: string;
  updated_at: string;
};

export type ReStock = {
  id: number;
  store: number;
  approved: boolean;
  created_by: Pick<User, "id" | "email">;
  created_at: string;
  updated_at: string;
  items?: Array<{ product: number; quantity: number }>;
};

type Prettify<T> = {
  [K in keyof T]: T[K];
  // eslint-disable-next-line @typescript-eslint/ban-types
} & {};
