import { useRef } from 'react';
import styles from './CreateSubaccount.module.css';
import Modal from '~/components/Modal/Modal';
import type { useModalIF } from '~/hooks/useModal';
import { useKeydown } from '~/hooks/useKeydown';
import {
    useNotificationStore,
    type NotificationStoreIF,
} from '~/stores/NotificationStore';

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

    // logic to dispatch a notification for sub-account creation
    const notifications: NotificationStoreIF = useNotificationStore();

    // fn to handle subaccount creation
    function createSubaccount(): void {
        if (inputRef.current) {
            const text: string = inputRef.current.value;
            if (text.length) {
                create(inputRef.current.value, 'discretionary');
                notifications.add({
                    title: 'Sub Account Created',
                    message: `Made new discretionary sub-account ${inputRef.current.value}`,
                    icon: 'check',
                });
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
                    <button onClick={modalControl.close}>Cancel</button>
                    <button onClick={createSubaccount}>Confirm</button>
                </div>
            </div>
        </Modal>
    );
}
