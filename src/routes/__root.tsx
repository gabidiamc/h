import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { I18nProvider } from "@/lib/i18n";
import { ThemeProvider, THEME_INIT_SCRIPT } from "@/lib/theme";
import { Toaster } from "@/components/ui/sonner";
import { useRealtimeContentSync } from "@/lib/sync";
import { SchoolProvider } from "@/lib/school";
import { FirebaseProvider } from "@/lib/firebase-context";
import { SchoolSelectorModal } from "@/components/school-selector-modal";
import { OnboardingTutorial } from "@/components/onboarding-tutorial";
import { FloatingAnnouncement } from "@/components/floating-announcement";
import { LegacyServiceWorkerCleanup } from "@/components/legacy-sw-cleanup";
import { CanvaSvgMaskDefs } from "@/components/canva-image-direct-editor";
import { UniversalPageTranslator } from "@/components/universal-page-translator";
import { DmpsAnalyticsObserver } from "@/analytics";
import { PodcastPlayerProvider } from "@/lib/podcast-player-context";
import { GlobalPodcastPlayer } from "@/components/podcast/global-podcast-player";
import { BrandingHeadSync } from "@/components/branding-head-sync";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "DMPS Family Info" },
      {
        name: "description",
        content:
          "Automated and verified official information portal for Des Moines Public Schools families",
      },
      { name: "author", content: "Des Moines Public Schools" },
      {
        name: "google-site-verification",
        content: "google57394eaad22d42f1",
      },
      {
        name: "google-site-verification",
        content: "3bAP6SGW3bYnd3_MMJ46K1Qi7S8XjRZTBPXA1e97GXc",
      },
      { name: "application-name", content: "Familias DMPS" },
      { name: "apple-mobile-web-app-title", content: "Familias DMPS" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "theme-color", content: "#06234B" },

      { property: "og:title", content: "DMPS Family Info" },
      {
        property: "og:description",
        content:
          "Automated and verified official information portal for Des Moines Public Schools families",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          name: "Des Moines Public Schools",
          alternateName: "DMPS",
          url: "https://dmps-familias.lovable.app",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Des Moines",
            addressRegion: "IA",
            addressCountry: "US",
          },
        }),
      },
      {
        children: THEME_INIT_SCRIPT,
      },
    ],

    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap",
      },
      { rel: "manifest", href: "/api/manifest" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/icons/apple-touch-icon.png" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/icons/favicon-32x32.png" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/icons/favicon-16x16.png" },
      { rel: "shortcut icon", href: "/favicon.ico" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
        <LegacyServiceWorkerCleanup />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    const isExtensionNoise = (msg: string) => {
      const lower = msg.toLowerCase();
      return (
        lower.includes("metamask") ||
        lower.includes("ethereum") ||
        lower.includes("coinbase") ||
        lower.includes("wallet") ||
        lower.includes("chrome-extension") ||
        lower.includes("moz-extension") ||
        lower.includes("failed to connect")
      );
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason ? String(event.reason?.message || event.reason) : "";
      if (isExtensionNoise(reason)) {
        event.preventDefault();
        event.stopImmediatePropagation?.();
      }
    };

    const handleError = (event: ErrorEvent) => {
      const msg = event.message || event.error?.message || "";
      if (isExtensionNoise(String(msg))) {
        event.preventDefault();
        event.stopImmediatePropagation?.();
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleError);

    // Client-side non-blocking AdSense load after initial hydration
    try {
      const existingScript = document.querySelector('script[src*="pagead2.googlesyndication.com"]');
      if (!existingScript) {
        const adScript = document.createElement("script");
        adScript.async = true;
        adScript.src =
          "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4360884520548274";
        adScript.crossOrigin = "anonymous";
        document.head.appendChild(adScript);
      }
    } catch {
      // ignore
    }

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("error", handleError);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <UniversalPageTranslator />
          <SchoolProvider>
            <FirebaseProvider>
              <PodcastPlayerProvider>
                <DmpsAnalyticsObserver />
                <BrandingHeadSync />
                <RealtimeSync />
                {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
                <Outlet />
                <GlobalPodcastPlayer />
                <OnboardingTutorial />
                <SchoolSelectorModal />
                <FloatingAnnouncement />
                <CanvaSvgMaskDefs />

                <Toaster />
              </PodcastPlayerProvider>
            </FirebaseProvider>
          </SchoolProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function RealtimeSync() {
  useRealtimeContentSync();
  return null;
}
