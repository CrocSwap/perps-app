export const handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' }),
            headers: { 'Content-Type': 'application/json' },
        };
    }

    try {
        const hubspotToken = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
        if (!hubspotToken) {
            return {
                statusCode: 500,
                body: JSON.stringify({
                    error: 'HubSpot configuration missing',
                }),
                headers: { 'Content-Type': 'application/json' },
            };
        }

        const walletAddress = event.queryStringParameters?.wallet;
        if (!walletAddress) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Wallet address is required' }),
                headers: { 'Content-Type': 'application/json' },
            };
        }

        // Search for contact by wallet_address property
        const searchUrl =
            'https://api.hubapi.com/crm/v3/objects/contacts/search';
        const searchResponse = await fetch(searchUrl, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${hubspotToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                filterGroups: [
                    {
                        filters: [
                            {
                                propertyName: 'wallet_address',
                                operator: 'EQ',
                                value: walletAddress,
                            },
                        ],
                    },
                ],
                properties: [
                    'email',
                    'firstname',
                    'lastname',
                    'wallet_address',
                    'lifecyclestage',
                    'hs_lead_status',
                    'createdate',
                ],
                limit: 1,
            }),
        });

        if (!searchResponse.ok) {
            const errorText = await searchResponse.text();
            return {
                statusCode: searchResponse.status,
                body: JSON.stringify({
                    error: 'Failed to search HubSpot',
                    details: errorText,
                }),
                headers: { 'Content-Type': 'application/json' },
            };
        }

        const searchData = await searchResponse.json();
        const contact = searchData.results?.[0];

        if (!contact) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    found: false,
                    status: null,
                }),
                headers: { 'Content-Type': 'application/json' },
            };
        }

        // Map HubSpot lifecycle stage / lead status to application status
        const lifecycleStage = contact.properties?.lifecyclestage;
        const leadStatus = contact.properties?.hs_lead_status;

        let applicationStatus = 'pending';
        if (lifecycleStage === 'customer' || leadStatus === 'QUALIFIED') {
            applicationStatus = 'approved';
        } else if (
            leadStatus === 'UNQUALIFIED' ||
            leadStatus === 'BAD_TIMING'
        ) {
            applicationStatus = 'rejected';
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                found: true,
                status: applicationStatus,
                lifecycleStage,
                leadStatus,
                email: contact.properties?.email,
                createdAt: contact.properties?.createdate,
            }),
            headers: { 'Content-Type': 'application/json' },
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Internal server error',
                details:
                    error instanceof Error ? error.message : 'Unknown error',
            }),
            headers: { 'Content-Type': 'application/json' },
        };
    }
};
