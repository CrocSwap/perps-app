import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuArrowLeftRight } from 'react-icons/lu';
import { useDepositService } from '~/hooks/useDepositService';
import { useWithdrawService } from '~/hooks/useWithdrawService';
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

/**
 * Set to `false` to revert to mock/offline behaviour (no real blockchain calls).
 * Balance will show 1000 and confirmation will just close the modal.
 */
const USE_REAL_TRANSFER = true;

/** Fallback balance used when USE_REAL_TRANSFER = false or session unavailable */
const MOCK_BALANCE = 1000;

interface propsIF {
    closeModal: () => void;
    /** Pre-selected agent (from row actions or detail page) */
    agent?: strategyDecoratedIF;
    /** All agents list (from the agents page header button — user picks one) */
    agents?: strategyDecoratedIF[];
}

export default function TransferModal(props: propsIF) {
    const { t } = useTranslation();
    const { closeModal, agent, agents } = props;

    const subAccounts: useAccountsIF = useAccounts();

    // general transfer: selectable accounts
    const accountNames: string[] = [subAccounts.master]
        .concat(subAccounts.sub)
        .map((a: accountIF) => a.name);

    // agent selector (only used when `agents` list is provided)
    const agentNames = agents?.map((a) => a.name) ?? [];
    const [selectedAgentName, setSelectedAgentName] = useState<string | null>(
        null,
    );
    const selectedAgent =
        agent ?? agents?.find((a) => a.name === selectedAgentName) ?? null;

    const isAgentTransfer = !!agent || !!agents;

    // direction toggle (false = Master → Agent, true = Agent → Master)
    const [isReversed, setIsReversed] = useState(false);

    // general transfer dropdowns
    const [fromAccount, setFromAccount] = useState<string | null>(
        'Master Account',
    );
    const [toAccount, setToAccount] = useState<string | null>(null);
    const [asset, setAsset] = useState<string | null>('USDe');

    // shared amount input
    const [qty, setQty] = useState<string>('');

    // Real transfer services — hooks must always be called (React rules of hooks)
    const depositSvc = useDepositService();
    const withdrawSvc = useWithdrawService();

    // Agent available balance: real or mock depending on USE_REAL_TRANSFER and direction
    const agentAvailableBalance = USE_REAL_TRANSFER
        ? isReversed
            ? (withdrawSvc.availableBalance?.decimalized ?? 0)
            : (depositSvc.balance?.decimalized ?? 0)
        : MOCK_BALANCE;

    const isTransferLoading = USE_REAL_TRANSFER
        ? isReversed
            ? withdrawSvc.isLoading
            : depositSvc.isLoading
        : false;

    const transferError = USE_REAL_TRANSFER
        ? isReversed
            ? withdrawSvc.error
            : depositSvc.error
        : null;

    // Active balance drives the slider for both agent and general transfer branches
    const activeBalance = isAgentTransfer
        ? agentAvailableBalance
        : MOCK_BALANCE;

    const sliderPct =
        Math.min(
            100,
            Math.max(0, (parseFloat(qty) / (activeBalance || 1)) * 100),
        ) || 0;

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const pct = Number(e.target.value);
        const amount = (pct / 100) * activeBalance;
        setQty(amount === 0 ? '' : String(parseFloat(amount.toFixed(2))));
    };

    const ACCOUNT_DROPDOWN_INITIAL_TEXT = t('agents.transfer.selectAccount');
    const ASSET_DROPDOWN_INITIAL_TEXT = t('agents.transfer.selectAsset');

    // derived from/to labels for agent transfer
    const masterName = subAccounts.master.name;
    const agentSubName = selectedAgent
        ? `${selectedAgent.name} Subaccount`
        : '';

    const isValid = useMemo<boolean>(() => {
        if (isAgentTransfer) {
            if (!selectedAgent) return false;
            const n = parseFloat(qty);
            return !!(qty && !isNaN(n) && n > 0);
        }
        return !!(fromAccount && toAccount && asset && qty);
    }, [isAgentTransfer, selectedAgent, qty, fromAccount, toAccount, asset]);

    const agentCtaText = isTransferLoading
        ? '...'
        : isValid
          ? isReversed
              ? t('agents.transfer.withdrawToMaster')
              : t('agents.transfer.fundAgent')
          : !selectedAgent
            ? t('agents.transfer.selectAgent')
            : t('agents.transfer.enterAmount');

    const handleConfirm = async () => {
        if (!isValid || isTransferLoading) return;
        if (USE_REAL_TRANSFER && isAgentTransfer) {
            const amount = parseFloat(qty);
            const result = isReversed
                ? await withdrawSvc.executeWithdraw(amount)
                : await depositSvc.executeDeposit(amount);
            if (result.success) closeModal();
        } else {
            closeModal();
        }
    };

    const formattedAgentBalance = agentAvailableBalance.toLocaleString(
        'en-US',
        { minimumFractionDigits: 2, maximumFractionDigits: 2 },
    );

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
                {/* Pre-selected agent info (single-agent mode only) */}
                {agent && (
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

                {isAgentTransfer ? (
                    <>
                        <div className={styles.direction_stack}>
                            {/* FROM */}
                            <div className={styles.direction_account}>
                                <span className={styles.direction_label}>
                                    {t('agents.transfer.from')}
                                </span>
                                <span className={styles.direction_value}>
                                    {isReversed && selectedAgent
                                        ? agentSubName
                                        : masterName}
                                </span>
                            </div>

                            {/* Swap — only once an agent is chosen */}
                            {selectedAgent && (
                                <button
                                    type='button'
                                    className={styles.swap_btn}
                                    onClick={() => setIsReversed((r) => !r)}
                                    aria-label='Swap transfer direction'
                                >
                                    <LuArrowLeftRight size={15} />
                                </button>
                            )}

                            {/* TO — inline agent selector until chosen */}
                            <div className={styles.direction_account}>
                                <span className={styles.direction_label}>
                                    {t('agents.transfer.to')}
                                </span>
                                {agents && !selectedAgent ? (
                                    <select
                                        className={styles.agent_inline_select}
                                        defaultValue=''
                                        onChange={(e) => {
                                            setSelectedAgentName(
                                                e.target.value || null,
                                            );
                                            setIsReversed(false);
                                            setQty('');
                                        }}
                                    >
                                        <option value=''>
                                            {t('agents.transfer.selectAgent')}
                                        </option>
                                        {agentNames.map((name) => (
                                            <option key={name} value={name}>
                                                {name} Subaccount
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <span className={styles.direction_value}>
                                        {isReversed && selectedAgent
                                            ? masterName
                                            : agentSubName}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className={styles.asset_qty_input_wrapper}>
                            <label
                                htmlFor='transfer_agent_qty_input'
                                className='sr-only'
                            >
                                {t('aria.transferAmount')}
                            </label>
                            <input
                                id='transfer_agent_qty_input'
                                type='text'
                                placeholder={t('agents.transfer.amount')}
                                value={qty}
                                onChange={(e) => setQty(e.currentTarget.value)}
                                aria-describedby='transfer_agent_balance'
                            />
                            <button
                                type='button'
                                onClick={() => setQty(String(activeBalance))}
                                aria-label={t('aria.setMaxAmount')}
                            >
                                {t('common.max')}
                            </button>
                        </div>
                        <div className={styles.slider_wrap}>
                            <input
                                type='range'
                                min={0}
                                max={100}
                                step={1}
                                value={sliderPct}
                                onChange={handleSliderChange}
                                className={styles.amount_slider}
                                style={
                                    {
                                        '--slider-pct': `${sliderPct}%`,
                                    } as React.CSSProperties
                                }
                                aria-label='Transfer amount percentage'
                            />
                            <div className={styles.slider_labels}>
                                {[0, 25, 50, 75, 100].map((pct) => (
                                    <button
                                        key={pct}
                                        type='button'
                                        onClick={() =>
                                            setQty(
                                                pct === 0
                                                    ? ''
                                                    : String(
                                                          parseFloat(
                                                              (
                                                                  (pct / 100) *
                                                                  activeBalance
                                                              ).toFixed(2),
                                                          ),
                                                      ),
                                            )
                                        }
                                        className={`${styles.slider_label_btn} ${sliderPct === pct ? styles.slider_label_active : ''}`}
                                    >
                                        {pct}%
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div
                            className={styles.info}
                            id='transfer_agent_balance'
                        >
                            <div>
                                <p>{t('agents.transfer.available')}</p>
                                <p>
                                    {isTransferLoading && !agentAvailableBalance
                                        ? '...'
                                        : formattedAgentBalance}
                                </p>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className={styles.from_to_row}>
                            <TransferDropdown
                                idForDOM='transfer_dropdown_field_from'
                                labelText={t('agents.transfer.from')}
                                active={
                                    fromAccount ?? ACCOUNT_DROPDOWN_INITIAL_TEXT
                                }
                                options={accountNames}
                                handleChange={setFromAccount}
                            />
                            <TransferDropdown
                                idForDOM='transfer_dropdown_field_to'
                                labelText={t('agents.transfer.to')}
                                active={
                                    toAccount ?? ACCOUNT_DROPDOWN_INITIAL_TEXT
                                }
                                options={accountNames}
                                handleChange={setToAccount}
                            />
                        </div>
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
                                onClick={() => setQty(String(activeBalance))}
                                aria-label={t('aria.setMaxAmount')}
                            >
                                {t('common.max')}
                            </button>
                        </div>
                        <div className={styles.slider_wrap}>
                            <input
                                type='range'
                                min={0}
                                max={100}
                                step={1}
                                value={sliderPct}
                                onChange={handleSliderChange}
                                className={styles.amount_slider}
                                style={
                                    {
                                        '--slider-pct': `${sliderPct}%`,
                                    } as React.CSSProperties
                                }
                                aria-label='Transfer amount percentage'
                            />
                            <div className={styles.slider_labels}>
                                {[0, 25, 50, 75, 100].map((pct) => (
                                    <button
                                        key={pct}
                                        type='button'
                                        onClick={() =>
                                            setQty(
                                                pct === 0
                                                    ? ''
                                                    : String(
                                                          parseFloat(
                                                              (
                                                                  (pct / 100) *
                                                                  activeBalance
                                                              ).toFixed(2),
                                                          ),
                                                      ),
                                            )
                                        }
                                        className={`${styles.slider_label_btn} ${sliderPct === pct ? styles.slider_label_active : ''}`}
                                    >
                                        {pct}%
                                    </button>
                                ))}
                            </div>
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

                {transferError && isAgentTransfer && (
                    <p
                        style={{
                            color: 'var(--negative1)',
                            fontSize: 'var(--font-size-xs)',
                        }}
                    >
                        {transferError}
                    </p>
                )}

                <SimpleButton
                    onClick={handleConfirm}
                    style={{
                        cursor:
                            isValid && !isTransferLoading
                                ? 'pointer'
                                : 'not-allowed',
                    }}
                    bg={isValid && !isTransferLoading ? 'accent1' : 'dark2'}
                >
                    {isAgentTransfer
                        ? agentCtaText
                        : isValid
                          ? t('common.confirm')
                          : t('agents.transfer.enterAllFields')}
                </SimpleButton>
            </div>
        </Modal>
    );
}
