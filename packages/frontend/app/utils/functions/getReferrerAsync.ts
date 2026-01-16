export default async function getReferrerAsync(userAddress: string) {
    const OPTIONS = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            authorization:
                'Bearer 7010050cc4b7274037a80fd9119bce3567ce7443d163c097c787a39dac341870',
        },
    };

    const FUUL_ENDPOINT = `https://api.fuul.xyz/api/v1/user/referrer?user_identifier=${userAddress}&user_identifier_type=solana_address`;

    const response = fetch(FUUL_ENDPOINT, OPTIONS)
        .then((res) => res.json())
        .then((res) => {
            console.log(res);
            return res;
        })
        .catch((err) => console.error(err));

    return response;
}
