"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import LanguageSwitcher from "@/components/LanguageSwitcher";
import { getLocalizedField } from "@/lib/i18n/getLocalizedField";

function formatPrice(amount) {
  return new Intl.NumberFormat("lo-LA", {
    style: "currency",
    currency: "LAK",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function CustomerMenu({ tableId, menuItems, fetchError }) {
  const { t, i18n } = useTranslation(["common", "menu"]);
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = useMemo(() => {
    const unique = [...new Set(menuItems.map((item) => item.category).filter(Boolean))];
    return unique.sort();
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    if (activeCategory === "all") return menuItems;
    return menuItems.filter((item) => item.category === activeCategory);
  }, [activeCategory, menuItems]);

  const lang = i18n.language;

  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 px-4 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {t("common:welcome")}
            </p>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {t("common:appName")}
            </h1>
            <p className="mt-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              {t("common:table")} {tableId}
            </p>
          </div>
          <LanguageSwitcher />
        </div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {t("menu:title")}
        </h2>
      </header>

      <main className="flex-1 px-4 py-4">
        {fetchError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            <p className="font-medium">{t("common:error")}</p>
            <p className="mt-1">{fetchError}</p>
          </div>
        ) : null}

        {!fetchError && categories.length > 0 ? (
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeCategory === "all"
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-700"
              }`}
            >
              {t("menu:allItems")}
            </button>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeCategory === category
                    ? "bg-emerald-600 text-white"
                    : "bg-white text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-700"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        ) : null}

        {!fetchError && filteredItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-zinc-600 dark:text-zinc-400">{t("menu:noItems")}</p>
          </div>
        ) : null}

        <ul className="flex flex-col gap-3">
          {filteredItems.map((item) => {
            const name = getLocalizedField(item, "name", lang);
            const description = getLocalizedField(item, "description", lang);

            return (
              <li
                key={item.id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800"
              >
                <div className="flex gap-3 p-3">
                  {item.image_url ? (
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
                      <Image
                        src={item.image_url}
                        alt={name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                  ) : (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-2xl dark:bg-emerald-950/40">
                      🍽️
                    </div>
                  )}

                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                        {name}
                      </h3>
                      {description ? (
                        <p className="mt-1 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                          {description}
                        </p>
                      ) : null}
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                        {formatPrice(item.price)}
                      </span>
                      <button
                        type="button"
                        className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                      >
                        {t("menu:addToCart")}
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
