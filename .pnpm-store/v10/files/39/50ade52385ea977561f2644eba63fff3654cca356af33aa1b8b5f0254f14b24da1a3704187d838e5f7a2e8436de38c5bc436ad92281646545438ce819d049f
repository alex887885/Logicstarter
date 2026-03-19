import * as _better_fetch_fetch0 from "@better-fetch/fetch";

//#region src/client.d.ts
interface DashAuditLog {
  eventType: string;
  eventData: Record<string, unknown>;
  eventKey: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  ageInMinutes?: number;
  location?: {
    ipAddress?: string;
    city?: string;
    country?: string;
    countryCode?: string;
  };
}
interface DashAuditLogsResponse {
  events: DashAuditLog[];
  total: number;
  limit: number;
  offset: number;
}
type SessionLike = {
  user?: {
    id?: string | null;
  };
};
type UserLike = {
  id?: string | null;
};
interface DashGetAuditLogsInput {
  limit?: number;
  offset?: number;
  organizationId?: string;
  identifier?: string;
  eventType?: string;
  userId?: string;
  user?: UserLike | null;
  session?: SessionLike | null;
}
interface DashClientOptions {
  resolveUserId?: (input: {
    userId?: string;
    user?: UserLike | null;
    session?: SessionLike | null;
  }) => string | undefined;
}
declare const dashClient: (options?: DashClientOptions) => {
  id: "dash";
  getActions: ($fetch: _better_fetch_fetch0.BetterFetch) => {
    dash: {
      getAuditLogs: (input?: DashGetAuditLogsInput) => Promise<{
        data: DashAuditLogsResponse;
        error: null;
      } | {
        data: null;
        error: {
          message?: string | undefined;
          status: number;
          statusText: string;
        };
      }>;
    };
  };
  pathMethods: {
    "/events/audit-logs": "GET";
  };
};
interface SentinelClientOptions {
  /**
   * The URL of the identification service
   * @default "https://kv.better-auth.com"
   */
  identifyUrl?: string;
  /**
   * Whether to automatically solve PoW challenges (default: true)
   */
  autoSolveChallenge?: boolean;
  /**
   * Callback when a PoW challenge is received
   */
  onChallengeReceived?: (reason: string) => void;
  /**
   * Callback when a PoW challenge is solved
   */
  onChallengeSolved?: (solveTimeMs: number) => void;
  /**
   * Callback when a PoW challenge fails to solve
   */
  onChallengeFailed?: (error: Error) => void;
}
declare const sentinelClient: (options?: SentinelClientOptions) => {
  id: "sentinel";
  fetchPlugins: ({
    id: string;
    name: string;
    hooks: {
      onRequest<T extends Record<string, any>>(context: _better_fetch_fetch0.RequestContext<T>): Promise<_better_fetch_fetch0.RequestContext<T>>;
      onResponse?: undefined;
    };
  } | {
    id: string;
    name: string;
    hooks: {
      onResponse(context: _better_fetch_fetch0.ResponseContext): Promise<_better_fetch_fetch0.ResponseContext>;
      onRequest<T extends Record<string, any>>(context: _better_fetch_fetch0.RequestContext<T>): Promise<_better_fetch_fetch0.RequestContext<T>>;
    };
  })[];
};
//#endregion
export { DashAuditLog, DashAuditLogsResponse, DashClientOptions, DashGetAuditLogsInput, SentinelClientOptions, dashClient, sentinelClient };