import * as dgram from 'dgram';
import type { RemoteAgent, HeartbeatPayload } from './types';

let socket: dgram.Socket | null = null;
let timer: ReturnType<typeof setInterval> | null = null;

export function startBroadcast(
	getAgentSnapshot: () => RemoteAgent[],
	peerId: string,
	getName: () => string,
	getPort: () => number,
	getHeartbeatInterval: () => number,
): void {
	stopBroadcast();

	socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

	socket.on('error', (err) => {
		console.error('[PeerBroadcast] Socket error:', err.message);
		stopBroadcast();
	});

	socket.bind(0, () => {
		socket!.setBroadcast(true);

		const send = (): void => {
			const payload: HeartbeatPayload = {
				v: 1,
				type: 'heartbeat',
				peerId,
				name: getName(),
				agents: getAgentSnapshot(),
			};
			const buf = Buffer.from(JSON.stringify(payload));
			const port = getPort();
			socket?.send(buf, 0, buf.length, port, '255.255.255.255', (err) => {
				if (err) console.error('[PeerBroadcast] Send error:', err.message);
			});
		};

		send();
		timer = setInterval(send, getHeartbeatInterval() * 1000);
	});
}

export function stopBroadcast(): void {
	if (timer) {
		clearInterval(timer);
		timer = null;
	}
	if (socket) {
		try { socket.close(); } catch { /* already closed */ }
		socket = null;
	}
}
