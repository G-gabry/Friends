import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarBadge,
} from "@/components/ui/avatar";
import { Trash, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import InsertEmployee from "./InsertEmployee";
import DeleteEmployee from "./DeleteEmployee";
import UpdateEmployee from "./updateEmployee";
import { useAuth } from "@/hooks/useAuth";
import { UpdateStatus } from "../orders/UpdateStatus";
import { useProfiles } from "@/hooks/useEmployeesQuery";
import { useTranslation } from "react-i18next";

export default function EmployeesPage() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const { data: profiles } = useProfiles() || {};
  return (
    <>
      <Table>
        <TableCaption>
          {t("employees.caption", { count: profiles.length - 1 })}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className={`w-25 ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>{t("employees.columns.avatar")}</TableHead>
            <TableHead className={`w-25 ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>{t("employees.columns.name")}</TableHead>
            <TableHead className={`${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>{t("employees.columns.email")}</TableHead>
            <TableHead className={`${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>{t("employees.columns.role")}</TableHead>
            <TableHead className={`${i18n.language === 'ar' ? 'text-left' : 'text-right'}`}>{t("employees.columns.manage")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles?.map((profile) => (
            <TableRow key={profile.id}>
              <TableCell>
                <Avatar>
                  <AvatarImage
                    src={profile.avatar_url}
                    alt={profile.full_name}
                  />
                  <AvatarFallback>
                    <User />
                  </AvatarFallback>
                  {user.id === profile.id && (
                    <AvatarBadge className="bg-green-600 dark:bg-green-800" />
                  )}
                </Avatar>
              </TableCell>
              <TableCell className="font-medium">{profile.full_name}</TableCell>
              <TableCell>{profile.email}</TableCell>
              <TableCell className="capitalize font-mono">{profile.role}</TableCell>
              <TableCell className={`flex items-center gap-2 ${i18n.language === 'ar' ? 'justify-start' : 'justify-end'}`}>
                <DeleteEmployee employee={profile}>
                  <Button
                    variant="destructive"
                    className="bg-red-50 dark:bg-amber-50 dark:text-red-600 dark:hover:text-amber-100 dark:hover:bg-red-600 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition-colors duration-300"
                  >
                    <Trash />
                  </Button>
                </DeleteEmployee>

                <UpdateEmployee user={profile} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <InsertEmployee />
      <UpdateStatus />
    </>
  );
}
