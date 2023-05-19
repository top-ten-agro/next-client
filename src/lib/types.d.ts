import type { User } from "next-auth";

export type Depot = {
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
  pack_size: string;
  price: string;
  published: boolean;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductStock = {
  id: number;
  product: Product;
  depot: number;
  quantity: number;
  created_at: string;
  updated_at: string;
};

export type Role = {
  id: number;
  role: "MANAGER" | "DIRECTOR" | "OFFICER";
  depot: number;
  user: number;
  created_at: string;
  updated_at: string;
};
export type UserRole = Prettify<Omit<Role, "user"> & { user: User }>;

export type ReStock = {
  id: number;
  depot: number;
  approved: boolean;
  created_by: Pick<User, "id" | "email">;
  created_at: string;
  updated_at: string;
  items?: Array<{ product: number; quantity: number }>;
};

export type Customer = {
  id: number;
  name: string;
  phone: string;
  created_at: string;
  updated_at: string;
  address: string;
};

export type Balance = {
  id: number;
  cash_in: string;
  sales: string;
  customer: number;
  depot: number;
  created_at: string;
  updated_at: string;
};

export type CustomerBalance = Prettify<
  Omit<Balance, "customer"> & { customer: Customer; officer: UserRole | null }
>;

export type Order = {
  id: number;
  subtotal: string;
  total: string;
  commission: string;
  approved: boolean;
  balance: { id: number; customer: Prettify<Pick<Customer, "id" | "name">> };
  items: Array<{ product: number; quantity: number; rate: string }>;
  created_at: string;
  updated_at: string;
  created_by: Prettify<Pick<User, "id" | "email">>;
};

export type Transaction = Prettify<{
  id: number;
  category: "SALES" | "TRANSPORT" | "BILL";
  cash_in: string;
  cash_out: string;
  title: string;
  note: string | null;
  approved: boolean;
  depot: number;
  balance: { id: number; customer: Prettify<Pick<Customer, "id" | "name">> };
  created_by: Pick<User, "id" | "email">;
  created_at: string;
  updated_at: string;
}>;

type Prettify<T> = {
  [K in keyof T]: T[K];
  // eslint-disable-next-line @typescript-eslint/ban-types
} & {};
