// fn to screen a text string for permissible characters (no regex)
export function checkForPermittedCharacters(input: string): boolean {
    if (input.length === 0) return true;
    for (let i: number = 0; i < input.length; i++) {
        const char: string = input[i];
        const isAlphanumeric: boolean =
            (char >= 'A' && char <= 'Z') ||
            (char >= 'a' && char <= 'z') ||
            (char >= '0' && char <= '9');
        const isHyphen: boolean = char === '-';

        if (!isAlphanumeric && !isHyphen) {
            return false;
        }
    }
    return true;
}
