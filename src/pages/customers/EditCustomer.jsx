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

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { updateCustomer } from "./customerActions";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

const customerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  phone: z.string().min(6, "Phone must be at least 6 characters").max(20),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export default function EditCustomer({ customer }) {
  const form = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: customer.name || "",
      phone: customer.phone || "",
      address: customer.address || "",
      notes: customer.notes || "",
    },
  });

  const [open, setOpen] = useState(false);
  const { isSubmitting } = form.formState;
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();

  const onSubmit = async (values) => {
    const { success } = await updateCustomer(customer.id, values);
    if (success) {
      toast.success(t("forms.success_customer_edit"));
      setTimeout(() => {
        setOpen(false);
        queryClient.invalidateQueries({ queryKey: ["customers"] });
      }, 200);
    } else {
      toast.error(t("forms.fail_customer_edit"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">{t("common.edit")}</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <DialogHeader className={i18n.language === 'ar' ? 'text-right' : 'text-left'}>
              <DialogTitle>{t("forms.edit_customer")}</DialogTitle>
              <DialogDescription>
                {t("forms.edit_customer_desc")}
              </DialogDescription>
            </DialogHeader>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className={i18n.language === 'ar' ? 'text-right' : 'text-left'}>
                  <FormLabel>{t("forms.full_name")}</FormLabel>
                  <FormControl>
                    <Input dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem className={i18n.language === 'ar' ? 'text-right' : 'text-left'}>
                  <FormLabel>{t("forms.phone_number")}</FormLabel>
                  <FormControl>
                    <Input dir="ltr" className={i18n.language === 'ar' ? 'text-right' : 'text-left'} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className={i18n.language === 'ar' ? 'text-right' : 'text-left'}>
                  <FormLabel>{t("forms.address")}</FormLabel>
                  <FormControl>
                    <Textarea dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} {...field} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className={i18n.language === 'ar' ? 'text-right' : 'text-left'}>
                  <FormLabel>{t("forms.notes")}</FormLabel>
                  <FormControl>
                    <Textarea dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} {...field} rows={2} />
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
                ) : (
                  t("forms.save_changes")
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
