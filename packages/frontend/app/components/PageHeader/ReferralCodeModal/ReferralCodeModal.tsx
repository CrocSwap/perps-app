import SimpleButton from '~/components/SimpleButton/SimpleButton';
import styles from './ReferralCodeModal.module.css';
import { useNavigate } from 'react-router';

interface PropsIF {
    refCode: string;
    refCodeUrl: string | null;
    handleConfirm: (rc: string) => void;
    close: () => void;
}

export default function ReferralCodeModal(props: PropsIF) {
    const { refCode, refCodeUrl, handleConfirm, close } = props;

    const refCodeToConsume: string = refCodeUrl ?? refCode;

    const navigate = useNavigate();
    return (
        <section className={styles.referral_code_modal}>
            <p>
                You have been referred by{' '}
                <span className={styles.referral_code_inline}>
                    {refCodeToConsume}
                </span>{' '}
                to Ambient Perps.
            </p>
            <p>
                Using a referral code will grant incentives to both you and the
                referrer.
            </p>
            <div className={styles.button_container}>
                <SimpleButton onClick={() => handleConfirm(refCodeToConsume)}>
                    Confirm
                </SimpleButton>
                <SimpleButton
                    bg='dark4'
                    onClick={(): void => {
                        navigate('/v2/referrals');
                        close();
                    }}
                >
                    Edit
                </SimpleButton>
            </div>
        </section>
    );
}
