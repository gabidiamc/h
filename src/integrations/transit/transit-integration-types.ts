/**
 * DMPS Info & DMPS Transit Integration Architecture Types
 *
 * This module defines the architectural contracts for integrating the independent
 * DMPS Transit system into DMPS Info.
 *
 * ARCHITECTURAL BOUNDARIES:
 * 1. ESPACIO PÚBLICO (DMPS Info):
 *    - Open, frictionless access for students, families, and staff.
 *    - No Transit account, login, or app installation required.
 *    - Rendered directly inside the DMPS Info web experience (embedded in-page experience, no external browser tabs).
 *
 * 2. ESPACIO PRIVADO / ADMINISTRATIVO (DMPS Info Admin):
 *    - Access restricted to authorized DMPS Info personnel (AppRole).
 *    - Can initiate the connection handshake by providing an integration credential
 *      issued from the DMPS Transit Owner Panel.
 *    - STRICT ISOLATION: The DMPS Info Admin does NOT have access to the DMPS Transit Owner Panel,
 *      nor does it hold Transit Owner roles.
 *
 * 3. MÓDULO INTEGRADO (DMPS Transit):
 *    - DMPS Transit is an independent system containing the transit engines (GTFS, GTFS-RT,
 *      telemetry, navigation, ratings).
 *    - DMPS Info merely hosts the integration slot without duplicating the transit engine.
 */

export type TransitConnectionState =
  "NOT_CONNECTED" | "CONNECTING" | "CONNECTED" | "UNAVAILABLE" | "ERROR";

export interface TransitIntegrationMetadata {
  /** Integration status */
  state: TransitConnectionState;
  /** Timestamp when connection was established (ISO 8601), or null */
  connectedAt: string | null;
  /** Timestamp of last heartbeat check (ISO 8601), or null */
  lastHeartbeat: string | null;
  /** Integration protocol version */
  protocolVersion: string;
  /** Friendly label for the target transit instance */
  instanceName?: string | null;
  /** School context filter ('all' | 'lincoln' | 'east') */
  schoolScope?: "all" | "lincoln" | "east";
  /** Descriptive error message if state === 'ERROR' or 'UNAVAILABLE' */
  errorMessage?: string | null;
  /** Flag verifying whether the connection was verified server-side */
  isVerified: boolean;
}

/**
 * Public capability flags for the Transit module.
 * In this preparation phase, all remote execution capabilities remain idle
 * until a verified connection is completed in a future phase.
 */
export interface TransitModuleCapabilities {
  supportsRealtimeTracking: boolean;
  supportsTripPlanner: boolean;
  supportsLiveNavigation: boolean;
  supportsServiceAlerts: boolean;
}

export interface TransitIntegrationContainerProps {
  /** Current school context */
  schoolId?: "lincoln" | "east" | "all";
  /** Human-readable school name */
  schoolName?: string;
  /** Fallback content to render while Transit is in NOT_CONNECTED or UNAVAILABLE state */
  children?: React.ReactNode;
  /** Optional custom class names */
  className?: string;
  /** Show an informative banner in the preparation phase */
  showPreparationBanner?: boolean;
}
