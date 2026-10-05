/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  isSpotifyUrl,
  parseSpotifyUrl,
  isSpotifyEpisode,
  getEpisodeSpotifyUrl,
} from "../lib/spotify";
import { normalizeEpisodeRow, savePodcastEpisode } from "../lib/podcasts";
import { supabase } from "@/integrations/supabase/client";

describe("Spotify Direct Integration (No audio upload required, in-web playback)", () => {
  let originalFrom: any;
  let tables: Map<string, any[]>;

  beforeEach(() => {
    originalFrom = (supabase as any).from;
    tables = new Map<string, any[]>();

    const createBuilder = (tableName: string) => {
      const filters: Array<(r: any) => boolean> = [];
      let pendingMutation: (() => any) | null = null;

      const applyFilters = (list: any[]) => list.filter((r) => filters.every((fn) => fn(r)));

      const builder: any = {
        select: vi.fn().mockImplementation(() => builder),
        eq: vi.fn().mockImplementation((col: string, val: any) => {
          filters.push((row: any) => row[col] === val);
          return builder;
        }),
        order: vi.fn().mockImplementation(() => builder),
        maybeSingle: vi.fn().mockImplementation(async () => {
          if (pendingMutation) {
            return pendingMutation();
          }
          const currentRows = tables.get(tableName) || [];
          const matches = applyFilters(currentRows);
          return { data: matches[0] || null, error: null };
        }),
        single: vi.fn().mockImplementation(async () => {
          if (pendingMutation) {
            return pendingMutation();
          }
          const currentRows = tables.get(tableName) || [];
          const matches = applyFilters(currentRows);
          return { data: matches[0] || null, error: null };
        }),
        insert: vi.fn().mockImplementation((payload: any) => {
          pendingMutation = () => {
            const current = tables.get(tableName) || [];
            const row = Array.isArray(payload) ? payload[0] : payload;
            current.push(row);
            tables.set(tableName, current);
            return { data: row, error: null };
          };
          return builder;
        }),
        upsert: vi.fn().mockImplementation((payload: any) => {
          pendingMutation = () => {
            const current = tables.get(tableName) || [];
            const row = Array.isArray(payload) ? payload[0] : payload;
            const idx = current.findIndex((r: any) => r.id === row.id);
            if (idx >= 0) {
              current[idx] = { ...current[idx], ...row };
            } else {
              current.push(row);
            }
            tables.set(tableName, current);
            return { data: row, error: null };
          };
          return builder;
        }),
        update: vi.fn().mockImplementation((payload: any) => {
          pendingMutation = () => {
            const current = tables.get(tableName) || [];
            current.forEach((r) => {
              if (filters.every((fn) => fn(r))) {
                Object.assign(r, payload);
              }
            });
            return { data: null, error: null };
          };
          return builder;
        }),
      };
      return builder;
    };

    (supabase as any).from = vi
      .fn()
      .mockImplementation((tableName: string) => createBuilder(tableName));
  });

  afterEach(() => {
    (supabase as any).from = originalFrom;
  });

  describe("URL detection and parsing", () => {
    it("detects standard Spotify episode links", () => {
      const url = "https://open.spotify.com/episode/7makk4oTQel546B0PZlDM5";
      expect(isSpotifyUrl(url)).toBe(true);

      const parsed = parseSpotifyUrl(url);
      expect(parsed).not.toBeNull();
      expect(parsed?.type).toBe("episode");
      expect(parsed?.id).toBe("7makk4oTQel546B0PZlDM5");
      expect(parsed?.embedUrl).toBe(
        "https://open.spotify.com/embed/episode/7makk4oTQel546B0PZlDM5?utm_source=generator&theme=0",
      );
    });

    it("detects localized international Spotify episode links", () => {
      const url = "https://open.spotify.com/intl-es/episode/5Abc123XYZ?si=123456";
      expect(isSpotifyUrl(url)).toBe(true);

      const parsed = parseSpotifyUrl(url);
      expect(parsed).not.toBeNull();
      expect(parsed?.type).toBe("episode");
      expect(parsed?.id).toBe("5Abc123XYZ");
      expect(parsed?.embedUrl).toContain("https://open.spotify.com/embed/episode/5Abc123XYZ");
    });

    it("detects Spotify show (channel) links", () => {
      const url = "https://open.spotify.com/show/2lK6Qh8rJg3e9p1X";
      expect(isSpotifyUrl(url)).toBe(true);

      const parsed = parseSpotifyUrl(url);
      expect(parsed).not.toBeNull();
      expect(parsed?.type).toBe("show");
      expect(parsed?.id).toBe("2lK6Qh8rJg3e9p1X");
    });

    it("detects spotify: URI format", () => {
      const uri = "spotify:episode:7makk4oTQel546B0PZlDM5";
      expect(isSpotifyUrl(uri)).toBe(true);

      const parsed = parseSpotifyUrl(uri);
      expect(parsed).not.toBeNull();
      expect(parsed?.type).toBe("episode");
      expect(parsed?.id).toBe("7makk4oTQel546B0PZlDM5");
    });

    it("detects and extracts URL from pasted iframe embed code", () => {
      const iframe =
        '<iframe style="border-radius:12px" src="https://open.spotify.com/embed/episode/7makk4oTQel546B0PZlDM5?utm_source=generator" width="100%" height="352" frameBorder="0"></iframe>';
      expect(isSpotifyUrl(iframe)).toBe(true);

      const parsed = parseSpotifyUrl(iframe);
      expect(parsed).not.toBeNull();
      expect(parsed?.id).toBe("7makk4oTQel546B0PZlDM5");
    });

    it("rejects non-Spotify links", () => {
      expect(isSpotifyUrl("https://example.com/audio.mp3")).toBe(false);
      expect(isSpotifyUrl("https://youtube.com/watch?v=123")).toBe(false);
      expect(isSpotifyUrl("")).toBe(false);
      expect(isSpotifyUrl(null)).toBe(false);
    });
  });

  describe("Episode helpers and normalization", () => {
    it("recognizes Spotify episode from spotify_url", () => {
      const ep = {
        id: "ep_1",
        spotify_url: "https://open.spotify.com/episode/7makk4oTQel546B0PZlDM5",
        audio_url: null,
      };
      expect(isSpotifyEpisode(ep)).toBe(true);
      expect(getEpisodeSpotifyUrl(ep)).toBe(
        "https://open.spotify.com/episode/7makk4oTQel546B0PZlDM5",
      );
    });

    it("recognizes Spotify episode if pasted into audio_url and normalizes it", () => {
      const raw = {
        id: "ep_2",
        podcast_id: "pod_1",
        title: "Episodio de Spotify",
        audio_url: "https://open.spotify.com/episode/7makk4oTQel546B0PZlDM5",
      };
      const normalized = normalizeEpisodeRow(raw);
      expect(normalized.spotify_url).toBe(
        "https://open.spotify.com/episode/7makk4oTQel546B0PZlDM5",
      );
      // audio_url is cleared so native <audio> will not fail trying to load it as MP3
      expect(normalized.audio_url).toBeNull();
      expect(isSpotifyEpisode(normalized)).toBe(true);
    });

    it("preserves native audio_url when it is a regular audio stream", () => {
      const raw = {
        id: "ep_3",
        podcast_id: "pod_1",
        title: "Episodio Local MP3",
        audio_url: "https://storage.example.com/episode.mp3",
      };
      const normalized = normalizeEpisodeRow(raw);
      expect(normalized.spotify_url).toBeNull();
      expect(normalized.audio_url).toBe("https://storage.example.com/episode.mp3");
      expect(isSpotifyEpisode(normalized)).toBe(false);
    });
  });

  describe("Saving episode with Spotify link (No audio upload required)", () => {
    it("successfully saves an episode with only spotify_url and no audio_url", async () => {
      const saved = await savePodcastEpisode({
        podcast_id: "pod_test",
        title: "Episodio Exclusivo Spotify",
        spotify_url: "https://open.spotify.com/episode/7makk4oTQel546B0PZlDM5",
        status: "published",
      });

      expect(saved.id).toBeDefined();
      expect(saved.title).toBe("Episodio Exclusivo Spotify");
      expect(saved.spotify_url).toBe("https://open.spotify.com/episode/7makk4oTQel546B0PZlDM5");
      expect(saved.audio_url).toBeNull();
      expect(saved.metadata?.spotify_url).toBe(
        "https://open.spotify.com/episode/7makk4oTQel546B0PZlDM5",
      );
      expect(saved.status).toBe("published");
    });
  });
});
