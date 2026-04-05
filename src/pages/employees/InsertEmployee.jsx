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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserRoundPlus, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Spinner } from "@/components/ui/spinner";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/shared/ImageUpload";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { insertEmployee } from "./employeesActions";
import { useTranslation } from "react-i18next";

const insertSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(3, "name must be at least 3 characters").max(30),
  role: z.enum(["admin", "employee"], {
    required_error: "Please select a role",
  }),
  image: z.any().refine((file) => {
    if (!file) return true;
    return file.size <= 500 * 1024;
  }, "Image must be less than 0.5MB (500KB)"),
});

import { useQueryClient } from "@tanstack/react-query";

export default function InsertEmployee() {
  const [showPassword, setShowPassword] = useState(false);
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();

  const form = useForm({
    resolver: zodResolver(insertSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      image: null,
      role: undefined,
    },
  });

  const [open, setOpen] = useState(false);
  const { isSubmitting } = form.formState;

  const onSubmit = async (values) => {
    const { success, error } = await insertEmployee(values);
    if (success) {
      toast.success(t("forms.success_employee_add"));
      setTimeout(() => {
        setOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: ["profiles"] });
      }, 200);
    } else {
      console.error("Insert employee failed:", error);
      toast.error(error || t("forms.fail_employee_add"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserRoundPlus /> {t("forms.add_employee")}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <DialogHeader className={i18n.language === 'ar' ? 'text-right' : 'text-left'}>
              <DialogTitle>{t("forms.add_employee")}</DialogTitle>
              <DialogDescription>
                {t("forms.add_employee_desc")}
              </DialogDescription>
            </DialogHeader>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className={i18n.language === 'ar' ? 'text-right' : 'text-left'}>
                  <FormLabel>{t("forms.email")}</FormLabel>
                  <FormControl>
                    <Input placeholder="hello@ahmedzaki.me" dir="ltr" className={i18n.language === 'ar' ? 'text-right' : 'text-left'} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className={i18n.language === 'ar' ? 'text-right' : 'text-left'}>
                  <FormLabel>{t("forms.password")}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        {...field}
                        dir="ltr"
                        className={`pr-10 ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none ${i18n.language === 'ar' ? 'left-3' : 'right-3'}`}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className={i18n.language === 'ar' ? 'text-right' : 'text-left'}>
                  <FormLabel>{t("forms.name")}</FormLabel>
                  <FormControl>
                    <Input dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className={i18n.language === 'ar' ? 'text-right' : 'text-left'}>
                  <FormLabel>{t("forms.role")}</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value} dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("forms.select_role")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>{t("forms.roles")}</SelectLabel>
                          <SelectItem value="admin">{t("forms.admin")}</SelectItem>
                          <SelectItem value="employee">{t("forms.employee")}</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem className={i18n.language === 'ar' ? 'text-right' : 'text-left'}>
                  <FormLabel>{t("forms.avatar")}</FormLabel>
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
                  t("forms.add")
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
