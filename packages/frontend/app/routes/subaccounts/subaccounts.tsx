import { useEffect, useRef } from 'react';
import { useModal } from '~/hooks/useModal';
import { useAccounts, type useAccountsIF } from '~/stores/AccountsStore';
import AccountsTable from './AccountsTable/AccountsTable';
import CreateSubaccount from './CreateSubaccount/CreateSubaccount';
import styles from './subaccounts.module.css';
import SimpleButton from '~/components/SimpleButton/SimpleButton';
import TransferModal from '~/components/TransferModal/TransferModal';

export function meta() {
    return [
        { title: 'Sub-Accounts | Ambient Finance' },
        { name: 'description', content: 'Trade Perps with Ambient' },
    ];
}

export default function Subaccounts() {
    // logic to open and close subaccount creation modal
    const createSubaccountModal = useModal('closed');

    // logic to open and close transfer modal
    const transferModalCtrl = useModal('closed');

    // state data for subaccounts
    const data: useAccountsIF = useAccounts();

    // logic to reset subaccount data to default
    // hit `Escape` twice quickly
    const lastKeyPressTime = useRef<number | null>(null);
    useEffect(() => {
        const TARGET_KEY = 'Escape';
        const INTERVAL = 300;
        const handleKeyDown = (event: KeyboardEvent): void => {
            if (event.key === TARGET_KEY) {
                const currentTime: number = new Date().getTime();
                if (
                    lastKeyPressTime.current &&
                    currentTime - lastKeyPressTime.current <= INTERVAL
                ) {
                    data.reset();
                    lastKeyPressTime.current = null;
                } else {
                    lastKeyPressTime.current = currentTime;
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    return (
        <div className={styles.subaccounts}>
            <div className={styles.subaccounts_wrapper}>
                <header>
                    <h2>Sub-Accounts</h2>
                    <div className={styles.button_container}>
                        <SimpleButton
                            bg='dark4'
                            onClick={() => transferModalCtrl.open()}
                        >
                            Transfer
                        </SimpleButton>
                        <SimpleButton
                            bg='accent1'
                            onClick={() => createSubaccountModal.open()}
                        >
                            Create Sub-Account
                        </SimpleButton>
                    </div>
                </header>
                <AccountsTable
                    title='Master Account'
                    accounts={[data.master]}
                    tabId='table_1'
                    noSort
                />
                <AccountsTable
                    title='Sub-Accounts'
                    accounts={data.sub}
                    tabId='table_2'
                />
            </div>
            {createSubaccountModal.isOpen && (
                <CreateSubaccount
                    modalControl={createSubaccountModal}
                    create={data.create}
                />
            )}
            {transferModalCtrl.isOpen && (
                <TransferModal closeModal={transferModalCtrl.close} />
            )}
        </div>
    );
}
