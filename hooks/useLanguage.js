import { useContext } from "react";
import { LanguageContext } from "../context/LanguageContext";
import { STRINGS } from "../constants/strings";

export default function useLanguage() {
  const { language, changeLanguage } = useContext(LanguageContext);

  const toggleLanguage = () => {
    const next = language === "EN" ? "FIL" : "EN";
    changeLanguage(next);
  };

  return {
    lang: language,
    t: STRINGS[language],
    toggleLanguage,
  };
}
