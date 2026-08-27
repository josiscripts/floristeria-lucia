export type GHLProduct = {
  id: string;
  name: string;
  description?: string;
  price?: number;
  cost?: number;
  image?: string;
  images?: string[];
  sku?: string;
  category?: string;
  status?: "active" | "inactive";
  inventory?: number;
  [key: string]: unknown; // Allow custom fields
};

export type GHLProductsResponse = {
  products: GHLProduct[];
  total: number;
  pageSize: number;
  currentPage: number;
};

export type GHLError = {
  message: string;
  code?: string;
  statusCode?: number;
};
