import { useState, useEffect } from 'react';
import {
    isEstablished,
    SessionButton,
    useSession,
} from '@fogo/sessions-sdk-react';
import { Link } from 'react-router';
import { useModal } from '~/hooks/useModal';
import Modal from '~/components/Modal/Modal';
import { useFuul } from '~/contexts/FuulContext';
import { useAppStateStore } from '~/stores/AppStateStore';
import { URL_PARAMS, useUrlParams } from '~/hooks/useURLParams';
import { useReferralStore } from '~/stores/ReferralStore';
import { useNotificationStore } from '~/stores/NotificationStore';
import { useRefCodeModalStore } from '~/stores/RefCodeModalStore';
import { checkAddressFormat } from '~/utils/functions/checkAddressFormat';
import SimpleButton from '~/components/SimpleButton/SimpleButton';
import styles from './RefCodeModal.module.css';

export default function RefCodeModal() {
    const sessionState = useSession();
    const { isSessionReestablishing } = useAppStateStore();
    const {
        isInitialized,
        trackPageView,
        checkIfCodeIsAvailableForInviteeToUse,
    } = useFuul();
    const referralStore = useReferralStore();
    const notificationStore = useNotificationStore();
    const refCodeModalStore = useRefCodeModalStore();
    const referralCodeFromURL = useUrlParams(URL_PARAMS.referralCode);

    const isUserConnected = isEstablished(sessionState);
    const userPublicKey: string | null = isUserConnected
        ? sessionState.walletPublicKey?.toString()
        : null;

    // track whether the session has completed its initial resolution
    // this prevents the 'noWallet' modal from flashing during startup
    // when the session transitions through NotEstablished before Established
    const [hasSessionResolved, setHasSessionResolved] = useState(false);
    const [userRefCode, setUserRefCode] = useState<string | null>(null);
    const [userRefCodeFetchedFor, setUserRefCodeFetchedFor] = useState<
        string | null
    >(null);
    const [isOwnCode, setIsOwnCode] = useState<boolean>(false);

    // true when we need to wait for userRefCode to load for the current user
    const isUserRefCodePending =
        isUserConnected && userPublicKey !== userRefCodeFetchedFor;

    // fetch user's own ref code when public key changes
    useEffect(() => {
        if (userPublicKey) {
            referralStore.getRefCodeByPubKey(userPublicKey).then((res) => {
                setUserRefCode(res?.code ?? null);
                setUserRefCodeFetchedFor(userPublicKey);
                console.log(
                    '🔑 [RefCodeModal] userRefCode set to:',
                    res?.code ?? null,
                );
            });
        } else {
            setUserRefCode(null);
            setUserRefCodeFetchedFor(null);
        }
    }, [userPublicKey]);
    useEffect(() => {
        if (
            !hasSessionResolved &&
            !isSessionReestablishing &&
            !isEstablished(sessionState)
        ) {
            const timer = setTimeout(() => setHasSessionResolved(true), 500);
            return () => clearTimeout(timer);
        }
        if (isEstablished(sessionState)) {
            setHasSessionResolved(true);
        }
    }, [isSessionReestablishing, sessionState, hasSessionResolved]);

    const refCodeModal = useModal<
        'goodCode' | 'badCode' | 'address' | 'noWallet' | 'ownCode'
    >('closed');
    const [wasRefCodeModalShown, setWasRefCodeModalShown] = useState(false);

    const refCodeFromURL =
        // logic to open the ref code modal when relevant
        useEffect(() => {
            const runLogic = async (codeToCheck: string): Promise<void> => {
                if (
                    isUserConnected &&
                    userPublicKey &&
                    (await referralStore.checkForConversion(userPublicKey))
                ) {
                    return;
                }
                // check if this is the user's own code
                if (isUserConnected && userPublicKey) {
                    const isOwnPubKey = codeToCheck === userPublicKey;
                    const isOwnRegisteredCode = userRefCode === codeToCheck;
                    if (isOwnPubKey || isOwnRegisteredCode) {
                        refCodeModal.open('ownCode');
                        setWasRefCodeModalShown(true);
                        return;
                    }
                }
                const isCodeSVM: boolean = checkAddressFormat(codeToCheck);
                if (!wasRefCodeModalShown) {
                    if (isUserConnected) {
                        if (isCodeSVM) {
                            refCodeModal.open('address');
                        } else if (
                            await checkIfCodeIsAvailableForInviteeToUse(
                                codeToCheck,
                            )
                        ) {
                            refCodeModal.open('goodCode');
                        } else {
                            refCodeModal.open('badCode');
                        }
                        setWasRefCodeModalShown(true);
                    } else if (hasSessionResolved) {
                        refCodeModal.open('noWallet');
                    }
                }
            };
            // wait for userRefCode to load before running modal logic
            if (
                isInitialized &&
                referralCodeFromURL.value &&
                hasSessionResolved &&
                !isUserRefCodePending
            ) {
                runLogic(referralCodeFromURL.value);
            }
        }, [
            isInitialized,
            referralCodeFromURL.value,
            userPublicKey,
            isUserConnected,
            hasSessionResolved,
            isUserRefCodePending,
            userRefCode,
        ]);

    // logic to open modal when triggered from store (e.g., from EnterCode confirm button)
    useEffect(() => {
        const runLogic = async (codeToCheck: string): Promise<void> => {
            // check if this is the user's own code
            if (userPublicKey) {
                const isOwnPubKey = codeToCheck === userPublicKey;
                const isOwnRegisteredCode = userRefCode === codeToCheck;
                if (isOwnPubKey || isOwnRegisteredCode) {
                    refCodeModal.open('ownCode');
                    return;
                }
            }
            const isCodeSVM: boolean = checkAddressFormat(codeToCheck);
            if (isCodeSVM) {
                refCodeModal.open('address');
            } else if (
                await checkIfCodeIsAvailableForInviteeToUse(codeToCheck)
            ) {
                refCodeModal.open('goodCode');
            } else {
                refCodeModal.open('badCode');
            }
        };
        if (
            refCodeModalStore.shouldOpenModal &&
            refCodeModalStore.codeToConfirm &&
            !isUserRefCodePending
        ) {
            runLogic(refCodeModalStore.codeToConfirm);
        }
    }, [
        refCodeModalStore.shouldOpenModal,
        refCodeModalStore.codeToConfirm,
        userPublicKey,
        userRefCode,
        isUserRefCodePending,
    ]);

    // logic to ingest a ref code from the URL
    useEffect(() => {
        if (referralCodeFromURL.value) {
            referralStore.cache(referralCodeFromURL.value);
        }
    }, [referralCodeFromURL.value]);

    // use code from store if available, otherwise fall back to URL param
    const activeRefCode =
        refCodeModalStore.codeToConfirm || referralCodeFromURL.value;

    // check if the active ref code is the user's own code
    useEffect(() => {
        if (activeRefCode && userPublicKey) {
            const isSameCode =
                userRefCode === activeRefCode ||
                activeRefCode === userPublicKey;
            setIsOwnCode(isSameCode);
            if (isSameCode && refCodeModal.isOpen) {
                refCodeModal.open('ownCode');
                console.log(
                    '🚫 [RefCodeModal] Detected own code, opening ownCode view',
                );
            }
        } else {
            setIsOwnCode(false);
        }
    }, [userRefCode, activeRefCode, userPublicKey, refCodeModal.isOpen]);

    function handleClose(): void {
        refCodeModal.close();
        refCodeModalStore.closeModal();
    }

    function mockAcceptRefCode(refCode: string): void {
        trackPageView();
        referralStore.cache(refCode, true);
        notificationStore.add({
            title: 'Referral Code Accepted',
            message: `You have successfully accepted the ${refCode} referral code.`,
            icon: 'check',
            removeAfter: 5000,
        });
    }

    if (!refCodeModal.isOpen) {
        return null;
    }

    return (
        <Modal
            close={handleClose}
            position='center'
            title='Referral Code'
            stopOutsideClick
        >
            {refCodeModal.content === 'badCode' && (
                <div className={styles.invalid_ref_code_modal}>
                    <p>
                        The referral code{' '}
                        <span className={styles.highlight_code}>
                            {activeRefCode}
                        </span>{' '}
                        is not recognized. Please check the code and try again.
                    </p>
                    <Link to='/v2/referrals' onClick={handleClose}>
                        Go to Referrals
                    </Link>
                </div>
            )}
            {refCodeModal.content === 'goodCode' && (
                <div className={styles.invalid_ref_code_modal}>
                    <p>
                        Please click 'Accept' to accept the{' '}
                        <span className={styles.highlight_code}>
                            {activeRefCode}
                        </span>{' '}
                        referral code. If you deny this referral code it can
                        still be activated later on the Referrals page.
                    </p>
                    <div className={styles.referral_code_modal_buttons}>
                        <button onClick={handleClose}>Deny</button>
                        <button
                            onClick={() => {
                                if (!activeRefCode) {
                                    return;
                                }
                                mockAcceptRefCode(activeRefCode);
                                handleClose();
                            }}
                        >
                            Accept
                        </button>
                    </div>
                </div>
            )}
            {refCodeModal.content === 'address' && (
                <div className={styles.invalid_ref_code_modal}>
                    <p>
                        Please click 'Accept' to accept the{' '}
                        <span className={styles.highlight_code}>
                            {activeRefCode}
                        </span>{' '}
                        referral code (address). This referral can still be
                        activated later on the Referrals page.
                    </p>
                    <div className={styles.referral_code_modal_buttons}>
                        <button onClick={handleClose}>Deny</button>
                        <button
                            onClick={() => {
                                if (!activeRefCode) {
                                    return;
                                }
                                mockAcceptRefCode(activeRefCode);
                                handleClose();
                            }}
                        >
                            Accept
                        </button>
                    </div>
                </div>
            )}
            {refCodeModal.content === 'noWallet' && (
                <div className={styles.invalid_ref_code_modal}>
                    <p>
                        You've been referred to Ambient by a friend. Please
                        connect your wallet to accept and start trading with the{' '}
                        <span className={styles.highlight_code}>
                            {activeRefCode}
                        </span>{' '}
                        referral code.
                    </p>
                    <SessionButton />
                </div>
            )}
            {refCodeModal.content === 'ownCode' && (
                <div className={styles.invalid_ref_code_modal}>
                    <p>
                        The referral code{' '}
                        <span style={{ color: 'var(--accent3)' }}>
                            {activeRefCode}
                        </span>{' '}
                        appears registered to your wallet address. Please use a
                        different code.
                    </p>
                    <SimpleButton bg='accent1' onClick={handleClose}>
                        Ok
                    </SimpleButton>
                </div>
            )}
        </Modal>
    );
}
