// fn to check if a given ref code is registered to a given wallet
export async function checkIfOwnRefCode(
    rc: string,
    address: string,
): Promise<boolean | undefined> {
    const options = {
        method: 'GET',
        headers: { accept: 'application/json' },
    };

    const ENDPOINT = `https://api.fuul.xyz/api/v1/affiliates/${address}?identifier_type=solana_address`;

    try {
        const response = await fetch(ENDPOINT, options);
        const res = await response.json();
        // the FUUL system is case-sensitive, strings must match exactly
        return res.code?.toLowerCase() === rc.toLowerCase();
    } catch (err) {
        console.error(err);
        return undefined;
    }
}
