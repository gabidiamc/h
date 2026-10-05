import { ExternalLink, ShieldCheck } from "lucide-react";

import { ReportInfoDialog } from "@/components/report-info-dialog";
import { useI18n } from "@/lib/i18n";

/**
 * Public trust indicator. Only render it when the data really has an official
 * source; never claim verification without one.
 */
export function VerificationNote({
  sourceName,
  sourceUrl,
  reviewedAt,
  entityType,
  entityId,
}: {
  sourceName: string;
  sourceUrl: string;
  reviewedAt?: string | null;
  entityType?: string;
  entityId?: string;
}) {
  const { t } = useI18n();
  return (
    <div className="surface-card flex flex-wrap items-center gap-x-4 gap-y-2 bg-secondary/40 px-4 py-3 text-sm">
      <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
        <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
        {t("verification.verifiedInfo")}
      </span>
      <span className="text-muted-foreground">
        {t("verification.officialSource")}:{" "}
        <span className="font-medium text-foreground">{sourceName}</span>
      </span>
      {reviewedAt ? (
        <span className="text-muted-foreground">
          {t("verification.lastReviewed")}: {new Date(reviewedAt).toLocaleDateString()}
        </span>
      ) : null}
      <a
        href={sourceUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary underline-offset-4 hover:underline"
      >
        {t("verification.viewSource")}
        <ExternalLink className="size-4" aria-hidden="true" />
      </a>
      <ReportInfoDialog entityType={entityType ?? "page"} {...(entityId ? { entityId } : {})} />
    </div>
  );
}

/** Shown when information exists but no official source confirms it yet. */
export function PendingVerificationNote({ what }: { what: string }) {
  const { t } = useI18n();
  return (
    <div className="surface-card border-dashed bg-secondary/30 p-5 text-sm text-muted-foreground">
      <p className="font-semibold text-foreground">
        {t("verification.pending.title")} {what}.
      </p>
      <p className="mt-1">{t("verification.pending.body")}</p>
    </div>
  );
}
