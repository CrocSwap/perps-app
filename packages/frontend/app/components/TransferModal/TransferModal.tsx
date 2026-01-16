import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    useAccounts,
    type accountIF,
    type useAccountsIF,
} from '~/stores/AccountsStore';
import Modal from '../Modal/Modal';
import SimpleButton from '../SimpleButton/SimpleButton';
import TransferDropdown from './TransferDropdown';
import styles from './TransferModal.module.css';

interface propsIF {
    closeModal: () => void;
}

export default function TransferModal(props: propsIF) {
    const { t } = useTranslation();
    const { closeModal } = props;

    // list of active subaccounts data
    const subAccounts: useAccountsIF = useAccounts();

    // array of account name strings
    const accountNames: string[] = [subAccounts.master]
        .concat(subAccounts.sub)
        .map((subaccount: accountIF) => subaccount.name);

    // state-handler hooks for current values in modal
    // initialize on a string: that option is selected by default
    // initialize on `null`: dropdown initializes with a placeholder
    const [fromAccount, setFromAccount] = useState<string | null>(
        'Master Account',
    );
    const [toAccount, setToAccount] = useState<string | null>(null);
    const [asset, setAsset] = useState<string | null>('USDe');
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
                    <label
                        htmlFor='transfer_asset_qty_input'
                        className='sr-only'
                    >
                        {t('aria.transferAmount')}
                    </label>
                    <input
                        id='transfer_asset_qty_input'
                        type='text'
                        placeholder='Amount'
                        value={qty}
                        onChange={(e) => setQty(e.currentTarget.value)}
                        aria-describedby='transfer_available_balance'
                    />
                    <button
                        type='button'
                        onClick={() => setQty('1000')}
                        aria-label={t('aria.setMaxAmount')}
                    >
                        Max
                    </button>
                </div>
                <div className={styles.info} id='transfer_available_balance'>
                    <div>
                        <p>Available to Deposit</p>
                        <p>1,000.00</p>
                    </div>
                </div>
                <SimpleButton
                    onClick={() => {
                        if (isValid) closeModal();
                    }}
                    style={{
                        cursor: isValid ? 'pointer' : 'not-allowed',
                    }}
                    bg={isValid ? 'accent1' : 'dark2'}
                >
                    {isValid ? 'Confirm' : 'Please enter all fields'}
                </SimpleButton>
            </div>
        </Modal>
    );
}
