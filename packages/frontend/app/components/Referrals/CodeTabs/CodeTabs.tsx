import { useEffect, useMemo, useRef, useState, type JSX } from 'react';
import {
    isEstablished,
    SessionButton,
    useSession,
} from '@fogo/sessions-sdk-react';
import { UserIdentifierType } from '@fuul/sdk';
import styles from './CodeTabs.module.css';
import Tabs from '~/components/Tabs/Tabs';
import { motion } from 'framer-motion';
import SimpleButton from '~/components/SimpleButton/SimpleButton';
import { useUserDataStore } from '~/stores/UserDataStore';
import { Fuul } from '@fuul/sdk';
import { URL_PARAMS, useUrlParams } from '~/hooks/useURLParams';
import { useReferralStore } from '~/stores/ReferralStore';
import { useNarrowScreen } from '~/hooks/useMediaQuery';
import { Trans, useTranslation } from 'react-i18next';
import getReferrerAsync from '~/utils/functions/getReferrerAsync';
import { FaCheck, FaRegCircle, FaSpinner } from 'react-icons/fa';
import { GiCancel } from 'react-icons/gi';
import { LuCopy } from 'react-icons/lu';
import useClipboard from '~/hooks/useClipboard';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useFuul } from '~/contexts/FuulContext';

interface PropsIF {
    initialTab?: string;
}

const COPY_PER_SCREEN_WIDTH = {
    enterCode: {
        full: 'referrals.enterCode',
        short: 'common.enter',
    },
    createCode: {
        full: 'referrals.createCode',
        short: 'common.create',
    },
    claim: {
        full: 'common.claim',
        short: 'common.claim',
    },
};

const AFFILIATE_EDIT_VOLUME_THRESHOLD = 1_000_000;
const DEFAULT_AFFILIATE_CODE_LENGTH = 6;

// fee amounts for affiliate and the referred user
const AFFILIATE_PERCENT = '10%';
const USER_PERCENT = '4%';

export default function CodeTabs(props: PropsIF) {
    const { initialTab = 'referrals.enterCode' } = props;
    const [activeTab, setActiveTab] = useState(initialTab);
    const [temporaryAffiliateCode, setTemporaryAffiliateCode] = useState('');
    const [isTemporaryAffiliateCodeValid, setIsTemporaryAffiliateCodeValid] =
        useState<boolean | undefined>();
    const [affiliateCode, setAffiliateCode] = useState('');
    const sessionState = useSession();
    const userDataStore = useUserDataStore();
    const affiliateAddress = userDataStore.userAddress;
    const referralStore = useReferralStore();

    const defaultAffiliateCode = useMemo(() => {
        if (!affiliateAddress) return '';
        return affiliateAddress
            .toString()
            .slice(0, DEFAULT_AFFILIATE_CODE_LENGTH);
    }, [affiliateAddress]);

    const canEditAffiliateCode = useMemo(() => {
        return (
            referralStore.totVolume !== undefined &&
            referralStore.totVolume >= AFFILIATE_EDIT_VOLUME_THRESHOLD
        );
    }, [referralStore.totVolume]);

    const { t } = useTranslation();

    const [editModeReferral, setEditModeReferral] = useState<boolean>(false);
    const [editModeAffiliate, setEditModeAffiliate] = useState<boolean>(false);
    const [justCopied, setJustCopied] = useState<boolean>(false);

    // ref code to use in the DOM (being referred by someone else)
    const [refCodeToConsume, setRefCodeToConsume] = useState<
        string | undefined
    >(undefined);
    // Update refCodeToConsume whenever the cached value changes
    useEffect(() => {
        if (referralStore.cached && affiliateAddress) {
            (async () => {
                const isOwnedByUser: boolean | undefined =
                    await checkIfOwnRefCode(
                        referralStore.cached,
                        affiliateAddress,
                    );
                isOwnedByUser === false &&
                    setRefCodeToConsume(referralStore.cached);
            })();
        } else if (!referralStore.cached) {
            setRefCodeToConsume(undefined);
        }
    }, [referralStore.cached, affiliateAddress]);

    const [isRefCodeClaimed, setIsRefCodeClaimed] = useState<
        boolean | undefined
    >(undefined);
    useEffect(() => {
        if (refCodeToConsume === undefined || !refCodeToConsume.length) {
            setIsRefCodeClaimed(undefined);
        } else {
            isAffiliateCodeFree(refCodeToConsume)
                .then((isFree: boolean) => setIsRefCodeClaimed(!isFree))
                .catch((err) => {
                    setIsRefCodeClaimed(undefined);
                    console.error(err);
                });
        }
    }, [refCodeToConsume]);

    useEffect(() => {
        console.log('isRefCodeClaimed: ', isRefCodeClaimed);
    }, [isRefCodeClaimed]);

    // fn to check if a given ref code is registered to a given wallet
    async function checkIfOwnRefCode(
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

    const [_copiedData, copy] = useClipboard();

    const { formatNum } = useNumFormatter();
    const totVolumeFormatted = useMemo<string>(() => {
        if (referralStore.totVolume === undefined) {
            return '';
        } else if (Number.isNaN(referralStore.totVolume)) {
            return formatNum(0, 2, true, true);
        }
        console.log('totVolume: ', referralStore.totVolume);
        return formatNum(
            referralStore.totVolume,
            referralStore.totVolume < 0.01 ? 3 : 2,
            true,
            true,
        );
    }, [referralStore.totVolume, formatNum]);

    useEffect(() => {
        console.log('totVolume:', referralStore.totVolume);
    }, [referralStore.totVolume]);

    useEffect(() => {
        if (
            !referralStore.cached &&
            referralStore.totVolume !== undefined &&
            referralStore.totVolume < 10000
        ) {
            setEditModeReferral(true);
        }
    }, [referralStore.cached, referralStore.totVolume]);

    useEffect(() => {
        if (justCopied) {
            const timer = setTimeout(() => {
                setJustCopied(false);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [justCopied]);

    const handleTabChange = (tab: string) => {
        if (affiliateCode) {
            setEditModeAffiliate(false);
        }
        setTemporaryAffiliateCode('');
        setActiveTab(tab);
    };

    const isSessionEstablished = useMemo<boolean>(
        () => isEstablished(sessionState),
        [sessionState],
    );

    // run the FUUL context
    const { isAffiliateCodeFree, getAffiliateCode } = useFuul();

    const handleReferralURLParam = useUrlParams(URL_PARAMS.referralCode);

    // this holds an improperly formatted ref code to provide user feedback
    const [invalidCode, setInvalidCode] = useState<string>('');
    // fn to update a referral code and trigger FUUL confirmation workflow
    async function handleUpdateReferralCode(r: string): Promise<void> {
        // Don't make API calls with empty or whitespace-only codes
        if (!r || !r.trim()) {
            return;
        }

        // check FUUL API to see if code is claimed or free
        const codeIsFree: boolean = await isAffiliateCodeFree(r);

        // Always cache the code and set URL param
        handleReferralURLParam.set(r);
        referralStore.cache(r);

        // if code is unclaimed, show in edit mode with error
        if (!codeIsFree) {
            setInvalidCode(r);
            setIsCachedValueValid(false);
            setEditModeReferral(true);
            setUserInputRefCode(r);
        } else {
            // code is valid and claimed
            invalidCode && setInvalidCode('');
            setIsCachedValueValid(true);
            setEditModeReferral(false);
        }
    }

    // pixel-width breakpoint to toggle shorter copy
    const NARROW_SCREEN_COPY_BREAKPOINT = 900;
    // boolean tracking whether the screen is "narrow"
    const narrowScreenForCopy: boolean = useNarrowScreen(
        NARROW_SCREEN_COPY_BREAKPOINT,
    );

    // array of tab name strings based on screen width
    const avTabs = useMemo<string[]>(() => {
        // return an array of tab names based on the screen width type
        return Object.values(COPY_PER_SCREEN_WIDTH).map(
            (tab) => tab[narrowScreenForCopy ? 'short' : 'full'],
        );
    }, [narrowScreenForCopy]);

    // keep the correct tab highlighted when screen width changes
    useEffect(() => {
        // find which key in COPY_PER_SCREEN_WIDTH matches the current activeTab
        const currentKey = Object.entries(COPY_PER_SCREEN_WIDTH).find(
            ([_, value]) =>
                value.full === activeTab || value.short === activeTab,
        )?.[0] as keyof typeof COPY_PER_SCREEN_WIDTH | undefined;

        if (currentKey) {
            const currentTabCopySet = COPY_PER_SCREEN_WIDTH[currentKey];
            // get the updated tab name based on new screen width type
            const updatedTabName =
                currentTabCopySet[narrowScreenForCopy ? 'short' : 'full'];
            // update the value `activeTab` to the updated tab name
            setActiveTab(updatedTabName);
        }
    }, [narrowScreenForCopy]);

    const prevAffiliateAddress = useRef<string | undefined>(undefined);

    // reset temporary affiliate code when changing wallets
    useEffect(() => {
        // Only clear when switching between different wallets, not on initial connect
        if (
            prevAffiliateAddress.current &&
            prevAffiliateAddress.current !== affiliateAddress?.toString()
        ) {
            setTemporaryAffiliateCode('');
            referralStore.clear();
        }
        prevAffiliateAddress.current = affiliateAddress?.toString();
    }, [affiliateAddress]);

    const [isFetchingVolume, setIsFetchingVolume] = useState<
        boolean | undefined
    >(undefined);

    const [userInputRefCode, setUserInputRefCode] = useState<string>('');
    const [isUserRefCodeClaimed, setIsUserRefCodeClaimed] = useState<
        boolean | undefined
    >(undefined);
    const [isUserInputRefCodeSelfOwned, setIsUserInputRefCodeSelfOwned] =
        useState<boolean | undefined>(undefined);

    // when the user manually enters a refCode, check if the code is owned by their wallet
    useEffect(() => {
        if (userInputRefCode && affiliateAddress) {
            checkIfOwnRefCode(userInputRefCode, affiliateAddress.toString())
                .then((isSelfOwned: boolean | undefined) =>
                    setIsUserInputRefCodeSelfOwned(isSelfOwned),
                )
                .catch((err) => {
                    setIsUserInputRefCodeSelfOwned(undefined);
                    console.error(err);
                });
        } else {
            setIsUserInputRefCodeSelfOwned(undefined);
        }
    }, [userInputRefCode, affiliateAddress]);

    // when the user manually enters a refCode, make sure it exists
    useEffect(() => {
        if (userInputRefCode.length) {
            (async () => {
                try {
                    // check with FUUL to determine if ref code is claimed
                    const isCodeFree: boolean =
                        await isAffiliateCodeFree(userInputRefCode);
                    // normally `isCodeFree === true` means the code is available
                    // right now the API is returning `false` when the code is available
                    setIsUserRefCodeClaimed(isCodeFree);
                } catch (error) {
                    setIsUserRefCodeClaimed(false);
                }
            })();
        }
    }, [userInputRefCode]);

    // determines whether the value in zustand cache passes validation
    // legal characters, length, and format checks
    const [isCachedValueValid, setIsCachedValueValid] = useState<
        boolean | undefined
    >(undefined);

    // Track which code was validated to detect when validation state is stale
    const [lastValidatedCode, setLastValidatedCode] = useState<string>('');

    // Validate cached referral code when it changes (e.g., from URL)
    useEffect(() => {
        // Don't validate if there's no cached code
        if (!referralStore.cached) {
            setIsCachedValueValid(undefined);
            setLastValidatedCode('');
            return;
        }

        // Don't re-validate if we already have a validation result for this specific code
        if (
            isCachedValueValid !== undefined &&
            lastValidatedCode === referralStore.cached
        ) {
            return;
        }

        (async () => {
            const codeToValidate = referralStore.cached;
            try {
                const isCachedCodeFree: boolean =
                    await isAffiliateCodeFree(codeToValidate);
                console.log('isCodeFree: ', isCachedCodeFree);

                if (isCachedCodeFree) {
                    // Code is not claimed - show in edit mode with error
                    setInvalidCode(codeToValidate);
                    setIsCachedValueValid(false);
                    setEditModeReferral(true);
                    setUserInputRefCode(codeToValidate);
                } else {
                    // Code is valid and claimed
                    setIsCachedValueValid(true);
                    setEditModeReferral(false);
                }
                setLastValidatedCode(codeToValidate);
            } catch (error) {
                // On error, assume invalid to be safe
                setIsCachedValueValid(false);
                setEditModeReferral(true);
                setUserInputRefCode(codeToValidate);
                setLastValidatedCode(codeToValidate);
            }
        })();
    }, [referralStore.cached, isCachedValueValid, lastValidatedCode]);

    const currentCodeElem = (
        <section className={styles.sectionWithButton}>
            <div className={styles.enterCodeContent}>
                {referralStore.cached ? (
                    <>
                        <h6>{t('referrals.usingAffiliateCode')}</h6>
                        {isCachedValueValid && <p>{refCodeToConsume}</p>}
                        {isCachedValueValid === false && (
                            <p>
                                This code does not appear to be registered in
                                the referral system.
                            </p>
                        )}
                    </>
                ) : (
                    <h6>{t('referrals.enterCode')}</h6>
                )}
            </div>
            {referralStore.cached &&
                referralStore.totVolume !== undefined &&
                referralStore.totVolume < 10000 && (
                    <div className={styles.refferal_code_buttons}>
                        <SimpleButton
                            bg='accent1'
                            onClick={() => setEditModeReferral(true)}
                        >
                            {t('common.edit')}
                        </SimpleButton>
                    </div>
                )}
        </section>
    );

    const tempAffiliateCodeCharsValidate = useMemo<boolean>(() => {
        return checkForPermittedCharacters(temporaryAffiliateCode);
    }, [temporaryAffiliateCode]);

    const enterNewCodeElem = (
        <section className={styles.sectionWithButton}>
            <div className={styles.enterCodeContent}>
                <h6>
                    {referralStore.cached
                        ? t('referrals.overwriteCurrentReferralCode') + ': '
                        : t('referrals.enterReferralCode') + ': '}
                    <span style={{ color: 'var(--accent3)' }}>
                        {referralStore.cached}
                    </span>
                </h6>
                <input
                    type='text'
                    value={userInputRefCode}
                    onChange={(e) => setUserInputRefCode(e.target.value)}
                />
                {!isUserRefCodeClaimed &&
                    userInputRefCode.length <= 30 &&
                    userInputRefCode.length >= 2 && (
                        <p>
                            <Trans
                                i18nKey='referrals.referralCodeNotValidPleaseConfirm'
                                values={{ invalidCode: userInputRefCode }}
                                components={[
                                    <span
                                        style={{ color: 'var(--accent2)' }}
                                    />,
                                ]}
                            />
                        </p>
                    )}
                {isUserInputRefCodeSelfOwned && (
                    <p>
                        <Trans
                            i18nKey='referrals.doNotSelfRefer'
                            values={{ affiliateCode: userInputRefCode }}
                            components={[
                                <span style={{ color: 'var(--accent2)' }} />,
                            ]}
                        />
                    </p>
                )}
            </div>
            <div className={styles.refferal_code_buttons}>
                <SimpleButton
                    bg='accent1'
                    disabled={
                        userInputRefCode.length < 2 ||
                        userInputRefCode.length > 30 ||
                        !isUserRefCodeClaimed ||
                        isUserInputRefCodeSelfOwned
                    }
                    onClick={(): void => {
                        handleUpdateReferralCode(userInputRefCode);
                    }}
                >
                    {t('common.confirm')}
                </SimpleButton>
                {referralStore.cached && isCachedValueValid && (
                    <SimpleButton
                        bg='dark3'
                        hoverBg='accent1'
                        onClick={() => {
                            setEditModeReferral(false);
                            setInvalidCode('');
                        }}
                    >
                        {t('common.cancel')}
                    </SimpleButton>
                )}
            </div>
        </section>
    );

    useEffect(() => {
        (async () => {
            if (isEstablished(sessionState)) {
                const userWalletKey =
                    sessionState.walletPublicKey ||
                    sessionState.sessionPublicKey;

                const affiliateCode = await getAffiliateCode(
                    userWalletKey.toString(),
                    UserIdentifierType.SolanaAddress,
                );

                if (affiliateCode) {
                    setAffiliateCode(affiliateCode);
                }

                // Only fetch and apply on-chain referrer if no URL parameter is present
                // URL parameter always takes precedence
                if (!handleReferralURLParam.value) {
                    const referrer = await getReferrerAsync(
                        userWalletKey.toString(),
                    );
                    if (referrer?.referrer_identifier) {
                        const affiliateCode = await getAffiliateCode(
                            referrer.referrer_identifier as string,
                            UserIdentifierType.SolanaAddress,
                        );
                        if (affiliateCode) {
                            handleUpdateReferralCode(affiliateCode);
                        }
                    }
                }
            } else {
                setAffiliateCode('');
            }
        })();
    }, [sessionState]);

    useEffect(() => {
        if (!canEditAffiliateCode) {
            setTemporaryAffiliateCode(defaultAffiliateCode);
        }
    }, [canEditAffiliateCode, defaultAffiliateCode]);

    useEffect(() => {
        if (!canEditAffiliateCode && editModeAffiliate) {
            setEditModeAffiliate(false);
        }
    }, [canEditAffiliateCode, editModeAffiliate]);

    useEffect(() => {
        // If no temporary code, immediately set as valid
        if (!temporaryAffiliateCode) {
            setIsTemporaryAffiliateCodeValid(undefined);
            return;
        }

        // Don't check API if characters are invalid
        if (!tempAffiliateCodeCharsValidate) {
            setIsTemporaryAffiliateCodeValid(undefined);
            return;
        }

        // Set up debounced validation
        const timer = setTimeout(async () => {
            console.log(
                'Starting validation for code:',
                temporaryAffiliateCode,
            );
            try {
                const codeIsFree = await isAffiliateCodeFree(
                    temporaryAffiliateCode,
                );
                console.log('codeIsFree: ', codeIsFree);
                const options = {
                    method: 'GET',
                    headers: {
                        accept: 'application/json',
                        authorization:
                            'Bearer 74c36d38cf3f44ae2e90991a7e2857a0b035a623791a096e06c54b0c7f81354d',
                    },
                };

                fetch(
                    'https://api.fuul.xyz/api/v1/referral_codes/' +
                        temporaryAffiliateCode,
                    options,
                )
                    .then((res) => res.json())
                    .then((res) => console.log(res))
                    .catch((err) => console.error(err));
                setIsTemporaryAffiliateCodeValid(!codeIsFree);
            } catch (error) {
                console.log('Validation error:', error);
                setIsTemporaryAffiliateCodeValid(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [
        temporaryAffiliateCode,
        tempAffiliateCodeCharsValidate,
        canEditAffiliateCode,
    ]);

    // fn to create an affiliate code for the wallet
    const createAffiliateCode = async () => {
        try {
            // Get the user's wallet address from the session
            // @ts-ignore - The session type might not be fully typed
            if (isEstablished(sessionState)) {
                const userWalletKey =
                    sessionState.walletPublicKey ||
                    sessionState.sessionPublicKey;

                if (!userWalletKey) {
                    return;
                }

                const codeToCreate = canEditAffiliateCode
                    ? temporaryAffiliateCode.trim()
                    : defaultAffiliateCode;

                if (!codeToCreate) {
                    return;
                }

                // Create the message to sign
                // this text must match FUUL requirements exactly, coordinate changes with @Ben
                const message = `I confirm that I am creating the ${codeToCreate} code`;

                // Convert message to Uint8Array
                const messageBytes = new TextEncoder().encode(message);

                try {
                    console.log(sessionState);
                    // Get the signature from the session
                    const signatureBytes =
                        await sessionState.solanaWallet.signMessage(
                            messageBytes,
                        );

                    // Convert the signature to base64
                    const signatureArray = Array.from(
                        new Uint8Array(signatureBytes),
                    );
                    const binaryString = String.fromCharCode.apply(
                        null,
                        signatureArray,
                    );
                    const signature = btoa(binaryString);

                    // Call the Fuul SDK to create the affiliate code
                    await Fuul.createAffiliateCode({
                        userIdentifier: userWalletKey.toString(),
                        identifierType: UserIdentifierType.SolanaAddress,
                        signature,
                        signaturePublicKey: userWalletKey.toString(),
                        code: codeToCreate,
                    });

                    setTemporaryAffiliateCode('');
                    setAffiliateCode(codeToCreate);
                } catch (error) {
                    throw error;
                }
            }
        } catch (error) {
            console.error('Error creating affiliate code:', error);
            // Handle error (e.g., show error message to user)
        }
    };

    // fn to update the existing affiliate code for the wallet
    const updateAffiliateCode = async () => {
        try {
            if (!canEditAffiliateCode) {
                return;
            }

            if (isEstablished(sessionState)) {
                const userWalletKey =
                    sessionState.walletPublicKey ||
                    sessionState.sessionPublicKey;

                if (!userWalletKey) {
                    return;
                }

                const codeToUpdate = temporaryAffiliateCode.trim();

                if (!codeToUpdate) {
                    return;
                }

                // Create the message to sign
                // this text must match FUUL requirements exactly, coordinate changes with @Ben
                const message = `I confirm that I am updating my code to ${codeToUpdate}`;

                // Convert message to Uint8Array
                const messageBytes = new TextEncoder().encode(message);
                // Get the signature from the session
                const signatureBytes =
                    await sessionState.solanaWallet.signMessage(messageBytes);

                // Convert the signature to base64
                const signatureArray = Array.from(
                    new Uint8Array(signatureBytes),
                );
                const binaryString = String.fromCharCode.apply(
                    null,
                    signatureArray,
                );
                const signature = btoa(binaryString);

                await Fuul.updateAffiliateCode({
                    userIdentifier: userWalletKey.toString(), // the address of the user
                    identifierType: UserIdentifierType.SolanaAddress, // evm_address | solana_address | xrpl_address
                    signature,
                    signaturePublicKey: userWalletKey.toString(), // Only for XRPL type signatures
                    code: codeToUpdate,
                });

                setAffiliateCode(codeToUpdate);
                setTemporaryAffiliateCode('');
                setEditModeAffiliate(false);
            }
        } catch (error) {
            console.error('Error updating affiliate code:', error);
        }
    };

    // tracking link URL for the wallet's affiliate code
    const [trackingLink, setTrackingLink] = useState('');

    // reset affiliate address input when user changes wallet
    useEffect(() => setTemporaryAffiliateCode(''), [affiliateAddress]);

    useEffect(() => {
        (async () => {
            if (!affiliateCode || !affiliateAddress) return '';
            const trackingLinkUrl = await Fuul.generateTrackingLink(
                window.location.hostname,
                affiliateAddress.toString(),
                UserIdentifierType.SolanaAddress,
            );
            setTrackingLink(trackingLinkUrl);
        })();
    }, [affiliateCode]);

    // fn to screen a text string for permissible characters (no regex)
    function checkForPermittedCharacters(input: string): boolean {
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

    const affiliateCodeElem = isSessionEstablished ? (
        affiliateCode && !editModeAffiliate ? (
            <section className={styles.sectionWithButton}>
                <div className={styles.createCodeContent}>
                    <p>
                        <Trans
                            i18nKey='referrals.yourCodeIs'
                            values={{ affiliateCode }}
                            components={[
                                <span style={{ color: 'var(--accent3)' }} />,
                            ]}
                        />
                    </p>
                    <div
                        className={styles.with_copy_clipboard}
                        style={{
                            backgroundColor: justCopied
                                ? 'var(--green)'
                                : 'transparent',
                            transition: 'background-color 0.2s',
                            padding: 'var(--padding-s)',
                        }}
                        onClick={() => {
                            copy('https://' + trackingLink);
                            setJustCopied(true);
                        }}
                    >
                        {trackingLink && (
                            <div className={styles.walletLink}>
                                {trackingLink}
                            </div>
                        )}
                        <div className={styles.clipboard_wrapper}>
                            {justCopied ? (
                                <FaCheck size={14} />
                            ) : (
                                <LuCopy size={14} />
                            )}
                        </div>
                    </div>
                    <p className={styles.trackingLinkExplanation}>
                        <Trans
                            i18nKey='referrals.trackingLinkExplanation'
                            values={{
                                affiliatePercent: AFFILIATE_PERCENT,
                                userPercent: USER_PERCENT,
                            }}
                            components={[<span />, <span />]}
                        />
                    </p>
                    <p className={styles.trackingLinkExplanation}>
                        {t('referrals.toCustomizeAffiliateCode')}
                    </p>
                    <div className={styles.volume_progress_bar}>
                        <div className={styles.volume_progress_bar_labels}>
                            <p>Your volume:</p>
                            <p>
                                {formatNum(
                                    referralStore.totVolume ?? 0,
                                    2,
                                    true,
                                    true,
                                )}
                            </p>
                        </div>
                        {!!referralStore.totVolume &&
                            referralStore.totVolume <
                                AFFILIATE_EDIT_VOLUME_THRESHOLD && (
                                <div
                                    className={styles.volume_progress_bar_body}
                                >
                                    {!!referralStore.totVolume && (
                                        <div
                                            style={{
                                                width: `${Math.min(
                                                    100,
                                                    (referralStore.totVolume /
                                                        AFFILIATE_EDIT_VOLUME_THRESHOLD) *
                                                        100,
                                                )}%`,
                                            }}
                                        />
                                    )}
                                </div>
                            )}
                    </div>
                    <p className={styles.trackingLinkExplanation}>
                        {t('common.seeDocsForMore')}
                    </p>
                </div>
                {canEditAffiliateCode && (
                    <SimpleButton
                        bg='accent1'
                        onClick={() => {
                            setTemporaryAffiliateCode(affiliateCode);
                            setEditModeAffiliate(true);
                        }}
                    >
                        {t('common.edit')}
                    </SimpleButton>
                )}
            </section>
        ) : (
            <section className={styles.sectionWithButton}>
                <div className={styles.enterCodeContent}>
                    {canEditAffiliateCode ? (
                        <>
                            <h6>{t('referrals.createAnAffiliateCode')}</h6>
                            <input
                                type='text'
                                value={temporaryAffiliateCode}
                                onChange={(e) => {
                                    console.log(
                                        'Affiliate code input changed:',
                                        e.target.value,
                                    );
                                    setTemporaryAffiliateCode(e.target.value);
                                }}
                                onKeyDown={async (e) => {
                                    if (
                                        e.key === 'Enter' &&
                                        temporaryAffiliateCode.trim()
                                    ) {
                                        editModeAffiliate
                                            ? updateAffiliateCode()
                                            : createAffiliateCode();
                                    }
                                }}
                            />
                            <div className={styles.validation_item}>
                                {temporaryAffiliateCode.length > 0 ? (
                                    temporaryAffiliateCode.length >= 2 &&
                                    temporaryAffiliateCode.length <= 30 &&
                                    tempAffiliateCodeCharsValidate ? (
                                        <FaCheck
                                            size={10}
                                            color='var(--green)'
                                        />
                                    ) : (
                                        <GiCancel
                                            size={10}
                                            color='var(--red)'
                                        />
                                    )
                                ) : (
                                    <FaRegCircle
                                        size={10}
                                        color='var(--text3)'
                                    />
                                )}
                                <p>
                                    2 - 30 letters, numbers, hyphens (A-Z, a-z,
                                    0-9, -)
                                </p>
                            </div>
                            <div className={styles.validation_item}>
                                {temporaryAffiliateCode.length > 0 ? (
                                    isTemporaryAffiliateCodeValid === true ? (
                                        <FaCheck
                                            size={10}
                                            color='var(--green)'
                                        />
                                    ) : (
                                        <GiCancel
                                            size={10}
                                            color='var(--red)'
                                        />
                                    )
                                ) : (
                                    <FaRegCircle
                                        size={10}
                                        color='var(--text3)'
                                    />
                                )}
                                <p>Code is available</p>
                            </div>
                            <h6>{t('referrals.createAUniqueCodeToEarn')}</h6>
                        </>
                    ) : (
                        <>
                            <h6>
                                <Trans
                                    i18nKey='referrals.yourCodeIs'
                                    values={{
                                        affiliateCode:
                                            affiliateCode ||
                                            defaultAffiliateCode ||
                                            '—',
                                    }}
                                    components={[
                                        <span
                                            style={{ color: 'var(--accent3)' }}
                                        />,
                                    ]}
                                />
                            </h6>
                            <p>{t('referrals.pleaseClickCreate')}</p>
                            <p>{t('referrals.toCustomizeAffiliateCode')}</p>
                            {/* <p>
                                {t('referrals.defaultCodeVolumeExplanation', {
                                    threshold: formatNum(
                                        AFFILIATE_EDIT_VOLUME_THRESHOLD,
                                        0,
                                        true,
                                        true,
                                    ),
                                })}
                            </p>
                            <p>
                                <Trans
                                    i18nKey='referrals.defaultCodeDescription'
                                    values={{
                                        defaultCode:
                                            defaultAffiliateCode || '—',
                                    }}
                                    components={[
                                        <span
                                            style={{ color: 'var(--accent3)' }}
                                        />,
                                    ]}
                                />
                            </p> */}
                            {isTemporaryAffiliateCodeValid === false && (
                                <p style={{ color: 'var(--red)' }}>
                                    Default code unavailable. Please reach out
                                    to support.
                                </p>
                            )}
                        </>
                    )}
                </div>
                <div className={styles.refferal_code_buttons}>
                    <SimpleButton
                        bg='accent1'
                        onClick={() => {
                            if (editModeAffiliate && canEditAffiliateCode) {
                                void updateAffiliateCode();
                            } else {
                                void createAffiliateCode();
                            }
                        }}
                    >
                        {t(
                            editModeAffiliate
                                ? 'common.update'
                                : 'common.create',
                        )}
                    </SimpleButton>
                    {editModeAffiliate &&
                        affiliateCode &&
                        canEditAffiliateCode && (
                            <SimpleButton
                                bg='dark4'
                                hoverBg='accent1'
                                onClick={() => {
                                    setEditModeAffiliate(false);
                                    setTemporaryAffiliateCode('');
                                }}
                            >
                                {t('common.cancel')}
                            </SimpleButton>
                        )}
                </div>
            </section>
        )
    ) : (
        <section className={styles.sectionWithButton}>
            <div className={styles.enterCodeContent}>
                <h6>{t('referrals.connectYourWallet.affiliate')}</h6>
            </div>
            <div
                className={styles.sessionButtonWrapper}
                style={{ height: '100%' }}
            >
                <SessionButton />
            </div>
        </section>
    );

    const claimElem = isSessionEstablished ? (
        <section className={styles.sectionWithButton}>
            <div className={styles.claimContent}>
                <p>
                    {t('referrals.claimRewardsWithAmount', { amount: '$0.00' })}
                </p>
            </div>
            <SimpleButton bg='accent1'>{t('common.claim')}</SimpleButton>
        </section>
    ) : (
        <section className={styles.sectionWithButton}>
            <div className={styles.enterCodeContent}>
                <h6>{t('referrals.connectYourWallet.claim')}</h6>
            </div>
            <div
                className={styles.sessionButtonWrapper}
                style={{ height: '100%' }}
            >
                <SessionButton />
            </div>
        </section>
    );

    const renderTabContent = (): JSX.Element => {
        const spinner = (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                }}
            >
                <FaSpinner
                    style={{
                        color: 'var(--accent1)',
                        animation: 'spin 0.6s linear infinite',
                    }}
                />
            </div>
        );
        switch (activeTab) {
            // handlers for entering a referral code
            case 'referrals.enterCode':
            case 'common.enter':
                if (!isSessionEstablished) {
                    return (
                        <section className={styles.sectionWithButton}>
                            <div className={styles.enterCodeContent}>
                                <h6>
                                    {t('referrals.connectYourWallet.enterCode')}
                                </h6>
                            </div>
                            <div
                                className={styles.sessionButtonWrapper}
                                style={{ height: '100%' }}
                            >
                                <SessionButton />
                            </div>
                        </section>
                    );
                }
                // Show spinner while fetching (only if volume isn't already loaded)
                if (
                    isFetchingVolume !== false &&
                    referralStore.totVolume === undefined
                ) {
                    return spinner;
                }
                // Only show content/error when volume is available
                if (
                    referralStore.totVolume &&
                    referralStore.totVolume > 10000
                ) {
                    return (
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: '100%',
                                color: 'var(--text2)',
                                padding: 'var(--padding-m, 16px)',
                                textAlign: 'center',
                                lineHeight: '1.5',
                            }}
                        >
                            This wallet has logged {totVolumeFormatted} in
                            trading volume. Only users with less than $10,000 in
                            trading volume can enter a referral code.
                        </div>
                    );
                }
                const shouldShowInput =
                    (editModeReferral ||
                        !referralStore.cached ||
                        isCachedValueValid === false) &&
                    referralStore.totVolume !== undefined &&
                    referralStore.totVolume < 10000;
                return shouldShowInput ? enterNewCodeElem : currentCodeElem;
            // handlers for creating an affiliate code
            case 'referrals.createCode':
            case 'common.create':
                // Show spinner while fetching (undefined or true)
                if (
                    isSessionEstablished &&
                    referralStore.totVolume === undefined
                ) {
                    return spinner;
                }
                return affiliateCodeElem;
            // handlers for claiming rewards
            case 'common.claim':
                return claimElem;
            // default fallback
            default:
                return (
                    <div className={styles.emptyState}>
                        {t('referrals.selectATabToViewData')}
                    </div>
                );
        }
    };

    return (
        <div className={styles.tableWrapper}>
            <Tabs
                tabs={avTabs}
                defaultTab={activeTab}
                onTabChange={handleTabChange}
                wrapperId='codeTabs'
                layoutIdPrefix='codeTabIndicator'
                flex
            />
            <motion.div
                className={styles.tableContent}
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
            >
                {renderTabContent()}
            </motion.div>
        </div>
    );
}
