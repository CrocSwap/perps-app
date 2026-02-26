import Modal from '~/components/Modal/Modal';
import CreateReferralCodeForm from './CreateReferralCodeForm';

interface CreateReferralCodeModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    commissionRate?: number;
}

export function CreateReferralCodeModal({
    open,
    onClose,
    onSuccess,
    commissionRate,
}: CreateReferralCodeModalProps) {
    if (!open) return null;

    return (
        <Modal
            title='Create New Referral Code'
            close={onClose}
            position='center'
        >
            <CreateReferralCodeForm
                onSuccess={() => {
                    onSuccess?.();
                    onClose();
                }}
                onCancel={onClose}
                commissionRate={commissionRate}
            />
        </Modal>
    );
}
