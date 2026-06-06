export class OrmfyInvalidColumnError extends Error {
	constructor(table: string, column: string) {
		super(`Invalid column "${column}" for table "${table}"`);
		this.name = "OrmfyInvalidColumnError";
	}
}

export class OrmfyGuardedColumnError extends Error {
	constructor(table: string, column: string) {
		super(`Column "${column}" is guarded for table "${table}"`);
		this.name = "OrmfyGuardedColumnError";
	}
}

export class OrmfyUnsafeMutationError extends Error {
	constructor() {
		super("Refusing full-table mutation without allowFullTableMutation");
		this.name = "OrmfyUnsafeMutationError";
	}
}

export class OrmfyRecordNotFoundError extends Error {
	constructor(table: string, details?: string) {
		super(`Record not found in "${table}"${details ? ` for ${details}` : ""}`);
		this.name = "OrmfyRecordNotFoundError";
	}
}

export class OrmfyInvalidSortError extends Error {
	constructor(value: string) {
		super(`Invalid sort value "${value}"`);
		this.name = "OrmfyInvalidSortError";
	}
}
