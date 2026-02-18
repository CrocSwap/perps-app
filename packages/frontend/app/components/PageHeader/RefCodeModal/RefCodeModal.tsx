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

    // track whether the session has completed its initial resolution
    // this prevents the 'noWallet' modal from flashing during startup
    // when the session transitions through NotEstablished before Established
    const [hasSessionResolved, setHasSessionResolved] = useState(false);
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
        'goodCode' | 'badCode' | 'address' | 'noWallet'
    >('closed');
    const [wasRefCodeModalShown, setWasRefCodeModalShown] = useState(false);

    // logic to open the ref code modal when relevant
    useEffect(() => {
        const runLogic = async (codeToCheck: string): Promise<void> => {
            const isCodeSVM: boolean = checkAddressFormat(codeToCheck);
            if (!wasRefCodeModalShown) {
                if (isUserConnected) {
                    if (isCodeSVM) {
                        refCodeModal.open('address');
                    } else if (
                        await checkIfCodeIsAvailableForInviteeToUse(codeToCheck)
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
        if (isInitialized && referralCodeFromURL.value && hasSessionResolved) {
            runLogic(referralCodeFromURL.value);
        }
    }, [
        isInitialized,
        referralCodeFromURL.value,
        isUserConnected,
        hasSessionResolved,
    ]);

    // logic to open modal when triggered from store (e.g., from EnterCode confirm button)
    useEffect(() => {
        const runLogic = async (codeToCheck: string): Promise<void> => {
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
            refCodeModalStore.codeToConfirm
        ) {
            runLogic(refCodeModalStore.codeToConfirm);
        }
    }, [refCodeModalStore.shouldOpenModal, refCodeModalStore.codeToConfirm]);

    // logic to ingest a ref code from the URL
    useEffect(() => {
        const handleRefCodeFromURL = async (): Promise<void> => {
            if (referralCodeFromURL.value) {
                referralStore.cache(referralCodeFromURL.value);
                if (
                    referralCodeFromURL.value !== referralStore.cached2.code &&
                    !referralStore.cached2.isCodeApprovedByInvitee
                ) {
                    referralStore.cache2(referralCodeFromURL.value);
                }
            }
        };
        handleRefCodeFromURL();
    }, [referralCodeFromURL.value]);

    // use code from store if available, otherwise fall back to URL param
    const activeRefCode =
        refCodeModalStore.codeToConfirm || referralCodeFromURL.value;

    function handleClose(): void {
        refCodeModal.close();
        refCodeModalStore.closeModal();
    }

    function mockAcceptRefCode(refCode: string): void {
        trackPageView();
        if (referralStore.cached2.code !== refCode) {
            referralStore.cache2(refCode);
        }
        referralStore.markCodeApproved(refCode);
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
        </Modal>
    );
}
