"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDownIcon,
  CopyIcon,
  TrashIcon,
  SquarePen,
  SquarePlus,
} from "lucide-react";
import { toast } from "sonner";

import UpdateCategory from "./UpdateCategory";
import DeleteCategory from "./DeleteCategory";
import InsertItem from "./InsertItem";

export default function CategoryButtons({ category }) {
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(category?.name);
    toast.success("Done");
  };

  return (
    <ButtonGroup className="my-2">
      <Button variant="outline">Manage</Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="pl-2!">
            <ChevronDownIcon />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="center" className="w-44">
          <DropdownMenuGroup>
            <UpdateCategory
              category={category}
              open={isUpdateOpen}
              setOpen={setIsUpdateOpen}
            >
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <SquarePen /> Edit Category
              </DropdownMenuItem>
            </UpdateCategory>

            <DropdownMenuItem onClick={() => handleCopy(category?.name)}>
              <CopyIcon />
              Copy Title
            </DropdownMenuItem>

            <InsertItem
              categoryId={category?.id}
              open={isUpdateOpen}
              setOpen={setIsUpdateOpen}
            >
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <SquarePlus />
                Add Item
              </DropdownMenuItem>
            </InsertItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DeleteCategory
              category={category}
              open={isUpdateOpen}
              setOpen={setIsUpdateOpen}
            >
              <DropdownMenuItem
                variant="destructive"
                onSelect={(e) => e.preventDefault()}
              >
                <TrashIcon />
                Delete Category
              </DropdownMenuItem>
            </DeleteCategory>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
}
