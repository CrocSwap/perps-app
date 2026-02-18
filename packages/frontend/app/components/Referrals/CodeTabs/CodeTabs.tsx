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
import { checkForPermittedCharacters } from '../functions';
import { useAppStateStore } from '~/stores/AppStateStore';
import { useRefCodeModalStore } from '~/stores/RefCodeModalStore';
import { debugLog } from '~/utils/debugLog';
import { useDebounce } from '~/hooks/useDebounce';
import { checkAddressFormat } from '~/utils/functions/checkAddressFormat';

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

const REFERRER_EDIT_VOLUME_THRESHOLD = 1_000_000;
const DEFAULT_REFERRER_CODE_LENGTH = 6;

// fee amounts for referrer and the invitee
const REFERRER_PERCENT = '10%';
const INVITEE_PERCENT = '4%';

export default function CodeTabs(props: PropsIF) {
    const { isSessionReestablishing } = useAppStateStore();
    const refCodeModalStore = useRefCodeModalStore();

    const sessionState = useSession();

    const isSessionEstablished = useMemo<boolean>(
        () => isEstablished(sessionState),
        [sessionState],
    );

    useEffect(() => {
        debugLog({ isSessionReestablishing, isSessionEstablished });
    }, [isSessionReestablishing, isSessionEstablished]);

    // tab which should be open by default on page load
    const { initialTab = 'referrals.enterCode' } = props;
    // tab which is currently open
    const [activeTab, setActiveTab] = useState(initialTab);
    // this holds a value for a new referrer code as the user types
    const [temporaryReferrerCode, setTemporaryReferrerCode] = useState('');
    // determines the validity of the temporary referrer code
    const [isTemporaryReferrerCodeValid, setIsTemporaryReferrerCodeValid] =
        useState<boolean | undefined>();
    // referrer code for use (not temporary during edit mode)
    const [referrerCode, setReferrerCode] = useState('');
    // we need this for FOGO sessions
    // data on the current user (mainly wallet address)
    const userDataStore = useUserDataStore();
    const referrerAddress = userDataStore.userAddress;
    // data on the current referral state (mainly total volume)
    const referralStore = useReferralStore();
    // default referrer code is the first 6 characters of the wallet address
    const defaultReferrerCode = useMemo(() => {
        if (!referrerAddress) return '';
        return referrerAddress
            .toString()
            .slice(0, DEFAULT_REFERRER_CODE_LENGTH);
    }, [referrerAddress]);

    // boolean representing whether referrer code has enough volume to be changed
    const canEditReferrerCode = useMemo<boolean>(() => {
        return (
            referralStore.totVolume !== undefined &&
            referralStore.totVolume >= REFERRER_EDIT_VOLUME_THRESHOLD
        );
    }, [referralStore.totVolume]);

    // user-facing copy from translation files
    const { t } = useTranslation();

    // boolean controlling whether the `enter code` workflow is in edit mode
    const [editModeInvitee, setEditModeInvitee] = useState<boolean>(false);
    // boolean controlling whether the `referrer code` workflow is in edit mode
    const [editModeReferrer, setEditModeReferrer] = useState<boolean>(false);

    // boolean representing whether the user has just copied a code, needed to
    // ... prevent multiple copy actions
    const [justCopied, setJustCopied] = useState<boolean>(false);

    // ref code to use in the DOM (being referred by someone else)
    const [refCodeToConsume, setRefCodeToConsume] = useState<
        string | undefined
    >(undefined);

    // update refCodeToConsume whenever the cached value changes
    useEffect(() => {
        if (referralStore.cached && referrerAddress) {
            (async () => {
                const userCodeData =
                    await referralStore.getRefCodeByPubKey(referrerAddress);
                const isOwnedByUser =
                    userCodeData?.code === referralStore.cached ||
                    referralStore.cached === referrerAddress;
                !isOwnedByUser && setRefCodeToConsume(referralStore.cached);
            })();
        } else if (!referralStore.cached) {
            setRefCodeToConsume(undefined);
        }
    }, [referralStore.cached, referrerAddress]);

    // run the FUUL context
    const {
        checkIfCodeExists,
        checkIfCodeIsAvailableForInviteeToUse,
        getRefCode,
    } = useFuul();

    const [isRefCodeClaimed, setIsRefCodeClaimed] = useState<
        boolean | undefined
    >(undefined);
    useEffect(() => {
        if (refCodeToConsume === undefined || !refCodeToConsume.length) {
            setIsRefCodeClaimed(undefined);
        } else {
            checkIfCodeIsAvailableForInviteeToUse(refCodeToConsume)
                .then((isAvailable: boolean) =>
                    setIsRefCodeClaimed(isAvailable),
                )
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
            setEditModeInvitee(true);
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

    // run the FUUL context
    // const { isRefCodeFree, getRefCode } = useFuul();

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

        // check FUUL API to see if code exists and is available for use
        const isCodeAvailable: boolean =
            await checkIfCodeIsAvailableForInviteeToUse(r);

        // Always cache the code and set URL param
        handleReferralURLParam.set(r);
        referralStore.cache(r);

        if (!isCodeAvailable) {
            // code does not exist or has no remaining uses
            setInvalidCode(r);
            setIsCachedValueValid(false);
            setEditModeInvitee(true);
            setUserInputRefCode(r);
        } else {
            // code is valid and claimed - open the confirmation modal
            invalidCode && setInvalidCode('');
            setIsCachedValueValid(true);
            setEditModeInvitee(false);
            refCodeModalStore.openModal(r);
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

    const prevReferrerAddress = useRef<string | undefined>(undefined);

    // reset temporary ref code when changing wallets
    useEffect(() => {
        // Only clear when switching between different wallets, not on initial connect
        if (
            prevReferrerAddress.current &&
            prevReferrerAddress.current !== referrerAddress?.toString()
        ) {
            setTemporaryReferrerCode('');
            // referralStore.clear();
        }
        prevReferrerAddress.current = referrerAddress?.toString();
    }, [referrerAddress]);

    const [userInputRefCode, setUserInputRefCode] = useState<string>('');
    const debouncedUserInputRefCode = useDebounce(userInputRefCode, 500);
    const isInputSolanaAddress = useMemo<boolean>(
        () => checkAddressFormat(userInputRefCode),
        [userInputRefCode],
    );
    const [isUserRefCodeClaimed, setIsUserRefCodeClaimed] = useState<
        boolean | undefined
    >(undefined);
    const [isUserInputRefCodeSelfOwned, setIsUserInputRefCodeSelfOwned] =
        useState<boolean | undefined>(undefined);

    // when the user manually enters a refCode, check if the code is owned by their wallet
    useEffect(() => {
        if (isInputSolanaAddress) {
            setIsUserInputRefCodeSelfOwned(undefined);
            return;
        }
        if (debouncedUserInputRefCode && referrerAddress) {
            setIsUserInputRefCodeSelfOwned(undefined);
            referralStore
                .getRefCodeByPubKey(referrerAddress.toString())
                .then((userCodeData) => {
                    const isSelfOwned =
                        userCodeData?.code === debouncedUserInputRefCode ||
                        debouncedUserInputRefCode ===
                            referrerAddress.toString();
                    setIsUserInputRefCodeSelfOwned(isSelfOwned);
                })
                .catch((err) => {
                    setIsUserInputRefCodeSelfOwned(undefined);
                    console.error(err);
                });
        } else {
            setIsUserInputRefCodeSelfOwned(undefined);
        }
    }, [debouncedUserInputRefCode, referrerAddress, isInputSolanaAddress]);

    // when the user manually enters a refCode, make sure it exists
    useEffect(() => {
        if (isInputSolanaAddress) {
            setIsUserRefCodeClaimed(true);
            return;
        }
        if (debouncedUserInputRefCode.length) {
            setIsUserRefCodeClaimed(undefined);
            (async () => {
                try {
                    // check with FUUL to determine if ref code is claimed
                    // isAffiliateCodeAvailable returns true when the code
                    // exists and has remaining uses (i.e. is a valid referral)
                    const isCodeClaimed: boolean =
                        await checkIfCodeIsAvailableForInviteeToUse(
                            debouncedUserInputRefCode,
                        );
                    setIsUserRefCodeClaimed(isCodeClaimed);
                } catch (error) {
                    setIsUserRefCodeClaimed(false);
                }
            })();
        }
    }, [debouncedUserInputRefCode, isInputSolanaAddress]);

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
                const isCodeAvailable: boolean =
                    await checkIfCodeIsAvailableForInviteeToUse(codeToValidate);

                if (!isCodeAvailable) {
                    // Code does not exist or has no remaining uses
                    setInvalidCode(codeToValidate);
                    setIsCachedValueValid(false);
                    setEditModeInvitee(true);
                    setUserInputRefCode(codeToValidate);
                } else {
                    // Code is valid and claimed
                    setIsCachedValueValid(true);
                    setEditModeInvitee(false);
                }
                setLastValidatedCode(codeToValidate);
            } catch (error) {
                // On error, assume invalid to be safe
                setIsCachedValueValid(false);
                setEditModeInvitee(true);
                setUserInputRefCode(codeToValidate);
                setLastValidatedCode(codeToValidate);
            }
        })();
    }, [referralStore.cached, isCachedValueValid, lastValidatedCode]);

    const isCheckingCode = useMemo<boolean>(() => {
        if (userInputRefCode.length < 2) return false;
        if (userInputRefCode !== debouncedUserInputRefCode) return true;
        if (
            debouncedUserInputRefCode.length >= 2 &&
            isUserRefCodeClaimed === undefined
        )
            return true;
        return false;
    }, [userInputRefCode, debouncedUserInputRefCode, isUserRefCodeClaimed]);

    const tempRefCodeCharsValidate = useMemo<boolean>(() => {
        return checkForPermittedCharacters(temporaryReferrerCode);
    }, [temporaryReferrerCode]);

    useEffect(() => {
        (async () => {
            if (isEstablished(sessionState)) {
                const userWalletKey =
                    sessionState.walletPublicKey ||
                    sessionState.sessionPublicKey;

                const referrerData = await getRefCode(
                    userWalletKey.toString(),
                    UserIdentifierType.SolanaAddress,
                );

                if (referrerData?.code) {
                    setReferrerCode(referrerData.code);
                }

                // Only fetch and apply on-chain referrer if no URL parameter is present
                // URL parameter always takes precedence
                if (!handleReferralURLParam.value) {
                    const referrer = await getReferrerAsync(
                        userWalletKey.toString(),
                    );
                    if (referrer?.referrer_identifier) {
                        const referrerData = await getRefCode(
                            referrer.referrer_identifier as string,
                            UserIdentifierType.SolanaAddress,
                        );
                        if (referrerData?.code) {
                            handleUpdateReferralCode(referrerData.code);
                        }
                    }
                }
            } else {
                setReferrerCode('');
            }
        })();
    }, [sessionState]);

    useEffect(() => {
        if (!canEditReferrerCode) {
            setTemporaryReferrerCode(defaultReferrerCode);
        }
    }, [canEditReferrerCode, defaultReferrerCode]);

    useEffect(() => {
        if (!canEditReferrerCode && editModeReferrer) {
            setEditModeReferrer(false);
        }
    }, [canEditReferrerCode, editModeReferrer]);

    useEffect(() => {
        // If no temporary code, immediately set as valid
        if (!temporaryReferrerCode) {
            setIsTemporaryReferrerCodeValid(undefined);
            return;
        }

        // Don't check API if characters are invalid
        if (!tempRefCodeCharsValidate) {
            setIsTemporaryReferrerCodeValid(undefined);
            return;
        }

        // Set up debounced validation
        const timer = setTimeout(async () => {
            console.log('Starting validation for code:', temporaryReferrerCode);
            try {
                const codeIsFree = await checkIfCodeExists(
                    temporaryReferrerCode,
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
                        temporaryReferrerCode,
                    options,
                )
                    .then((res) => res.json())
                    .then((res) => console.log(res))
                    .catch((err) => console.error(err));
                setIsTemporaryReferrerCodeValid(!codeIsFree);
            } catch (error) {
                console.log('Validation error:', error);
                setIsTemporaryReferrerCodeValid(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [temporaryReferrerCode, tempRefCodeCharsValidate, canEditReferrerCode]);

    // fn to create a referral code for the wallet
    const createRefCode = async () => {
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

                const codeToCreate = canEditReferrerCode
                    ? temporaryReferrerCode.trim()
                    : defaultReferrerCode;

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

                    // Call the Fuul SDK to create the referral code
                    await Fuul.createAffiliateCode({
                        userIdentifier: userWalletKey.toString(),
                        identifierType: UserIdentifierType.SolanaAddress,
                        signature,
                        signaturePublicKey: userWalletKey.toString(),
                        code: codeToCreate,
                    });

                    setTemporaryReferrerCode('');
                    setReferrerCode(codeToCreate);
                } catch (error) {
                    throw error;
                }
            }
        } catch (error) {
            console.error('Error creating referral code:', error);
            // Handle error (e.g., show error message to user)
        }
    };

    // fn to update the existing referral code for the wallet
    const updateRefCode = async () => {
        try {
            if (!canEditReferrerCode) {
                return;
            }

            if (isEstablished(sessionState)) {
                const userWalletKey =
                    sessionState.walletPublicKey ||
                    sessionState.sessionPublicKey;

                if (!userWalletKey) {
                    return;
                }

                const codeToUpdate = temporaryReferrerCode.trim();

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

                setReferrerCode(codeToUpdate);
                setTemporaryReferrerCode('');
                setEditModeReferrer(false);
            }
        } catch (error) {
            console.error('Error updating referral code:', error);
        }
    };

    // tracking link URL for the wallet's referral code
    const [trackingLink, setTrackingLink] = useState('');

    // reset referrer address input when user changes wallet
    useEffect(() => setTemporaryReferrerCode(''), [referrerAddress]);

    useEffect(() => {
        (async () => {
            if (!referrerCode || !referrerAddress) return '';
            const trackingLinkUrl = await Fuul.generateTrackingLink(
                window.location.hostname,
                referrerAddress.toString(),
                UserIdentifierType.SolanaAddress,
            );
            setTrackingLink(trackingLinkUrl);
        })();
    }, [referrerCode]);

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
                        editModeInvitee={editModeInvitee}
                        setEditModeInvitee={setEditModeInvitee}
                        userInputRefCode={userInputRefCode}
                        setUserInputRefCode={setUserInputRefCode}
                        isCheckingCode={isCheckingCode}
                        isInputSolanaAddress={isInputSolanaAddress}
                        isUserRefCodeClaimed={isUserRefCodeClaimed}
                        isUserInputRefCodeSelfOwned={
                            isUserInputRefCodeSelfOwned
                        }
                        handleUpdateReferralCode={handleUpdateReferralCode}
                        setInvalidCode={setInvalidCode}
                    />
                );
            // handlers for creating a referral code
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
                        referrerCode={referrerCode}
                        editModeReferrer={editModeReferrer}
                        setEditModeReferrer={setEditModeReferrer}
                        temporaryReferrerCode={temporaryReferrerCode}
                        setTemporaryReferrerCode={setTemporaryReferrerCode}
                        isTemporaryReferrerCodeValid={
                            isTemporaryReferrerCodeValid
                        }
                        tempRefCodeCharsValidate={tempRefCodeCharsValidate}
                        canEditReferrerCode={canEditReferrerCode}
                        defaultReferrerCode={defaultReferrerCode}
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
                        referrerEditVolumeThreshold={
                            REFERRER_EDIT_VOLUME_THRESHOLD
                        }
                        referrerPercent={REFERRER_PERCENT}
                        inviteePercent={INVITEE_PERCENT}
                        createRefCode={createRefCode}
                        updateRefCode={updateRefCode}
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
                    if (referrerCode) {
                        setEditModeReferrer(false);
                    }
                    setTemporaryReferrerCode('');
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
