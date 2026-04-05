import { useQuery } from "@tanstack/react-query";
import { getItems, getCategories } from "@/lib/supabase";

export const menuKeys = {
  items: ["items"],
  categories: ["categories"],
};

export const menuQueries = {
  items: () => ({
    queryKey: menuKeys.items,
    queryFn: getItems,
  }),
  categories: () => ({
    queryKey: menuKeys.categories,
    queryFn: getCategories,
  }),
};

export const useItems = () => useQuery(menuQueries.items());
export const useCategories = () => useQuery(menuQueries.categories());
