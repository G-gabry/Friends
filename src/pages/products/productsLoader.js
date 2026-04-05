import { queryClient } from "@/lib/queryClient";
import { productQueries } from "@/hooks/useProductsQuery";

export const productsLoader = async () => {
  await Promise.all([
    queryClient.ensureQueryData(productQueries.products()),
    queryClient.ensureQueryData(productQueries.categories()),
  ]);
  return null;
};
