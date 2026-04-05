import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { TrashIcon } from "lucide-react";
import { toast } from "sonner";

import { deleteProduct } from "@/pages/products/productActions";
import { useQueryClient } from "@tanstack/react-query";

export default function AlertDialogDestructive({ id, itemName }) {
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    const { error, data } = await deleteProduct(id);
    if ((!error, data.length > 0)) {
      toast.success("Product deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } else {
      toast.error("Failed to delete the product");
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          className="rounded-full p-5 dark:bg-amber-100 dark:text-red-600 dark:hover:text-amber-100 dark:hover:bg-red-600 bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white  transition-colors duration-300"
        >
          <TrashIcon />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
            <TrashIcon />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete product?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {itemName}?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleDelete}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
