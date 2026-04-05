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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

import { Spinner } from "@/components/ui/spinner";
import { useState } from "react";

import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/shared/ImageUpload";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { updateProduct } from "./productActions";
import { useQueryClient } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "react-i18next";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL"];

const productSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(50),
  description: z.string().optional(),
  price: z.coerce.number().positive("Price must be a positive number"),
  quantity: z.coerce
    .number()
    .int("Must be a whole number")
    .nonnegative("Must be 0 or more"),
  size: z.string().optional(),
  color: z.string().optional(),
  barcode: z.string().optional(),
  image: z.any().refine((file) => {
    if (!file) return true;
    return file.size <= 500 * 1024;
  }, "Image must be less than 0.5MB (500KB)"),
});

export default function EditProduct({ product }) {
  const { t, i18n } = useTranslation();
  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product.name || "",
      quantity: product.stock_quantity || 0,
      price: product.price || 0,
      description: product.description || "",
      size: product.size || "",
      color: product.color || "",
      barcode: product.barcode || "",
      image: null,
    },
  });

  const [open, setOpen] = useState(false);
  const { isSubmitting } = form.formState;
  const queryClient = useQueryClient();

  const onSubmit = async (values) => {
    const { success, data, error } = await updateProduct(product.id, values);
    if (success && data.length != 0) {
      toast.success(t("forms.success_product"));

      setTimeout(() => {
        setOpen(false);
        queryClient.invalidateQueries({ queryKey: ["products"] });
      }, 200);
    } else {
      toast.error(error || t("forms.fail_product"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="px-7">{t("common.edit")}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[95vh] flex flex-col" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex flex-col overflow-hidden">
            <DialogHeader className={i18n.language === 'ar' ? 'text-right' : 'text-left'}>
              <DialogTitle>{t("forms.update_product") || "Update Product"}</DialogTitle>
              <DialogDescription>
                {t("forms.update_product_desc") || "Modify the product details below."}
              </DialogDescription>
            </DialogHeader>

            <div className="overflow-y-auto flex-1 max-h-[65vh] pr-4 rtl:pr-0 rtl:pl-4">
              <div className="space-y-6 px-1 py-1 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column (Image) */}
                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                      <FormItem className={`flex flex-col h-full ${i18n.language === 'ar' ? 'text-right items-end' : 'text-left items-start'}`}>
                        <FormLabel>{t("forms.product_image") || "Product Image"}</FormLabel>
                        <FormControl>
                           <div className="w-full h-full min-h-[200px] border flex items-center justify-center rounded-lg bg-muted/30 overflow-hidden">
                              <ImageUpload
                                value={field.value || product.image_url}
                                onChange={field.onChange}
                              />
                           </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Right Column (Form Fields) */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className={i18n.language === 'ar' ? 'text-right items-end' : 'text-left items-start'}>
                          <FormLabel>{t("forms.product_name") || "Product Name"}</FormLabel>
                          <FormControl>
                            <Input dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} placeholder={t("forms.product_name_ph")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem className={i18n.language === 'ar' ? 'text-right' : 'text-left'}>
                            <FormLabel>{t("forms.price_egp") || "Price (EGP)"}</FormLabel>
                            <FormControl>
                              <Input dir="ltr" className={i18n.language === 'ar' ? 'text-right' : 'text-left'} type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem className={i18n.language === 'ar' ? 'text-right' : 'text-left'}>
                            <FormLabel>{t("forms.stock_quantity") || "Stock"}</FormLabel>
                            <FormControl>
                              <Input dir="ltr" className={i18n.language === 'ar' ? 'text-right' : 'text-left'} type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="size"
                        render={({ field }) => (
                          <FormItem className={i18n.language === 'ar' ? 'text-right items-end' : 'text-left items-start'}>
                            <FormLabel>{t("forms.size")}</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("forms.select_size")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {SIZES.map((size) => (
                                  <SelectItem key={size} value={size}>
                                    {size}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="color"
                        render={({ field }) => (
                          <FormItem className={i18n.language === 'ar' ? 'text-right items-end' : 'text-left items-start'}>
                            <FormLabel>{t("forms.color")}</FormLabel>
                            <FormControl>
                              <Input dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} placeholder={t("forms.color_ph")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="barcode"
                      render={({ field }) => (
                        <FormItem className={i18n.language === 'ar' ? 'text-right items-end' : 'text-left items-start'}>
                          <FormLabel>{t("forms.barcode")}</FormLabel>
                          <FormControl>
                            <Input
                              dir="ltr"
                              className={i18n.language === 'ar' ? 'text-right' : 'text-left'}
                              placeholder={t("forms.barcode_ph")}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Description Full Width Below Grid */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className={`w-full ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
                      <FormLabel>{t("forms.description") || "Description"}</FormLabel>
                      <FormControl>
                        <Textarea
                          className="min-h-[120px]"
                          dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
                          {...field}
                          placeholder={t("forms.description_ph")}
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className={`mt-4 pt-4 border-t w-full flex gap-2 shrink-0 ${i18n.language === 'ar' ? 'justify-start rtl:flex-row-reverse' : 'justify-end'}`}>
              <DialogClose asChild>
                <Button variant="outline" disabled={isSubmitting} type="button">
                  {t("common.cancel")}
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2" />
                    {t("common.loading")}
                  </>
                ) : (
                  t("forms.save_changes") || "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
