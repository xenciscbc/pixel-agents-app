import * as dgram from 'dgram';
import type { RemoteAgent, RemotePeer, HeartbeatPayload } from './types';

interface PeerState {
	name: string;
	agents: RemoteAgent[];
	lastSeen: number;
}

let socket: dgram.Socket | null = null;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;
const peers = new Map<string, PeerState>();

export function startDiscovery(
	port: number,
	peerId: string,
	getHeartbeatInterval: () => number,
	onPeersChanged: (peers: RemotePeer[]) => void,
): void {
	stopDiscovery();

	socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

	socket.on('error', (err) => {
		console.error('[PeerDiscovery] Socket error:', err.message);
		stopDiscovery();
	});

	socket.on('message', (msg) => {
		try {
			const payload = JSON.parse(msg.toString()) as HeartbeatPayload;
			if (payload.v !== 1 || payload.type !== 'heartbeat') return;
			if (payload.peerId === peerId) return;

			const existing = peers.get(payload.peerId);
			const changed = !existing
				|| existing.name !== payload.name
				|| JSON.stringify(existing.agents) !== JSON.stringify(payload.agents);

			peers.set(payload.peerId, {
				name: payload.name,
				agents: payload.agents,
				lastSeen: Date.now(),
			});

			if (changed) {
				onPeersChanged(getPeersSnapshot());
			}
		} catch { /* ignore malformed messages */ }
	});

	socket.bind(port, () => {
		console.log(`[PeerDiscovery] Listening on port ${port}`);
	});

	// Cleanup stale peers every second
	cleanupTimer = setInterval(() => {
		const timeout = getHeartbeatInterval() * 3 * 1000;
		const now = Date.now();
		let removed = false;
		for (const [id, state] of peers) {
			if (now - state.lastSeen > timeout) {
				peers.delete(id);
				removed = true;
			}
		}
		if (removed) {
			onPeersChanged(getPeersSnapshot());
		}
	}, 1000);
}

function getPeersSnapshot(): RemotePeer[] {
	return Array.from(peers.entries()).map(([peerId, state]) => ({
		peerId,
		name: state.name,
		agents: state.agents,
	}));
}

export function stopDiscovery(): void {
	if (cleanupTimer) {
		clearInterval(cleanupTimer);
		cleanupTimer = null;
	}
	if (socket) {
		try { socket.close(); } catch { /* already closed */ }
		socket = null;
	}
	peers.clear();
}
