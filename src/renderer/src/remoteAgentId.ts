/**
 * Compute a deterministic negative ID for a remote agent.
 * Uses a full-string hash of peerId to minimise collisions.
 */
export function getRemoteAgentId(peerId: string, agentId: number): number {
  const hash = Array.from(peerId).reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return -(hash * 1000 + Math.abs(agentId))
}
