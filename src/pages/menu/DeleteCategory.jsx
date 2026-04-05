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
import { TrashIcon } from "lucide-react";
import { toast } from "sonner";

import { deleteCategory } from "@/pages/menu/menuActions";
import { useQueryClient } from "@tanstack/react-query";

export default function DeleteCategory({ category, children }) {
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    const { error, data } = await deleteCategory(category.id);
    if ((!error, data.length > 0)) {
      toast.success("The category was scanned successfully");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } else {
      toast.error("The category was not cleared");
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
            <TrashIcon />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete item?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {category?.name}?
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
