import { assertDefined } from '../utils/assert-defined.js';
export class Seeder {
    #props;
    constructor(props) {
        this.#props = props;
    }
    async getSeeds(seedNames) {
        const seeds = await this.#props.provider.getSeeds(seedNames);
        return Object.entries(seeds).map(([name, seed]) => ({
            name,
            seed,
        }));
    }
    async run(seedNames) {
        const seeds = await this.getSeeds(seedNames);
        const resultSet = {
            error: undefined,
            results: seeds.map((seed) => ({
                seedName: seed.name,
                status: 'NotExecuted',
            })),
        };
        for (let i = 0, len = seeds.length; i < len && !resultSet.error; ++i) {
            const result = resultSet.results[i];
            assertDefined(result);
            const seedInfo = seeds[i];
            assertDefined(seedInfo);
            try {
                await seedInfo.seed.seed(this.#props.db);
                result.status = 'Success';
            }
            catch (err) {
                result.status = 'Error';
                resultSet.error = err;
            }
        }
        return resultSet;
    }
}
//# sourceMappingURL=seeder.js.map