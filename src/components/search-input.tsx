import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export function SearchInput({
  size = "lg",
  defaultValue = "",
  autoFocus = false,
}: {
  size?: "lg" | "sm";
  defaultValue?: string;
  autoFocus?: boolean;
}) {
  const [value, setValue] = useState(defaultValue);
  const navigate = useNavigate();
  const { t } = useI18n();

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    navigate({ to: "/search", search: { q: value.trim() } });
  }

  const large = size === "lg";

  return (
    <form
      id={size === "lg" ? "main-search-input" : undefined}
      data-tutorial="search"
      onSubmit={onSubmit}
      role="search"
      className={`group flex w-full items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-soft search-glow-focus transition-all duration-300 focus-within:border-primary ${
        large ? "sm:rounded-3xl sm:p-3" : ""
      }`}
    >
      <label htmlFor={`site-search-${size}`} className="sr-only">
        {t("search.placeholder")}
      </label>
      <Search
        className="ms-2 size-5 shrink-0 text-muted-foreground sm:size-6 transition-all duration-300 group-focus-within:text-primary group-focus-within:scale-110"
        aria-hidden="true"
      />
      <input
        id={`site-search-${size}`}
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t("home.searchPlaceholder")}
        className={`min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground ${
          large ? "py-2 text-lg sm:text-xl" : "py-1 text-base"
        }`}
      />
      <Button
        type="submit"
        size={large ? "lg" : "default"}
        className="min-h-11 shrink-0 rounded-xl font-semibold shadow-xs hover:shadow-md transition-all duration-200"
      >
        <span className="hidden sm:inline">{t("home.searchButton")}</span>
        <Search className="size-5 sm:hidden" aria-hidden="true" />
      </Button>
    </form>
  );
}
