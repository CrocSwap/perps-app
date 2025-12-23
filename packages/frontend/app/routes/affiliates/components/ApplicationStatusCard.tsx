import { IoCheckmarkCircle, IoCloseCircle, IoTime } from 'react-icons/io5';
import type { ApplicationStatus } from '../hooks/useFormStatusStore';
import styles from '../affiliates.module.css';

interface ApplicationStatusCardProps {
    status: ApplicationStatus;
    email?: string;
    createdAt?: string;
}

const STATUS_CONFIG = {
    pending: {
        icon: IoTime,
        title: 'Application Pending',
        message: 'Thanks for applying. Your application is pending review.',
        color: 'var(--aff-accent-yellow, #f59e0b)',
    },
    approved: {
        icon: IoCheckmarkCircle,
        title: 'Application Approved',
        message:
            'Congratulations! Your affiliate application has been approved.',
        color: 'var(--aff-accent-green, #10b981)',
    },
    rejected: {
        icon: IoCloseCircle,
        title: 'Application Not Approved',
        message:
            'Unfortunately, your application was not approved at this time. Please contact support for more information.',
        color: 'var(--aff-accent-red, #ef4444)',
    },
};

export function ApplicationStatusCard({
    status,
    email,
    createdAt,
}: ApplicationStatusCardProps) {
    if (!status) return null;

    const config = STATUS_CONFIG[status];
    const Icon = config.icon;

    const formattedDate = createdAt
        ? new Date(createdAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          })
        : null;

    return (
        <div className={styles['glass-card']}>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
                <Icon
                    size={48}
                    style={{ color: config.color, marginBottom: '1rem' }}
                />
                <h2
                    style={{
                        marginBottom: '0.75rem',
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        color: 'var(--aff-text-primary)',
                    }}
                >
                    {config.title}
                </h2>
                <p style={{ color: 'var(--aff-text-secondary)' }}>
                    {config.message}
                </p>

                {(email || formattedDate) && (
                    <div
                        style={{
                            marginTop: '1.5rem',
                            padding: '1rem',
                            background:
                                'var(--aff-bg-secondary, rgba(0,0,0,0.2))',
                            borderRadius: '0.5rem',
                            fontSize: '0.875rem',
                            color: 'var(--aff-text-tertiary)',
                        }}
                    >
                        {email && (
                            <p
                                style={{
                                    marginBottom: formattedDate ? '0.5rem' : 0,
                                }}
                            >
                                <strong>Email:</strong> {email}
                            </p>
                        )}
                        {formattedDate && (
                            <p>
                                <strong>Applied:</strong> {formattedDate}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
