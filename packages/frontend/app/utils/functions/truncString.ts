export default function truncString(
    str: string,
    startLength: number,
    endLength: number,
    separator: string = '…',
): string {
    const output =
        str.length <= startLength + endLength + 1
            ? str
            : str.slice(0, startLength) + separator + str.slice(-endLength);
    return output;
}
