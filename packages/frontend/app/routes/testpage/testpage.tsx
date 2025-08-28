import { toast } from 'sonner';
import styles from './testpage.module.css';
import Notification from '~/components/Notifications/Notification';
import { useKeydown } from '~/hooks/useKeydown';
import { useRef } from 'react';

export default function testpage() {
    const toastId = useRef<number>(1);
    useKeydown('n', () => {
        toast.custom(
            (t) => (
                <Notification
                    data={{
                        toastId: toastId.current,
                        title: 'Deposit Failed',
                        message: 'Deposit Failed :(',
                        icon: 'error',
                    }}
                    dismiss={() => toast.dismiss(t)}
                />
            ),
            { duration: 2000 },
        );
        toastId.current++;
    });

    return <div className={styles.testpage}></div>;
}
