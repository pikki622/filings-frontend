import { apiClient } from './client';
import type { CLI, CommandSchema, CommandGroup } from '../types/command';

/**
 * Fetch all command schemas for a given CLI
 */
export async function fetchCommandSchemas(cli: CLI): Promise<CommandSchema[]> {
  const response = await apiClient.get<CommandSchema[]>(`/api/commands/schemas/${cli}`);
  return response.data;
}

/**
 * Fetch command schemas grouped by their group name
 */
export async function fetchCommandGroups(cli: CLI): Promise<CommandGroup[]> {
  const response = await apiClient.get<CommandGroup[]>(`/api/commands/schemas/${cli}/groups`);
  return response.data;
}

/**
 * Check if a CLI is available and responsive
 */
export async function checkCliStatus(cli: CLI): Promise<{
  available: boolean;
  version?: string;
  error?: string;
}> {
  try {
    const response = await apiClient.get<{ available: boolean; version?: string }>(
      `/api/commands/status/${cli}`
    );
    return response.data;
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get the WebSocket URL for command execution
 */
export function getCommandWebSocketUrl(): string {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const wsProtocol = baseUrl.startsWith('https') ? 'wss' : 'ws';
  const wsUrl = baseUrl.replace(/^https?/, wsProtocol);
  return `${wsUrl}/api/commands/execute`;
}

/**
 * Search for tickers with autocomplete
 */
export async function searchTickers(query: string): Promise<string[]> {
  if (!query || query.length < 1) {
    return [];
  }
  const response = await apiClient.get<string[]>('/api/files/tickers', {
    params: { search: query },
  });
  return response.data;
}
