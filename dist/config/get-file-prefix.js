export function getKnexTimestampPrefix() {
    const now = new Date();
    const year = now.getUTCFullYear().toString();
    const month = toPaddedNumber(now.getUTCMonth() + 1);
    const day = toPaddedNumber(now.getUTCDate());
    const hour = toPaddedNumber(now.getUTCHours());
    const minute = toPaddedNumber(now.getUTCMinutes());
    const second = toPaddedNumber(now.getUTCSeconds());
    return `${year}${month}${day}${hour}${minute}${second}_`;
}
function toPaddedNumber(number) {
    return number.toString().padStart(2, '0');
}
export function getMillisPrefix() {
    return `${Date.now()}_`;
}
//# sourceMappingURL=get-file-prefix.js.map