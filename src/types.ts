export interface Selection {
	start: { x: number; y: number };
	end: { x: number; y: number };
}

export interface FileNode {
	name: string;
	path: string;
	isDirectory: boolean;
	isOpen: boolean;
	level: number;
}

export interface GitChanges {
	addedLines: Set<number>;
	deletedLines: Set<number>;
}

export interface FileState {
	path: string;
	lines: string[];
	cursor: { x: number; y: number };
	scroll: number;
	scrollX: number;
	loading: boolean;
	error: string | null;
	lang: string;
	isDirty: boolean;
	selection: Selection | null;
	gitChanges: GitChanges | null;
	undoStack: { lines: string[]; cursor: { x: number; y: number }; preferredX?: number }[];
	redoStack: { lines: string[]; cursor: { x: number; y: number }; preferredX?: number }[];
	preferredX?: number;
}
