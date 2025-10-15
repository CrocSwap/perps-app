import { useEffect, useMemo, useRef, useState } from 'react';
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

// Add Buffer type definition for TypeScript
declare const Buffer: {
    from(
        array: ArrayLike<number> | ArrayBufferLike,
        byteOffset?: number,
        length?: number,
    ): Buffer;
    from(
        arrayBuffer: ArrayBufferLike,
        byteOffset?: number,
        length?: number,
    ): Buffer;
    from(str: string, encoding?: 'hex' | 'utf8'): Buffer;
    toString(encoding?: 'hex' | 'utf8'): string;
};

interface Props {
    initialTab?: string;
}

const availableTabs = [
    'referrals.enterCode',
    'referrals.createCode',
    'referrals.claim',
];

export default function CodeTabs(props: Props) {
    const { initialTab = 'referrals.enterCode' } = props;
    const [activeTab, setActiveTab] = useState(initialTab);
    const [temporaryAffiliateCode, setTemporaryAffiliateCode] = useState('');
    const [isTemporaryAffiliateCodeValid, setIsTemporaryAffiliateCodeValid] =
        useState(true);
    const [affiliateCode, setAffiliateCode] = useState('');
    // const [isEditing, setIsEditing] = useState(false);
    const sessionState = useSession();
    const userDataStore = useUserDataStore();
    const referralStore = useReferralStore();

    const [editModeReferral, setEditModeReferral] = useState<boolean>(false);
    const [editModeAffiliate, setEditModeAffiliate] = useState<boolean>(false);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
    };

    const isSessionEstablished = useMemo<boolean>(
        () => isEstablished(sessionState),
        [sessionState],
    );

    const handleReferralURLParam = useUrlParams(URL_PARAMS.referralCode);

    // fn to confirm a referral code and link to user's wallet address
    function confirmRefCode(): void {
        const isUserConnected = isEstablished(sessionState);
        if (isUserConnected) {
            referralStore.confirmCode(userDataStore.userAddress, {
                value: referralStore.cached.value,
                isConverted: false,
            });
        }
    }

    const [invalidCode, setInvalidCode] = useState<string>('');

    // fn to update a referral code and trigger FUUL confirmation workflow
    async function handleUpdateReferralCode(r: string): Promise<void> {
        console.log(r);
        // Check if the code exists (not free) before proceeding
        const codeIsFree = await Fuul.isAffiliateCodeFree(r);
        console.log(codeIsFree);

        if (codeIsFree) {
            console.log('Referral code is not valid (free/unused):', r);
            setInvalidCode(r);
            return;
        }

        invalidCode && setInvalidCode('');
        // update referral code param in the URL
        handleReferralURLParam.set(r);
        // toggle DOM to default view
        // setIsEditing(false);
        referralStore.cache(r);
        setEditModeReferral(false);
        // update referral code in store
        // userDataStore.userAddress
        //     ? referralStore.confirmCode(userDataStore.userAddress, {
        //           value: r,
        //           isConverted: false,
        //       })
        //     : referralStore.cache(r);
    }

    const affiliateAddress = userDataStore.userAddress;

    const updateReferralCodeInputRef = useRef<HTMLInputElement>(null);
    const updateReferralCodeInputRef2 = useRef<HTMLInputElement>(null);

    const confirmOrEditCodeElem = (
        <section className={styles.sectionWithButton}>
            <div className={styles.enterCodeContent}>
                <h6>Using Affiliate Code</h6>
                <p>{referralStore.cached.value}</p>
            </div>
            <div className={styles.refferal_code_buttons}>
                <SimpleButton
                    bg='accent3'
                    onClick={() => setEditModeReferral(true)}
                >
                    Edit1
                </SimpleButton>
            </div>
        </section>
    );

    const overwriteCurrentReferralCodeElem = (
        <section className={styles.sectionWithButton}>
            <div className={styles.enterCodeContent}>
                <h6>
                    {referralStore.cached.value
                        ? 'Overwrite current'
                        : 'Enter a'}{' '}
                    referral code: {referralStore.cached.value}
                </h6>
                <input
                    ref={updateReferralCodeInputRef}
                    type='text'
                    defaultValue={referralStore.cached.value}
                />
                {invalidCode && (
                    <p>
                        The referral code {invalidCode} is not claimed in the
                        referral program. Please confirm the code is correct.
                    </p>
                )}
            </div>
            <div className={styles.refferal_code_buttons}>
                <SimpleButton
                    bg='accent1'
                    onClick={() => {
                        handleUpdateReferralCode(
                            updateReferralCodeInputRef.current?.value || '',
                        );
                        // referralStore.cache(
                        //     updateReferralCodeInputRef.current?.value || '',
                        // );
                        // setEditModeReferral(false);
                    }}
                >
                    Confirm3
                </SimpleButton>
                <SimpleButton
                    bg='accent1'
                    onClick={() => setEditModeReferral(false)}
                >
                    Cancel3
                </SimpleButton>
            </div>
        </section>
    );

    const updateReferralCodeElem = (
        <section className={styles.sectionWithButton}>
            <div className={styles.enterCodeContent}>
                <h6>Enter a referral code</h6>
                <input
                    ref={updateReferralCodeInputRef2}
                    type='text'
                    defaultValue={referralStore.cached.value || ''}
                />
            </div>
            <SimpleButton
                bg='accent1'
                onClick={() =>
                    handleUpdateReferralCode(
                        updateReferralCodeInputRef2.current?.value || '',
                    )
                }
            >
                Update
            </SimpleButton>
            <SimpleButton
                bg='accent1'
                onClick={() => setEditModeReferral(false)}
            >
                Cancel1
            </SimpleButton>
        </section>
    );

    const connectYourWalletElem = (
        <section className={styles.sectionWithButton}>
            <div className={styles.enterCodeContent}>
                <h6>Connect your wallet to enter a referral code</h6>
            </div>
            <SessionButton />
        </section>
    );

    const enterCodeContent = isSessionEstablished
        ? referralStore.cached
            ? !editModeReferral
                ? // this code block:
                  //  - session is established
                  //  - active referral code
                  //  - user is not in 'edit' mode
                  confirmOrEditCodeElem
                : // this code block:
                  //  - session is established
                  //  - active referral code
                  //  - user is in 'edit' mode
                  overwriteCurrentReferralCodeElem
            : // this code block:
              //  - session is established
              //  - no active referral code
              updateReferralCodeElem
        : // this code block: session is not established
          connectYourWalletElem;

    useEffect(() => {
        (async () => {
            if (isEstablished(sessionState)) {
                const userWalletKey =
                    sessionState.walletPublicKey ||
                    sessionState.sessionPublicKey;

                const affiliateCode = await Fuul.getAffiliateCode(
                    userWalletKey.toString(),
                    UserIdentifierType.SolanaAddress,
                );

                if (affiliateCode) {
                    setAffiliateCode(affiliateCode);
                }
            } else {
                console.error('No wallet connected');
                setAffiliateCode('');
            }
        })();
    }, [sessionState]);

    useEffect(() => {
        (async () => {
            if (temporaryAffiliateCode) {
                const codeIsFree = await Fuul.isAffiliateCodeFree(
                    temporaryAffiliateCode,
                );
                setIsTemporaryAffiliateCodeValid(codeIsFree);
            }
        })();
    }, [temporaryAffiliateCode, sessionState]);

    /**
     * Creates an affiliate code for the user
     */
    const createAffiliateCode = async () => {
        try {
            // Get the user's wallet address from the session
            // @ts-ignore - The session type might not be fully typed
            if (isEstablished(sessionState)) {
                const userWalletKey =
                    sessionState.walletPublicKey ||
                    sessionState.sessionPublicKey;

                if (!userWalletKey) {
                    console.error('No wallet connected');
                    return;
                }

                // Create the message to sign
                const message = `I confirm that I am creating the ${temporaryAffiliateCode} code`;
                console.log('Message:', message);

                // Convert message to Uint8Array
                const messageBytes = new TextEncoder().encode(message);

                try {
                    // Get the signature from the session
                    const signatureBytes =
                        await sessionState.signMessage(messageBytes);

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
                    const result = await Fuul.createAffiliateCode({
                        userIdentifier: userWalletKey.toString(),
                        identifierType: UserIdentifierType.SolanaAddress,
                        signature,
                        signaturePublicKey: userWalletKey.toString(),
                        code: temporaryAffiliateCode,
                    });

                    console.log('API Response:', result);
                    setAffiliateCode(temporaryAffiliateCode);
                } catch (error) {
                    console.error(
                        'Error signing message or creating affiliate code:',
                        error,
                    );
                    throw error;
                }
            }
        } catch (error) {
            console.error('Error creating affiliate code:', error);
            // Handle error (e.g., show error message to user)
        }
    };

    const updateAffiliateCode = async () => {
        try {
            if (isEstablished(sessionState)) {
                const userWalletKey =
                    sessionState.walletPublicKey ||
                    sessionState.sessionPublicKey;

                if (!userWalletKey) {
                    console.error('No wallet connected');
                    return;
                }

                // Create the message to sign
                const message = `I confirm that I am updating my code to ${temporaryAffiliateCode}`;
                console.log('Message:', message);

                // Convert message to Uint8Array
                const messageBytes = new TextEncoder().encode(message);
                // Get the signature from the session
                const signatureBytes =
                    await sessionState.signMessage(messageBytes);

                // Convert the signature to base64
                const signatureArray = Array.from(
                    new Uint8Array(signatureBytes),
                );
                const binaryString = String.fromCharCode.apply(
                    null,
                    signatureArray,
                );
                const signature = btoa(binaryString);

                const result = await Fuul.updateAffiliateCode({
                    userIdentifier: userWalletKey.toString(), // the address of the user
                    identifierType: UserIdentifierType.SolanaAddress, // evm_address | solana_address | xrpl_address
                    signature,
                    signaturePublicKey: userWalletKey.toString(), // Only for XRPL type signatures
                    code: temporaryAffiliateCode,
                });

                console.log('API Response:', result);
                setAffiliateCode(temporaryAffiliateCode);
                setEditModeAffiliate(false);
            }
        } catch (error) {
            console.error('Error updating affiliate code:', error);
            // Handle error (e.g., show error message to user)
        }
    };

    const [trackingLink, setTrackingLink] = useState('');

    useEffect(() => {
        (async () => {
            if (!affiliateCode || !affiliateAddress) return '';
            const trackingLinkUrl = await Fuul.generateTrackingLink(
                'https://perps.ambient.finance',
                affiliateAddress.toString(),
                UserIdentifierType.SolanaAddress,
            );
            setTrackingLink(trackingLinkUrl);
        })();
    }, [affiliateCode]);

    const createCodeContent = isSessionEstablished ? (
        affiliateCode && !editModeAffiliate ? (
            <section className={styles.sectionWithButton}>
                <div className={styles.createCodeContent}>
                    <p>Your code is {affiliateCode}</p>

                    {trackingLink && (
                        <div className={styles.walletLink}>
                            <a href={trackingLink} target='_blank'>
                                {trackingLink}
                            </a>
                        </div>
                    )}
                    <p className={styles.trackingLinkExplanation}>
                        You will receive <span>10%</span> of referred users fees
                        and they will receive a <span>4%</span> discount. See
                        the Docs for more.
                    </p>
                </div>
                <SimpleButton
                    bg='accent1'
                    onClick={() => setEditModeAffiliate(true)}
                >
                    Edit2
                </SimpleButton>
            </section>
        ) : (
            <section className={styles.sectionWithButton}>
                <div className={styles.enterCodeContent}>
                    <h6>Create an affiliate code</h6>
                    <input
                        type='text'
                        value={temporaryAffiliateCode}
                        onChange={(e) =>
                            setTemporaryAffiliateCode(e.target.value)
                        }
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
                    <h6>
                        Create a unique code to earn 10% of referred users' fees
                    </h6>
                </div>
                <div className={styles.refferal_code_buttons}>
                    <SimpleButton
                        bg='accent1'
                        onClick={
                            editModeAffiliate
                                ? updateAffiliateCode
                                : createAffiliateCode
                        }
                        disabled={
                            !temporaryAffiliateCode.trim() ||
                            !isTemporaryAffiliateCodeValid
                        }
                    >
                        {!isTemporaryAffiliateCodeValid
                            ? 'Code Already In Use'
                            : editModeAffiliate
                              ? 'Update'
                              : 'Create'}
                    </SimpleButton>
                    {editModeAffiliate && (
                        <SimpleButton
                            bg='dark4'
                            hoverBg='accent1'
                            onClick={() => {
                                setEditModeAffiliate(false);
                                setTemporaryAffiliateCode('');
                            }}
                        >
                            Cancel2
                        </SimpleButton>
                    )}
                </div>
            </section>
        )
    ) : (
        <section className={styles.sectionWithButton}>
            <div className={styles.enterCodeContent}>
                <h6>Connect your wallet to create an affiliate code</h6>
            </div>
            <SessionButton />
        </section>
    );

    const claimContent = isSessionEstablished ? (
        <section className={styles.sectionWithButton}>
            <div className={styles.claimContent}>
                <p>Claim $0.00 in rewards</p>
            </div>
            <SimpleButton bg='accent1'>Claim</SimpleButton>
        </section>
    ) : (
        <section className={styles.sectionWithButton}>
            <div className={styles.enterCodeContent}>
                <h6>Connect your wallet to claim rewards</h6>
            </div>
            <SessionButton />
        </section>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'referrals.enterCode':
                return enterCodeContent;
            case 'referrals.createCode':
                return createCodeContent;
            case 'referrals.claim':
                return claimContent;
            default:
                return (
                    <div className={styles.emptyState}>
                        Select a tab to view data
                    </div>
                );
        }
    };

    return (
        <div className={styles.tableWrapper}>
            <Tabs
                tabs={availableTabs}
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
