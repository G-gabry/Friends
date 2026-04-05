import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { insertCategory } from "./menuActions";

import { useQueryClient } from "@tanstack/react-query";

const insertSchema = z.object({
  name: z.string().min(3, "name must be at least 3 characters").max(30),
  slug: z.string().min(3, "name must be at least 3 characters").max(30),
  description: z.string().min(1, "Required"),
});

export default function AddCategory({ owner_id }) {
  const form = useForm({
    resolver: zodResolver(insertSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
    },
  });

  const { isSubmitting } = form.formState;
  const queryClient = useQueryClient();

  const onSubmit = async (values) => {
    const { success, data } = await insertCategory(owner_id, values);
    if (success && data.length != 0) {
      toast.success("insertion operation successfully");
      form.reset();
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["categories"] });
      }, 200);
    } else {
      toast.error("insertion operation failed");
    }
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    form.setValue("name", value);
    form.setValue(
      "slug",
      value
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, ""),
    );
  };

  return (
    <Card className="my-8">
      <CardHeader>
        <CardTitle>Insert a New Category</CardTitle>
        <CardDescription>Enter the Data For Your New Category</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 ">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleNameChange(e);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel> Slug </FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
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

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2" />
                  Saving...
                </>
              ) : (
                "Insert"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
