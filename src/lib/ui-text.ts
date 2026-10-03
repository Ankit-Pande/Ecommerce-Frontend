import type { AppLanguage } from "@/store/ui-settings-store";

const words = {
  en: {
    search: "Search",
    searchPlaceholder: "Search products, brands and categories",
    yourAccount: "Your account",
    login: "Login",
    admin: "Admin panel",
    profile: "My profile",
    addresses: "Saved addresses",
    orders: "My orders",
    logout: "Logout",
    cart: "Cart",
    allCategories: "All categories",
    home: "Home",
    shop: "Shop",
    account: "Account",
    category: "Shop by category",
    settings: "Settings",
    help: "Help",
    language: "Menu language",
    appColor: "App color",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
  },
  hi: {
    search: "खोजें",
    searchPlaceholder: "प्रोडक्ट, ब्रांड या कैटेगरी खोजें",
    yourAccount: "आपका अकाउंट",
    login: "लॉगिन",
    admin: "एडमिन पैनल",
    profile: "मेरी प्रोफाइल",
    addresses: "सेव किए पते",
    orders: "मेरे ऑर्डर",
    logout: "लॉगआउट",
    cart: "कार्ट",
    allCategories: "सभी कैटेगरी",
    home: "होम",
    shop: "शॉप",
    account: "अकाउंट",
    category: "कैटेगरी से खरीदें",
    settings: "सेटिंग",
    help: "मदद",
    language: "मेन्यू भाषा",
    appColor: "ऐप का रंग",
    theme: "थीम",
    light: "लाइट",
    dark: "डार्क",
  },
} as const;

export type UiTextKey = keyof (typeof words)["en"];

// Text in the chosen language.
export function uiText(language: AppLanguage, key: UiTextKey): string {
  return words[language][key];
}
