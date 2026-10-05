import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Lightbulb,
  ExternalLink,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import type { LanguageCode } from "@/lib/i18n";
import {
  matchFamilyAdvice,
  INITIAL_CONSEJOS_SUGGESTIONS,
  type FamilyAdvice,
} from "@/lib/family-advice";

interface SearchAdviceProps {
  query: string;
  lang: LanguageCode;
  onSelectPrompt?: (prompt: string) => void;
  onSelectQuery?: (query: string) => void;
}

export function SearchAdvice({ query, lang, onSelectPrompt, onSelectQuery }: SearchAdviceProps) {
  const [speaking, setSpeaking] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  const selectItem = (text: string) => {
    onSelectQuery?.(text);
    onSelectPrompt?.(text);
  };

  const advice: FamilyAdvice | null = useMemo(() => {
    if (!query || !query.trim()) return null;
    return matchFamilyAdvice(query, lang);
  }, [query, lang]);

  const suggestions =
    lang === "en" ? INITIAL_CONSEJOS_SUGGESTIONS.en : INITIAL_CONSEJOS_SUGGESTIONS.es;

  const handleSpeak = () => {
    if (!window.speechSynthesis || !advice) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      `${advice.title}. ${advice.description}. Pasos: ${advice.steps.join(". ")}`,
    );
    utterance.lang = lang === "en" ? "en-US" : "es-US";
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // When no query is entered, show a super-minimal, right-aligned suggestions row
  if (!query || !query.trim()) {
    return (
      <div
        id="search-consejos-initial-minimal"
        className="flex flex-wrap items-center justify-end gap-1.5 text-xs"
      >
        <span className="inline-flex items-center gap-1 font-semibold text-muted-foreground text-[11px]">
          <Sparkles className="size-3 text-primary" />
          <span>{lang === "en" ? "Tips:" : "Consejos:"}</span>
        </span>
        {suggestions.slice(0, 4).map((item) => (
          <button
            key={item.query}
            type="button"
            onClick={() => selectItem(item.query)}
            className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-background px-2.5 py-1 text-[11px] font-medium text-foreground transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary active:scale-95"
          >
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    );
  }

  // If no advice match for this query
  if (!advice) return null;

  // Super minimal, small, right-corner card
  return (
    <div
      id="search-consejos-compact-card"
      className="max-w-md w-full ml-auto rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20 p-3 shadow-2xs backdrop-blur-xs transition-all text-xs"
    >
      {/* Header with bulb, title, badge and audio button */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <Lightbulb className="size-3" />
          </span>
          <h3 className="font-bold text-xs text-foreground truncate">{advice.title}</h3>
          <span className="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.2 text-[10px] font-bold text-amber-700 dark:text-amber-300">
            {advice.badge}
          </span>
        </div>

        {typeof window !== "undefined" && "speechSynthesis" in window && (
          <button
            type="button"
            onClick={handleSpeak}
            title={speaking ? "Detener" : "Escuchar"}
            aria-label="Escuchar consejo"
            className="flex size-5 shrink-0 items-center justify-center rounded hover:bg-amber-500/20 text-muted-foreground hover:text-foreground transition-colors"
          >
            {speaking ? (
              <VolumeX className="size-3 text-amber-600" />
            ) : (
              <Volume2 className="size-3" />
            )}
          </button>
        )}
      </div>

      {/* Short 1-2 sentence description */}
      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{advice.description}</p>

      {/* Optional short steps toggle */}
      {advice.steps.length > 0 && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowSteps(!showSteps)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
          >
            <span>{showSteps ? "Ocultar pasos" : `Ver ${advice.steps.length} pasos rápidos`}</span>
            {showSteps ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </button>

          {showSteps && (
            <ol className="mt-1.5 space-y-1 pl-4 list-decimal text-[11px] text-foreground/90">
              {advice.steps.map((step, idx) => (
                <li key={idx} className="leading-snug">
                  {step}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {/* Action official links */}
      {advice.links.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-amber-500/20">
          {advice.links.map((link, i) => {
            const isInternal = link.url.startsWith("/");
            const cls =
              "inline-flex items-center gap-1 rounded-lg bg-primary text-primary-foreground px-2.5 py-1 text-[11px] font-bold shadow-2xs hover:opacity-90 transition-opacity active:scale-95";

            if (isInternal) {
              return (
                <Link key={i} to={link.url} className={cls}>
                  <span>{link.label}</span>
                  <ChevronRight className="size-3" />
                </Link>
              );
            }

            return (
              <a key={i} href={link.url} target="_blank" rel="noreferrer noopener" className={cls}>
                <span>{link.label}</span>
                <ExternalLink className="size-2.5 opacity-80" />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
