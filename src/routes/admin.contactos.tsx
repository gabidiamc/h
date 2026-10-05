/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Phone,
  Plus,
  Search,
  Filter,
  School as SchoolIcon,
  Trash2,
  Edit,
  Save,
  X,
  User,
  Check,
  Building,
  Sparkles,
  Info,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ContactCard } from "@/components/contact-card";
import { CircularAvatarAdjuster } from "@/components/circular-avatar-adjuster";
import { type ContactRow } from "@/lib/directory";
import { listRows, upsertRow, deleteRow } from "@/lib/admin";
import { useSchool } from "@/lib/school";
import { notifyContentUpdated } from "@/lib/sync";

export const Route = createFileRoute("/admin/contactos")({
  component: AdminContactosPage,
});

const LANGUAGE_OPTIONS = [
  "Español",
  "Inglés",
  "Karen",
  "Árabe",
  "Swahili",
  "Somalí",
  "Francés",
  "Vietnamita",
];

function AdminContactosPage() {
  const queryClient = useQueryClient();
  const { adminSchoolFilter, setAdminSchoolFilter, schools } = useSchool();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingContact, setEditingContact] = useState<ContactRow | null>(null);
  const [isNewContact, setIsNewContact] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [personName, setPersonName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [schoolId, setSchoolId] = useState("all");
  const [phone, setPhone] = useState("");
  const [extension, setExtension] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [hours, setHours] = useState("");
  const [languages, setLanguages] = useState<string[]>(["Español", "Inglés"]);
  const [bio, setBio] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarScale, setAvatarScale] = useState(1);
  const [avatarX, setAvatarX] = useState(0);
  const [avatarY, setAvatarY] = useState(0);
  const [avatarRotate, setAvatarRotate] = useState(0);

  // Fetch contacts
  const contactsQuery = useQuery({
    queryKey: ["admin", "contacts", adminSchoolFilter],
    queryFn: async () => {
      const rows = await listRows("contacts", "department", true, adminSchoolFilter);
      return (rows as unknown as ContactRow[]) || [];
    },
  });

  const allContacts = contactsQuery.data ?? [];

  // Filter contacts by search
  const filteredContacts = allContacts.filter((c) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      (c.person_name && c.person_name.toLowerCase().includes(term)) ||
      (c.department && c.department.toLowerCase().includes(term)) ||
      (c.job_title && c.job_title.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.phone && c.phone.toLowerCase().includes(term)) ||
      (c.address && c.address.toLowerCase().includes(term))
    );
  });

  // Open modal for editing
  const handleOpenEdit = (c: ContactRow) => {
    setIsNewContact(false);
    setEditingContact(c);
    setPersonName(c.person_name || "");
    setJobTitle(c.job_title || "");
    setDepartment(c.department || "");
    setSchoolId(c.school_id || "all");
    setPhone(c.phone || "");
    setExtension(c.extension || "");
    setEmail(c.email || "");
    setWebsite(c.website || "");
    setAddress(c.address || "");
    setHours(c.hours || "");
    setLanguages(Array.isArray(c.languages) ? c.languages : ["Español", "Inglés"]);
    setBio(c.bio || "");
    setIsVisible(c.is_visible !== false);
    setAvatarUrl(c.avatar_url || "");
    setAvatarScale(c.avatar_scale ?? 1);
    setAvatarX(c.avatar_x ?? 0);
    setAvatarY(c.avatar_y ?? 0);
    setAvatarRotate(c.avatar_rotate ?? 0);
  };

  // Open modal for creating new
  const handleOpenNew = () => {
    setIsNewContact(true);
    setEditingContact({
      id: `contact_${Date.now()}`,
      department: "",
      person_name: "",
      job_title: "",
      phone: "",
      extension: null,
      email: "",
      website: "",
      address: "",
      hours: "Lunes a Viernes: 8:00 AM – 4:00 PM",
      languages: ["Español", "Inglés"],
      school_id: adminSchoolFilter && adminSchoolFilter !== "all" ? adminSchoolFilter : "all",
      category_ids: [],
      verification_status: "verified",
      verified_at: new Date().toISOString(),
      is_visible: true,
      avatar_url: "",
      avatar_scale: 1,
      avatar_x: 0,
      avatar_y: 0,
      avatar_rotate: 0,
      bio: "",
    });
    setPersonName("");
    setJobTitle("");
    setDepartment("");
    setSchoolId(adminSchoolFilter && adminSchoolFilter !== "all" ? adminSchoolFilter : "all");
    setPhone("");
    setExtension("");
    setEmail("");
    setWebsite("");
    setAddress("");
    setHours("Lunes a Viernes: 8:00 AM – 4:00 PM");
    setLanguages(["Español", "Inglés"]);
    setBio("");
    setIsVisible(true);
    setAvatarUrl("");
    setAvatarScale(1);
    setAvatarX(0);
    setAvatarY(0);
    setAvatarRotate(0);
  };

  // Toggle language selection
  const handleToggleLanguage = (lang: string) => {
    if (languages.includes(lang)) {
      setLanguages(languages.filter((l) => l !== lang));
    } else {
      setLanguages([...languages, lang]);
    }
  };

  // Save Contact Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!department.trim() && !personName.trim()) {
        throw new Error("Debes indicar al menos un nombre de persona o departamento.");
      }

      const payload: ContactRow = {
        id: editingContact?.id || `contact_${Date.now()}`,
        department: department.trim() || personName.trim(),
        person_name: personName.trim() || null,
        job_title: jobTitle.trim() || null,
        school_id: schoolId === "all" ? "all" : schoolId,
        phone: phone.trim() || null,
        extension: extension.trim() || null,
        email: email.trim() || null,
        website: website.trim() || null,
        address: address.trim() || null,
        hours: hours.trim() || null,
        languages: languages.length > 0 ? languages : ["Español"],
        bio: bio.trim() || null,
        is_visible: isVisible,
        verification_status: "verified",
        verified_at: new Date().toISOString(),
        category_ids: [],
        avatar_url: avatarUrl.trim() || null,
        avatar_scale: avatarScale,
        avatar_x: avatarX,
        avatar_y: avatarY,
        avatar_rotate: avatarRotate,
      };

      await upsertRow("contacts", payload as unknown as Record<string, any>);
      return payload;
    },
    onSuccess: () => {
      toast.success("Tarjeta de presentación guardada y visible al instante.");
      notifyContentUpdated("contacts");
      setEditingContact(null);
      void queryClient.invalidateQueries({ queryKey: ["admin", "contacts"] });
      void queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Error al guardar el contacto.");
    },
  });

  // Delete Contact Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteRow("contacts", id);
    },
    onSuccess: () => {
      toast.success("Contacto eliminado correctamente.");
      notifyContentUpdated("contacts");
      setDeleteConfirmId(null);
      void queryClient.invalidateQueries({ queryKey: ["admin", "contacts"] });
      void queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Error al eliminar el contacto.");
    },
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary mb-2">
            <Phone className="size-3.5" />
            <span>Directorio y Tarjetas de Presentación</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            Contactos y Enlaces Familiares
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            Gestiona las tarjetas de presentación para Lincoln High, East High y servicios del
            distrito escolar. Todas las ediciones se conservan y se muestran directamente a las
            familias.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={handleOpenNew}
            className="min-h-11 rounded-xl gap-2 font-bold shadow-md shadow-primary/20"
          >
            <Plus className="size-4" />
            <span>Nueva Tarjeta de Contacto</span>
          </Button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-border/80 bg-muted/30 p-3">
        {/* School Scope Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: "all", label: "Todas las escuelas" },
            ...schools.map((s) => ({ id: s.id, label: s.short_name || s.name })),
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setAdminSchoolFilter(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                adminSchoolFilter === tab.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-background/80 text-muted-foreground hover:bg-background hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, cargo, teléfono..."
            className="pl-9 min-h-10 rounded-xl bg-background"
          />
        </div>
      </div>

      {/* Contacts Grid */}
      {contactsQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted/60" />
          ))}
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <User className="mx-auto size-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-bold">No se encontraron contactos</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm
              ? "Prueba con otro término de búsqueda."
              : "Crea tu primera tarjeta de presentación."}
          </p>
          <Button onClick={handleOpenNew} className="mt-4 rounded-xl">
            <Plus className="size-4 mr-2" />
            Crear Tarjeta de Contacto
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredContacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              isAdmin
              onEdit={() => handleOpenEdit(contact)}
              onDelete={() => setDeleteConfirmId(contact.id)}
            />
          ))}
        </div>
      )}

      {/* Edit / Create Contact Dialog */}
      <Dialog
        open={editingContact !== null}
        onOpenChange={(open) => !saveMutation.isPending && !open && setEditingContact(null)}
      >
        <DialogContent
          onPointerDownOutside={(e) => saveMutation.isPending && e.preventDefault()}
          onEscapeKeyDown={(e) => saveMutation.isPending && e.preventDefault()}
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
              <Phone className="size-5 text-primary" />
              <span>
                {isNewContact ? "Nueva Tarjeta de Presentación" : "Editar Tarjeta de Presentación"}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* 1. School Selector */}
            <div>
              <label className="text-xs font-bold text-muted-foreground">
                Escuela / Asignación
              </label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {[
                  { id: "all", label: "DMPS (Todo el Distrito)", icon: "🌐" },
                  ...schools.map((s) => ({
                    id: s.id,
                    label: s.name,
                    icon: s.id === "lincoln" ? "🦁" : s.id === "east" ? "🌹" : "🏫",
                  })),
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSchoolId(s.id)}
                    className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all text-left ${
                      schoolId === s.id
                        ? "border-primary bg-primary/10 text-primary shadow-xs"
                        : "border-border bg-card text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    <span>{s.icon}</span>
                    <span className="truncate">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Photo / Avatar Circular Adjuster */}
            <div>
              <CircularAvatarAdjuster
                avatarUrl={avatarUrl}
                onChangeAvatarUrl={setAvatarUrl}
                scale={avatarScale}
                onChangeScale={setAvatarScale}
                offsetX={avatarX}
                onChangeOffsetX={setAvatarX}
                offsetY={avatarY}
                onChangeOffsetY={setAvatarY}
                rotate={avatarRotate}
                onChangeRotate={setAvatarRotate}
              />
            </div>

            {/* 3. Personal Info */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-muted-foreground">
                  Nombre completo <span className="text-destructive">*</span>
                </label>
                <Input
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="Ejemplo: Brenda Lucero"
                  className="mt-1 min-h-11 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground">Puesto / Cargo</label>
                <Input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Ejemplo: Enlace Familiar Bilingüe"
                  className="mt-1 min-h-11 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground">
                Departamento o Área <span className="text-destructive">*</span>
              </label>
              <Input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Ejemplo: Apoyo a Familias Bilingües (BFL)"
                className="mt-1 min-h-11 rounded-xl"
              />
            </div>

            {/* 4. Phone, Extension & Email */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-muted-foreground">Teléfono directo</label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="515-371-7143"
                  className="mt-1 min-h-11 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground">Extensión</label>
                <Input
                  value={extension}
                  onChange={(e) => setExtension(e.target.value)}
                  placeholder="Ej: 104"
                  className="mt-1 min-h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-muted-foreground">
                  Correo electrónico
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@dmschools.org"
                  className="mt-1 min-h-11 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground">
                  Sitio web / Enlace oficial
                </label>
                <Input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 min-h-11 rounded-xl"
                />
              </div>
            </div>

            {/* 5. Office Address & Hours */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-muted-foreground">
                  Ubicación / Oficina
                </label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Sala 104, Lincoln High School"
                  className="mt-1 min-h-11 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground">
                  Horario de atención
                </label>
                <Input
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="Lunes a Viernes: 8:00 AM – 4:00 PM"
                  className="mt-1 min-h-11 rounded-xl"
                />
              </div>
            </div>

            {/* 6. Languages Spoken */}
            <div>
              <label className="text-xs font-bold text-muted-foreground">Idiomas de atención</label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {LANGUAGE_OPTIONS.map((lang) => {
                  const isSelected = languages.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => handleToggleLanguage(lang)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground shadow-xs"
                          : "border-border bg-card text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {isSelected && <Check className="size-3.5" />}
                      <span>{lang}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 7. Bio / Description */}
            <div>
              <label className="text-xs font-bold text-muted-foreground">
                Descripción / Servicios que brinda (Opcional)
              </label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Describe brevemente en qué puede asistir a las familias..."
                className="mt-1 min-h-[70px] rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={saveMutation.isPending}
              className="min-h-11 rounded-xl"
              onClick={() => setEditingContact(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="min-h-11 rounded-xl font-bold gap-2"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              <Save className="size-4" />
              <span>
                {saveMutation.isPending ? "Guardando y Sincronizando..." : "Guardar Tarjeta"}
              </span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={(o) => !o && setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-destructive">
              ¿Eliminar contacto?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Esta acción eliminará la tarjeta de presentación del directorio público. Puedes volver a
            crearla o restaurar los contactos oficiales en cualquier momento.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="min-h-11 rounded-xl"
              onClick={() => setDeleteConfirmId(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="min-h-11 rounded-xl font-bold"
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
            >
              Eliminar Definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
