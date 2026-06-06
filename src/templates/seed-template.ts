import type { Kysely } from 'ormfy'

// replace `any` with your database interface.
export async function seed(db: Kysely<any>): Promise<void> {
	// seed code goes here...
	// note: this function is mandatory. you must implement this function.
}
