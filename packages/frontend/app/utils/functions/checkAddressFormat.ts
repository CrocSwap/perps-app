// fn to determine if a string is a valid Solana address in format
export function checkAddressFormat(address: string): boolean {
    // output variable with a default value of `true`
    let output: boolean = true;

    // set output to false if address is the wrong length
    if (address.length < 32 || address.length > 44) {
        output = false;
    }

    // define valid base58 characters
    const base58Chars =
        '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

    // set output to false if input contains non-base58 characters
    for (let i = 0; i < address.length; i++) {
        if (!base58Chars.includes(address[i])) {
            output = false;
        }
    }

    // return output variable
    return output;
}
