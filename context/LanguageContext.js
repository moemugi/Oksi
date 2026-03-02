import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState("EN");

  // Load saved language
  useEffect(() => {
    const loadLanguage = async () => {
      const savedLang = await AsyncStorage.getItem("appLanguage");
      if (savedLang) setLanguage(savedLang);
    };
    loadLanguage();
  }, []);

  // Save language when changed
  const changeLanguage = async (lang) => {
    setLanguage(lang);
    await AsyncStorage.setItem("appLanguage", lang);
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}