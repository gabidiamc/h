/**
 * DMPS Info & DMPS Transit Integration State Manager
 *
 * PREPARATION PHASE CONSTRAINTS:
 * - NO fake connection data or mock tokens.
 * - NO localStorage used as a security authority.
 * - Default status is strictly "NOT_CONNECTED".
 * - Prepared for future secure credential handshake from DMPS Transit Owner Panel.
 */

import type {
  TransitConnectionState,
  TransitIntegrationMetadata,
  TransitModuleCapabilities,
} from "./transit-integration-types";

const INITIAL_TRANSIT_METADATA: TransitIntegrationMetadata = {
  state: "NOT_CONNECTED",
  connectedAt: null,
  lastHeartbeat: null,
  protocolVersion: "1.0-draft",
  instanceName: "DMPS Transit Independent System",
  schoolScope: "all",
  errorMessage: null,
  isVerified: false,
};

let currentTransitMetadata: TransitIntegrationMetadata = {
  ...INITIAL_TRANSIT_METADATA,
};

const statusListeners = new Set<(status: TransitIntegrationMetadata) => void>();

/**
 * Returns the current integration status of DMPS Transit.
 * In this architectural preparation phase, returns state: 'NOT_CONNECTED'.
 */
export function getTransitIntegrationStatus(): TransitIntegrationMetadata {
  return { ...currentTransitMetadata };
}

/**
 * Helper to check whether DMPS Transit is currently connected.
 * In this phase, returns false until the real handshake is completed in a future phase.
 */
export function isTransitConnected(): boolean {
  return currentTransitMetadata.state === "CONNECTED" && currentTransitMetadata.isVerified;
}

/**
 * Subscribes a listener to transit connection status changes.
 * Returns an unsubscribe function.
 */
export function subscribeTransitStatus(
  listener: (status: TransitIntegrationMetadata) => void,
): () => void {
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
}

/**
 * Internal state updater for connection lifecycle events.
 * Reserved for future integration phase.
 */
export function updateTransitConnectionState(
  newState: TransitConnectionState,
  details?: Partial<TransitIntegrationMetadata>,
): void {
  currentTransitMetadata = {
    ...currentTransitMetadata,
    ...details,
    state: newState,
    lastHeartbeat: new Date().toISOString(),
  };

  statusListeners.forEach((listener) => {
    try {
      listener({ ...currentTransitMetadata });
    } catch {
      // Ignore listener errors
    }
  });
}

/**
 * Returns the capabilities of the transit module.
 * When not connected, all active features remain idle or fall back to local DMPS Info guides.
 */
export function getTransitCapabilities(): TransitModuleCapabilities {
  const connected = isTransitConnected();
  return {
    supportsRealtimeTracking: connected,
    supportsTripPlanner: connected,
    supportsLiveNavigation: connected,
    supportsServiceAlerts: connected,
  };
}
