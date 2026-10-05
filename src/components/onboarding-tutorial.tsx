import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bus,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  ExternalLink,
  FileText,
  Globe,
  GraduationCap,
  HeartHandshake,
  HelpCircle,
  Layers,
  Megaphone,
  Menu,
  Phone,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Trophy,
  Users2,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { toggleAppMenu } from "@/components/public-shell";

export const TUTORIAL_SAVED_STEP_KEY = "dmps_info_tutorial_step";
export const TUTORIAL_COMPLETED_KEY = "dmps_info_tutorial_completed";

/** Triggers the tutorial from the menu or help button */
export function openAppTutorial(initialStep?: number) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("dmps_open_tutorial", {
        detail: { step: initialStep },
      }),
    );
  }
}

/** Resets saved progress of tutorial */
export function resetAppOnboarding() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TUTORIAL_SAVED_STEP_KEY);
    localStorage.removeItem(TUTORIAL_COMPLETED_KEY);
  }
}

export type TutorialMode = "closed" | "resume-prompt" | "tutorial" | "exit-confirm";

export interface StepDefinition {
  step: number;
  titleKey: string;
  textKey: string;
  instructionKey: string;
  keywordKey: string;
  icon: typeof Menu;
  targetSelector: string;
  targetFallbackSelector?: string;
  preferredPlacement?: "bottom" | "top" | "auto";
  route?: string;
  hasExampleAction?: boolean;
  isMenuStep?: boolean;
}

export const TUTORIAL_STEPS: StepDefinition[] = [
  {
    step: 1,
    titleKey: "onboarding.step1.title",
    textKey: "onboarding.step1.text",
    instructionKey: "onboarding.step1.instruction",
    keywordKey: "onboarding.step1.keyword",
    icon: Menu,
    targetSelector:
      "#header-menu-button, [data-tutorial='main-menu'], header button[aria-haspopup='dialog']",
    targetFallbackSelector: "header",
    preferredPlacement: "bottom",
    route: "/",
    isMenuStep: true,
  },
  {
    step: 2,
    titleKey: "onboarding.step5.title",
    textKey: "onboarding.step5.text",
    instructionKey: "onboarding.step5.instruction",
    keywordKey: "onboarding.step5.keyword",
    icon: Layers,
    targetSelector: '[data-tutorial="categories"], #home-categories-grid',
    targetFallbackSelector: "main section",
    preferredPlacement: "top",
    route: "/",
  },
  {
    step: 3,
    titleKey: "onboarding.step6.title",
    textKey: "onboarding.step6.text",
    instructionKey: "onboarding.step6.instruction",
    keywordKey: "onboarding.step6.keyword",
    icon: BookOpen,
    targetSelector:
      '[data-tutorial="category-content"], [data-tutorial="card-details"], .surface-card, article',
    targetFallbackSelector: "main",
    preferredPlacement: "top",
    route: "/topics/transporte",
  },
  {
    step: 4,
    titleKey: "onboarding.step6.title",
    textKey: "onboarding.step6.text",
    instructionKey: "onboarding.step6.instruction",
    keywordKey: "onboarding.step6.keyword",
    icon: FileText,
    targetSelector: 'article h1, article header, [data-tutorial="card-details"], article',
    targetFallbackSelector: "article",
    preferredPlacement: "bottom",
    route: "/articles/rutas-autobus-dart",
  },
  {
    step: 5,
    titleKey: "onboarding.step2.title",
    textKey: "onboarding.step2.text",
    instructionKey: "onboarding.step2.instruction",
    keywordKey: "onboarding.step2.keyword",
    icon: Search,
    targetSelector: '[data-tutorial="search"], #main-search-input, input[type="search"]',
    targetFallbackSelector: "input",
    preferredPlacement: "bottom",
    route: "/",
    hasExampleAction: true,
  },
  {
    step: 6,
    titleKey: "onboarding.step3.title",
    textKey: "onboarding.step3.text",
    instructionKey: "onboarding.step3.instruction",
    keywordKey: "onboarding.step3.keyword",
    icon: GraduationCap,
    targetSelector: '[data-tutorial="school-selector"], #header-school-selector',
    targetFallbackSelector: "header",
    preferredPlacement: "bottom",
    route: "/",
  },
  {
    step: 7,
    titleKey: "onboarding.step4.title",
    textKey: "onboarding.step4.text",
    instructionKey: "onboarding.step4.instruction",
    keywordKey: "onboarding.step4.keyword",
    icon: Globe,
    targetSelector: '[data-tutorial="language-selector"], #header-language-selector',
    targetFallbackSelector: "header",
    preferredPlacement: "bottom",
    route: "/",
  },
  {
    step: 8,
    titleKey: "onboarding.step8.title",
    textKey: "onboarding.step8.text",
    instructionKey: "onboarding.step8.instruction",
    keywordKey: "onboarding.step8.keyword",
    icon: Sparkles,
    targetSelector: "#header-menu-button, [data-tutorial='main-menu'], header",
    targetFallbackSelector: "header",
    preferredPlacement: "bottom",
    route: "/",
  },
];

interface BubblePosition {
  top: number;
  left: number;
  width: number;
  placement: "top" | "bottom";
  arrowOffset: number;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function OnboardingTutorial() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [mode, setMode] = useState<TutorialMode>("closed");
  const [currentStep, setCurrentStep] = useState(1);
  const [savedStep, setSavedStep] = useState<number | null>(null);
  const [bubblePosition, setBubblePosition] = useState<BubblePosition | null>(null);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [showMenuOptionsList, setShowMenuOptionsList] = useState(false);
  const [isMenuOpenDuringTour, setIsMenuOpenDuringTour] = useState(false);

  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const activeElementRef = useRef<HTMLElement | null>(null);
  const previousFocusedElRef = useRef<HTMLElement | null>(null);

  // All Menu Options with descriptions and URLs
  const menuOptions = useMemo(
    () => [
      {
        id: "home",
        icon: Compass,
        title: t("onboarding.menu.opt.home.title"),
        desc: t("onboarding.menu.opt.home.desc"),
        path: "/",
        badge: "Principal",
        isExternal: false,
      },
      {
        id: "articles",
        icon: FileText,
        title: t("onboarding.menu.opt.articles.title"),
        desc: t("onboarding.menu.opt.articles.desc"),
        path: "/articulos",
        badge: "Guías",
        isExternal: false,
      },
      {
        id: "teams",
        icon: Users2,
        title: t("onboarding.menu.opt.teams.title"),
        desc: t("onboarding.menu.opt.teams.desc"),
        path: "/equipos",
        badge: "Lincoln High",
        isExternal: false,
      },
      {
        id: "voluntarios",
        icon: HeartHandshake,
        title: t("onboarding.menu.opt.voluntarios.title"),
        desc: t("onboarding.menu.opt.voluntarios.desc"),
        path: "https://hub.familiasdmps.app",
        badge: "DMPS Hub",
        isExternal: true,
      },
      {
        id: "bflStatus",
        icon: Zap,
        title: t("onboarding.menu.opt.bflStatus.title"),
        desc: t("onboarding.menu.opt.bflStatus.desc"),
        path: "https://status.familiasdmps.app/",
        badge: "Live Status",
        isExternal: true,
      },
      {
        id: "calendar",
        icon: Calendar,
        title: t("onboarding.menu.opt.calendar.title"),
        desc: t("onboarding.menu.opt.calendar.desc"),
        path: "/calendario",
        badge: "Fechas clave",
        isExternal: false,
      },
      {
        id: "programs",
        icon: GraduationCap,
        title: t("onboarding.menu.opt.programs.title"),
        desc: t("onboarding.menu.opt.programs.desc"),
        path: "/programas",
        badge: "Académico",
        isExternal: false,
      },
      {
        id: "sports",
        icon: Trophy,
        title: t("onboarding.menu.opt.sports.title"),
        desc: t("onboarding.menu.opt.sports.desc"),
        path: "/deportes-actividades",
        badge: "Actividades",
        isExternal: false,
      },
      {
        id: "dart",
        icon: Bus,
        title: t("onboarding.menu.opt.dart.title"),
        desc: t("onboarding.menu.opt.dart.desc"),
        path: "/dart-transporte",
        badge: "Transporte",
        isExternal: false,
      },
      {
        id: "notices",
        icon: Megaphone,
        title: t("onboarding.menu.opt.notices.title"),
        desc: t("onboarding.menu.opt.notices.desc"),
        path: "/announcements",
        badge: "Oficial",
        isExternal: false,
      },
      {
        id: "faq",
        icon: HelpCircle,
        title: t("onboarding.menu.opt.faq.title"),
        desc: t("onboarding.menu.opt.faq.desc"),
        path: "/faq",
        badge: "Ayuda",
        isExternal: false,
      },
      {
        id: "contact",
        icon: Phone,
        title: t("onboarding.menu.opt.contact.title"),
        desc: t("onboarding.menu.opt.contact.desc"),
        path: "/contact",
        badge: "Directorio",
        isExternal: false,
      },
    ],
    [t],
  );

  // Check saved step on mount (never opens automatically)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(TUTORIAL_SAVED_STEP_KEY);
      if (stored) {
        const stepNum = parseInt(stored, 10);
        if (stepNum > 1 && stepNum <= TUTORIAL_STEPS.length) {
          setSavedStep(stepNum);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Listen to open event from menu
  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ step?: number }>;
      previousFocusedElRef.current = document.activeElement as HTMLElement | null;

      const requestedStep = customEvent.detail?.step;
      if (requestedStep && requestedStep >= 1 && requestedStep <= TUTORIAL_STEPS.length) {
        setCurrentStep(requestedStep);
        setMode("tutorial");
        setShowMenuOptionsList(false);
        return;
      }

      // Check if there is a saved step to offer resume
      try {
        const stored = localStorage.getItem(TUTORIAL_SAVED_STEP_KEY);
        if (stored) {
          const parsed = parseInt(stored, 10);
          if (parsed > 1 && parsed < TUTORIAL_STEPS.length) {
            setSavedStep(parsed);
            setMode("resume-prompt");
            return;
          }
        }
      } catch {
        // ignore
      }

      setCurrentStep(1);
      setMode("tutorial");
      setShowMenuOptionsList(false);
    };

    window.addEventListener("dmps_open_tutorial", handleOpen);
    return () => window.removeEventListener("dmps_open_tutorial", handleOpen);
  }, []);

  // Save progress step to localStorage whenever it changes during active tutorial
  useEffect(() => {
    if (mode === "tutorial" && currentStep > 1 && currentStep < TUTORIAL_STEPS.length) {
      try {
        localStorage.setItem(TUTORIAL_SAVED_STEP_KEY, String(currentStep));
      } catch {
        // ignore
      }
    }
  }, [mode, currentStep]);

  // Route transition synchronization for each step
  useEffect(() => {
    if (mode !== "tutorial") return;

    const stepConfig = TUTORIAL_STEPS[currentStep - 1] || TUTORIAL_STEPS[0];
    if (stepConfig.route && stepConfig.route !== pathname) {
      if (stepConfig.route.startsWith("/topics/")) {
        const slug = stepConfig.route.split("/").pop() || "transporte";
        void navigate({ to: "/topics/$slug", params: { slug } });
      } else if (stepConfig.route.startsWith("/articles/")) {
        const slug = stepConfig.route.split("/").pop() || "rutas-autobus-dart";
        void navigate({ to: "/articles/$slug", params: { slug } });
      } else if (stepConfig.route === "/") {
        if (pathname !== "/") {
          void navigate({ to: "/" });
        }
      }
    }
  }, [currentStep, mode, pathname, navigate]);

  // Calculate target element position and place bubble accurately
  const updatePosition = useCallback(() => {
    if (mode !== "tutorial") {
      if (activeElementRef.current) {
        activeElementRef.current.classList.remove("tutorial-target-active");
        activeElementRef.current = null;
      }
      setBubblePosition(null);
      setTargetRect(null);
      return;
    }

    const stepConfig = TUTORIAL_STEPS[currentStep - 1] || TUTORIAL_STEPS[0];

    // Find target element by selector, then fallback
    let el: HTMLElement | null = null;
    const selectors = stepConfig.targetSelector.split(",").map((s) => s.trim());
    for (const sel of selectors) {
      const match = document.querySelector<HTMLElement>(sel);
      if (match && match.offsetParent !== null) {
        el = match;
        break;
      }
    }

    if (!el && stepConfig.targetFallbackSelector) {
      const fallbackMatches = document.querySelectorAll<HTMLElement>(
        stepConfig.targetFallbackSelector,
      );
      for (let i = 0; i < fallbackMatches.length; i++) {
        if (fallbackMatches[i].offsetParent !== null) {
          el = fallbackMatches[i];
          break;
        }
      }
    }

    if (!el) {
      el = document.querySelector("header") || document.querySelector("main");
    }

    // Highlight target element
    if (activeElementRef.current && activeElementRef.current !== el) {
      activeElementRef.current.classList.remove("tutorial-target-active");
    }

    if (el) {
      el.classList.add("tutorial-target-active");
      activeElementRef.current = el;

      const rect = el.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });

      // Responsive bubble dimensions (compact & clean)
      const margin = 12;
      const maxBubbleWidth = 360;
      const bubbleWidth = Math.min(maxBubbleWidth, viewportWidth - margin * 2);
      const bubbleHeight = bubbleRef.current
        ? bubbleRef.current.offsetHeight
        : showMenuOptionsList
          ? 420
          : 220;

      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      let placement: "top" | "bottom" = stepConfig.preferredPlacement === "top" ? "top" : "bottom";

      // If targeting header/menu (top of screen), place below
      if (rect.top < 110) {
        placement = "bottom";
      } else if (placement === "bottom") {
        if (spaceBelow < bubbleHeight + margin + 10 && spaceAbove > bubbleHeight + margin + 10) {
          placement = "top";
        }
      } else {
        if (spaceAbove < bubbleHeight + margin + 10 && spaceBelow > bubbleHeight + margin + 10) {
          placement = "bottom";
        }
      }

      let top = 0;
      if (placement === "bottom") {
        top = rect.bottom + 12;
      } else {
        top = rect.top - bubbleHeight - 12;
      }

      // Clamp vertical position strictly within viewport
      top = Math.max(margin, Math.min(viewportHeight - bubbleHeight - margin, top));

      // Calculate horizontal position
      const targetCenterX = rect.left + rect.width / 2;
      let left = targetCenterX - bubbleWidth / 2;

      // Special adjustment for elements on the far right (like mobile menu button)
      if (rect.left + rect.width / 2 > viewportWidth * 0.65) {
        left = Math.max(margin, viewportWidth - bubbleWidth - margin);
      } else if (rect.left + rect.width / 2 < viewportWidth * 0.35) {
        left = margin;
      } else {
        left = Math.max(margin, Math.min(viewportWidth - bubbleWidth - margin, left));
      }

      // Arrow offset relative to bubble left edge (pointing to center of target)
      const arrowOffset = Math.max(24, Math.min(bubbleWidth - 24, targetCenterX - left));

      setBubblePosition({
        top,
        left,
        width: bubbleWidth,
        placement,
        arrowOffset,
      });
    }
  }, [mode, currentStep, showMenuOptionsList]);

  // Smooth scroll target into view ONLY once on step change
  useEffect(() => {
    if (mode !== "tutorial") return;

    const stepConfig = TUTORIAL_STEPS[currentStep - 1] || TUTORIAL_STEPS[0];
    let el: HTMLElement | null = null;
    const selectors = stepConfig.targetSelector.split(",").map((s) => s.trim());
    for (const sel of selectors) {
      const match = document.querySelector<HTMLElement>(sel);
      if (match && match.offsetParent !== null) {
        el = match;
        break;
      }
    }
    if (!el && stepConfig.targetFallbackSelector) {
      el = document.querySelector(stepConfig.targetFallbackSelector);
    }
    if (!el) {
      el = document.querySelector("header") || document.querySelector("main");
    }

    if (el) {
      const rect = el.getBoundingClientRect();
      const isNearTop = rect.top >= 0 && rect.top <= 120;
      const isVisible = rect.top >= 70 && rect.bottom <= window.innerHeight - 70;

      if (!isNearTop && !isVisible) {
        const headerOffset = 90;
        const elementPosition = rect.top + window.scrollY;
        const offsetPosition =
          elementPosition - (window.innerHeight / 2 - el.offsetHeight / 2) + headerOffset / 2;

        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: "smooth",
        });
      }
    }

    const t1 = setTimeout(updatePosition, 80);
    const t2 = setTimeout(updatePosition, 320);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [currentStep, mode, updatePosition]);

  // Handle resize and scroll dynamically
  useEffect(() => {
    if (mode !== "tutorial") return;

    let rafId: number;
    const handleRecalculate = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        updatePosition();
      });
    };

    window.addEventListener("resize", handleRecalculate, { passive: true });
    window.addEventListener("scroll", handleRecalculate, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleRecalculate);
      window.removeEventListener("scroll", handleRecalculate);
    };
  }, [mode, updatePosition]);

  // Clean up spotlight class on exit/unmount
  useEffect(() => {
    return () => {
      document.querySelectorAll(".tutorial-target-active").forEach((el) => {
        el.classList.remove("tutorial-target-active");
      });
    };
  }, []);

  const closeTour = useCallback(
    (completed = false) => {
      if (activeElementRef.current) {
        activeElementRef.current.classList.remove("tutorial-target-active");
        activeElementRef.current = null;
      }
      document.querySelectorAll(".tutorial-target-active").forEach((el) => {
        el.classList.remove("tutorial-target-active");
      });

      if (isMenuOpenDuringTour) {
        toggleAppMenu(false);
        setIsMenuOpenDuringTour(false);
      }

      try {
        if (completed) {
          localStorage.removeItem(TUTORIAL_SAVED_STEP_KEY);
          localStorage.setItem(TUTORIAL_COMPLETED_KEY, "true");
        }
      } catch {
        // ignore
      }

      setMode("closed");
      setShowMenuOptionsList(false);

      if (previousFocusedElRef.current) {
        previousFocusedElRef.current.focus();
      }
    },
    [isMenuOpenDuringTour],
  );

  const handleNext = useCallback(() => {
    setShowMenuOptionsList(false);
    if (currentStep < TUTORIAL_STEPS.length) {
      setCurrentStep((s) => s + 1);
    } else {
      closeTour(true);
    }
  }, [currentStep, closeTour]);

  const handleBack = useCallback(() => {
    setShowMenuOptionsList(false);
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const handleSkipStep = useCallback(() => {
    handleNext();
  }, [handleNext]);

  // Helper action: fills search example in search step
  const handleTypeSearchExample = useCallback(() => {
    const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement | null;
    if (searchInput) {
      const sampleText =
        lang === "es" ? "calendario" : lang === "kar" ? "တၢ်ရဲၣ်တၢ်ကျဲၤ" : "calendar";
      searchInput.value = sampleText;
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));
      searchInput.focus();
    }
  }, [lang]);

  // Helper action: toggle menu drawer from Step 1
  const handleToggleMenuFromTour = useCallback(() => {
    toggleAppMenu(!isMenuOpenDuringTour);
    setIsMenuOpenDuringTour((prev) => !prev);
  }, [isMenuOpenDuringTour]);

  // Keyboard navigation
  useEffect(() => {
    if (mode === "closed") return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (mode === "tutorial") {
          setMode("exit-confirm");
        } else if (mode === "exit-confirm" || mode === "resume-prompt") {
          closeTour(false);
        }
      } else if (mode === "tutorial") {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          handleNext();
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          handleBack();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, handleNext, handleBack, closeTour]);

  if (mode === "closed") return null;

  const currentConfig = TUTORIAL_STEPS[currentStep - 1] || TUTORIAL_STEPS[0];
  const StepIcon = currentConfig.icon;

  const stepOfText = t("onboarding.stepOf")
    .replace("{current}", String(currentStep))
    .replace("{total}", String(TUTORIAL_STEPS.length));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("onboarding.reopen")}
      className="fixed inset-0 z-[999999] pointer-events-none"
    >
      {/* Very light, non-blur backdrop so everything on page remains 100% sharp and readable */}
      <div
        className="fixed inset-0 bg-black/[0.08] dark:bg-black/20 pointer-events-none transition-opacity duration-200"
        aria-hidden="true"
      />

      {/* Target Element Glow Border Ring */}
      {mode === "tutorial" && targetRect && (
        <div
          style={{
            position: "fixed",
            top: `${Math.max(2, targetRect.top - 4)}px`,
            left: `${Math.max(2, targetRect.left - 4)}px`,
            width: `${targetRect.width + 8}px`,
            height: `${targetRect.height + 8}px`,
            zIndex: 999998,
            pointerEvents: "none",
          }}
          className="rounded-2xl border-[3px] border-amber-400 dark:border-amber-400 shadow-[0_0_0_4px_rgba(251,191,36,0.35),0_10px_25px_rgba(0,0,0,0.18)] transition-all duration-200"
        />
      )}

      {/* ========================================================= */}
      {/* 1. RESUME PROMPT MODAL (Continuar donde te quedaste)      */}
      {/* ========================================================= */}
      {mode === "resume-prompt" && (
        <div className="fixed inset-0 z-[1000005] flex items-center justify-center p-4 pointer-events-auto">
          <div className="w-full max-w-sm rounded-3xl border-2 border-amber-400/80 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-3">
              <div className="grid size-11 place-items-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <Compass className="size-5" />
              </div>
              <button
                type="button"
                onClick={() => closeTour(false)}
                className="rounded-xl p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label={t("onboarding.exit")}
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-3">
              <h3 className="text-lg font-extrabold text-foreground leading-snug">
                {t("onboarding.resume.title")}
              </h3>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                {t("onboarding.resume.desc")}
              </p>
            </div>

            {/* Resume / Restart Buttons */}
            <div className="mt-5 flex flex-col gap-2">
              <Button
                size="default"
                onClick={() => {
                  setCurrentStep(savedStep ?? 1);
                  setMode("tutorial");
                }}
                className="min-h-11 w-full rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lift hover:bg-primary/90 flex items-center justify-center gap-2"
              >
                <Play className="size-4 fill-current" />
                <span>{t("onboarding.resume.continue")}</span>
              </Button>

              <Button
                variant="outline"
                size="default"
                onClick={() => {
                  setCurrentStep(1);
                  setMode("tutorial");
                }}
                className="min-h-10 rounded-xl font-semibold text-xs gap-2"
              >
                <RotateCcw className="size-3.5" />
                <span>{t("onboarding.resume.restart")}</span>
              </Button>
            </div>

            {/* Quick Direct Tours */}
            <div className="mt-5 border-t border-border pt-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                {t("onboarding.quickTours")}
              </p>
              <div className="grid grid-cols-2 gap-1.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(1);
                    setMode("tutorial");
                  }}
                  className="rounded-xl bg-secondary/80 p-2 text-start hover:bg-primary-soft hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  <Menu className="size-3.5 shrink-0 text-primary" />
                  <span className="truncate">{t("onboarding.tour.menu")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(5);
                    setMode("tutorial");
                  }}
                  className="rounded-xl bg-secondary/80 p-2 text-start hover:bg-primary-soft hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  <Search className="size-3.5 shrink-0 text-primary" />
                  <span className="truncate">{t("onboarding.tour.search")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(6);
                    setMode("tutorial");
                  }}
                  className="rounded-xl bg-secondary/80 p-2 text-start hover:bg-primary-soft hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  <GraduationCap className="size-3.5 shrink-0 text-primary" />
                  <span className="truncate">{t("onboarding.tour.school")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(7);
                    setMode("tutorial");
                  }}
                  className="rounded-xl bg-secondary/80 p-2 text-start hover:bg-primary-soft hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  <Globe className="size-3.5 shrink-0 text-primary" />
                  <span className="truncate">{t("onboarding.tour.lang")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(2);
                    setMode("tutorial");
                  }}
                  className="rounded-xl bg-secondary/80 p-2 text-start hover:bg-primary-soft hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  <Layers className="size-3.5 shrink-0 text-primary" />
                  <span className="truncate">{t("onboarding.tour.categories")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(8);
                    setMode("tutorial");
                  }}
                  className="rounded-xl bg-secondary/80 p-2 text-start hover:bg-primary-soft hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="size-3.5 shrink-0 text-primary" />
                  <span className="truncate">{t("onboarding.tour.full")}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. COMPACT FLOATING EXPLANATION BUBBLE                    */}
      {/* ========================================================= */}
      {mode === "tutorial" && bubblePosition && (
        <div
          ref={bubbleRef}
          style={{
            position: "fixed",
            top: `${bubblePosition.top}px`,
            left: `${bubblePosition.left}px`,
            width: `${bubblePosition.width}px`,
            zIndex: 1000000,
          }}
          className="pointer-events-auto animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="relative rounded-2xl border-2 border-amber-400 bg-card p-4 shadow-[0_16px_36px_rgba(0,0,0,0.22)] ring-1 ring-black/5 text-start max-h-[82vh] flex flex-col">
            {/* Pointer arrow connector */}
            {bubblePosition.placement === "bottom" && (
              <div
                style={{ left: `${bubblePosition.arrowOffset}px` }}
                className="absolute -top-2 -translate-x-1/2 size-3.5 rotate-45 border-s-2 border-t-2 border-amber-400 bg-card z-10"
                aria-hidden="true"
              />
            )}
            {bubblePosition.placement === "top" && (
              <div
                style={{ left: `${bubblePosition.arrowOffset}px` }}
                className="absolute -bottom-2 -translate-x-1/2 size-3.5 rotate-45 border-e-2 border-b-2 border-amber-400 bg-card z-10"
                aria-hidden="true"
              />
            )}

            {/* Bubble Header: Badge & Close X */}
            <div className="flex items-center justify-between gap-2 border-b border-border/70 pb-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className="grid size-6 place-items-center rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold">
                  <StepIcon className="size-3.5" />
                </span>
                <span className="rounded-full bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 text-[11px] font-black text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                  {stepOfText}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setMode("exit-confirm")}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                aria-label={t("onboarding.exit")}
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="mt-2.5 space-y-2 overflow-y-auto pr-0.5 scrollbar-thin">
              <h3 className="tutorial-title-pop text-sm sm:text-base font-extrabold text-foreground tracking-tight leading-snug">
                {t(currentConfig.titleKey)}
              </h3>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {t(currentConfig.textKey)}
              </p>

              {/* Action Instruction Box with Highlight Badge */}
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-2 text-xs font-semibold text-amber-950 dark:text-amber-200 flex items-start gap-1.5">
                <span className="tutorial-highlight-word shrink-0 mt-0.5 font-bold uppercase tracking-wider text-[10px] text-amber-700 dark:text-amber-300 bg-amber-500/20 px-1 py-0.5 rounded">
                  {t(currentConfig.keywordKey)}
                </span>
                <span className="flex-1 leading-snug">{t(currentConfig.instructionKey)}</span>
              </div>

              {/* STEP 1 SPECIAL: Menu Open & Option Explorer */}
              {currentConfig.isMenuStep && (
                <div className="mt-2 space-y-1.5 pt-1 border-t border-border/70">
                  <div className="grid grid-cols-2 gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleToggleMenuFromTour}
                      className="h-8 text-xs font-bold border-amber-400 bg-amber-500/10 hover:bg-amber-500/20 text-amber-950 dark:text-amber-100 gap-1 rounded-xl justify-center"
                    >
                      <Menu className="size-3" />
                      <span className="truncate">
                        {isMenuOpenDuringTour
                          ? t("onboarding.menu.closeButton")
                          : t("onboarding.menu.openButton")}
                      </span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMenuOptionsList((prev) => !prev)}
                      className="h-8 text-xs font-bold border-border bg-secondary/80 hover:bg-secondary text-foreground gap-1 rounded-xl justify-center"
                    >
                      <span className="truncate">{t("onboarding.menu.exploreOptions")}</span>
                      {showMenuOptionsList ? (
                        <ChevronUp className="size-3 shrink-0" />
                      ) : (
                        <ChevronDown className="size-3 shrink-0" />
                      )}
                    </Button>
                  </div>

                  {/* Expandable detailed breakdown of menu options */}
                  {showMenuOptionsList && (
                    <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto rounded-xl bg-secondary/60 p-2 border border-border/80 text-xs">
                      {menuOptions.map((opt) => {
                        const Icon = opt.icon;
                        return (
                          <div
                            key={opt.id}
                            className="rounded-lg bg-card p-2 border border-border/60 shadow-2xs hover:border-amber-400/80 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-1.5 mb-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="grid size-5 place-items-center rounded-md bg-primary/10 text-primary">
                                  <Icon className="size-3" />
                                </span>
                                <span className="font-bold text-foreground text-[11px]">
                                  {opt.title}
                                </span>
                              </div>
                              <span className="rounded-full bg-secondary px-1.5 py-0.2 text-[9px] font-extrabold text-muted-foreground flex items-center gap-0.5">
                                {opt.badge}
                                {opt.isExternal && <ExternalLink className="size-2" />}
                              </span>
                            </div>
                            <p className="text-[10.5px] text-muted-foreground leading-snug">
                              {opt.desc}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Interactive Helper Button for Step 5 (Search) */}
              {currentConfig.hasExampleAction && (
                <div className="mt-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleTypeSearchExample}
                    className="w-full h-7 text-xs font-bold border-amber-400/80 bg-amber-500/10 hover:bg-amber-500/20 text-amber-950 dark:text-amber-100 gap-1 rounded-xl"
                  >
                    <Search className="size-3" />
                    <span>{t("onboarding.typeExample")}</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Bubble Controls Bottom Bar */}
            <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border/70 pt-2 shrink-0">
              <div className="flex items-center gap-1">
                {currentStep > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="h-7 px-2 text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="size-3" />
                    <span>{t("onboarding.back")}</span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSkipStep}
                    className="h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    {t("onboarding.skipStep")}
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {currentStep < TUTORIAL_STEPS.length ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleNext}
                    className="h-7 px-3 text-xs font-bold rounded-xl bg-primary text-primary-foreground shadow-2xs hover:bg-primary/90 gap-1"
                  >
                    <span>{t("onboarding.next")}</span>
                    <ArrowRight className="size-3" />
                  </Button>
                ) : (
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentStep(1);
                      }}
                      className="h-7 px-2 text-xs font-semibold gap-1"
                    >
                      <RotateCcw className="size-3" />
                      <span>{t("onboarding.practiceAgain")}</span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => closeTour(true)}
                      className="h-7 px-3 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs gap-1"
                    >
                      <CheckCircle2 className="size-3" />
                      <span>{t("onboarding.finish")}</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. EXIT CONFIRMATION MODAL                                */}
      {/* ========================================================= */}
      {mode === "exit-confirm" && (
        <div className="fixed inset-0 z-[1000005] flex items-center justify-center p-4 pointer-events-auto">
          <div className="w-full max-w-sm rounded-3xl border-2 border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 space-y-3.5 text-start">
            <div className="grid size-10 place-items-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Compass className="size-5" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-foreground leading-snug">
                {t("onboarding.exit.title")}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                {t("onboarding.exit.text")}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <Button
                size="default"
                onClick={() => setMode("tutorial")}
                className="h-9 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
              >
                {t("onboarding.exit.resume")}
              </Button>
              <Button
                variant="outline"
                size="default"
                onClick={() => closeTour(false)}
                className="h-9 rounded-xl font-semibold text-xs text-muted-foreground hover:text-foreground"
              >
                {t("onboarding.exit.confirm")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
