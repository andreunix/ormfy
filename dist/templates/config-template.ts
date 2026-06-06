import {
	DummyDriver,
	PostgresAdapter,
	PostgresIntrospector,
	PostgresQueryCompiler,
	defineConfig,
} from 'ormfy'

export default defineConfig({
	// replace me with a real dialect instance OR a dialect name + `dialectConfig` prop.
	dialect: {
		createAdapter() {
			return new PostgresAdapter()
		},
		createDriver() {
			return new DummyDriver()
		},
		createIntrospector(db: unknown) {
			return new PostgresIntrospector(db as never)
		},
		createQueryCompiler() {
			return new PostgresQueryCompiler()
		},
	},
	//   migrations: {
	//     migrationFolder: "migrations",
	//   },
	//   plugins: [],
	//   seeds: {
	//     seedFolder: "seeds",
	//   }
})
