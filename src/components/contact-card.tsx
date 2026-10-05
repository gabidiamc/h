import React, { useState } from "react";
import {
  Phone,
  Mail,
  Clock,
  School as SchoolIcon,
  Edit,
  Trash2,
  User,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ContactRow } from "@/lib/directory";
import { useI18n } from "@/lib/i18n";
import { autoTranslateText } from "@/lib/auto-translator";
import { trackContactClick } from "@/analytics";

interface ContactCardProps {
  contact: ContactRow;
  onEdit?: () => void;
  onDelete?: () => void;
  isAdmin?: boolean;
}

export function ContactCard({ contact, onEdit, onDelete, isAdmin = false }: ContactCardProps) {
  const { lang } = useI18n();
  const [imgError, setImgError] = useState(false);
  const isLincoln = contact.school_id === "lincoln" || contact.school_id === "sch-lincoln";
  const isEast = contact.school_id === "east" || contact.school_id === "sch-east";

  const schoolLabel = isLincoln
    ? "Lincoln High School"
    : isEast
      ? "East High School"
      : lang === "en"
        ? "School District (DMPS)"
        : "Distrito Escolar (DMPS)";

  const schoolBadgeClass = isLincoln
    ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
    : isEast
      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
      : "bg-primary/10 text-primary border-primary/20";

  // Avatar transformations
  const scale = contact.avatar_scale ?? 1;
  const offsetX = contact.avatar_x ?? 0;
  const offsetY = contact.avatar_y ?? 0;
  const rotation = contact.avatar_rotate ?? 0;

  return (
    <div className="surface-card group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40">
      {/* Top Header with School Badge & Admin actions */}
      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-bold ${schoolBadgeClass}`}
        >
          <SchoolIcon className="size-3.5" />
          <span>{schoolLabel}</span>
        </span>

        {isAdmin ? (
          <div className="flex items-center gap-1">
            {onEdit && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg hover:bg-muted text-foreground"
                onClick={onEdit}
                title="Editar tarjeta de contacto"
              >
                <Edit className="size-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg hover:bg-destructive/10 text-destructive"
                onClick={onDelete}
                title="Eliminar contacto"
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        ) : (
          contact.verification_status === "verified" && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400"
              title={lang === "en" ? "Contact verified by DMPS" : "Contacto verificado por DMPS"}
            >
              <ShieldCheck className="size-3.5" />
              <span>{lang === "en" ? "Verified" : "Verificado"}</span>
            </span>
          )
        )}
      </div>

      {/* Main Body: Details on the Left, Photo on the Right */}
      <div className="mt-4 flex items-start justify-between gap-4">
        {/* Left Side: Name, Job Title, Phone, Email, Hours */}
        <div className="flex-1 min-w-0 space-y-2.5">
          <div>
            <h3 className="text-lg font-extrabold text-foreground leading-tight truncate">
              {contact.person_name || contact.department}
            </h3>
            {contact.job_title && (
              <p className="text-xs font-semibold text-primary mt-0.5">
                {lang === "en" ? autoTranslateText(contact.job_title, "en") : contact.job_title}
              </p>
            )}
          </div>

          <div className="space-y-1.5 pt-1 text-sm">
            {/* Phone */}
            {contact.phone && (
              <div className="flex items-center gap-2">
                <span className="grid size-6 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                  <Phone className="size-3.5" />
                </span>
                <a
                  href={`tel:${contact.phone.replace(/[^0-9+]/g, "")}`}
                  data-analytics-tracked="true"
                  onClick={() => trackContactClick(contact.id, "phone", contact.school_id)}
                  className="font-bold text-foreground hover:text-primary hover:underline text-xs sm:text-sm"
                >
                  {contact.phone}
                  {contact.extension ? ` ext. ${contact.extension}` : ""}
                </a>
              </div>
            )}

            {/* Email */}
            {contact.email && (
              <div className="flex items-center gap-2">
                <span className="grid size-6 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                  <Mail className="size-3.5" />
                </span>
                <a
                  href={`mailto:${contact.email}`}
                  data-analytics-tracked="true"
                  onClick={() => trackContactClick(contact.id, "email", contact.school_id)}
                  className="font-medium text-foreground hover:text-primary hover:underline truncate text-xs sm:text-sm"
                >
                  {contact.email}
                </a>
              </div>
            )}

            {/* Office Hours */}
            {contact.hours && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-0.5">
                <span className="grid size-6 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
                  <Clock className="size-3" />
                </span>
                <span className="truncate">
                  {lang === "en" ? autoTranslateText(contact.hours, "en") : contact.hours}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Photo / Avatar */}
        <div className="relative size-20 sm:size-24 shrink-0 overflow-hidden rounded-full border-2 border-primary/20 bg-muted shadow-sm">
          {contact.avatar_url && !imgError ? (
            <div className="relative size-full overflow-hidden">
              <img
                src={contact.avatar_url}
                alt={contact.person_name || contact.department}
                className="size-full object-cover transition-transform duration-200"
                style={{
                  transform: `translate(${offsetX}%, ${offsetY}%) scale(${scale}) rotate(${rotation}deg)`,
                  transformOrigin: "center center",
                }}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
              />
            </div>
          ) : (
            <div className="grid size-full place-items-center bg-primary/10 text-primary">
              <User className="size-10" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
