import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import {
  DEFAULT_LANGUAGE,
  FALLBACK_LANGUAGE,
  NAMESPACES,
} from "./constants";

import loCommon from "@/locales/lo/common.json";
import loMenu from "@/locales/lo/menu.json";
import loOrder from "@/locales/lo/order.json";

import enCommon from "@/locales/en/common.json";
import enMenu from "@/locales/en/menu.json";
import enOrder from "@/locales/en/order.json";

import thCommon from "@/locales/th/common.json";
import thMenu from "@/locales/th/menu.json";
import thOrder from "@/locales/th/order.json";

import zhCommon from "@/locales/zh/common.json";
import zhMenu from "@/locales/zh/menu.json";
import zhOrder from "@/locales/zh/order.json";

const resources = {
  lo: { common: loCommon, menu: loMenu, order: loOrder },
  en: { common: enCommon, menu: enMenu, order: enOrder },
  th: { common: thCommon, menu: thMenu, order: thOrder },
  zh: { common: zhCommon, menu: zhMenu, order: zhOrder },
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: DEFAULT_LANGUAGE,
    fallbackLng: FALLBACK_LANGUAGE,
    defaultNS: "common",
    ns: NAMESPACES,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });
}

export default i18n;
export { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from "./constants";
