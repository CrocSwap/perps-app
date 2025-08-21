import { toast, Toaster } from 'sonner';
import styles from './testpage.module.css';
import Notification from '~/components/Notifications/Notification';
import { useKeydown } from '~/hooks/useKeydown';

export default function testpage() {
    useKeydown('n', () => {
        toast.custom(() => (
            <Notification
                data={{
                    slug: 514351358,
                    title: 'Deposit Failed',
                    message: 'Deposit Failed :(',
                    icon: 'error',
                    removeAfter: 10000,
                }}
                dismiss={(num: number) => console.log(num)}
            />
        ));
    });

    return (
        <div className={styles.testpage}>
            <Toaster position='bottom-right' />
        </div>
    );
}
