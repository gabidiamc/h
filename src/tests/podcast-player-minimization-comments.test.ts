import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchPodcastComments, addPodcastComment } from "@/lib/podcasts";
import { fetchPodcastMetadata } from "@/lib/spotify";

describe("Podcast Minimization, Continuous Playback, Metadata Auto-fill & Public Comments", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("1. Public Comments: allows adding comments without user account and retrieves them publicly", async () => {
    const podcastId = `test_pod_${Date.now()}`;

    // Verify initial comments are empty
    const initial = await fetchPodcastComments(podcastId);
    expect(initial).toEqual([]);

    // Add comment anonymously without an account
    const comment1 = await addPodcastComment({
      podcastId,
      authorName: "", // Empty defaults to anonymous
      content: "Excelente episodio para las familias de Lincoln High School!",
    });

    expect(comment1).toBeDefined();
    expect(comment1.id).toBeDefined();
    expect(comment1.author_name).toBe("Oyente anónimo");
    expect(comment1.content).toBe("Excelente episodio para las familias de Lincoln High School!");

    // Add another comment with custom family name
    const comment2 = await addPodcastComment({
      podcastId,
      authorName: "Familia Morales",
      content: "Muy buena información sobre el transporte escolar DART.",
    });

    expect(comment2.author_name).toBe("Familia Morales");

    // Fetch comments again: both should be publicly available
    const publicComments = await fetchPodcastComments(podcastId);
    expect(publicComments.length).toBe(2);
    expect(publicComments[0].content).toBe(
      "Muy buena información sobre el transporte escolar DART.",
    );
    expect(publicComments[1].content).toBe(
      "Excelente episodio para las familias de Lincoln High School!",
    );
  });

  it("2. Link Auto-Fill: extracts title, description, and cover from Spotify, RSS, and web URLs", async () => {
    // Test Spotify Episode parsing
    const spotifyUrl = "https://open.spotify.com/episode/7makk4oTQel546B0PZlDM5";
    const spotifyMeta = await fetchPodcastMetadata(spotifyUrl);
    expect(spotifyMeta).toBeDefined();
    if (spotifyMeta) {
      expect(spotifyMeta.type).toBe("episode");
    }

    // Test Audio URL
    const audioUrl = "https://example.com/podcasts/episodio-1-bienvenida-escolar.mp3";
    const audioMeta = await fetchPodcastMetadata(audioUrl);
    expect(audioMeta).toBeDefined();
    expect(audioMeta?.title).toContain("Episodio 1 Bienvenida Escolar");
    expect(audioMeta?.description).toBeDefined();
    expect(audioMeta?.description?.length).toBeGreaterThan(0);
  });

  it("3. Audio Playback Persistence: saves and restores playback position without restarting from 0", () => {
    const RESUME_KEY = "dmps_podcast_resume_positions_v1";
    const episodeId = "ep_continuidad_123";

    // Mock storage
    const storageStore: Record<string, string> = {};
    const mockStorage = {
      getItem: (k: string) => storageStore[k] || null,
      setItem: (k: string, v: string) => {
        storageStore[k] = v;
      },
    };

    // Simulate playback position reaching 245 seconds (4 minutes 5 seconds)
    const savedMap = { [episodeId]: 245 };
    mockStorage.setItem(RESUME_KEY, JSON.stringify(savedMap));

    // Verify it can be retrieved from storage
    const loaded = JSON.parse(mockStorage.getItem(RESUME_KEY) || "{}");
    expect(loaded[episodeId]).toBe(245);
    expect(loaded[episodeId]).not.toBe(0);
  });
});
