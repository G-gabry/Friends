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

import { deleteCustomer } from "./customerActions";
import { useQueryClient } from "@tanstack/react-query";

export default function DeleteCustomer({ customer }) {
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    const { success } = await deleteCustomer(customer.id);
    if (success) {
      toast.success("Customer deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    } else {
      toast.error("Failed to delete customer");
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="destructive"
          className="dark:bg-amber-100 dark:text-red-600 dark:hover:text-amber-100 dark:hover:bg-red-600 bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition-colors duration-300"
        >
          <TrashIcon className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
            <TrashIcon />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete customer?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {customer.name}? This will not
            affect existing orders.
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
