import { useMemo, useState } from 'react';
import { isEstablished, useSession } from '@fogo/sessions-sdk-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { FuulSdk, Network } from '@fuul/sdk-solana';
import {
    getFuulConnection,
    getClaimFee,
    buildClaimInstructions,
} from '~/utils/claimRewards';
import {
    useAffiliateClaims,
    type AffiliateClaim,
} from '../hooks/useAffiliateData';
import { useUserDataStore } from '~/stores/UserDataStore';
import styles from '../affiliates.module.css';

function hexToBytes(hex: string): Uint8Array {
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
    }
    return bytes;
}

function formatClaimableAmount(claims: AffiliateClaim[]): string {
    if (!claims || claims.length === 0) return '$0.00';
    const totalAmount = claims.reduce((sum, claim) => {
        return sum + BigInt(claim.amount);
    }, BigInt(0));
    const decimals = 6;
    const divisor = BigInt(10 ** decimals);
    const wholePart = totalAmount / divisor;
    const fractionalPart = totalAmount % divisor;
    const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
    const trimmed = fractionalStr.replace(/0+$/, '') || '00';
    const displayDecimals = trimmed.length < 2 ? '00' : trimmed;
    const formatted = `${wholePart}.${displayDecimals}`;
    if (wholePart === BigInt(0) && totalAmount > BigInt(0)) {
        return `${totalAmount.toString()} units`;
    }
    return `$${formatted}`;
}

export function ClaimRewardsCard() {
    const sessionState = useSession();
    const isConnected = isEstablished(sessionState);
    const { userAddress } = useUserDataStore();
    const [isClaiming, setIsClaiming] = useState(false);
    const [claimError, setClaimError] = useState<string | null>(null);
    const [txSignature, setTxSignature] = useState<string | null>(null);

    const {
        data: claims,
        isLoading,
        refetch,
    } = useAffiliateClaims(userAddress ?? '', isConnected && !!userAddress);

    const claimableAmount = useMemo(
        () => formatClaimableAmount(claims ?? []),
        [claims],
    );

    const hasClaimableRewards =
        claims && claims.length > 0 && claimableAmount !== '$0.00';

    const handleClaim = async () => {
        if (!claims || claims.length === 0) return;
        if (!isEstablished(sessionState)) return;

        const walletPublicKey =
            sessionState.walletPublicKey || sessionState.sessionPublicKey;
        if (!walletPublicKey) return;

        setIsClaiming(true);
        setClaimError(null);
        setTxSignature(null);

        try {
            const fuulConnection = getFuulConnection();
            const sdk = new FuulSdk(fuulConnection, Network.FOGO_MAINNET);

            await getClaimFee();

            const firstClaim = claims[0];
            const projectAddress = new PublicKey(firstClaim.project_address);

            const proofBytes = hexToBytes(firstClaim.proof);
            const signatureBytes = hexToBytes(firstClaim.signatures[0]);

            const instructions = await buildClaimInstructions(
                sdk,
                walletPublicKey,
                {
                    projectAddress,
                    recipient: new PublicKey(firstClaim.to),
                    tokenMint: new PublicKey(firstClaim.currency),
                    amount: BigInt(firstClaim.amount),
                    deadline: firstClaim.deadline,
                    reasonCode: firstClaim.reason,
                    proof: proofBytes,
                    signature: signatureBytes,
                },
            );

            const transaction = new Transaction();
            transaction.add(...instructions);

            const { blockhash, lastValidBlockHeight } =
                await fuulConnection.getLatestBlockhash('confirmed');
            transaction.recentBlockhash = blockhash;
            transaction.lastValidBlockHeight = lastValidBlockHeight;
            transaction.feePayer = walletPublicKey;

            if (!sessionState.solanaWallet?.signTransaction) {
                throw new Error('signTransaction not available on wallet');
            }
            const signedTx =
                await sessionState.solanaWallet.signTransaction(transaction);

            const sig = await fuulConnection.sendRawTransaction(
                signedTx.serialize(),
                {
                    skipPreflight: false,
                    preflightCommitment: 'confirmed',
                },
            );

            await fuulConnection.confirmTransaction(
                { signature: sig, blockhash, lastValidBlockHeight },
                'confirmed',
            );

            setTxSignature(sig);
            refetch();
        } catch (error) {
            console.error('🎁 [AffiliateClaim] Error:', error);
            setClaimError(
                error instanceof Error ? error.message : 'Claim failed',
            );
        } finally {
            setIsClaiming(false);
        }
    };

    if (!isConnected || isLoading) return null;

    return (
        <div
            className={styles['glass-card']}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap',
            }}
        >
            <div>
                <div
                    style={{
                        fontSize: '0.875rem',
                        color: 'var(--aff-text-muted)',
                        marginBottom: '0.25rem',
                    }}
                >
                    Claimable Rewards
                </div>
                <div
                    style={{
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        color: hasClaimableRewards
                            ? 'var(--aff-positive)'
                            : 'var(--aff-text-primary)',
                    }}
                >
                    {claimableAmount}
                </div>
                {claimError && (
                    <div
                        style={{
                            fontSize: '0.75rem',
                            color: 'var(--aff-negative)',
                            marginTop: '0.25rem',
                        }}
                    >
                        {claimError}
                    </div>
                )}
                {txSignature && (
                    <a
                        href={`https://explorer.fogo.io/tx/${txSignature}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        style={{
                            fontSize: '0.75rem',
                            color: 'var(--aff-accent1)',
                            marginTop: '0.25rem',
                            display: 'inline-block',
                        }}
                    >
                        View transaction
                    </a>
                )}
            </div>
            <button
                className={`${styles.btn} ${styles['btn-primary']}`}
                disabled={!hasClaimableRewards || isClaiming}
                onClick={handleClaim}
            >
                {isClaiming ? 'Claiming...' : 'Claim'}
            </button>
        </div>
    );
}
