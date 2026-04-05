import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";

import { Spinner } from "@/components/ui/spinner";
import { useState } from "react";

import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/shared/ImageUpload";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { updateItem } from "./menuActions";
const editSchema = z.object({
  name: z.string().min(3, "name must be at least 3 characters").max(30),
  description: z.string().min(1, "Required"),
  price: z.coerce.number().positive("Price must be a positive number"),

  quantity: z.coerce
    .number()
    .int("must be a whole number")
    .nonnegative("must be 0 or more"),

  image: z.any().refine((file) => {
    if (!file) return true;
    return file.size <= 500 * 1024;
  }, "Image must be less than 0.5MB (500KB)"),
});
import { useQueryClient } from "@tanstack/react-query";

export default function EditDialog({ item }) {
  const form = useForm({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: item.name || "",
      quantity: item.stock_quantity || 0,
      price: item.price || 0,
      description: item.description || "",
      image: null,
    },
  });

  const [open, setOpen] = useState(false);
  const { isSubmitting } = form.formState;
  const queryClient = useQueryClient();

  const onSubmit = async (values) => {
    const { success, data } = await updateItem(item.id, values);
    if (success && data.length != 0) {
      toast.success("The item has been modified successfully");

      setTimeout(() => {
        setOpen(false);
        queryClient.invalidateQueries({ queryKey: ["items"] });
      }, 200);
    } else {
      toast.error("Failed to modify the item");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="px-7">Edit</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Edit Item</DialogTitle>
              <DialogDescription>
                Make changes to your item here. Click save when you&apos;re
                done.
              </DialogDescription>
            </DialogHeader>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Image</FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter description..."
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={isSubmitting} type="button">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
