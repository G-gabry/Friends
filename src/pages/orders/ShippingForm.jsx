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
import { Input } from "@/components/ui/input";
import { Truck } from "lucide-react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

const shippingSchema = z.object({
  company_name: z.string().min(2, "Company name is required"),
  tracking_number: z.string().optional(),
  phone: z.string().optional(),
});

export default function ShippingForm({ orderId, existingShipping }) {
  const { t, i18n } = useTranslation();
  const isEdit = !!existingShipping;

  const form = useForm({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      company_name: existingShipping?.company_name || "",
      tracking_number: existingShipping?.tracking_number || "",
      phone: existingShipping?.phone || "",
    },
  });

  const [open, setOpen] = useState(false);
  const { isSubmitting } = form.formState;
  const queryClient = useQueryClient();

  const onSubmit = async (values) => {
    let result;

    if (isEdit) {
      result = await supabase
        .from("shipping")
        .update({
          company_name: values.company_name,
          tracking_number: values.tracking_number || null,
          phone: values.phone || null,
          shipped_at: new Date().toISOString(),
        })
        .eq("id", existingShipping.id)
        .select();
    } else {
      result = await supabase
        .from("shipping")
        .insert([
          {
            order_id: orderId,
            company_name: values.company_name,
            tracking_number: values.tracking_number || null,
            phone: values.phone || null,
            shipped_at: new Date().toISOString(),
          },
        ])
        .select();

      // Auto-update order status to "shipped"
      if (!result.error) {
        await supabase
          .from("orders")
          .update({ status: "shipped" })
          .eq("id", orderId);
      }
    }

    if (result.error) {
      toast.error(t("forms.fail_shipping") || "Failed to save shipping info");
      return;
    }

    toast.success(isEdit ? (t("forms.success_shipping_edit") || "Shipping updated") : (t("forms.success_shipping_add") || "Shipping info added"));
    setTimeout(() => {
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["shipping"] });
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={isEdit ? "outline" : "default"} size="sm">
          <Truck className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
          {isEdit ? t("forms.edit_shipping_btn") : t("forms.add_shipping_btn")}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <DialogHeader className={i18n.language === 'ar' ? 'text-right' : 'text-left'}>
              <DialogTitle>
                {isEdit ? t("forms.edit_shipping") : t("forms.add_shipping")}
              </DialogTitle>
              <DialogDescription>
                {t("forms.shipping_desc")}
              </DialogDescription>
            </DialogHeader>

            <FormField
              control={form.control}
              name="company_name"
              render={({ field }) => (
                <FormItem className={i18n.language === 'ar' ? 'text-right items-end' : 'text-left items-start'}>
                  <FormLabel>{t("forms.shipping_company")}</FormLabel>
                  <FormControl>
                    <Input dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} placeholder={t("forms.shipping_company_ph")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tracking_number"
              render={({ field }) => (
                <FormItem className={i18n.language === 'ar' ? 'text-right items-end' : 'text-left items-start'}>
                  <FormLabel>{t("forms.tracking_number")}</FormLabel>
                  <FormControl>
                    <Input dir="ltr" className={i18n.language === 'ar' ? 'text-right' : 'text-left'} placeholder={t("forms.optional")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem className={i18n.language === 'ar' ? 'text-right items-end' : 'text-left items-start'}>
                  <FormLabel>{t("forms.company_phone")}</FormLabel>
                  <FormControl>
                    <Input dir="ltr" className={i18n.language === 'ar' ? 'text-right' : 'text-left'} placeholder={t("forms.optional")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className={`mt-4 flex gap-2 ${i18n.language === 'ar' ? 'justify-start rtl:flex-row-reverse' : 'justify-end'}`}>
              <DialogClose asChild>
                <Button variant="outline" disabled={isSubmitting} type="button">
                  {t("common.cancel")}
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner className={"mr-2" + (i18n.language === 'ar' ? ' rtl:ml-2 rtl:mr-0' : '')} />
                    {t("common.loading")}
                  </>
                ) : isEdit ? (
                  t("forms.save_changes")
                ) : (
                  t("forms.add_shipping_btn")
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
