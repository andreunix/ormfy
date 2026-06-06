// types.ts
import type {
	AccessMode,
	Expression,
	ExpressionBuilder,
	Insertable,
	IsolationLevel,
	Kysely,
	Selectable,
	SelectQueryBuilder,
	SqlBool,
	Transaction,
	Updateable,
} from "kysely";

export type OrmfyTableName<DB> = keyof DB & string;
export type OrmfyRow<DB, TName extends OrmfyTableName<DB>> = Selectable<DB[TName]>;
export type OrmfyInsert<DB, TName extends OrmfyTableName<DB>> = Insertable<DB[TName]>;
export type OrmfyCreateInput<DB, TName extends OrmfyTableName<DB>> = Partial<OrmfyInsert<DB, TName>>;
export type OrmfyUpdate<DB, TName extends OrmfyTableName<DB>> = Updateable<DB[TName]>;
export type OrmfyColumn<DB, TName extends OrmfyTableName<DB>> = keyof OrmfyRow<DB, TName> & string;
export type OrmfyNumericColumn<DB, TName extends OrmfyTableName<DB>> = {
	[K in OrmfyColumn<DB, TName>]: OrmfyRow<DB, TName>[K] extends number | null ? K : never;
}[OrmfyColumn<DB, TName>];
export type OrmfyDb<DB> = Kysely<DB> | Transaction<DB>;
export type OrmfyProjection<DB, TName extends OrmfyTableName<DB>, Columns extends readonly OrmfyColumn<DB, TName>[]> = Pick<
	OrmfyRow<DB, TName>,
	Columns[number]
>;

/**
 * Controla como o Ormfy preenche a chave primaria ao criar registros.
 *
 * - `"uuidv7"` gera `Bun.randomUUIDv7()` quando a chave primaria nao vem no input.
 * - `"uuidv4"` gera `Bun.randomUUIDv4()` quando a chave primaria nao vem no input e e o default do Ormfy.
 * - `"manual"` exige que quem chama informe a chave primaria.
 * - `"database"` deixa a chave primaria para um default do banco.
 * - uma funcao permite usar um gerador de id customizado.
 */
export type OrmfyIdStrategy = "database" | "manual" | "uuidv7" | "uuidv4" | (() => string);

/**
 * Configuracao em runtime para um model Ormfy.
 *
 * @example
 * ```ts
 * ormfy(db, "users", {
 *   columns: databaseColumns.users,
 *   guarded: ["id", "created_at", "updated_at"],
 *   idStrategy: "uuidv4",
 *   primaryKey: "id",
 * })
 * ```
 */
export type OrmfyConfig<DB, TName extends OrmfyTableName<DB>> = {
	/** Allowlist de colunas em runtime para validar filtros, ordenacao e updates dinamicos. */
	columns: readonly OrmfyColumn<DB, TName>[];
	/** Colunas que nao podem receber mass assignment via create/update/merge do upsert. */
	guarded?: readonly OrmfyColumn<DB, TName>[];
	/** Estrategia de geracao da chave primaria. Padrao: `"uuidv4"`. */
	idStrategy?: OrmfyIdStrategy;
	/** Coluna de chave primaria usada por `findById`, `updateById`, `deleteById`, etc. Padrao: `"id"`. */
	primaryKey?: OrmfyColumn<DB, TName>;
};

/**
 * Filtro avancado que recebe o expression builder do Kysely.
 *
 * Use quando os operadores simples de filtro nao forem suficientes.
 *
 * @example
 * ```ts
 * usersModel.find({
 *   $complex: (eb) => eb.or([
 *     eb("email", "is not", null),
 *     eb("phone_verified", "=", true),
 *   ]),
 * })
 * ```
 */
export type OrmfyComplexFilter<DB, TName extends OrmfyTableName<DB>> = (eb: ExpressionBuilder<DB, TName>) => Expression<SqlBool>;

/**
 * Filtro simples por objeto aceito por `find`, `findOne`, `update`, `delete`, etc.
 *
 * Chaves diretas viram filtros de igualdade. Os operadores cobrem casos comuns
 * sem esconder o Kysely para queries complexas.
 *
 * @example
 * ```ts
 * citiesModel.find({
 *   state_code: "RO",
 *   $search: { name: "Porto" },
 *   $notNull: ["created_at"],
 * })
 * ```
 */
export type OrmfyFindFilter<DB, TName extends OrmfyTableName<DB>> = Partial<OrmfyRow<DB, TName>> & {
	$between?: Partial<{
		[K in OrmfyColumn<DB, TName>]: [OrmfyRow<DB, TName>[K], OrmfyRow<DB, TName>[K]];
	}>;
	$complex?: OrmfyComplexFilter<DB, TName> | Array<OrmfyComplexFilter<DB, TName>>;
	$gt?: Partial<OrmfyRow<DB, TName>>;
	$gte?: Partial<OrmfyRow<DB, TName>>;
	$in?: Partial<{ [K in OrmfyColumn<DB, TName>]: OrmfyRow<DB, TName>[K][] }>;
	$lt?: Partial<OrmfyRow<DB, TName>>;
	$lte?: Partial<OrmfyRow<DB, TName>>;
	$notEqual?: Partial<{
		[K in OrmfyColumn<DB, TName>]: OrmfyRow<DB, TName>[K];
	}>;
	$notIn?: Partial<{ [K in OrmfyColumn<DB, TName>]: OrmfyRow<DB, TName>[K][] }>;
	$notNull?: Array<OrmfyColumn<DB, TName>>;
	$null?: Array<OrmfyColumn<DB, TName>>;
	$search?: Partial<Record<OrmfyColumn<DB, TName>, string>>;
};

export type OrmfySort<DB, TName extends OrmfyTableName<DB>> = Array<
	[OrmfyColumn<DB, TName>, "asc" | "desc"] | [OrmfyColumn<DB, TName>, "asc" | "desc", "first" | "last"]
>;

export type OrmfyFindOptions<DB, TName extends OrmfyTableName<DB>, TCount extends boolean> = {
	count?: TCount;
	limit?: number;
	offset?: number;
	sort?: OrmfySort<DB, TName>;
	tx?: OrmfyDb<DB>;
};

export type OrmfyFindReturn<DB, TName extends OrmfyTableName<DB>, TCount extends boolean> = Array<
	OrmfyRow<DB, TName> & (TCount extends true ? { count: number } : unknown)
>;

export type OrmfyPageOptions<DB, TName extends OrmfyTableName<DB>> = {
	page?: number;
	perPage?: number;
	sort?: OrmfySort<DB, TName>;
	tx?: OrmfyDb<DB>;
};

export type OrmfyPage<Row> = {
	data: Row[];
	meta: {
		has_next_page: boolean;
		has_previous_page: boolean;
		page: number;
		per_page: number;
		total: number;
		total_pages: number;
	};
};

export type OrmfyCursorPageOptions<DB, TName extends OrmfyTableName<DB>> = {
	cursor?: OrmfyRow<DB, TName>[OrmfyColumn<DB, TName>] | null;
	cursorColumn: OrmfyColumn<DB, TName>;
	direction?: "asc" | "desc";
	perPage?: number;
	tx?: OrmfyDb<DB>;
};

export type OrmfyCursorPage<Row> = {
	data: Row[];
	meta: {
		has_next_page: boolean;
		next_cursor: unknown | null;
		per_page: number;
	};
};

export type OrmfyUpdateInput<DB, TName extends OrmfyTableName<DB>> = OrmfyUpdate<DB, TName> & {
	$decr?: Partial<Record<OrmfyNumericColumn<DB, TName>, number>>;
	$incr?: Partial<Record<OrmfyNumericColumn<DB, TName>, number>>;
};

export type OrmfyMutationOptions<DB> = {
	/**
	 * Permite `update({})` ou `delete({})`.
	 *
	 * O padrao e false para evitar mutacoes acidentais na tabela inteira.
	 */
	allowFullTableMutation?: boolean;
	/** Transacao opcional retornada por `model.transaction(...)`. */
	tx?: OrmfyDb<DB>;
};

export type OrmfyReturningOptions<DB, TName extends OrmfyTableName<DB>, Columns extends readonly OrmfyColumn<DB, TName>[] | undefined = undefined> = {
	returning?: Columns;
	tx?: OrmfyDb<DB>;
};

export type OrmfyMutationReturningOptions<
	DB,
	TName extends OrmfyTableName<DB>,
	Columns extends readonly OrmfyColumn<DB, TName>[] | undefined = undefined,
> = OrmfyMutationOptions<DB> & {
	returning?: Columns;
};

export type OrmfyReturningRow<
	DB,
	TName extends OrmfyTableName<DB>,
	Columns extends readonly OrmfyColumn<DB, TName>[] | undefined,
> = Columns extends readonly OrmfyColumn<DB, TName>[] ? OrmfyProjection<DB, TName, Columns> : OrmfyRow<DB, TName>;

export type OrmfyUpsertOptions<DB, TName extends OrmfyTableName<DB>> = {
	/**
	 * Colunas atualizadas quando houver conflito.
	 *
	 * Obrigatorio de proposito para evitar sobrescrever `id`, `created_at` ou
	 * outras colunas protegidas por acidente.
	 */
	mergeColumns: Array<OrmfyColumn<DB, TName>>;
	/** Transacao opcional retornada por `model.transaction(...)`. */
	tx?: OrmfyDb<DB>;
};

export type OrmfyTransactionOptions = {
	/** Modo de acesso da transacao suportado pelo Kysely, por exemplo `"read write"`. */
	accessMode?: AccessMode;
	/** Nivel de isolamento da transacao, por exemplo `"read committed"` ou `"serializable"`. */
	isolationLevel?: IsolationLevel;
};

export type OrmfyBase<DB, TName extends OrmfyTableName<DB>> = {
	/** Retorna todos os registros. Prefira `find` com filtros em endpoints de API. */
	all: (options?: { tx?: OrmfyDb<DB> }) => Promise<Array<OrmfyRow<DB, TName>>>;
	/**
	 * Insere registros em lotes. E atomico por padrao quando nenhuma transacao e informada.
	 *
	 * @example
	 * ```ts
	 * await citiesModel.batchInsert(rows, { chunkSize: 500 })
	 * ```
	 */
	batchInsert: (
		data: readonly OrmfyCreateInput<DB, TName>[],
		options?: { atomic?: boolean; chunkSize?: number; tx?: OrmfyDb<DB> },
	) => Promise<Array<OrmfyRow<DB, TName>>>;
	/** Conta os registros que batem com o filtro. */
	countDocuments: (filter?: OrmfyFindFilter<DB, TName>, options?: { tx?: OrmfyDb<DB> }) => Promise<number>;
	/**
	 * Insere um registro e retorna a linha criada.
	 *
	 * Com `idStrategy: "uuidv4"` ou sem `idStrategy`, a chave primaria e gerada automaticamente
	 * quando omitida.
	 */
	create: <Columns extends readonly OrmfyColumn<DB, TName>[] | undefined = undefined>(
		data: OrmfyCreateInput<DB, TName>,
		options?: OrmfyReturningOptions<DB, TName, Columns>,
	) => Promise<OrmfyReturningRow<DB, TName, Columns>>;
	/** Alias para `insertMany`. */
	createMany: (data: readonly OrmfyCreateInput<DB, TName>[], options?: { tx?: OrmfyDb<DB> }) => Promise<Array<OrmfyRow<DB, TName>>>;
	/**
	 * Paginacao por cursor para tabelas grandes.
	 *
	 * @example
	 * ```ts
	 * await ordersModel.cursorPaginate(
	 *   { status: "pending" },
	 *   { cursorColumn: "created_at", direction: "desc", perPage: 20 },
	 * )
	 * ```
	 */
	cursorPaginate: (
		filter: OrmfyFindFilter<DB, TName> | undefined,
		options: OrmfyCursorPageOptions<DB, TName>,
	) => Promise<OrmfyCursorPage<OrmfyRow<DB, TName>>>;
	/** Decrementa uma coluna numerica por id e retorna o registro atualizado. */
	decrement: (id: string, column: OrmfyNumericColumn<DB, TName>, amount?: number, options?: { tx?: OrmfyDb<DB> }) => Promise<OrmfyRow<DB, TName>>;
	/**
	 * Remove registros que batem com o filtro.
	 *
	 * Filtros vazios sao rejeitados, exceto quando `allowFullTableMutation` for true.
	 */
	delete: <Columns extends readonly OrmfyColumn<DB, TName>[] | undefined = undefined>(
		filter: OrmfyFindFilter<DB, TName>,
		options?: OrmfyMutationReturningOptions<DB, TName, Columns>,
	) => Promise<Array<OrmfyReturningRow<DB, TName, Columns>>>;
	/** Remove um registro pela chave primaria e retorna o registro removido. */
	deleteById: <Columns extends readonly OrmfyColumn<DB, TName>[] | undefined = undefined>(
		id: string,
		options?: OrmfyReturningOptions<DB, TName, Columns>,
	) => Promise<OrmfyReturningRow<DB, TName, Columns>>;
	/** Retorna true quando nenhum registro bate com o filtro. */
	doesntExist: (filter: OrmfyFindFilter<DB, TName>, options?: { tx?: OrmfyDb<DB> }) => Promise<boolean>;
	/** Retorna true quando pelo menos um registro bate com o filtro. */
	exists: (filter: OrmfyFindFilter<DB, TName>, options?: { tx?: OrmfyDb<DB> }) => Promise<boolean>;
	/**
	 * Busca registros por filtro.
	 *
	 * @example
	 * ```ts
	 * await citiesModel.find(
	 *   { state_code: "RO", $search: { name: "Porto" } },
	 *   { limit: 20, sort: [["name", "asc"]] },
	 * )
	 * ```
	 */
	find: <TCount extends boolean = false>(
		filter?: OrmfyFindFilter<DB, TName>,
		options?: OrmfyFindOptions<DB, TName, TCount>,
	) => Promise<OrmfyFindReturn<DB, TName, TCount>>;
	/** Busca um registro pela chave primaria. Retorna undefined quando nao encontrar. */
	findById: (id: string, options?: { tx?: OrmfyDb<DB> }) => Promise<OrmfyRow<DB, TName> | undefined>;
	/** Busca um registro pela chave primaria ou lanca erro quando nao encontrar. */
	findOrFail: (id: string, options?: { tx?: OrmfyDb<DB> }) => Promise<OrmfyRow<DB, TName>>;
	/** Busca o primeiro registro que bate com o filtro. */
	findOne: (filter: OrmfyFindFilter<DB, TName>, options?: { tx?: OrmfyDb<DB> }) => Promise<OrmfyRow<DB, TName> | undefined>;
	/** Retorna o primeiro registro da tabela. */
	first: (options?: { tx?: OrmfyDb<DB> }) => Promise<OrmfyRow<DB, TName> | undefined>;
	/** Busca o primeiro registro que bate com o filtro, ou cria usando `filter + data`. */
	firstOrCreate: (
		filter: OrmfyFindFilter<DB, TName>,
		data?: OrmfyCreateInput<DB, TName>,
		options?: { tx?: OrmfyDb<DB> },
	) => Promise<OrmfyRow<DB, TName>>;
	/** Busca o primeiro registro que bate com o filtro ou lanca erro. */
	firstOrFail: (filter: OrmfyFindFilter<DB, TName>, options?: { tx?: OrmfyDb<DB> }) => Promise<OrmfyRow<DB, TName>>;
	/** Incrementa uma coluna numerica por id e retorna o registro atualizado. */
	increment: (id: string, column: OrmfyNumericColumn<DB, TName>, amount?: number, options?: { tx?: OrmfyDb<DB> }) => Promise<OrmfyRow<DB, TName>>;
	/** Insere varios registros e retorna as linhas criadas. */
	insertMany: (data: readonly OrmfyCreateInput<DB, TName>[], options?: { tx?: OrmfyDb<DB> }) => Promise<Array<OrmfyRow<DB, TName>>>;
	/**
	 * Seleciona um registro dentro de uma transacao usando `FOR UPDATE`.
	 *
	 * Util para fluxos de pedidos/pagamentos onde workers concorrentes nao devem
	 * atualizar o mesmo registro ao mesmo tempo.
	 */
	lockForUpdate: {
		(tx: Transaction<DB>, filter: OrmfyFindFilter<DB, TName>): Promise<OrmfyRow<DB, TName>>;
		(filter: OrmfyFindFilter<DB, TName>): Promise<OrmfyRow<DB, TName>>;
	};
	/** Paginacao por offset com total. Prefira `cursorPaginate` para tabelas grandes. */
	paginate: (filter?: OrmfyFindFilter<DB, TName>, options?: OrmfyPageOptions<DB, TName>) => Promise<OrmfyPage<OrmfyRow<DB, TName>>>;
	cursorPaginateSelect: <Columns extends readonly OrmfyColumn<DB, TName>[]>(
		columns: Columns,
		filter: OrmfyFindFilter<DB, TName> | undefined,
		options: OrmfyCursorPageOptions<DB, TName>,
	) => Promise<OrmfyCursorPage<OrmfyProjection<DB, TName, Columns>>>;
	paginateSelect: <Columns extends readonly OrmfyColumn<DB, TName>[]>(
		columns: Columns,
		filter?: OrmfyFindFilter<DB, TName>,
		options?: OrmfyPageOptions<DB, TName>,
	) => Promise<OrmfyPage<OrmfyProjection<DB, TName, Columns>>>;
	/** Retorna um array com os valores de uma coluna. */
	pluck: <Column extends OrmfyColumn<DB, TName>>(
		column: Column,
		filter?: OrmfyFindFilter<DB, TName>,
		options?: { tx?: OrmfyDb<DB> },
	) => Promise<Array<OrmfyRow<DB, TName>[Column]>>;
	/**
	 * Retorna o query builder do Kysely para casos que o Ormfy nao deve abstrair.
	 *
	 * @example
	 * ```ts
	 * await ordersModel.query(tx).where("status", "=", "pending").forUpdate().execute()
	 * ```
	 */
	query: (tx?: OrmfyDb<DB>) => SelectQueryBuilder<DB, TName, {}>;
	/** Retorna o comportamento antigo de `query()`, ja com `selectAll()`. */
	queryAll: (tx?: OrmfyDb<DB>) => SelectQueryBuilder<DB, TName, OrmfyRow<DB, TName>>;
	select: <Columns extends readonly OrmfyColumn<DB, TName>[]>(
		columns: Columns,
		filter?: OrmfyFindFilter<DB, TName>,
		options?: OrmfyFindOptions<DB, TName, false>,
	) => Promise<Array<OrmfyProjection<DB, TName, Columns>>>;
	selectOne: <Columns extends readonly OrmfyColumn<DB, TName>[]>(
		columns: Columns,
		filter?: OrmfyFindFilter<DB, TName>,
		options?: OrmfyFindOptions<DB, TName, false>,
	) => Promise<OrmfyProjection<DB, TName, Columns> | undefined>;
	/**
	 * Executa uma transacao do Kysely.
	 *
	 * @example
	 * ```ts
	 * await ordersModel.transaction({ isolationLevel: "read committed" }, async (tx) => {
	 *   const order = await ordersModel.lockForUpdate(tx, { id })
	 *   await ordersModel.updateById(order.id, { status: "accepted" }, { tx })
	 * })
	 * ```
	 */
	transaction: {
		<T>(callback: (tx: Transaction<DB>) => Promise<T>): Promise<T>;
		<T>(options: OrmfyTransactionOptions, callback: (tx: Transaction<DB>) => Promise<T>): Promise<T>;
	};
	tx: {
		<T>(callback: (model: OrmfyBase<DB, TName>, tx: Transaction<DB>) => Promise<T>): Promise<T>;
		<T>(options: OrmfyTransactionOptions, callback: (model: OrmfyBase<DB, TName>, tx: Transaction<DB>) => Promise<T>): Promise<T>;
	};
	/**
	 * Atualiza registros que batem com o filtro.
	 *
	 * Filtros vazios sao rejeitados, exceto quando `allowFullTableMutation` for true.
	 */
	update: <Columns extends readonly OrmfyColumn<DB, TName>[] | undefined = undefined>(
		filter: OrmfyFindFilter<DB, TName>,
		data: OrmfyUpdateInput<DB, TName>,
		options?: OrmfyMutationReturningOptions<DB, TName, Columns>,
	) => Promise<Array<OrmfyReturningRow<DB, TName, Columns>>>;
	/** Atualiza um registro pela chave primaria e retorna o registro atualizado. */
	updateById: <Columns extends readonly OrmfyColumn<DB, TName>[] | undefined = undefined>(
		id: string,
		data: OrmfyUpdateInput<DB, TName>,
		options?: OrmfyReturningOptions<DB, TName, Columns>,
	) => Promise<OrmfyReturningRow<DB, TName, Columns>>;
	/** Atualiza o primeiro registro encontrado ou cria um novo usando `filter + data`. */
	updateOrCreate: (
		filter: OrmfyFindFilter<DB, TName>,
		data: OrmfyCreateInput<DB, TName>,
		options?: { tx?: OrmfyDb<DB> },
	) => Promise<OrmfyRow<DB, TName>>;
	/**
	 * Insere registros ou atualiza colunas explicitas quando houver conflito.
	 *
	 * `mergeColumns` e obrigatorio para evitar sobrescrever campos protegidos
	 * por acidente.
	 */
	upsert: (
		data: readonly OrmfyCreateInput<DB, TName>[],
		onConflict: OrmfyColumn<DB, TName> | Array<OrmfyColumn<DB, TName>>,
		options: OrmfyUpsertOptions<DB, TName>,
	) => Promise<Array<OrmfyRow<DB, TName>>>;
	/** Retorna o valor de uma coluna do primeiro registro encontrado. */
	value: <Column extends OrmfyColumn<DB, TName>>(
		column: Column,
		filter: OrmfyFindFilter<DB, TName>,
		options?: { tx?: OrmfyDb<DB> },
	) => Promise<OrmfyRow<DB, TName>[Column] | undefined>;
	withTx: (tx: OrmfyDb<DB>) => OrmfyBase<DB, TName>;
};

export type Ormfy<DB, TName extends OrmfyTableName<DB>, CustomOps extends object> = Omit<OrmfyBase<DB, TName>, "tx" | "withTx"> &
	CustomOps & {
		tx: {
			<T>(callback: (model: Ormfy<DB, TName, CustomOps>, tx: Transaction<DB>) => Promise<T>): Promise<T>;
			<T>(options: OrmfyTransactionOptions, callback: (model: Ormfy<DB, TName, CustomOps>, tx: Transaction<DB>) => Promise<T>): Promise<T>;
		};
		withTx: (tx: OrmfyDb<DB>) => Ormfy<DB, TName, CustomOps>;
	};
export type OrmfyCustomOpsFactory<DB, TName extends OrmfyTableName<DB>, CustomOps extends object> = (base: OrmfyBase<DB, TName>) => CustomOps;
