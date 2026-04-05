import { useQuery } from "@tanstack/react-query";
import { getProducts, getCategories } from "@/lib/supabase";

export const productKeys = {
  products: ["products"],
  categories: ["categories"],
};

export const productQueries = {
  products: () => ({
    queryKey: productKeys.products,
    queryFn: getProducts,
  }),
  categories: () => ({
    queryKey: productKeys.categories,
    queryFn: getCategories,
  }),
};

export const useProducts = () => useQuery(productQueries.products());
export const useCategories = () => useQuery(productQueries.categories());
