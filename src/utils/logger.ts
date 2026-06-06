import { createInterface } from 'node:readline/promises'

export const LogLevels = {
	debug: 4,
} as const

export const consola = {
	level: 0,
	options: {
		formatOptions: {
			date: false,
		},
	},
	log(...args: unknown[]) {
		console.log(...args)
	},
	info(...args: unknown[]) {
		console.log(...args)
	},
	warn(...args: unknown[]) {
		console.warn(...args)
	},
	error(...args: unknown[]) {
		console.error(...args)
	},
	debug(...args: unknown[]) {
		if (this.level >= LogLevels.debug) {
			console.debug(...args)
		}
	},
	success(message: string) {
		console.log(`OK ${message}`)
	},
	fail(message: string) {
		console.error(`FAIL ${message}`)
	},
	start(message: string) {
		console.log(message)
	},
	box(message: string) {
		console.log(message)
	},
	async prompt(
		message: string,
		options: { cancel?: string | null; placeholder?: string; required?: boolean; type?: 'text' } = {},
	): Promise<string | null> {
		const readline = createInterface({
			input: process.stdin,
			output: process.stdout,
		})

		try {
			while (true) {
				const answer = await readline.question(`${message} `)

				if (answer === options.cancel) {
					return null
				}

				if (!options.required || answer.trim()) {
					return answer
				}
			}
		} finally {
			readline.close()
		}
	},
}
