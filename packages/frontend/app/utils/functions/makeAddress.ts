const BASE58_ALPHABET =
    '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Encode(buffer: number[]): string {
    let intVal = BigInt(0);
    for (let i = 0; i < buffer.length; i++) {
        intVal = (intVal << 8n) + BigInt(buffer[i]);
    }
    let encoded = '';
    while (intVal > 0) {
        const rem = Number(intVal % 58n);
        intVal = intVal / 58n;
        encoded = BASE58_ALPHABET[rem] + encoded;
    }
    // Add '1' for each leading 0 byte
    for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
        encoded = BASE58_ALPHABET[0] + encoded;
    }
    return encoded;
}

function generatePseudoRandomBytes(length: number): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < length; i++) {
        bytes.push(Math.floor(Math.random() * 256));
    }
    return bytes;
}

export function generateSolanaAddress(): string {
    const randomBytes = generatePseudoRandomBytes(32);
    return base58Encode(randomBytes);
}

export const BASE58_REGEX =
    /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;

export function isValidBase58(str: string): boolean {
    return BASE58_REGEX.test(str);
}
