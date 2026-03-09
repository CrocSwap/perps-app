import { Connection, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import {
    FuulSdk,
    Network,
    ClaimMessage,
    ClaimMessageData,
    MessageDomain,
    TokenType,
    ClaimReason,
} from '@fuul/sdk-solana';

// Fuul contracts are deployed on Fogo mainnet, separate from app's testnet
const FOGO_MAINNET_RPC = 'https://mainnet.fogo.io';

export function getFuulConnection(): Connection {
    return new Connection(FOGO_MAINNET_RPC, {
        commitment: 'confirmed',
    });
}

export async function getClaimFee(): Promise<bigint | null> {
    const connection = getFuulConnection();
    const sdk = new FuulSdk(connection, Network.FOGO_MAINNET);
    const globalConfig = await sdk.getGlobalConfig();
    if (!globalConfig) {
        console.warn('[claimRewards] GlobalConfig not found');
        return null;
    }
    return BigInt(globalConfig.feeManagement.userNativeClaimFee.toString());
}

export async function fetchClaimRequirements(
    sdk: FuulSdk,
    projectAddress: PublicKey,
) {
    const program = sdk.getProgram();
    console.log('hey');
    // Fetch project account to get nonce
    const projectAccount = await program.account.project.fetch(projectAddress);
    const projectNonce = projectAccount.nonce as anchor.BN;

    // Fetch global config to get authorized signer
    const globalConfig = await sdk.getGlobalConfig();
    if (!globalConfig) {
        throw new Error('Global config not found');
    }

    const signers = globalConfig.rolesMapping.roles
        .filter(
            (r: { role: Record<string, unknown>; account: PublicKey }) =>
                Object.keys(r.role)[0] === 'signer',
        )
        .map(
            (r: { role: Record<string, unknown>; account: PublicKey }) =>
                r.account,
        );

    if (signers.length === 0) {
        throw new Error('No authorized signers found');
    }

    return { projectNonce, signer: signers[0], program };
}

export async function buildClaimInstructions(
    sdk: FuulSdk,
    walletPublicKey: PublicKey,
    claim: {
        projectAddress: PublicKey;
        recipient: PublicKey;
        tokenMint: PublicKey;
        amount: bigint;
        deadline: number;
        reasonCode: number;
        proof: Uint8Array;
        signature: Uint8Array;
    },
) {
    const { projectNonce, signer, program } = await fetchClaimRequirements(
        sdk,
        claim.projectAddress,
    );

    // Build message domain
    const domain = new MessageDomain({
        programId: program.programId,
        version: 1,
        deadline: BigInt(claim.deadline),
    });

    // Build claim data
    const claimData = new ClaimMessageData({
        amount: claim.amount,
        project: claim.projectAddress,
        recipient: claim.recipient,
        tokenType: TokenType.FungibleSpl,
        tokenMint: claim.tokenMint,
        proof: Buffer.from(claim.proof),
        reason:
            claim.reasonCode === 0
                ? ClaimReason.AffiliatePayout
                : ClaimReason.EndUserPayout,
    });

    const claimMessage = new ClaimMessage({ data: claimData, domain });

    // SDK handles ATA creation and PDA derivation internally
    const instructions = await sdk.claim({
        authority: walletPublicKey,
        projectNonce,
        message: claimMessage,
        signatures: [
            {
                signature: claim.signature,
                signer: signer,
            },
        ],
    });

    return instructions;
}
