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
