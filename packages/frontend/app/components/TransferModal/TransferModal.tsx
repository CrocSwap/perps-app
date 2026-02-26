import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    useAccounts,
    type accountIF,
    type useAccountsIF,
} from '~/stores/AccountsStore';
import type { strategyDecoratedIF } from '~/stores/AgentsStore';
import Modal from '../Modal/Modal';
import SimpleButton from '../SimpleButton/SimpleButton';
import TransferDropdown from './TransferDropdown';
import styles from './TransferModal.module.css';

interface propsIF {
    closeModal: () => void;
    agent?: strategyDecoratedIF;
}

export default function TransferModal(props: propsIF) {
    const { t } = useTranslation();
    const { closeModal, agent } = props;

    // Determine mode: agent transfer vs asset transfer
    const isAgentTransfer = !!agent;

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
        isAgentTransfer ? null : 'Master Account',
    );
    const [toAccount, setToAccount] = useState<string | null>(null);
    const [asset, setAsset] = useState<string | null>('USDe');
    const [qty, setQty] = useState<string>('');

    // placeholder text for different input types
    const ACCOUNT_DROPDOWN_INITIAL_TEXT = t('agents.transfer.selectAccount');
    const ASSET_DROPDOWN_INITIAL_TEXT = t('agents.transfer.selectAsset');

    // boolean representing whether all fields pass validation
    const isValid = useMemo<boolean>(() => {
        if (isAgentTransfer) {
            return !!(fromAccount && toAccount);
        }
        return !!(fromAccount && toAccount && asset && qty);
    }, [fromAccount, toAccount, asset, qty, isAgentTransfer]);

    return (
        <Modal
            title={
                isAgentTransfer
                    ? t('agents.transfer.agentTitle')
                    : t('agents.transfer.title')
            }
            close={closeModal}
        >
            <div className={styles.transfer_modal}>
                {isAgentTransfer && agent && (
                    <div className={styles.agent_info_section}>
                        <div className={styles.agent_info_row}>
                            <span className={styles.agent_info_label}>
                                {t('forms.name')}
                            </span>
                            <span className={styles.agent_info_value}>
                                {agent.name}
                            </span>
                        </div>
                        <div className={styles.agent_info_row}>
                            <span className={styles.agent_info_label}>
                                {t('forms.address')}
                            </span>
                            <span className={styles.agent_info_value}>
                                {agent.address}
                            </span>
                        </div>
                        <div className={styles.agent_info_row}>
                            <span className={styles.agent_info_label}>
                                {t('tradeTable.status')}
                            </span>
                            <span className={styles.agent_info_value}>
                                {agent.isPaused
                                    ? t('agents.overview.paused')
                                    : t('agents.overview.running')}
                            </span>
                        </div>
                    </div>
                )}
                <TransferDropdown
                    idForDOM='transfer_dropdown_field_from'
                    labelText={t('agents.transfer.from')}
                    active={fromAccount ?? ACCOUNT_DROPDOWN_INITIAL_TEXT}
                    options={accountNames}
                    handleChange={setFromAccount}
                />
                <TransferDropdown
                    idForDOM='transfer_dropdown_field_to'
                    labelText={t('agents.transfer.to')}
                    active={toAccount ?? ACCOUNT_DROPDOWN_INITIAL_TEXT}
                    options={accountNames}
                    handleChange={setToAccount}
                />
                {!isAgentTransfer && (
                    <>
                        <TransferDropdown
                            idForDOM='transfer_dropdown_field_asset'
                            labelText={t('agents.transfer.asset')}
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
                                placeholder={t('agents.transfer.amount')}
                                value={qty}
                                onChange={(e) => setQty(e.currentTarget.value)}
                                aria-describedby='transfer_available_balance'
                            />
                            <button
                                type='button'
                                onClick={() => setQty('1000')}
                                aria-label={t('aria.setMaxAmount')}
                            >
                                {t('common.max')}
                            </button>
                        </div>
                        <div
                            className={styles.info}
                            id='transfer_available_balance'
                        >
                            <div>
                                <p>{t('agents.transfer.available')}</p>
                                <p>1,000.00</p>
                            </div>
                        </div>
                    </>
                )}
                <SimpleButton
                    onClick={() => {
                        if (isValid) closeModal();
                    }}
                    style={{
                        cursor: isValid ? 'pointer' : 'not-allowed',
                    }}
                    bg={isValid ? 'accent1' : 'dark2'}
                >
                    {isValid
                        ? t('common.confirm')
                        : isAgentTransfer
                          ? t('agents.transfer.selectAccounts')
                          : t('agents.transfer.enterAllFields')}
                </SimpleButton>
            </div>
        </Modal>
    );
}
