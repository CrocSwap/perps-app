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
import { FaSpinner } from 'react-icons/fa';
import useClipboard from '~/hooks/useClipboard';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useFuul } from '~/contexts/FuulContext';
import EnterCode from '~/components/Referrals/EnterCode/EnterCode';
import CreateCode from '../CreateCode/CreateCode';
import { checkForPermittedCharacters, checkIfOwnRefCode } from '../functions';

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
    // tab which should be open by default on page load
    const { initialTab = 'referrals.enterCode' } = props;
    // tab which is currently open
    const [activeTab, setActiveTab] = useState(initialTab);
    // this holds a value for a new affiliate code as the user types
    const [temporaryAffiliateCode, setTemporaryAffiliateCode] = useState('');
    // determines the validity of the temporary affiliate code
    const [isTemporaryAffiliateCodeValid, setIsTemporaryAffiliateCodeValid] =
        useState<boolean | undefined>();
    // affiliate code for use (not temporary during edit mode)
    const [affiliateCode, setAffiliateCode] = useState('');
    // we need this for FOGO sessions
    const sessionState = useSession();
    // data on the current user (mainly wallet address)
    const userDataStore = useUserDataStore();
    const affiliateAddress = userDataStore.userAddress;
    // data on the current referral state (mainly total volume)
    const referralStore = useReferralStore();
    // default affiliate code is the first 6 characters of the wallet address
    const defaultAffiliateCode = useMemo(() => {
        if (!affiliateAddress) return '';
        return affiliateAddress
            .toString()
            .slice(0, DEFAULT_AFFILIATE_CODE_LENGTH);
    }, [affiliateAddress]);

    // boolean representing whether affiliate code has enough volume to be changed
    const canEditAffiliateCode = useMemo<boolean>(() => {
        return (
            referralStore.totVolume !== undefined &&
            referralStore.totVolume >= AFFILIATE_EDIT_VOLUME_THRESHOLD
        );
    }, [referralStore.totVolume]);

    // user-facing copy from translation files
    const { t } = useTranslation();

    // boolean controlling whether the `enter code` workflow is in edit mode
    const [editModeReferral, setEditModeReferral] = useState<boolean>(false);
    // boolean controlling whether the `affiliate code` workflow is in edit mode
    const [editModeAffiliate, setEditModeAffiliate] = useState<boolean>(false);

    // boolean representing whether the user has just copied a code, needed to
    // ... prevent multiple copy actions
    const [justCopied, setJustCopied] = useState<boolean>(false);

    // ref code to use in the DOM (being referred by someone else)
    const [refCodeToConsume, setRefCodeToConsume] = useState<
        string | undefined
    >(undefined);

    // update refCodeToConsume whenever the cached value changes
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

    const [_copiedData, copy] = useClipboard();

    const { formatNum } = useNumFormatter();
    const totVolumeFormatted = useMemo<string>(() => {
        if (referralStore.totVolume === undefined) {
            return '';
        } else if (Number.isNaN(referralStore.totVolume)) {
            return formatNum(0, 2, true, true);
        }
        return formatNum(
            referralStore.totVolume,
            referralStore.totVolume < 0.01 ? 3 : 2,
            true,
            true,
        );
    }, [referralStore.totVolume, formatNum]);

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

    const isSessionEstablished = useMemo<boolean>(
        () => isEstablished(sessionState),
        [sessionState],
    );

    // run the FUUL context
    const { isAffiliateCodeFree, getAffiliateCode } = useFuul();

    const handleReferralURLParam = useUrlParams(URL_PARAMS.referralCode);

    // URL param takes priority over cached localStorage value
    useEffect(() => {
        if (
            handleReferralURLParam.value &&
            handleReferralURLParam.value !== referralStore.cached
        ) {
            // Reset validation state so the validation effect will re-run
            setIsCachedValueValid(undefined);
            setLastValidatedCode('');
            referralStore.cache(handleReferralURLParam.value);
        }
    }, [handleReferralURLParam.value]);

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
        // Update lastValidatedCode to prevent the useEffect from re-validating
        setLastValidatedCode(r);
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

    const tempAffiliateCodeCharsValidate = useMemo<boolean>(() => {
        return checkForPermittedCharacters(temporaryAffiliateCode);
    }, [temporaryAffiliateCode]);

    useEffect(() => {
        (async () => {
            if (isEstablished(sessionState)) {
                const userWalletKey =
                    sessionState.walletPublicKey ||
                    sessionState.sessionPublicKey;

                const affiliateData = await getAffiliateCode(
                    userWalletKey.toString(),
                    UserIdentifierType.SolanaAddress,
                );

                if (affiliateData?.code) {
                    setAffiliateCode(affiliateData.code);
                }

                // Only fetch and apply on-chain referrer if no URL parameter is present
                // URL parameter always takes precedence
                if (!handleReferralURLParam.value) {
                    const referrer = await getReferrerAsync(
                        userWalletKey.toString(),
                    );
                    if (referrer?.referrer_identifier) {
                        const affiliateData = await getAffiliateCode(
                            referrer.referrer_identifier as string,
                            UserIdentifierType.SolanaAddress,
                        );
                        if (affiliateData?.code) {
                            handleUpdateReferralCode(affiliateData.code);
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
                return (
                    <EnterCode
                        isSessionEstablished={isSessionEstablished}
                        totVolume={referralStore.totVolume}
                        totVolumeFormatted={totVolumeFormatted}
                        cached={referralStore.cached}
                        isCachedValueValid={isCachedValueValid}
                        refCodeToConsume={refCodeToConsume}
                        editModeReferral={editModeReferral}
                        setEditModeReferral={setEditModeReferral}
                        userInputRefCode={userInputRefCode}
                        setUserInputRefCode={setUserInputRefCode}
                        isUserRefCodeClaimed={isUserRefCodeClaimed}
                        isUserInputRefCodeSelfOwned={
                            isUserInputRefCodeSelfOwned
                        }
                        handleUpdateReferralCode={handleUpdateReferralCode}
                        setInvalidCode={setInvalidCode}
                    />
                );
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
                return (
                    <CreateCode
                        isSessionEstablished={isSessionEstablished}
                        affiliateCode={affiliateCode}
                        editModeAffiliate={editModeAffiliate}
                        setEditModeAffiliate={setEditModeAffiliate}
                        temporaryAffiliateCode={temporaryAffiliateCode}
                        setTemporaryAffiliateCode={setTemporaryAffiliateCode}
                        isTemporaryAffiliateCodeValid={
                            isTemporaryAffiliateCodeValid
                        }
                        tempAffiliateCodeCharsValidate={
                            tempAffiliateCodeCharsValidate
                        }
                        canEditAffiliateCode={canEditAffiliateCode}
                        defaultAffiliateCode={defaultAffiliateCode}
                        trackingLink={trackingLink}
                        justCopied={justCopied}
                        setJustCopied={setJustCopied}
                        copy={copy}
                        totVolume={referralStore.totVolume}
                        totVolumeFormatted={formatNum(
                            referralStore.totVolume ?? 0,
                            2,
                            true,
                            true,
                        )}
                        affiliateEditVolumeThreshold={
                            AFFILIATE_EDIT_VOLUME_THRESHOLD
                        }
                        affiliatePercent={AFFILIATE_PERCENT}
                        userPercent={USER_PERCENT}
                        createAffiliateCode={createAffiliateCode}
                        updateAffiliateCode={updateAffiliateCode}
                    />
                );
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
                onTabChange={(tab: string) => {
                    if (affiliateCode) {
                        setEditModeAffiliate(false);
                    }
                    setTemporaryAffiliateCode('');
                    setActiveTab(tab);
                }}
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
