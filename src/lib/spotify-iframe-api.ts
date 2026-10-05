/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Spotify IFrame Player API Client & Controller Manager
 * Official documentation: https://developer.spotify.com/documentation/embeds/tutorials/using-the-iframe-api
 *
 * Enables bidirectional programmatic control (play, pause, toggle, seek) of
 * embedded Spotify podcast episodes inside DMPS INFO.
 */

export interface SpotifyEmbedController {
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  loadUri: (uri: string) => void;
  destroy: () => void;
  addListener: (event: string, callback: (event: any) => void) => void;
  removeListener?: (event: string, callback: (event: any) => void) => void;
}

export interface SpotifyIFrameAPI {
  createController: (
    element: HTMLElement,
    options: {
      uri: string;
      width?: string | number;
      height?: string | number;
    },
    callback: (controller: SpotifyEmbedController) => void,
  ) => void;
}

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (IFrameAPI: SpotifyIFrameAPI) => void;
    SpotifyIframeApi?: SpotifyIFrameAPI;
  }
}

let activeController: SpotifyEmbedController | null = null;
const controllerRegistry = new Map<string, SpotifyEmbedController>();
const controllerSubscribers = new Set<(c: SpotifyEmbedController | null) => void>();

export function getActiveSpotifyController(): SpotifyEmbedController | null {
  return activeController;
}

export function setActiveSpotifyController(
  controller: SpotifyEmbedController | null,
  uri?: string | null,
): void {
  if (controller) {
    activeController = controller;
    if (uri) {
      controllerRegistry.set(uri, controller);
    }
  }
  controllerSubscribers.forEach((fn) => {
    try {
      fn(controller);
    } catch {
      // ignore subscriber error
    }
  });
}

export function clearActiveSpotifyController(
  controllerToClear?: SpotifyEmbedController | null,
  uri?: string | null,
): void {
  if (uri) {
    controllerRegistry.delete(uri);
  }
  if (!controllerToClear || activeController === controllerToClear) {
    // If there is another registered controller in the registry, switch to it
    const remaining = Array.from(controllerRegistry.values()).pop() || null;
    activeController = remaining;
    controllerSubscribers.forEach((fn) => {
      try {
        fn(remaining);
      } catch {
        // ignore
      }
    });
  }
}

export function getSpotifyControllerForUri(uri: string): SpotifyEmbedController | null {
  if (controllerRegistry.has(uri)) {
    return controllerRegistry.get(uri)!;
  }
  return activeController;
}

export function subscribeSpotifyController(
  fn: (c: SpotifyEmbedController | null) => void,
): () => void {
  controllerSubscribers.add(fn);
  return () => {
    controllerSubscribers.delete(fn);
  };
}

let apiPromise: Promise<SpotifyIFrameAPI> | null = null;

export function loadSpotifyIframeApi(): Promise<SpotifyIFrameAPI> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("window is undefined"));
  }

  if (window.SpotifyIframeApi) {
    return Promise.resolve(window.SpotifyIframeApi);
  }

  if (apiPromise) {
    return apiPromise;
  }

  apiPromise = new Promise<SpotifyIFrameAPI>((resolve) => {
    // If the API script is already on page
    const existing = document.querySelector('script[src*="spotify.com/embed/iframe-api"]');

    const previousCallback = window.onSpotifyIframeApiReady;
    window.onSpotifyIframeApiReady = (IFrameAPI: SpotifyIFrameAPI) => {
      window.SpotifyIframeApi = IFrameAPI;
      if (previousCallback) {
        try {
          previousCallback(IFrameAPI);
        } catch {
          // ignore
        }
      }
      resolve(IFrameAPI);
    };

    if (!existing) {
      const script = document.createElement("script");
      script.src = "https://open.spotify.com/embed/iframe-api/v1";
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return apiPromise;
}

/**
 * Executes a seek command on the active Spotify controller.
 */
export function sendSpotifySeek(seconds: number, uri?: string): boolean {
  let handled = false;
  const controller = (uri ? getSpotifyControllerForUri(uri) : null) || activeController;
  if (controller) {
    try {
      controller.seek(Math.max(0, Math.round(seconds)));
      handled = true;
    } catch {
      // ignore
    }
  }

  return handled;
}

/**
 * Executes a play command on the active Spotify controller.
 */
export function sendSpotifyPlay(uri?: string): boolean {
  let handled = false;
  const controller = (uri ? getSpotifyControllerForUri(uri) : null) || activeController;
  if (controller) {
    try {
      controller.play();
      handled = true;
    } catch {
      // ignore
    }
  }

  return handled;
}

/**
 * Executes a pause command on the active Spotify controller.
 */
export function sendSpotifyPause(uri?: string): boolean {
  let handled = false;
  const controller = (uri ? getSpotifyControllerForUri(uri) : null) || activeController;
  if (controller) {
    try {
      controller.pause();
      handled = true;
    } catch {
      // ignore
    }
  }

  return handled;
}

/**
 * Executes a toggle play/pause command on the active Spotify controller.
 */
export function sendSpotifyTogglePlay(uri?: string): boolean {
  let handled = false;
  const controller = (uri ? getSpotifyControllerForUri(uri) : null) || activeController;
  if (controller) {
    try {
      controller.togglePlay();
      handled = true;
    } catch {
      // ignore
    }
  }

  return handled;
}
