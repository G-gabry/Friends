import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(nextLang);
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={toggleLanguage} 
      className="fixed bottom-20 left-4 z-50 flex items-center gap-2 rounded-full shadow-md print:hidden"
    >
      <Globe className="w-4 h-4" />
      {i18n.language === "en" ? "عربي" : "English"}
    </Button>
  );
}
