const CAPTURE_COMMON_CLASS_SUFFIXES = /adapter|dialect/gi;
export function inferDialectName(kysely) {
    return kysely
        .getExecutor()
        .adapter.constructor.name.replaceAll(CAPTURE_COMMON_CLASS_SUFFIXES, '')
        .toLowerCase();
}
//# sourceMappingURL=infer-dialect-name.js.map