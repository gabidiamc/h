import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { CATEGORIES_QUERY_OPTIONS } from "@/lib/categories-service";
import { SITE_SETTINGS_QUERY_OPTIONS } from "@/lib/site-settings-service";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
      },
    },
  });

  queryClient.setQueryDefaults(["categories"], CATEGORIES_QUERY_OPTIONS);
  queryClient.setQueryDefaults(["admin", "categories"], CATEGORIES_QUERY_OPTIONS);
  queryClient.setQueryDefaults(["site_settings"], SITE_SETTINGS_QUERY_OPTIONS);
  queryClient.setQueryDefaults(["settings"], SITE_SETTINGS_QUERY_OPTIONS);
  queryClient.setQueryDefaults(["popup-announcement"], SITE_SETTINGS_QUERY_OPTIONS);
  queryClient.setQueryDefaults(["popup_announcement"], SITE_SETTINGS_QUERY_OPTIONS);
  queryClient.setQueryDefaults(["public_menu_items"], SITE_SETTINGS_QUERY_OPTIONS);
  queryClient.setQueryDefaults(["app_article_featured"], SITE_SETTINGS_QUERY_OPTIONS);
  queryClient.setQueryDefaults(["app-article"], SITE_SETTINGS_QUERY_OPTIONS);
  queryClient.setQueryDefaults(["external_services"], SITE_SETTINGS_QUERY_OPTIONS);

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
