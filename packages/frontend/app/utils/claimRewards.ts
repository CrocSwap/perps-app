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
    console.log('🔧 [claimRewards] ===== FETCHING CLAIM REQUIREMENTS =====');
    console.log(
        '🔧 [claimRewards] Project address:',
        projectAddress.toBase58(),
    );

    const program = sdk.getProgram();
    console.log('🔧 [claimRewards] Program ID:', program.programId.toBase58());

    let projectNonce: anchor.BN;

    try {
        console.log('🔧 [claimRewards] Fetching project account...');
        // Fetch project account to get nonce
        const projectAccount =
            await program.account.project.fetch(projectAddress);
        console.log('🔧 [claimRewards] Project account fetched successfully');
        console.log('🔧 [claimRewards] Project account data:', {
            nonce: projectAccount.nonce?.toString(),
            isInitialized: projectAccount.isInitialized,
            attributionsCount: projectAccount.attributionsCount?.toString(),
            metadataUri: projectAccount.metadataUri,
        });

        projectNonce = projectAccount.nonce as anchor.BN;
        console.log(
            '🔧 [claimRewards] Project nonce:',
            projectNonce.toString(),
        );
    } catch (projectError: any) {
        console.error(
            '🔧 [claimRewards] Failed to fetch project account:',
            projectError,
        );
        throw new Error(
            `Failed to fetch project account: ${projectError.message}`,
        );
    }

    try {
        console.log('🔧 [claimRewards] Fetching global config...');
        // Fetch global config to get authorized signer
        const globalConfig = await sdk.getGlobalConfig();
        if (!globalConfig) {
            console.error('🔧 [claimRewards] Global config not found');
            throw new Error('Global config not found');
        }
        console.log('🔧 [claimRewards] Global config fetched successfully');
        console.log(
            '🔧 [claimRewards] Global config roles:',
            globalConfig.rolesMapping?.roles?.length || 0,
        );

        // Log all available signers for debugging
        console.log('🔧 [claimRewards] ===== ALL AVAILABLE SIGNERS =====');
        const allSigners = globalConfig.rolesMapping.roles
            .filter((role: any) => role.role === 'signer')
            .map((role: any) => role.account);

        allSigners.forEach((signer: any, index: number) => {
            console.log(
                `🔧 [claimRewards] Signer ${index}: ${signer.toBase58()}`,
            );
        });
        console.log('🔧 [claimRewards] ======================================');

        const signers = globalConfig.rolesMapping.roles
            .filter(
                (r: { role: Record<string, unknown>; account: PublicKey }) => {
                    const roleKeys = Object.keys(r.role);
                    const isSigner = roleKeys[0] === 'signer';
                    if (isSigner) {
                        console.log(
                            '🔧 [claimRewards] Found signer role:',
                            r.role,
                        );
                        console.log(
                            '🔧 [claimRewards] Signer account:',
                            r.account.toBase58(),
                        );
                    }
                    return isSigner;
                },
            )
            .map(
                (r: { role: Record<string, unknown>; account: PublicKey }) =>
                    r.account,
            );

        console.log('🔧 [claimRewards] Total signers found:', signers.length);

        if (signers.length === 0) {
            console.error('🔧 [claimRewards] No authorized signers found');
            throw new Error('No authorized signers found');
        }

        const result = { projectNonce, signer: signers[0], program };
        console.log('🔧 [claimRewards] Claim requirements fetched:', {
            projectNonce: result.projectNonce.toString(),
            signer: result.signer.toBase58(),
            programId: result.program.programId.toBase58(),
        });

        return result;
    } catch (configError: any) {
        console.error(
            '🔧 [claimRewards] Failed to fetch global config:',
            configError,
        );
        throw new Error(
            `Failed to fetch global config: ${configError.message}`,
        );
    }
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
    console.log('🔧 [claimRewards] ===== BUILDING CLAIM INSTRUCTIONS =====');
    console.log('🔧 [claimRewards] Input claim data:', {
        projectAddress: claim.projectAddress.toBase58(),
        recipient: claim.recipient.toBase58(),
        tokenMint: claim.tokenMint.toBase58(),
        amount: claim.amount.toString(),
        deadline: claim.deadline,
        deadlineDate: new Date(claim.deadline * 1000).toISOString(),
        reasonCode: claim.reasonCode,
        proofLength: claim.proof.length,
        signatureLength: claim.signature.length,
        walletPublicKey: walletPublicKey.toBase58(),
    });

    const { projectNonce, signer, program } = await fetchClaimRequirements(
        sdk,
        claim.projectAddress,
    );

    console.log('🔧 [claimRewards] Requirements fetched:', {
        projectNonce: projectNonce.toString(),
        signer: signer.toBase58(),
        programId: program.programId.toBase58(),
    });

    // Build message domain
    console.log('🔧 [claimRewards] Building message domain...');
    const domain = new MessageDomain({
        programId: program.programId,
        version: 1,
        deadline: BigInt(claim.deadline),
    });
    console.log('🔧 [claimRewards] Message domain created:', {
        programId: program.programId.toBase58(),
        version: domain.version,
        deadline: domain.deadline.toString(),
    });

    // Build claim data
    console.log('🔧 [claimRewards] Building claim message data...');
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
    console.log('🔧 [claimRewards] Claim message data created:', {
        amount: claimData.amount.toString(),
        project: claim.projectAddress.toBase58(),
        recipient: claim.recipient.toBase58(),
        tokenType: TokenType.FungibleSpl,
        tokenMint: claim.tokenMint.toBase58(),
        proofLength: claimData.proof.length,
        reason: claim.reasonCode === 0 ? 'AffiliatePayout' : 'EndUserPayout',
    });

    const claimMessage = new ClaimMessage({ data: claimData, domain });
    console.log('🔧 [claimRewards] Claim message created successfully');

    console.log('🔧 [claimRewards] Calling SDK claim method...');
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

    console.log('🔧 [claimRewards] Instructions built successfully:', {
        instructionCount: instructions.length,
        instructions: instructions.map((instruction, index) => ({
            index,
            programId: instruction.programId.toBase58(),
            keysCount: instruction.keys.length,
            dataLength: instruction.data.length,
        })),
    });

    return instructions;
}
