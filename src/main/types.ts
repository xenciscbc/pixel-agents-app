import type { ChildProcess } from 'child_process';

export interface MessageSender {
	postMessage(msg: Record<string, unknown>): void;
}

export type AgentMode = 'observe' | 'managed';

export interface AgentState {
	id: number;
	mode: AgentMode;
	processRef: ChildProcess | null;
	projectDir: string;
	jsonlFile: string;
	fileOffset: number;
	lineBuffer: string;
	activeToolIds: Set<string>;
	activeToolStatuses: Map<string, string>;
	activeToolNames: Map<string, string>;
	activeSubagentToolIds: Map<string, Set<string>>;
	activeSubagentToolNames: Map<string, Map<string, string>>;
	isWaiting: boolean;
	permissionSent: boolean;
	hadToolsInTurn: boolean;
}

export interface PersistedAgent {
	id: number;
	jsonlFile: string;
	projectDir: string;
}
