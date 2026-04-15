export type SourceType =
  | "direct"
  | "referral"
  | "social"
  | "search"
  | "email"
  | "other"
  | "unknown";
export type DeviceType = "mobile" | "desktop" | "tablet" | "unknown";

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface ShortLink {
  id: string;
  code: string;
  destination_url: string;
  created_at: string;
  created_by: string;
  expires_at: string | null;
  is_active: boolean;
  click_count: number;
}

export interface ClickEvent {
  id: string;
  short_link_id: string;
  clicked_at: string;
  source: SourceType;
  device: DeviceType;
  ip_hash: string | null;
  user_agent_summary: string | null;
}

/**
 * Environment validation types
 * Defines the structure for deployment environment configuration and validation
 */

export type EnvironmentType = "production" | "preview" | "local";

export interface EnvVariable {
  name: string;
  purpose: string;
  required: boolean;
  format?: string;
  valuePattern?: RegExp;
  example: string;
  sourced: string;
}

export interface EnvironmentProfile {
  name: EnvironmentType;
  environmentType: EnvironmentType;
  requiredVariables: EnvVariable[];
  isProduction: boolean;
  healthCheckEnabled: boolean;
  validatedAt?: string;
}

export interface ConfigurationError extends Error {
  code: string;
  severity: "critical" | "warning";
  variable?: string;
  hint?: string;
  location?: string;
  timestamp?: string;
}

export interface HealthCheckResult {
  status: "healthy" | "unhealthy";
  database: "connected" | "disconnected" | "unreachable";
  environment: "validated" | "invalid";
  errors: Array<{
    code: string;
    severity: string;
    variable?: string;
    message: string;
    hint: string;
    location: string;
  }>;
  warnings: string[];
  timestamp: string;
  responseTime: number;
}

export interface DeploymentVerificationChecklist {
  environmentVariablesSet: boolean;
  healthCheckPassed: boolean;
  databaseConnected: boolean;
  shortenEndpointWorks: boolean;
  redirectEndpointWorks: boolean;
  dashboardAccessible: boolean;
  all: boolean;
}
