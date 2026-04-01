// IMPORTANT:   this is a temporary file being used for dev purposes only and should be removed before merging to main
// IMPORTANT:   ... will be replaced with better handling before launch

export interface FUUL_API_KEY_SET {
    // Grants read-only access to the project information, conversions and rewards
    READ_ONLY: string;
    // Grants access to send tracking events (e.g: pageview, connect_wallet)
    SEND_TRACKING_EVENT: string;
    // Grants access to send custom trigger events
    SEND_TRIGGER_EVENT: string;
    // This api key should be used by a service or a backend application, it has permissions to create and update project information
    SERVICE_ROLE: string;
    // Grants access to read invite codes
    REFERRAL_CODES_READ: string;
}

export const NON_PERMISSIONED: FUUL_API_KEY_SET = {
    READ_ONLY:
        '459f44f19dd5e3d7a8e2953fb0742ed98736abc42873b6c35c4847585c781661',
    SEND_TRACKING_EVENT: '',
    SEND_TRIGGER_EVENT:
        '68f4529bf55654f9a94c911133f81000b92ccbb1b3deb6a2ecc6df965369a935',
    SERVICE_ROLE: '',
    REFERRAL_CODES_READ:
        '5208e0f9fd95f4dd7897fc383186cd2870cb45446f4c5d7fc75f670df02132fa',
};

export const PERMISSIONED: FUUL_API_KEY_SET = {
    READ_ONLY:
        'fa6829880bf45b720329c5ab1b6beafad705b6cc3967981120e31d398568f4e0',
    SEND_TRACKING_EVENT: '',
    SEND_TRIGGER_EVENT:
        '2d4ee5747de1f767c6cd08d51ff3d66a36a47d33d17e8adb38fe3d51a24db623',
    SERVICE_ROLE: '',
    REFERRAL_CODES_READ:
        'f0273090097e61ce706cc8c6423b7da119bc5e13896ac30c7187cdbb339abf0a',
};

export type READ_ONLY_KEY = (
    | typeof NON_PERMISSIONED
    | typeof PERMISSIONED
)['READ_ONLY'];
export type SEND_TRACKING_EVENT_KEY = (
    | typeof NON_PERMISSIONED
    | typeof PERMISSIONED
)['SEND_TRACKING_EVENT'];
export type SEND_TRIGGER_EVENT_KEY = (
    | typeof NON_PERMISSIONED
    | typeof PERMISSIONED
)['SEND_TRIGGER_EVENT'];
export type SERVICE_ROLE_KEY = (
    | typeof NON_PERMISSIONED
    | typeof PERMISSIONED
)['SERVICE_ROLE'];
export type REFERRAL_CODES_READ_KEY = (
    | typeof NON_PERMISSIONED
    | typeof PERMISSIONED
)['REFERRAL_CODES_READ'];
