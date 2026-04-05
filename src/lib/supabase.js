import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
);

export const getCurrentUser = async () => {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  return { ...session.user, ...profile };
};

const fetchData = async (
  table,
  errorMessage,
  sortColumn = "id",
  ascending = true,
) => {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .order(sortColumn, { ascending });
  if (error) {
    console.error(`Error fetching ${table}:`, error.message);
    throw new Error(errorMessage);
  }
  return data || [];
};

export const getProducts = () =>
  fetchData("products", "Failed to fetch products");
export const getCategories = () =>
  fetchData("categories", "Failed to fetch categories");

export const getOrders = () =>
  fetchData("orders", "Failed to fetch orders", "invoice", true);
export const getOrderItems = () =>
  fetchData("order_items", "Failed to fetch order items");

export const getProfiles = () =>
  fetchData("profiles", "Failed to fetch profiles", "role", true);

export const getCustomers = () =>
  fetchData("customers", "Failed to fetch customers");

export const getShipping = () =>
  fetchData("shipping", "Failed to fetch shipping data");

export const getShippingRates = () =>
  fetchData("shipping_rates", "Failed to fetch shipping rates data");
