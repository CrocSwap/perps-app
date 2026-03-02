import Modal from '~/components/Modal/Modal';
import EditCommissionSplitForm from './EditCommissionSplitForm';

interface EditCommissionSplitModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    code: string;
    currentSplit: number;
    commissionRate?: number;
}

export function EditCommissionSplitModal({
    open,
    onClose,
    onSuccess,
    code,
    currentSplit,
    commissionRate,
}: EditCommissionSplitModalProps) {
    if (!open) return null;

    return (
        <Modal title='Edit Commission Split' close={onClose} position='center'>
            <EditCommissionSplitForm
                code={code}
                currentSplit={currentSplit}
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
