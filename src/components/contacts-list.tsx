import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Phone, User } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { ContactCard } from "@/components/contact-card";
import { fetchContacts } from "@/lib/directory";
import { useI18n } from "@/lib/i18n";
import { useSchool } from "@/lib/school";

/** Directory of contacts published as rich Presentation Cards. */
export function ContactsList() {
  const { t } = useI18n();
  const { selectedSchool } = useSchool();
  const contacts = useQuery({
    queryKey: ["contacts", selectedSchool.id],
    queryFn: () => fetchContacts(selectedSchool.id),
  });

  const targetSchoolId = selectedSchool.id;

  const rows = (contacts.data ?? []).filter((c) => {
    if (c.is_visible === false) return false;
    if (!c.school_id || c.school_id === "all" || c.school_id === "*") return true;
    return (
      c.school_id === targetSchoolId ||
      c.school_id === `sch-${targetSchoolId}` ||
      c.school_id.toLowerCase().includes(targetSchoolId.toLowerCase())
    );
  });

  if (contacts.isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-12 text-center">
        <User className="mx-auto size-12 text-muted-foreground/40" />
        <p className="mt-3 text-lg font-semibold text-muted-foreground">{t("contacts.none")}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {rows.map((c) => (
        <ContactCard key={c.id} contact={c} />
      ))}
    </div>
  );
}
