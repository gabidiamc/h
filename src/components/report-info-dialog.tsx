import { useState } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";
import { submitUpdateRequest } from "@/lib/directory";

const KINDS = ["phone", "link", "date", "outdated", "translation"] as const;

export function ReportInfoDialog({
  entityType,
  entityId,
}: {
  entityType?: string;
  entityId?: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<string>("outdated");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length < 5) return;
    setBusy(true);
    try {
      await submitUpdateRequest({
        kind,
        message: message.trim(),
        reporter_email: email.trim(),
        page_url: typeof window !== "undefined" ? window.location.href : undefined,
        entity_type: entityType,
        entity_id: entityId,
      });
      setSent(true);
      setMessage("");
      setEmail("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setSent(false);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="min-h-11 gap-2 rounded-xl">
          <AlertTriangle className="size-4" aria-hidden="true" />
          {t("report.button")}
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>{t("report.title")}</DialogTitle>
          <DialogDescription>{t("report.subtitle")}</DialogDescription>
        </DialogHeader>
        {sent ? (
          <p role="status" className="rounded-xl bg-primary-soft p-4 font-medium text-primary">
            {t("report.thanks")}
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="report-kind">{t("report.kind")}</Label>
              <select
                id="report-kind"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                className="min-h-11 w-full rounded-xl border border-input bg-background px-3 text-base"
              >
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {t(`report.kind.${k}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-message">{t("report.message")}</Label>
              <Textarea
                id="report-message"
                required
                maxLength={2000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-28 rounded-xl text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-email">{t("report.email")}</Label>
              <Input
                id="report-email"
                type="email"
                maxLength={200}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-h-11 rounded-xl text-base"
              />
            </div>
            <Button type="submit" disabled={busy} className="min-h-11 w-full rounded-xl">
              {busy ? t("common.loading") : t("report.send")}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
