import { useEffect, useRef, useState } from "react";
import { useI18n, type LanguageCode } from "@/lib/i18n";
import { autoTranslateText, containsSpanishText } from "@/lib/auto-translator";

/**
 * In-memory client cache for dynamically translated DOM text blocks.
 * Keyed by language code ("en").
 */
const DOM_TRANSLATIONS_CACHE: Record<string, Record<string, string>> = {
  en: {},
};

// Load saved translations from localStorage on client boot
if (typeof window !== "undefined") {
  try {
    const enRaw = window.localStorage.getItem("dmps_dom_tr_v3_en");
    if (enRaw) DOM_TRANSLATIONS_CACHE.en = JSON.parse(enRaw);
  } catch {
    // ignore
  }
}

// Track text node originals so we can revert when returning to Spanish
const textNodeOriginals = new WeakMap<Text, { es: string; en: string }>();

/**
 * Universal Page Translator:
 * Automatically monitors the public DOM and translates any remaining Spanish text elements
 * to English when English is active, without interfering with React's own bilingual rendering
 * or admin rich-text editors.
 */
export function UniversalPageTranslator() {
  const { lang } = useI18n();
  const [isTranslatingBatch, setIsTranslatingBatch] = useState(false);
  const queueRef = useRef<Set<string>>(new Set());
  const batchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    // Clean up any legacy baked-in attributes from older saves
    cleanupLegacyAttributes();

    // 1. If returning to Spanish (source language), restore only nodes we translated
    if (lang === "es") {
      restoreOriginalTexts();
      return;
    }

    // Do not run automatic DOM mutation inside the Admin CMS panel
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
      return;
    }

    // 2. Otherwise, translate visible Spanish text on page and observe DOM mutations
    translateVisiblePage(lang, queueRef, () => {
      triggerBatchAiTranslation(lang, queueRef, batchTimerRef, setIsTranslatingBatch);
    });

    // 3. Set up MutationObserver to translate any newly loaded pages or dynamic articles
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    let mutationDebounce: NodeJS.Timeout | null = null;
    const observer = new MutationObserver(() => {
      if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
        return;
      }
      if (mutationDebounce) clearTimeout(mutationDebounce);
      mutationDebounce = setTimeout(() => {
        translateVisiblePage(lang, queueRef, () => {
          triggerBatchAiTranslation(lang, queueRef, batchTimerRef, setIsTranslatingBatch);
        });
      }, 150);
    });
    observerRef.current = observer;

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: false,
    });

    return () => {
      if (observer) {
        observer.disconnect();
      }
      if (mutationDebounce) {
        clearTimeout(mutationDebounce);
      }
      const currentBatchTimer = batchTimerRef.current;
      if (currentBatchTimer) {
        clearTimeout(currentBatchTimer);
      }
    };
  }, [lang]);

  // Expose status event for UI indicator
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("dmps:translation-status", {
        detail: { isTranslating: isTranslatingBatch, lang },
      }),
    );
  }, [isTranslatingBatch, lang]);

  return null;
}

function cleanupLegacyAttributes() {
  if (typeof document === "undefined") return;
  const legacy = document.querySelectorAll("[data-orig-text], [data-translated-lang]");
  legacy.forEach((el) => {
    el.removeAttribute("data-orig-text");
    el.removeAttribute("data-translated-lang");
  });
}

/**
 * Reverts elements that UniversalPageTranslator itself translated back to their Spanish text,
 * without overwriting elements that React already updated.
 */
function restoreOriginalTexts() {
  const elements = document.querySelectorAll("[data-upt-es]");
  elements.forEach((el) => {
    const origEs = el.getAttribute("data-upt-es");
    const appliedEn = el.getAttribute("data-upt-en");
    if (origEs !== null && el instanceof HTMLElement) {
      // Only revert if the element still holds the exact English string we wrote
      if (el.children.length === 0 && appliedEn && el.textContent?.trim() === appliedEn.trim()) {
        el.textContent = origEs;
      }
      el.removeAttribute("data-upt-es");
      el.removeAttribute("data-upt-en");
    }
  });

  // Revert direct text nodes
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let currentNode = walker.nextNode();
  while (currentNode) {
    if (currentNode instanceof Text && textNodeOriginals.has(currentNode)) {
      const record = textNodeOriginals.get(currentNode)!;
      if (currentNode.textContent?.trim() === record.en.trim()) {
        currentNode.textContent = record.es;
      }
      textNodeOriginals.delete(currentNode);
    }
    currentNode = walker.nextNode();
  }
}

/**
 * Checks whether an element should be ignored by the universal translator.
 */
function shouldSkipElement(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  if (
    tag === "script" ||
    tag === "style" ||
    tag === "noscript" ||
    tag === "input" ||
    tag === "textarea" ||
    tag === "code" ||
    tag === "pre" ||
    tag === "svg" ||
    tag === "path"
  ) {
    return true;
  }
  if (
    (el instanceof HTMLElement && el.isContentEditable) ||
    el.hasAttribute("contenteditable") ||
    el.closest("[contenteditable]") ||
    el.classList.contains("notranslate") ||
    el.hasAttribute("data-no-translate") ||
    el.closest(".notranslate") ||
    el.closest("[data-no-translate]") ||
    el.closest("[data-tutorial]")
  ) {
    return true;
  }
  return false;
}

/**
 * Traverses visible content nodes on the current page, translating Spanish dictionary matches
 * immediately and collecting untranslated Spanish texts for server-side translation.
 */
function translateVisiblePage(
  targetLang: LanguageCode,
  queueRef: React.MutableRefObject<Set<string>>,
  onQueueUpdate: () => void,
) {
  if (targetLang === "es") return;
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) return;

  const selectors = "h1, h2, h3, h4, h5, h6, p, button, a, span, label, li, dt, dd, th, td";
  const elements = document.querySelectorAll(selectors);

  let newPhrasesQueued = false;

  const handleTextProcessing = (origText: string, applyTranslation: (trans: string) => void) => {
    if (!origText || origText.length < 2) return;
    if (/^[\d\s.,:/%#$()—\-+]+$/.test(origText)) return;

    // Skip known proper names, acronyms, or codes that do not need translation
    const isKnownProperName =
      /^(DMPS|DART|Infinite Campus|Silver Cord|Lincoln|Roosevelt|East|North|Hoover|Central Campus|Central Academy|BFL|NGOT|FAFSA)$/i.test(
        origText.trim(),
      );
    if (isKnownProperName) {
      return;
    }

    // 1. Check client memory/storage cache first
    const cached = DOM_TRANSLATIONS_CACHE[targetLang]?.[origText];
    if (cached && !containsSpanishText(cached)) {
      applyTranslation(cached);
      return;
    }

    // 2. Check local instant dictionary and full-phrase template rules
    const dictionaryHit = autoTranslateText(origText, targetLang);
    if (dictionaryHit && dictionaryHit !== origText && !containsSpanishText(dictionaryHit)) {
      applyTranslation(dictionaryHit);
      if (!DOM_TRANSLATIONS_CACHE[targetLang]) DOM_TRANSLATIONS_CACHE[targetLang] = {};
      DOM_TRANSLATIONS_CACHE[targetLang][origText] = dictionaryHit;
      return;
    }

    // 3. Only if the text genuinely contains Spanish words/accents, queue for batch translation
    if (containsSpanishText(origText) && origText.length < 400) {
      if (!queueRef.current.has(origText)) {
        queueRef.current.add(origText);
        newPhrasesQueued = true;
      }
    }
  };

  elements.forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    if (shouldSkipElement(node)) return;

    // Leaf elements with no children
    if (node.children.length === 0) {
      const currentText = node.textContent?.trim() || "";
      if (!currentText) return;

      const appliedEn = node.getAttribute("data-upt-en");
      if (appliedEn && currentText === appliedEn.trim()) {
        // Already translated by UniversalPageTranslator and unchanged
        return;
      }

      // Check if current text is Spanish (either via dictionary or Spanish words check)
      const dictCheck = autoTranslateText(currentText, targetLang);
      const isSpanish =
        (dictCheck && dictCheck !== currentText && !containsSpanishText(dictCheck)) ||
        containsSpanishText(currentText);

      if (!isSpanish) {
        // Element is already rendered in English by React; do not touch it
        node.removeAttribute("data-upt-es");
        node.removeAttribute("data-upt-en");
        return;
      }

      const origText = currentText;
      node.setAttribute("data-upt-es", origText);

      handleTextProcessing(origText, (translated) => {
        node.textContent = translated;
        node.setAttribute("data-upt-en", translated);
      });
      return;
    }

    // Mixed content: handle direct text children
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE && child instanceof Text) {
        const textVal = child.textContent?.trim() || "";
        if (textVal.length < 2) return;

        const existingRecord = textNodeOriginals.get(child);
        if (existingRecord && textVal === existingRecord.en.trim()) {
          return;
        }

        const dictCheck = autoTranslateText(textVal, targetLang);
        const isSpanish =
          (dictCheck && dictCheck !== textVal && !containsSpanishText(dictCheck)) ||
          containsSpanishText(textVal);

        if (!isSpanish) return;

        handleTextProcessing(textVal, (translated) => {
          textNodeOriginals.set(child, { es: textVal, en: translated });
          child.textContent = child.textContent?.replace(textVal, translated) || translated;
        });
      }
    });
  });

  if (newPhrasesQueued) {
    onQueueUpdate();
  }
}

/**
 * Dispatches a batch request to /api/translate with debouncing, caching the results
 * and immediately applying them to any elements waiting on the page.
 */
function triggerBatchAiTranslation(
  targetLang: LanguageCode,
  queueRef: React.MutableRefObject<Set<string>>,
  timerRef: React.MutableRefObject<NodeJS.Timeout | null>,
  setIsTranslating: (state: boolean) => void,
) {
  if (timerRef.current) {
    clearTimeout(timerRef.current);
  }

  timerRef.current = setTimeout(async () => {
    const items = Array.from(queueRef.current);
    if (items.length === 0) return;
    queueRef.current.clear();

    setIsTranslating(true);
    try {
      const batch = items.slice(0, 35);
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texts: batch,
          targetLang: "en",
          sourceLang: "es",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.translations) && data.translations.length === batch.length) {
          if (!DOM_TRANSLATIONS_CACHE[targetLang]) {
            DOM_TRANSLATIONS_CACHE[targetLang] = {};
          }

          batch.forEach((orig, idx) => {
            const translated = data.translations[idx];
            if (translated && typeof translated === "string" && !containsSpanishText(translated)) {
              DOM_TRANSLATIONS_CACHE[targetLang][orig] = translated;
            }
          });

          // Save to localStorage
          try {
            window.localStorage.setItem(
              `dmps_dom_tr_v3_${targetLang}`,
              JSON.stringify(DOM_TRANSLATIONS_CACHE[targetLang]),
            );
          } catch {
            // ignore
          }

          // Update elements on page matching these phrases
          batch.forEach((orig, idx) => {
            const translated = data.translations[idx];
            if (!translated || containsSpanishText(translated)) return;
            const matches = document.querySelectorAll(`[data-upt-es]`);
            matches.forEach((el) => {
              if (
                el instanceof HTMLElement &&
                el.getAttribute("data-upt-es") === orig &&
                el.children.length === 0
              ) {
                el.textContent = translated;
                el.setAttribute("data-upt-en", translated);
              }
            });
          });
        }
      }
    } catch {
      // Graceful offline/network fallback
    } finally {
      setIsTranslating(false);
    }
  }, 300);
}
