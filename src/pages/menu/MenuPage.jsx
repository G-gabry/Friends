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

import AlertDialogDestructive from "@/pages/menu/DeleteButton";
import EditDialog from "./EditDialog";
import { CirclePlus } from "lucide-react";
import AddCategory from "./AddCategory";
import CategoryButtons from "./CategoryButtons";

import { useAuth } from "@/hooks/useAuth";
import { useItems } from "@/hooks/useMenuQuery";
import { useCategories } from "@/hooks/useMenuQuery";

export default function MenuPage() {
  const [activeCategoryId, setActiveCategoryId] = useState("all");
  
  const { data: items = [] } = useItems();
  const { data: categories = [] } = useCategories();

  const { user } = useAuth();

  const filteredItems = useMemo(() => {
    if (activeCategoryId === "all") return items;

    return items.filter((item) => item.category_id === activeCategoryId);
  }, [items, activeCategoryId]);

  const category = useMemo(
    () => categories.find((cat) => cat.id === activeCategoryId),
    [categories, activeCategoryId],
  );

  return (
    <Tabs defaultValue="all" onValueChange={setActiveCategoryId}>
      {/*  categories */}
      <TabsList className="flex w-full justify-start overflow-x-auto overflow-y-hidden whitespace-nowrap rounded-lg bg-muted p-1 scrollbar-hide">
        <TabsTrigger value="all" className="shrink-0 cursor-pointer">
          All
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

      {/* items */}
      <TabsContent value={activeCategoryId}>
        {activeCategoryId == "AddCategory" ? (
          <AddCategory owner_id={user?.id ?? ""} />
        ) : (
          <>
            {activeCategoryId !== "all" && (
              <CategoryButtons category={category} />
            )}
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5 my-3">
                {filteredItems.map((item) => {
                  return (
                    <Card
                      className="relative mx-auto w-full max-w-sm pt-0 overflow-hidden items-between"
                      key={item.id}
                    >
                      <div className="absolute inset-0 z-30 aspect-video bg-black/25 " />
                      <img
                        src={item.image_url}
                        alt={item.name}
                        loading="lazy"
                        className="relative z-20 aspect-video w-full object-cover "
                      />
                      <Badge
                        variant="secondary"
                        className="absolute top-3 end-3 z-40 text-sm"
                      >
                        ${item.price}
                      </Badge>

                      <CardHeader className="flex-1 ">
                        <CardAction className="flex flex-col gap-5">
                          <Badge
                            variant="secondary"
                            className={`font-bold text-sm ${
                              item.stock_quantity == 0
                                ? "text-[#888]"
                                : item.stock_quantity > 10
                                  ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                                  : item.stock_quantity < 5
                                    ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                                    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
                            }`}
                          >
                            Stock: {item.stock_quantity}
                          </Badge>
                        </CardAction>
                        <CardTitle> {item.name} </CardTitle>
                        <CardDescription>{item.description}</CardDescription>
                      </CardHeader>

                      <CardFooter className="flex justify-between items-center">
                        <EditDialog item={item} />
                        <AlertDialogDestructive
                          id={item.id}
                          itemName={item.name}
                        />
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="py-20 text-center text-muted-foreground">
                No Items
              </div>
            )}
          </>
        )}
      </TabsContent>
    </Tabs>
  );
}
