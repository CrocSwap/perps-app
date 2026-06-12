import { PublicKey, TransactionInstruction } from '@solana/web3.js';

export const TEST_PUBLIC_KEYS = {
    user: new PublicKey('11111111111111111111111111111112'),
    session: new PublicKey('11111111111111111111111111111113'),
    payer: new PublicKey('11111111111111111111111111111114'),
    program: new PublicKey('11111111111111111111111111111115'),
};

export function makeInstruction(label = 'test'): TransactionInstruction {
    return new TransactionInstruction({
        programId: TEST_PUBLIC_KEYS.program,
        keys: [
            {
                pubkey: TEST_PUBLIC_KEYS.user,
                isSigner: true,
                isWritable: true,
            },
        ],
        data: Buffer.from(label),
    });
}

export function makeTransaction(instructions = [makeInstruction()]) {
    return { instructions };
}
