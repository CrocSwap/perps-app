import { useState, useEffect } from 'react';
import { toast, Toaster } from 'sonner';
import { IoCloseCircleSharp } from 'react-icons/io5';

export default function ToasterSonner() {
    // Optimized for max 3 toasts
    const [toastCount, setToastCount] = useState(0);

    useEffect(() => {
        const observer = new MutationObserver(() => {
            const toastElements = document.querySelectorAll(
                '[data-sonner-toast]',
            );
            setToastCount(Math.min(toastElements.length, 3));
        });
        observer.observe(document.body, { childList: true, subtree: true });
        return () => observer.disconnect();
    }, []);

    return (
        <div
            style={{ position: 'fixed', bottom: 0, right: 0, padding: '16px' }}
        >
            {/* Static icon button at the bottom */}
            {toastCount > 0 && (
                <IoCloseCircleSharp
                    onClick={() => toast.dismiss()}
                    style={{
                        color: '#8b5cf6',
                        fontSize: '28px',
                        cursor: 'pointer',
                        zIndex: 10000, // Higher than Toaster's z-index
                        position: 'absolute',
                        bottom: '16px',
                        right: '16px',
                    }}
                />
            )}

            {/* Toaster moved up by 10px */}
            <div style={{ transform: 'translateY(-10px)' }}>
                <Toaster position='bottom-right' visibleToasts={3} />
            </div>
        </div>
    );
}
