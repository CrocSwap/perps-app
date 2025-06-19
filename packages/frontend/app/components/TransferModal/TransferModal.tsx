import styles from './TransferModal.module.css';
import Modal from '../Modal/Modal';
import TransferDropdown from './TransferDropdown';
import { useMemo, useState } from 'react';
import SimpleButton from '../SimpleButton/SimpleButton';
import {
    useAccounts,
    type accountIF,
    type useAccountsIF,
} from '~/stores/AccountsStore';

interface propsIF {
    closeModal: () => void;
}

export default function TransferModal(props: propsIF) {
    const { closeModal } = props;

    // list of active subaccounts data
    const subAccounts: useAccountsIF = useAccounts();

    // array of account name strings
    const accountNames: string[] = [subAccounts.master]
        .concat(subAccounts.sub)
        .map((subaccount: accountIF) => subaccount.name);
    console.log(accountNames);

    // state-handler hooks for current values in modal
    const [fromAccount, setFromAccount] = useState<string | null>(null);
    const [toAccount, setToAccount] = useState<string | null>(null);
    const [asset, setAsset] = useState<string | null>(null);
    const [qty, setQty] = useState<string>('');

    // placeholder text for different input types
    const ACCOUNT_DROPDOWN_INITIAL_TEXT = 'Please select an account';
    const ASSET_DROPDOWN_INITIAL_TEXT = 'Please select an asset';

    // boolean representing whether all fields pass validation
    const isValid = useMemo<boolean>(() => {
        return !!(fromAccount && toAccount && asset && qty);
    }, [fromAccount, toAccount, asset, qty]);

    return (
        <Modal title='Transfer' close={closeModal}>
            <div className={styles.transfer_modal}>
                <TransferDropdown
                    idForDOM='transfer_dropdown_field_from'
                    labelText='From'
                    active={fromAccount ?? ACCOUNT_DROPDOWN_INITIAL_TEXT}
                    options={accountNames}
                    handleChange={setFromAccount}
                />
                <TransferDropdown
                    idForDOM='transfer_dropdown_field_to'
                    labelText='To'
                    active={toAccount ?? ACCOUNT_DROPDOWN_INITIAL_TEXT}
                    options={accountNames}
                    handleChange={setToAccount}
                />
                <TransferDropdown
                    idForDOM='transfer_dropdown_field_asset'
                    labelText='Asset'
                    active={asset ?? ASSET_DROPDOWN_INITIAL_TEXT}
                    options={['USDe', 'BTC']}
                    handleChange={setAsset}
                />
                <div className={styles.asset_qty_input_wrapper}>
                    <input
                        id='transfer_asset_qty_input'
                        type='text'
                        placeholder='Amount'
                        value={qty}
                        onChange={(e) => setQty(e.currentTarget.value)}
                    />
                    <div onClick={() => setQty('1000')}>Max</div>
                </div>
                <div className={styles.info}>
                    <div>
                        <p>Available to Deposit</p>
                        <p>1,000.00</p>
                    </div>
                    <div>
                        <p>Network Fee</p>
                        <p>$0.001</p>
                    </div>
                </div>
                <SimpleButton
                    onClick={() => {
                        if (isValid) closeModal();
                    }}
                    style={{ cursor: isValid ? 'cursor' : 'not-allowed' }}
                >
                    {isValid ? 'Confirm' : 'Please enter all fields'}
                </SimpleButton>
            </div>
        </Modal>
    );
}
