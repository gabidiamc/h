import { useState, type ReactNode } from "react";
import { AlertTriangle, Info, ShieldAlert, CheckCircle2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export interface ConfirmActionConfig {
  title: string;
  description: string;
  consequence?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive" | "warning" | "success";
  onConfirm: () => void | Promise<void>;
}

export function ConfirmActionDialog({
  open,
  onOpenChange,
  config,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: ConfirmActionConfig | null;
}) {
  const [loading, setLoading] = useState(false);

  if (!config) return null;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await config.onConfirm();
      onOpenChange(false);
    } catch {
      // handled by caller's toast
    } finally {
      setLoading(false);
    }
  };

  const getIcon = () => {
    switch (config.variant) {
      case "destructive":
        return <ShieldAlert className="size-6 text-destructive shrink-0" aria-hidden="true" />;
      case "warning":
        return <AlertTriangle className="size-6 text-amber-500 shrink-0" aria-hidden="true" />;
      case "success":
        return <CheckCircle2 className="size-6 text-emerald-500 shrink-0" aria-hidden="true" />;
      default:
        return <Info className="size-6 text-primary shrink-0" aria-hidden="true" />;
    }
  };

  const getButtonVariant = () => {
    switch (config.variant) {
      case "destructive":
        return "bg-destructive text-destructive-foreground hover:bg-destructive/90";
      case "warning":
        return "bg-amber-600 text-white hover:bg-amber-700";
      case "success":
        return "bg-emerald-600 text-white hover:bg-emerald-700";
      default:
        return "bg-primary text-primary-foreground hover:bg-primary-deep";
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md rounded-2xl p-6">
        <AlertDialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-muted">{getIcon()}</div>
            <AlertDialogTitle className="text-xl font-bold text-foreground">
              {config.title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
            {config.description}
          </AlertDialogDescription>

          {config.consequence && (
            <div className="rounded-xl border border-border/80 bg-muted/40 p-3 text-xs font-medium text-foreground">
              <span className="font-bold text-primary block mb-0.5">Consecuencia:</span>
              {config.consequence}
            </div>
          )}
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-6 gap-2 sm:gap-0">
          <AlertDialogCancel
            disabled={loading}
            className="min-h-11 rounded-xl font-semibold border-border"
          >
            {config.cancelText || "Cancelar"}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={loading}
            onClick={(e) => {
              e.preventDefault();
              void handleConfirm();
            }}
            className={`min-h-11 rounded-xl font-bold shadow-soft ${getButtonVariant()}`}
          >
            {loading ? "Procesando…" : config.confirmText || "Confirmar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
