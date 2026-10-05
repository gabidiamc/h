import { Check, Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LANGUAGES, useI18n } from "@/lib/i18n";

export function LanguageSelector({ variant = "header" }: { variant?: "header" | "inline" }) {
  const { lang, setLang, t } = useI18n();
  const current = LANGUAGES.find((l) => l.code === lang);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          data-tutorial="language-selector"
          variant={variant === "header" ? "outline" : "secondary"}
          className="group min-h-11 gap-2 rounded-full font-semibold transition-all duration-200"
          aria-label={t("lang.select")}
        >
          <Globe
            className="size-5 shrink-0 transition-transform duration-300 group-hover:rotate-45 text-primary"
            aria-hidden="true"
          />
          <span className="max-w-28 truncate">{current?.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-60 rounded-2xl p-1.5 shadow-lift animate-menu-pop"
      >
        <DropdownMenuLabel>{t("lang.select")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LANGUAGES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onSelect={() => setLang(l.code)}
            className="min-h-11 cursor-pointer gap-2 text-base"
          >
            <Check
              className={`size-4 shrink-0 ${l.code === lang ? "opacity-100" : "opacity-0"}`}
              aria-hidden="true"
            />
            <span className="flex min-w-0 flex-1 items-baseline justify-between gap-2">
              <span className="truncate">{l.label}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{l.english}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
