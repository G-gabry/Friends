import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import AlertDialogDestructive from "@/pages/products/DeleteButton";
import EditProduct from "./EditProduct";
import { CirclePlus, Ruler, Palette, Barcode } from "lucide-react";
import AddCategory from "./AddCategory";
import CategoryButtons from "./CategoryButtons";

import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useProducts, useCategories } from "@/hooks/useProductsQuery";

export default function ProductsPage() {
  const { t } = useTranslation();
  const [activeCategoryId, setActiveCategoryId] = useState("all");

  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();

  const { user } = useAuth();

  const filteredProducts = useMemo(() => {
    if (activeCategoryId === "all") return products;
    return products.filter(
      (product) => product.category_id === activeCategoryId,
    );
  }, [products, activeCategoryId]);

  const category = useMemo(
    () => categories.find((cat) => cat.id === activeCategoryId),
    [categories, activeCategoryId],
  );

  return (
    <Tabs defaultValue="all" onValueChange={setActiveCategoryId}>
      {/* categories */}
      <TabsList className="flex w-full justify-start overflow-x-auto overflow-y-hidden whitespace-nowrap rounded-lg bg-muted p-1 scrollbar-hide">
        <TabsTrigger value="all" className="shrink-0 cursor-pointer">
          {t("new_order.all")}
        </TabsTrigger>

        {categories.map((category) => {
          return (
            <TabsTrigger
              value={category.id}
              key={category.id}
              className="shrink-0 cursor-pointer"
            >
              {category.name}
            </TabsTrigger>
          );
        })}

        <TabsTrigger
          value="AddCategory"
          className="shrink-0 cursor-pointer text-[#2e9014] "
        >
          <CirclePlus />
        </TabsTrigger>
      </TabsList>

      {/* products */}
      <TabsContent value={activeCategoryId}>
        {activeCategoryId == "AddCategory" ? (
          <AddCategory owner_id={user?.id ?? ""} />
        ) : (
          <>
            {activeCategoryId !== "all" && (
              <CategoryButtons category={category} />
            )}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5 my-3">
                {filteredProducts.map((product) => {
                  return (
                    <Card
                      className="relative mx-auto w-full max-w-sm pt-0 overflow-hidden items-between"
                      key={product.id}
                    >
                      <div className="absolute inset-0 z-30 aspect-video bg-black/25 " />
                      <img
                        src={product.image_url}
                        alt={product.name}
                        loading="lazy"
                        className="relative z-20 aspect-video w-full object-cover "
                      />
                      <Badge
                        variant="secondary"
                        className="absolute top-3 end-3 z-40 text-sm"
                      >
                        {product.price} {t("new_order.egp")}
                      </Badge>

                      <CardHeader className="flex-1 ">
                        <CardAction className="flex flex-col gap-2">
                          <Badge
                            variant="secondary"
                            className={`font-bold text-sm ${
                              product.stock_quantity == 0
                                ? "text-[#888]"
                                : product.stock_quantity > 10
                                  ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                                  : product.stock_quantity < 5
                                    ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                                    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
                            }`}
                          >
                            {t("product.stock")}: {product.stock_quantity}
                          </Badge>
                        </CardAction>
                        <CardTitle> {product.name} </CardTitle>
                        <CardDescription>
                          {product.description}
                        </CardDescription>

                        {/* Product attributes: size, color, barcode */}
                        <div className="flex flex-wrap gap-2 mt-1">
                          {product.size && (
                            <Badge variant="outline" className="gap-1 text-xs">
                              <Ruler className="w-3 h-3" />
                              {product.size}
                            </Badge>
                          )}
                          {product.color && (
                            <Badge variant="outline" className="gap-1 text-xs">
                              <Palette className="w-3 h-3" />
                              {product.color}
                            </Badge>
                          )}
                          {product.barcode && (
                            <Badge variant="outline" className="gap-1 text-xs font-mono">
                              <Barcode className="w-3 h-3" />
                              {product.barcode}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>

                      <CardFooter className="flex justify-between items-center">
                        <EditProduct product={product} />
                        <AlertDialogDestructive
                          id={product.id}
                          itemName={product.name}
                        />
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="py-20 text-center text-muted-foreground">
                {t("common.no_data")}
              </div>
            )}
          </>
        )}
      </TabsContent>
    </Tabs>
  );
}
