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
import { Checkbox } from "@/components/ui/checkbox";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { insertProduct } from "./productActions";

import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "react-i18next";

const SIZES = ["OS", "XS", "S", "M", "L", "XL", "XXL", "3XL"];

const productSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(50),
  description: z.string().optional(),
  price: z.coerce.number().positive("Price must be a positive number"),
  color: z.string().optional(),
  barcode: z.string().optional(),
  image: z.any().refine((file) => {
    if (!file) return true;
    return file.size <= 500 * 1024;
  }, "Image must be less than 0.5MB (500KB)"),
  variants: z.array(z.object({
      size: z.string(),
      quantity: z.coerce.number().int("Whole number").nonnegative("0+")
  })).min(1, "Please select at least one size/stock variant")
});

export default function InsertProduct({ children, categoryId: category_id }) {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      price: 0,
      description: "",
      color: "",
      barcode: "",
      image: null,
      variants: [],
    },
  });

  const [open, setOpen] = useState(false);
  const { isSubmitting } = form.formState;
  const queryClient = useQueryClient();

  const handleSizeToggle = (size) => {
    const currentVariants = form.getValues("variants");
    const existsIndex = currentVariants.findIndex((v) => v.size === size);

    if (existsIndex >= 0) {
      // Remove variant
      const updated = currentVariants.filter((_, idx) => idx !== existsIndex);
      form.setValue("variants", updated, { shouldValidate: true });
    } else {
      // Add variant with default 0 stock
      const updated = [...currentVariants, { size, quantity: 10 }];
      form.setValue("variants", updated, { shouldValidate: true });
    }
  };

  const currentVariants = form.watch("variants");
  
  const onSubmit = async (values) => {
    const { success, error } = await insertProduct(
      user?.id,
      category_id,
      values,
    );
    if (success) {
      toast.success(t("forms.success_product_add") || "Products added successfully");

      setTimeout(() => {
        setOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: ["products"] });
      }, 200);
    } else {
      console.error("Insert product failed:", error);
      toast.error(error || t("forms.fail_product_add"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
        if(!val) form.reset();
        setOpen(val);
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[95vh] flex flex-col" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex flex-col overflow-hidden">
            <DialogHeader className={i18n.language === 'ar' ? 'text-right' : 'text-left'}>
              <DialogTitle>{t("forms.add_product")}</DialogTitle>
              <DialogDescription>
                أضف المنتج، وحدد تشكيلة المقاسات ليتم إنشاء قيود مستقلة لكل مقاس في النظام.
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
                        <FormLabel>{t("forms.product_image")}</FormLabel>
                        <FormControl>
                           <div className="w-full h-full min-h-[200px] border flex items-center justify-center rounded-lg bg-muted/30 overflow-hidden">
                              <ImageUpload
                                value={field.value}
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
                          <FormLabel>{t("forms.product_name")}</FormLabel>
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
                            <FormLabel>{t("forms.price_egp")}</FormLabel>
                            <FormControl>
                              <Input dir="ltr" className={i18n.language === 'ar' ? 'text-right' : 'text-left'} type="number" {...field} />
                            </FormControl>
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
                          <FormLabel>{t("forms.barcode")} (اختياري)</FormLabel>
                          <FormControl>
                            <Input
                              dir="ltr"
                              className={i18n.language === 'ar' ? 'text-right' : 'text-left'}
                              placeholder="سيتم إنشاء باركود تلقائياً إذا تُرك فارغاً"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Variants Generation Section */}
                <div className="bg-slate-50 border p-4 rounded-xl space-y-3">
                   <div className="flex items-center justify-between">
                     <h3 className="font-bold text-sm">حدد المقاسات والكمية</h3>
                   </div>
                   
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {SIZES.map((sz) => {
                         const variantIndex = currentVariants.findIndex((v) => v.size === sz);
                         const isSelected = variantIndex >= 0;

                         return (
                           <div key={sz} className={`flex items-center gap-2 p-2 rounded-lg border ${isSelected ? 'bg-white border-primary/50 shadow-sm' : 'bg-transparent border-transparent grayscale opacity-70'}`}>
                             <div className="flex items-center gap-2 flex-1">
                                <input 
                                  type="checkbox" 
                                  className="w-4 h-4 cursor-pointer" 
                                  checked={isSelected}
                                  onChange={() => handleSizeToggle(sz)}
                                  id={`checkbox-${sz}`}
                                />
                                <label htmlFor={`checkbox-${sz}`} className="font-bold cursor-pointer">{sz}</label>
                             </div>
                             
                             {isSelected && (
                               <div className="w-16">
                                  <FormField
                                    control={form.control}
                                    name={`variants.${variantIndex}.quantity`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                           <Input 
                                              type="number" 
                                              className="h-8 text-xs font-bold text-center px-1"
                                              {...field}
                                           />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                               </div>
                             )}
                           </div>
                         )
                      })}
                   </div>
                   
                   {/* Variant Array errors mapping */}
                   {form.formState.errors.variants?.root && (
                     <p className="text-[13px] font-medium text-destructive">{form.formState.errors.variants.root.message}</p>
                   )}
                </div>

                {/* Description Full Width Below Grid */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className={`w-full ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
                      <FormLabel>{t("forms.description")}</FormLabel>
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
                  t("forms.add_product")
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
