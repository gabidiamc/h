import { ExternalLink, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { logReviewButtonClick, type PublicReviewState } from "@/lib/help/public-review";
import { useI18n } from "@/lib/i18n";

/**
 * Voluntary invitation to write a public review, shown to every family after
 * any internal rating regardless of the score they gave.
 */
export function PublicReviewInvite({
  review,
  schoolId,
  surface,
  onDismiss,
  compact = false,
}: {
  review: PublicReviewState;
  schoolId?: string | null;
  surface: string;
  onDismiss?: () => void;
  compact?: boolean;
}) {
  const { t } = useI18n();
  if (!review.url) {
    return (
      <p
        className={
          compact ? "mt-2 text-xs text-muted-foreground" : "mt-3 text-sm text-muted-foreground"
        }
      >
        {review.unavailableMessage}
      </p>
    );
  }

  return (
    <div className="mt-3">
      <p className={compact ? "text-xs" : "text-sm"}>{t("help.review.saved")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={review.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            void logReviewButtonClick({
              provider: review.provider,
              schoolId: schoolId ?? null,
              surface,
            });
          }}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Star className="size-4" aria-hidden="true" />
          {t("help.review.writeReview")}
          <ExternalLink className="size-4" aria-hidden="true" />
        </a>
        {onDismiss ? (
          <Button variant="outline" className="min-h-11 rounded-xl text-sm" onClick={onDismiss}>
            {t("help.review.notNow")}
          </Button>
        ) : null}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{t("help.review.opensNewTab")}</p>
    </div>
  );
}
