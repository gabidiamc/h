import {
  ExternalLink,
  HeartHandshake,
  Activity,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
} from "lucide-react";
import { useExternalServices, type ExternalServiceId } from "@/lib/external-services";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ExternalServiceView({ serviceId }: { serviceId: ExternalServiceId }) {
  const { t } = useI18n();
  const { getServiceConfig, isAvailable } = useExternalServices();

  const config = getServiceConfig(serviceId);
  const available = isAvailable(serviceId);

  const title = t(config.nameKey) || config.nameFallback;
  const description = t(config.descKey) || config.descFallback;
  const buttonText = t(config.buttonKey) || config.buttonFallback;

  const isVolunteer = serviceId === "voluntarios";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Breadcrumb indicator */}
      <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <span>DMPS Info</span>
        <span>/</span>
        <span>{t("nav.resources")}</span>
        <span>/</span>
        <span className="text-primary">{title}</span>
      </div>

      {/* Main card */}
      <div className="surface-card overflow-hidden border border-border p-6 shadow-sm sm:p-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="space-y-4">
            {/* Header pill & Icon */}
            <div className="flex flex-wrap items-center gap-3">
              <div
                className={`grid size-14 place-items-center rounded-2xl ${
                  isVolunteer
                    ? "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400"
                    : "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                }`}
              >
                {isVolunteer ? (
                  <HeartHandshake className="size-8" aria-hidden="true" />
                ) : (
                  <Activity className="size-8" aria-hidden="true" />
                )}
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-bold text-primary">
                  <ShieldCheck className="size-3.5" aria-hidden="true" />
                  <span>{config.badgeText}</span>
                </span>
                <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl mt-1">
                  {title}
                </h1>
              </div>
            </div>

            {/* Explanatory requested text */}
            <p className="text-lg font-medium text-foreground/90 leading-relaxed max-w-2xl">
              {description}
            </p>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-8 rounded-2xl bg-secondary/50 p-6 border border-border/60">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
            {t("services.highlightsTitle")}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {config.features.map((feature, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-sm text-foreground/80 font-medium"
              >
                <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Notice of external service */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs font-medium text-foreground/85">
          <Lock className="size-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-bold text-foreground">{t("services.externalNoticeTitle")}</p>
            <p className="mt-0.5 text-muted-foreground">{t("services.externalNoticeDesc")}</p>
          </div>
        </div>

        {/* Action button or unavailable notice */}
        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {available ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                className={`min-h-12 rounded-xl font-bold px-6 text-base gap-2 shadow-sm ${
                  isVolunteer
                    ? "bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                <a
                  href={config.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${buttonText} (${t("services.opensInNewTab")})`}
                >
                  <span>{buttonText}</span>
                  <ExternalLink className="size-4" aria-hidden="true" />
                </a>
              </Button>
              <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                <ArrowRight className="size-3.5 text-muted-foreground/70" />
                {t("services.opensInNewTab")}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-destructive w-full">
              <AlertCircle className="size-5 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-bold text-sm">{t("services.unavailable")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("services.unavailableDesc")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
