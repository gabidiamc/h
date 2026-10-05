import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAppearance } from "@/lib/directory";
import { applyFaviconToDocument, applyPwaIconToDocument } from "@/lib/branding";

/**
 * Global component that synchronizes website Favicon and PWA icons in real-time
 * into the document <head> based on the appearance settings in Supabase.
 */
export function BrandingHeadSync() {
  const { data: appearance, refetch } = useQuery({
    queryKey: ["appearance"],
    queryFn: fetchAppearance,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (appearance) {
      applyFaviconToDocument(appearance.favicon_url, appearance.branding_version);
      applyPwaIconToDocument(appearance.pwa_icon_url, appearance.branding_version);
    }
  }, [appearance]);

  useEffect(() => {
    const handleUpdate = () => {
      void refetch();
    };
    window.addEventListener("dmps_appearance_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("dmps_appearance_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [refetch]);

  return null;
}
