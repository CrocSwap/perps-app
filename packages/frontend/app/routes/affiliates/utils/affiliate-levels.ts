export interface AffiliateLevel {
    audienceId: string;
    name: string;
    commission: number;
}

export const AFFILIATE_LEVELS: AffiliateLevel[] = [
    {
        audienceId: 'ca72391b-34b2-438e-844e-da92e970fece',
        name: 'Level 1',
        commission: 0.3,
    },
    {
        audienceId: '30fb2e8d-c042-4815-932b-47598de7f995',
        name: 'Level 2',
        commission: 0.35,
    },
    {
        audienceId: '1306fd7a-9363-4d51-bdf8-4f6cafab4091',
        name: 'Level 3',
        commission: 0.4,
    },
    {
        audienceId: '6688f130-73e3-468c-b0ce-b0f837212c38',
        name: 'Level 4',
        commission: 0.45,
    },
    {
        audienceId: '4147d56b-86bb-4a60-9678-9669420a2574',
        name: 'Level 5',
        commission: 0.5,
    },
    {
        audienceId: 'c8bd566e-1374-4051-b5e9-f89378420598',
        name: 'Level 6',
        commission: 0.55,
    },
    {
        audienceId: '328eb020-a0cc-443f-b7ca-b16498d99397',
        name: 'Level 7',
        commission: 0.6,
    },
    {
        audienceId: 'c031a46e-3b5e-4471-b97e-051a75e1f733',
        name: 'Level 8',
        commission: 0.65,
    },
    {
        audienceId: 'c88040ac-cf63-4034-bba3-bcf0d0956b72',
        name: 'Level 9',
        commission: 0.7,
    },
    {
        audienceId: '05915390-54bc-4624-b9f5-24ff73735731',
        name: 'Level 10',
        commission: 0.75,
    },
    {
        audienceId: '78ccca07-4ee2-418b-9c51-dbd821a02625',
        name: 'Level 11',
        commission: 0.8,
    },
    {
        audienceId: '63b9437e-9827-4ec6-b58b-f2b5d75299ad',
        name: 'Level 12',
        commission: 0.85,
    },
    {
        audienceId: '54fc9e35-5610-4df6-890e-ea46a8cefbfa',
        name: 'Level 13',
        commission: 0.9,
    },
    {
        audienceId: 'a86a9a46-c171-4398-ba77-bb76221b832e',
        name: 'Level 14',
        commission: 0.95,
    },
    {
        audienceId: '262b1491-06ac-4e6a-8eae-3adf31570757',
        name: 'Level 15',
        commission: 1,
    },
];

export const getAffiliateLevelByAudienceId = (
    audienceId: string,
): AffiliateLevel | undefined => {
    return AFFILIATE_LEVELS.find((level) => level.audienceId === audienceId);
};

export const getCommissionByAudienceId = (
    audienceId: string,
): number | undefined => {
    return getAffiliateLevelByAudienceId(audienceId)?.commission;
};
