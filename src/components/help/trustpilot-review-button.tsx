import { logReviewButtonClick, usePublicReview } from "@/lib/help/public-review";
import { useI18n } from "@/lib/i18n";

/** Direct "Review us on Trustpilot" button (opens the official review form). */
export function TrustpilotReviewButton({ surface = "footer" }: { surface?: string }) {
  const { review } = usePublicReview();
  const { t } = useI18n();
  if (!review.url) return null;

  return (
    <a
      href={review.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        void logReviewButtonClick({ provider: review.provider, surface });
      }}
      className="inline-flex min-h-11 items-center gap-2 bg-transparent px-0 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      aria-label={`${t("footer.reviewUs")} Trustpilot`}
    >
      <span>{t("footer.reviewUs")}</span>
      <svg
        viewBox="0 0 24 24"
        className="size-5"
        style={{ color: "#00B67A" }}
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 1.6 15 8.9l7.9.6-6 5.1 1.8 7.8L12 18.2 5.3 22.4l1.8-7.8-6-5.1L9 8.9z" />
      </svg>
      <span className="text-foreground">Trustpilot</span>
    </a>
  );
}
