import { useRef } from 'react';
import styles from './CreateSubaccount.module.css';
import Modal from '~/components/Modal/Modal';
import type { useModalIF } from '~/hooks/useModal';
import { useKeydown } from '~/hooks/useKeydown';
import SimpleButton from '~/components/SimpleButton/SimpleButton';
import { toast } from 'sonner';
import Notification from '~/components/Notifications/Notification';

// interface for functional component props
interface propsIF {
    modalControl: useModalIF;
    create: (a: string, g: 'discretionary') => void;
}

// main react functional component
export default function CreateSubaccount(props: propsIF) {
    const { modalControl, create } = props;

    // ref to hold input field until form submission
    const inputRef = useRef<HTMLInputElement>(null);

    // string to link `<label>` and `<input>` fields
    const INPUT_ID_FOR_DOM = 'create_subaccount_input_field';

    // fn to handle subaccount creation
    function createSubaccount(): void {
        // ID to allow all notifications within the same toast
        const toastId: number = Date.now();

        if (inputRef.current) {
            const text: string = inputRef.current.value;
            if (text.length) {
                create(inputRef.current.value, 'discretionary');
                toast.custom(
                    (t) => (
                        <Notification
                            data={{
                                toastId,
                                title: 'Sub Account Created',
                                message: `Made new discretionary sub-account ${inputRef.current?.value}`,
                                icon: 'check',
                            }}
                            dismiss={() => toast.dismiss(t)}
                        />
                    ),
                    { id: toastId, duration: 60000 },
                );
            }
        }
        modalControl.close();
    }

    // trigger subaccount creation when user presses the `Enter` key
    useKeydown('Enter', createSubaccount);

    // JSX return
    return (
        <Modal title='Create Sub-Account' close={modalControl.close}>
            <div className={styles.create_sub_account_modal}>
                <div className={styles.text_entry}>
                    <label htmlFor={INPUT_ID_FOR_DOM}>Name</label>
                    <input
                        id={INPUT_ID_FOR_DOM}
                        type='text'
                        autoComplete='off'
                        placeholder='eg: My Sub-Account 1'
                        ref={inputRef}
                    />
                </div>
                <div className={styles.modal_buttons}>
                    <SimpleButton bg='dark4' onClick={modalControl.close}>
                        Cancel
                    </SimpleButton>
                    <SimpleButton bg='accent1' onClick={createSubaccount}>
                        Confirm
                    </SimpleButton>
                </div>
            </div>
        </Modal>
    );
}
