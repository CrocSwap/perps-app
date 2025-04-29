import AccountsTable from './AccountsTable/AccountsTable';
import styles from './subaccounts.module.css';
import { useModal, type useModalIF } from '~/hooks/useModal';
import Button from '~/components/Button/Button';
import CreateSubaccount from './CreateSubaccount/CreateSubaccount';
import { useAccounts, type useAccountsIF } from '~/stores/AccountsStore';
import { useRef, useEffect } from 'react';

export default function subaccounts() {
    // logic to open and close subaccount creation modal
    const createSubaccountModal: useModalIF = useModal('closed');

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
                if (lastKeyPressTime.current && 
                    (currentTime - lastKeyPressTime.current) <= INTERVAL
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
                    <Button
                        size='medium'
                        selected={true}
                        onClick={createSubaccountModal.open}
                    >
                        Create Sub-Account
                    </Button>
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
        </div>
    );
}
