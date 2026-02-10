import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { IoAdd, IoClose, IoAlertCircle } from 'react-icons/io5';
import { useUserDataStore } from '~/stores/UserDataStore';
import { notificationService } from '~/services/notificationService';
import { useFormStatusStore } from '../hooks/useFormStatusStore';
import { ApplicationPendingCard } from './ApplicationPendingCard';
import styles from '../affiliates.module.css';

type HubspotValidationDetails = {
    status?: string;
    message?: string;
    errors?: Array<{
        message?: string;
        code?: string;
        context?: {
            propertyName?: string[];
        };
    }>;
    category?: string;
};

interface SocialChannel {
    id: string;
    platform: string;
    link: string;
    followers: string;
    language: string;
}

interface FormValues {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    im: string;
    imHandle: string;
    imOther: string;
    socialName: string;
    socialChannels: SocialChannel[];
    upgradeRequest: 'yes' | 'na' | '';
    recommenderName: string;
    recommenderEmail: string;
    agreementAccepted: boolean;
}

const IM_PLATFORMS = [
    'Telegram',
    'WhatsApp',
    'WeChat',
    'QQ',
    'KakaoTalk',
    'LINE',
    'Others',
];

const SOCIAL_PLATFORMS = [
    'X/Twitter',
    'Youtube',
    'Telegram',
    'Discord',
    'Facebook',
    'Instagram',
    'Tiktok',
    'Twitch',
    'Linkedin',
    'Weibo (微博)',
    'WeChat (微信)',
    'Xiaohongshu (小红书)',
    'Douyin (抖音)',
    'KakaoTalk',
    'Line',
    'VK',
    'Odnoklassniki',
    'Rutube',
    'Other',
];

const HUBSPOT_PREFIX_BY_PLATFORM: Record<string, string> = {
    'X/Twitter': 'x_twitter',
    Youtube: 'youtube',
    Telegram: 'telegram',
    Discord: 'discord',
    Facebook: 'facebook',
    Instagram: 'instagram',
    Tiktok: 'tiktok',
    Twitch: 'twitch',
    Linkedin: 'linkedin',
    'Weibo (微博)': 'weibo',
    'WeChat (微信)': 'wechat',
    'Xiaohongshu (小红书)': 'xiaohongshu',
    'Douyin (抖音)': 'douyin',
    KakaoTalk: 'kakaotalk',
    Line: 'line',
    VK: 'vk',
    Odnoklassniki: 'odnoklassniki',
    Rutube: 'rutube',
    Other: 'others',
};

function tryParseHubspotValidationDetails(
    rawDetails: unknown,
): HubspotValidationDetails | null {
    if (typeof rawDetails !== 'string') return null;
    const trimmed = rawDetails.trim();
    if (!trimmed) return null;

    try {
        return JSON.parse(trimmed) as HubspotValidationDetails;
    } catch {
        return null;
    }
}

const isValidEmail = (email: string): boolean => {
    const trimmed = email.trim();
    if (!trimmed) return false;
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed);
};

const isValidPhone = (phone: string): boolean => {
    const trimmed = phone.trim();
    if (!trimmed) return false;
    // Allow +, spaces, dashes, parentheses. Require at least 7 digits.
    if (!/^[+\d\s().-]+$/.test(trimmed)) return false;
    const digits = trimmed.replace(/\D/g, '');
    return digits.length >= 7;
};

const isValidUrl = (raw: string): boolean => {
    const trimmed = raw.trim();
    if (!trimmed) return false;
    try {
        const url = new URL(trimmed);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
};

const parseNonNegativeInt = (raw: string): number | null => {
    const normalized = raw.trim().replace(/,/g, '');
    if (!normalized) return null;
    if (!/^\d+$/.test(normalized)) return null;
    const n = Number(normalized);
    if (!Number.isFinite(n) || n < 0) return null;
    return n;
};

const LANGUAGE_OPTIONS = [
    'Afrikaans',
    'Albanian',
    'Arabic',
    'Armenian',
    'Assamese',
    'Azerbaijani',
    'Basque',
    'Belarusian',
    'Bengali',
    'Bosnian',
    'Bulgarian',
    'Burmese',
    'Catalan',
    'Chinese (Simplified)',
    'Chinese (Traditional)',
    'Croatian',
    'Czech',
    'Danish',
    'Dutch',
    'English',
    'Estonian',
    'Faroese',
    'Farsi',
    'Finnish',
    'French',
    'Galician',
    'Georgian',
    'German',
    'Greek',
    'Gujarati',
    'Haitian Creole',
    'Hausa',
    'Hebrew',
    'Hindi',
    'Hungarian',
    'Icelandic',
    'Indonesian',
    'Irish',
    'Italian',
    'Japanese',
    'Kannada',
    'Kazakh',
    'Kinyarwanda',
    'Kiswahili',
    'Konkani',
    'Korean',
    'Kurdish',
    'Kyrgyz',
    'Lao',
    'Latvian',
    'Lithuanian',
    'Macedonian',
    'Malagasy',
    'Malay',
    'Malayalam',
    'Maltese',
    'Marathi',
    'Mongolian',
    'Norwegian',
    'Norwegian Bokmal',
    'Nyanja',
    'Polish',
    'Portuguese',
    'Punjabi',
    'Romanian',
    'Russian',
    'Sanskrit',
    'Serbian',
    'Slovak',
    'Slovenian',
    'Spanish',
    'Swahili',
    'Swedish',
    'Syriac',
    'Tagalog',
    'Tamil',
    'Tatar',
    'Telugu',
    'Thai',
    'Turkish',
    'Ukrainian',
    'Urdu',
    'Uzbek',
    'Vietnamese',
    'Yoruba',
];

function makeId() {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).slice(2);
}

const initialChannel: SocialChannel = {
    id: 'initial',
    platform: '',
    link: '',
    followers: '',
    language: '',
};

export function AffiliateApplicationForm() {
    const { userAddress } = useUserDataStore();
    const { addCompletedWallet, completedWallets, _hasHydrated } =
        useFormStatusStore();

    const [values, setValues] = useState<FormValues>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        im: '',
        imHandle: '',
        imOther: '',
        socialName: '',
        socialChannels: [initialChannel],
        upgradeRequest: '',
        recommenderName: '',
        recommenderEmail: '',
        agreementAccepted: false,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [channelErrors, setChannelErrors] = useState<
        Record<string, Partial<Record<keyof SocialChannel, string>>>
    >({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [touchedChannels, setTouchedChannels] = useState<
        Record<string, Partial<Record<keyof SocialChannel, boolean>>>
    >({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const isCompleted = useMemo(() => {
        return _hasHydrated && userAddress
            ? completedWallets.includes(userAddress)
            : false;
    }, [_hasHydrated, userAddress, completedWallets]);

    const showIMOther = values.im === 'Others';

    const setField = <K extends keyof FormValues>(
        key: K,
        value: FormValues[K],
    ) => {
        setValues((prev) => ({ ...prev, [key]: value }));
        setSubmitError(null);
        setErrors((prev) => {
            if (!(key in prev)) return prev;
            const copy = { ...prev };
            delete copy[key as string];
            return copy;
        });
    };

    const touchField = (key: keyof FormValues) => {
        setTouched((prev) => ({ ...prev, [key]: true }));
    };

    const touchChannelField = (id: string, field: keyof SocialChannel) => {
        setTouchedChannels((prev) => ({
            ...prev,
            [id]: { ...(prev[id] || {}), [field]: true },
        }));
    };

    const updateChannel = (
        id: string,
        field: keyof SocialChannel,
        value: string,
    ) => {
        setValues((prev) => ({
            ...prev,
            socialChannels: prev.socialChannels.map((c) =>
                c.id === id ? { ...c, [field]: value } : c,
            ),
        }));
        setSubmitError(null);
        setChannelErrors((prev) => {
            const prevEntry = prev[id];
            if (!prevEntry || !(field in prevEntry)) return prev;
            const copy = { ...prev };
            copy[id] = { ...prevEntry };
            delete copy[id]?.[field];
            if (copy[id] && Object.keys(copy[id] as object).length === 0) {
                delete copy[id];
            }
            return copy;
        });
    };

    const addSocialChannel = () => {
        const newChannel: SocialChannel = {
            id: makeId(),
            platform: '',
            link: '',
            followers: '',
            language: '',
        };

        setValues((prev) => ({
            ...prev,
            socialChannels: [...prev.socialChannels, newChannel],
        }));
    };

    const removeSocialChannel = (id: string) => {
        setValues((prev) => ({
            ...prev,
            socialChannels: prev.socialChannels.filter((c) => c.id !== id),
        }));
        setChannelErrors((prev) => {
            const copy = { ...prev };
            delete copy[id];
            return copy;
        });
        setTouchedChannels((prev) => {
            const copy = { ...prev };
            delete copy[id];
            return copy;
        });
    };

    const getValidation = (v: FormValues) => {
        const nextErrors: Record<string, string> = {};
        const nextChannelErrors: Record<
            string,
            Partial<Record<keyof SocialChannel, string>>
        > = {};

        if (!v.firstName.trim())
            nextErrors.firstName = 'First name is required';
        if (!v.lastName.trim()) nextErrors.lastName = 'Last name is required';

        if (!v.email.trim()) nextErrors.email = 'Email is required';
        else if (!isValidEmail(v.email))
            nextErrors.email = 'Invalid email address';

        if (!v.phone.trim()) nextErrors.phone = 'Phone number is required';
        else if (!isValidPhone(v.phone))
            nextErrors.phone = 'Invalid phone number';

        if (!v.socialName.trim())
            nextErrors.socialName = 'Social name is required';

        if (!v.im) nextErrors.im = 'IM platform is required';
        if (v.im === 'Others' && !v.imOther.trim()) {
            nextErrors.imOther = 'Please specify the IM platform';
        }
        if (!v.imHandle.trim()) nextErrors.imHandle = 'IM handle is required';
        else if (/\s/.test(v.imHandle.trim())) {
            nextErrors.imHandle = 'IM handle cannot contain spaces';
        }

        if (!v.upgradeRequest)
            nextErrors.upgradeRequest = 'Please select an option';

        if (v.recommenderEmail.trim() && !isValidEmail(v.recommenderEmail)) {
            nextErrors.recommenderEmail = 'Invalid recommender email address';
        }

        if (!v.agreementAccepted) {
            nextErrors.agreementAccepted = 'You must accept the agreement';
        }

        const channels = v.socialChannels;
        if (!channels || channels.length === 0) {
            nextErrors.socialChannels =
                'Please add at least one social channel';
        } else {
            for (const channel of channels) {
                const ce: Partial<Record<keyof SocialChannel, string>> = {};
                if (!channel.platform) ce.platform = 'Platform is required';
                if (!channel.link.trim()) ce.link = 'Link is required';
                else if (!isValidUrl(channel.link))
                    ce.link = 'Invalid URL (must start with http/https)';

                if (!channel.followers.trim())
                    ce.followers = 'Followers count is required';
                else if (parseNonNegativeInt(channel.followers) === null) {
                    ce.followers = 'Followers must be a non-negative integer';
                }

                if (!channel.language) ce.language = 'Language is required';

                if (Object.keys(ce).length > 0)
                    nextChannelErrors[channel.id] = ce;
            }
        }

        return { nextErrors, nextChannelErrors };
    };

    const liveValidation = useMemo(() => getValidation(values), [values]);

    const getFieldError = (key: keyof FormValues) => {
        return (
            errors[key as string] ||
            (touched[key as string]
                ? liveValidation.nextErrors[key as string]
                : undefined)
        );
    };

    const getChannelFieldError = (id: string, field: keyof SocialChannel) => {
        const submitError = channelErrors[id]?.[field];
        const isTouched = !!touchedChannels[id]?.[field];
        const liveError = liveValidation.nextChannelErrors[id]?.[field];
        return submitError || (isTouched ? liveError : undefined);
    };

    const validate = (): boolean => {
        const { nextErrors, nextChannelErrors } = liveValidation;
        setErrors(nextErrors);
        setChannelErrors(nextChannelErrors);
        return (
            Object.keys(nextErrors).length === 0 &&
            Object.keys(nextChannelErrors).length === 0
        );
    };

    const isFormValid = useMemo(() => {
        const { nextErrors, nextChannelErrors } = liveValidation;
        return (
            Object.keys(nextErrors).length === 0 &&
            Object.keys(nextChannelErrors).length === 0
        );
    }, [liveValidation]);

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitError(null);
        if (!userAddress) {
            notificationService.addNotification(
                `affiliate-form-${Date.now()}`,
                {
                    type: 'error',
                    title: 'Wallet required',
                    message: 'Please connect your wallet before submitting.',
                },
            );
            return;
        }

        setTouched((prev) => ({
            ...prev,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            socialName: true,
            im: true,
            imOther: true,
            imHandle: true,
            upgradeRequest: true,
            recommenderEmail: true,
            agreementAccepted: true,
        }));
        setTouchedChannels((prev) => {
            const next = { ...prev };
            for (const channel of values.socialChannels) {
                next[channel.id] = {
                    ...(next[channel.id] || {}),
                    platform: true,
                    link: true,
                    followers: true,
                    language: true,
                };
            }
            return next;
        });

        if (!validate()) {
            notificationService.addNotification(
                `affiliate-form-${Date.now()}`,
                {
                    type: 'error',
                    title: 'Please fix the form',
                    message: 'Some required fields are missing or invalid.',
                },
            );
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/hubspot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: values.firstName,
                    lastName: values.lastName,
                    email: values.email,
                    phone: values.phone,
                    im:
                        values.im === 'Others'
                            ? values.imOther || ''
                            : values.im,
                    imHandle: values.imHandle,
                    socialName: values.socialName,
                    walletAddress: userAddress,
                    socialChannels: values.socialChannels,
                    upgradeRequest:
                        values.upgradeRequest === 'yes' ? 'Yes' : 'NA',
                    recommenderName: values.recommenderName || '',
                    recommenderEmail: values.recommenderEmail || '',
                    affiliateAgreement: values.agreementAccepted,
                }),
            });

            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                const detailsParsed = tryParseHubspotValidationDetails(
                    json?.details,
                );

                if (
                    json?.code === 'VALIDATION_ERROR' &&
                    detailsParsed?.errors?.length
                ) {
                    const nextErrors: Record<string, string> = {};
                    const nextChannelErrors: Record<
                        string,
                        Partial<Record<keyof SocialChannel, string>>
                    > = {};
                    let firstValidationMessage: string | null = null;

                    for (const err of detailsParsed.errors) {
                        const msg =
                            (typeof err?.message === 'string' && err.message) ||
                            (typeof detailsParsed?.message === 'string'
                                ? detailsParsed.message
                                : '') ||
                            '';
                        if (!firstValidationMessage && msg)
                            firstValidationMessage = msg;

                        const props = err?.context?.propertyName;
                        if (!Array.isArray(props) || props.length === 0) {
                            continue;
                        }

                        for (const propertyName of props) {
                            if (typeof propertyName !== 'string') continue;

                            if (propertyName === 'email') {
                                if (msg) nextErrors.email = msg;
                                continue;
                            }
                            if (propertyName === 'firstname') {
                                if (msg) nextErrors.firstName = msg;
                                continue;
                            }
                            if (propertyName === 'lastname') {
                                if (msg) nextErrors.lastName = msg;
                                continue;
                            }
                            if (propertyName === 'phone') {
                                if (msg) nextErrors.phone = msg;
                                continue;
                            }

                            if (
                                propertyName.startsWith('im___') ||
                                propertyName === 'hs_whatsapp_phone_number'
                            ) {
                                if (msg) nextErrors.imHandle = msg;
                                continue;
                            }

                            const socialMatch = propertyName.match(
                                /^(.+?)_(link|followers_subscribers|language)$/,
                            );
                            if (socialMatch) {
                                const prefix = socialMatch[1];
                                const suffix = socialMatch[2];
                                const channel = values.socialChannels.find(
                                    (c) =>
                                        HUBSPOT_PREFIX_BY_PLATFORM[
                                            c.platform
                                        ] === prefix,
                                );
                                if (channel) {
                                    const field: keyof SocialChannel =
                                        suffix === 'link'
                                            ? 'link'
                                            : suffix === 'followers_subscribers'
                                              ? 'followers'
                                              : 'language';
                                    if (msg) {
                                        nextChannelErrors[channel.id] = {
                                            ...(nextChannelErrors[channel.id] ||
                                                {}),
                                            [field]: msg,
                                        };
                                    }
                                }
                            }
                        }
                    }

                    if (
                        Object.keys(nextErrors).length > 0 ||
                        Object.keys(nextChannelErrors).length > 0
                    ) {
                        setErrors((prev) => ({ ...prev, ...nextErrors }));
                        setChannelErrors((prev) => ({
                            ...prev,
                            ...nextChannelErrors,
                        }));
                        setTouched((prev) => ({
                            ...prev,
                            ...Object.fromEntries(
                                Object.keys(nextErrors).map((k) => [k, true]),
                            ),
                        }));
                        setTouchedChannels((prev) => {
                            const next = { ...prev };
                            for (const [channelId, fields] of Object.entries(
                                nextChannelErrors,
                            )) {
                                next[channelId] = {
                                    ...(next[channelId] || {}),
                                    ...Object.fromEntries(
                                        Object.keys(fields).map((k) => [
                                            k,
                                            true,
                                        ]),
                                    ),
                                };
                            }
                            return next;
                        });
                    }

                    if (firstValidationMessage) {
                        setSubmitError(firstValidationMessage);
                        throw new Error(firstValidationMessage);
                    }
                }

                const message =
                    (typeof json?.error === 'string' && json.error) ||
                    (typeof json?.message === 'string' && json.message) ||
                    (typeof json?.details === 'string' && json.details) ||
                    'Failed to submit form';

                setSubmitError(message);
                throw new Error(message);
            }

            notificationService.addNotification(
                `affiliate-form-${Date.now()}`,
                {
                    type: 'success',
                    title: 'Application submitted',
                    message: 'Your application was submitted successfully.',
                },
            );

            addCompletedWallet(userAddress);
        } catch (err) {
            const fallbackMessage =
                err instanceof Error
                    ? err.message
                    : 'Failed to submit application. Please try again.';
            setSubmitError((prev) => prev ?? fallbackMessage);

            notificationService.addNotification(
                `affiliate-form-${Date.now()}`,
                {
                    type: 'error',
                    title: 'Submission failed',
                    message:
                        err instanceof Error
                            ? err.message
                            : 'Failed to submit application. Please try again.',
                    duration: 10000,
                },
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isCompleted) {
        return <ApplicationPendingCard />;
    }

    return (
        <form onSubmit={onSubmit} className={styles['animate-fade-in']}>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem',
                }}
            >
                <div className={styles['glass-card']}>
                    <h2
                        style={{
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            color: 'var(--aff-text-primary)',
                            marginBottom: '1rem',
                        }}
                    >
                        Contact Information
                    </h2>

                    <div className={styles['form-group']}>
                        <label className={styles['form-label']}>
                            First Name{' '}
                            <span className={styles['form-label-required']}>
                                *
                            </span>
                        </label>
                        <input
                            className={styles.input}
                            value={values.firstName}
                            onChange={(e) =>
                                setField('firstName', e.target.value)
                            }
                            onBlur={() => touchField('firstName')}
                            placeholder='Enter your first name'
                            required
                        />
                        {getFieldError('firstName') && (
                            <div className={styles['form-error']}>
                                {getFieldError('firstName')}
                            </div>
                        )}
                    </div>

                    <div className={styles['form-group']}>
                        <label className={styles['form-label']}>
                            Last Name{' '}
                            <span className={styles['form-label-required']}>
                                *
                            </span>
                        </label>
                        <input
                            className={styles.input}
                            value={values.lastName}
                            onChange={(e) =>
                                setField('lastName', e.target.value)
                            }
                            onBlur={() => touchField('lastName')}
                            placeholder='Enter your last name'
                            required
                        />
                        {getFieldError('lastName') && (
                            <div className={styles['form-error']}>
                                {getFieldError('lastName')}
                            </div>
                        )}
                    </div>

                    <div className={styles['form-group']}>
                        <label className={styles['form-label']}>
                            Email{' '}
                            <span className={styles['form-label-required']}>
                                *
                            </span>
                        </label>
                        <input
                            className={styles.input}
                            type='email'
                            value={values.email}
                            onChange={(e) => setField('email', e.target.value)}
                            onBlur={() => touchField('email')}
                            placeholder='your@email.com'
                            required
                        />
                        {getFieldError('email') && (
                            <div className={styles['form-error']}>
                                {getFieldError('email')}
                            </div>
                        )}
                    </div>

                    <div className={styles['form-group']}>
                        <label className={styles['form-label']}>
                            Phone{' '}
                            <span className={styles['form-label-required']}>
                                *
                            </span>
                        </label>
                        <input
                            className={styles.input}
                            type='tel'
                            value={values.phone}
                            onChange={(e) => setField('phone', e.target.value)}
                            onBlur={() => touchField('phone')}
                            placeholder='+1234567890'
                            required
                        />
                        {getFieldError('phone') && (
                            <div className={styles['form-error']}>
                                {getFieldError('phone')}
                            </div>
                        )}
                    </div>

                    <div className={styles['form-group']}>
                        <label className={styles['form-label']}>
                            Social Name{' '}
                            <span className={styles['form-label-required']}>
                                *
                            </span>
                        </label>
                        <input
                            className={styles.input}
                            value={values.socialName}
                            onChange={(e) =>
                                setField('socialName', e.target.value)
                            }
                            onBlur={() => touchField('socialName')}
                            placeholder='Enter your social name'
                            required
                        />
                        {getFieldError('socialName') && (
                            <div className={styles['form-error']}>
                                {getFieldError('socialName')}
                            </div>
                        )}
                    </div>

                    <div className={styles['form-group']}>
                        <label className={styles['form-label']}>
                            IM Platform{' '}
                            <span className={styles['form-label-required']}>
                                *
                            </span>
                        </label>
                        <select
                            className={styles.select}
                            value={values.im}
                            onChange={(e) => {
                                setField('im', e.target.value);
                                touchField('im');
                            }}
                            onBlur={() => touchField('im')}
                            required
                        >
                            <option value=''>Select IM platform</option>
                            {IM_PLATFORMS.map((p) => (
                                <option key={p} value={p}>
                                    {p}
                                </option>
                            ))}
                        </select>
                        {getFieldError('im') && (
                            <div className={styles['form-error']}>
                                {getFieldError('im')}
                            </div>
                        )}
                    </div>

                    {showIMOther && (
                        <div className={styles['form-group']}>
                            <label className={styles['form-label']}>
                                Other IM Platform{' '}
                                <span className={styles['form-label-required']}>
                                    *
                                </span>
                            </label>
                            <input
                                className={styles.input}
                                value={values.imOther}
                                onChange={(e) =>
                                    setField('imOther', e.target.value)
                                }
                                onBlur={() => touchField('imOther')}
                                placeholder='Enter platform name'
                                required
                            />
                            {getFieldError('imOther') && (
                                <div className={styles['form-error']}>
                                    {getFieldError('imOther')}
                                </div>
                            )}
                        </div>
                    )}

                    <div className={styles['form-group']}>
                        <label className={styles['form-label']}>
                            {values.im === 'Others' ? 'IM' : values.im || 'IM'}{' '}
                            Handle/Username{' '}
                            <span className={styles['form-label-required']}>
                                *
                            </span>
                        </label>
                        <input
                            className={styles.input}
                            value={values.imHandle}
                            onChange={(e) =>
                                setField('imHandle', e.target.value)
                            }
                            onBlur={() => touchField('imHandle')}
                            placeholder={
                                values.im === 'Telegram'
                                    ? '@username'
                                    : 'Enter your handle'
                            }
                            required
                        />
                        {getFieldError('imHandle') && (
                            <div className={styles['form-error']}>
                                {getFieldError('imHandle')}
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles['glass-card']}>
                    <div style={{ marginBottom: '1rem' }}>
                        <h2
                            style={{
                                fontSize: '1.25rem',
                                fontWeight: 700,
                                color: 'var(--aff-text-primary)',
                                marginBottom: '0.25rem',
                            }}
                        >
                            Social Channels
                        </h2>
                        <p
                            style={{
                                fontSize: '0.875rem',
                                color: 'var(--aff-text-muted)',
                            }}
                        >
                            Please share at least one active channel link,
                            follower count and language used.
                        </p>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                        }}
                    >
                        {values.socialChannels.map((channel) => {
                            return (
                                <div
                                    key={channel.id}
                                    className={styles['glass-card']}
                                    style={{ padding: '1rem' }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '0.75rem',
                                        }}
                                    >
                                        <div
                                            style={{
                                                color: 'var(--aff-text-primary)',
                                                fontWeight: 600,
                                            }}
                                        >
                                            Channel
                                        </div>
                                        {values.socialChannels.length > 1 && (
                                            <button
                                                type='button'
                                                className={
                                                    styles['modal-close']
                                                }
                                                onClick={() =>
                                                    removeSocialChannel(
                                                        channel.id,
                                                    )
                                                }
                                                aria-label='Remove channel'
                                            >
                                                <IoClose size={18} />
                                            </button>
                                        )}
                                    </div>

                                    <div className={styles['form-group']}>
                                        <label className={styles['form-label']}>
                                            Platform{' '}
                                            <span
                                                className={
                                                    styles[
                                                        'form-label-required'
                                                    ]
                                                }
                                            >
                                                *
                                            </span>
                                        </label>
                                        <select
                                            className={styles.select}
                                            value={channel.platform}
                                            onChange={(e) =>
                                                updateChannel(
                                                    channel.id,
                                                    'platform',
                                                    e.target.value,
                                                )
                                            }
                                            onBlur={() =>
                                                touchChannelField(
                                                    channel.id,
                                                    'platform',
                                                )
                                            }
                                            required
                                        >
                                            <option value=''>
                                                Select platform
                                            </option>
                                            {SOCIAL_PLATFORMS.map((p) => (
                                                <option key={p} value={p}>
                                                    {p}
                                                </option>
                                            ))}
                                        </select>
                                        {getChannelFieldError(
                                            channel.id,
                                            'platform',
                                        ) && (
                                            <div
                                                className={styles['form-error']}
                                            >
                                                {getChannelFieldError(
                                                    channel.id,
                                                    'platform',
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className={styles['form-group']}>
                                        <label className={styles['form-label']}>
                                            Link{' '}
                                            <span
                                                className={
                                                    styles[
                                                        'form-label-required'
                                                    ]
                                                }
                                            >
                                                *
                                            </span>
                                        </label>
                                        <input
                                            className={styles.input}
                                            value={channel.link}
                                            onChange={(e) =>
                                                updateChannel(
                                                    channel.id,
                                                    'link',
                                                    e.target.value,
                                                )
                                            }
                                            onBlur={() =>
                                                touchChannelField(
                                                    channel.id,
                                                    'link',
                                                )
                                            }
                                            placeholder='https://...'
                                            required
                                        />
                                        {getChannelFieldError(
                                            channel.id,
                                            'link',
                                        ) && (
                                            <div
                                                className={styles['form-error']}
                                            >
                                                {getChannelFieldError(
                                                    channel.id,
                                                    'link',
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className={styles['form-group']}>
                                        <label className={styles['form-label']}>
                                            Followers/Subscribers{' '}
                                            <span
                                                className={
                                                    styles[
                                                        'form-label-required'
                                                    ]
                                                }
                                            >
                                                *
                                            </span>
                                        </label>
                                        <input
                                            className={styles.input}
                                            value={channel.followers}
                                            onChange={(e) =>
                                                updateChannel(
                                                    channel.id,
                                                    'followers',
                                                    e.target.value,
                                                )
                                            }
                                            onBlur={() =>
                                                touchChannelField(
                                                    channel.id,
                                                    'followers',
                                                )
                                            }
                                            placeholder='0'
                                            inputMode='numeric'
                                            required
                                        />
                                        {getChannelFieldError(
                                            channel.id,
                                            'followers',
                                        ) && (
                                            <div
                                                className={styles['form-error']}
                                            >
                                                {getChannelFieldError(
                                                    channel.id,
                                                    'followers',
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className={styles['form-group']}>
                                        <label className={styles['form-label']}>
                                            Language{' '}
                                            <span
                                                className={
                                                    styles[
                                                        'form-label-required'
                                                    ]
                                                }
                                            >
                                                *
                                            </span>
                                        </label>
                                        <select
                                            className={styles.select}
                                            value={channel.language}
                                            onChange={(e) =>
                                                updateChannel(
                                                    channel.id,
                                                    'language',
                                                    e.target.value,
                                                )
                                            }
                                            onBlur={() =>
                                                touchChannelField(
                                                    channel.id,
                                                    'language',
                                                )
                                            }
                                            required
                                        >
                                            <option value=''>
                                                Select language
                                            </option>
                                            {LANGUAGE_OPTIONS.map((l) => (
                                                <option key={l} value={l}>
                                                    {l}
                                                </option>
                                            ))}
                                        </select>
                                        {getChannelFieldError(
                                            channel.id,
                                            'language',
                                        ) && (
                                            <div
                                                className={styles['form-error']}
                                            >
                                                {getChannelFieldError(
                                                    channel.id,
                                                    'language',
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {errors.socialChannels && (
                        <div
                            className={styles['form-error']}
                            style={{ marginTop: '0.75rem' }}
                        >
                            {errors.socialChannels}
                        </div>
                    )}

                    <div style={{ paddingTop: '0.75rem' }}>
                        <button
                            type='button'
                            onClick={addSocialChannel}
                            className={`${styles.btn} ${styles['btn-secondary']}`}
                        >
                            <IoAdd size={16} />
                            Add Social Channel
                        </button>
                    </div>
                </div>

                <div className={styles['glass-card']}>
                    <h2
                        style={{
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            color: 'var(--aff-text-primary)',
                            marginBottom: '1rem',
                        }}
                    >
                        Referral Upgrade Request (For Referrer to Affiliate
                        ONLY)
                        <span className={styles['form-label-required']}>
                            {' '}
                            *
                        </span>
                    </h2>

                    <p
                        style={{
                            fontSize: '0.875rem',
                            color: 'var(--aff-text-secondary)',
                            marginBottom: '0.75rem',
                        }}
                    >
                        I confirm that I meet the eligibility criteria for a
                        referral to affiliate upgrade:
                    </p>

                    <ul
                        style={{
                            marginBottom: '0.75rem',
                            paddingLeft: '1.25rem',
                            color: 'var(--aff-text-tertiary)',
                            fontSize: '0.875rem',
                        }}
                    >
                        <li>
                            I have successfully invited more than 10 users who
                            have completed their first trades.
                        </li>
                        <li>
                            The cumulative trading volume of my invitees within
                            a 30-day period exceeds $10 million.
                        </li>
                    </ul>

                    <div
                        style={{
                            display: 'flex',
                            gap: '1.5rem',
                            alignItems: 'center',
                        }}
                    >
                        <label className={styles['checkbox-container']}>
                            <input
                                type='radio'
                                name='upgradeRequest'
                                value='yes'
                                checked={values.upgradeRequest === 'yes'}
                                onChange={() => {
                                    setField('upgradeRequest', 'yes');
                                    touchField('upgradeRequest');
                                }}
                            />
                            <span
                                style={{ color: 'var(--aff-text-secondary)' }}
                            >
                                YES
                            </span>
                        </label>

                        <label className={styles['checkbox-container']}>
                            <input
                                type='radio'
                                name='upgradeRequest'
                                value='na'
                                checked={values.upgradeRequest === 'na'}
                                onChange={() => {
                                    setField('upgradeRequest', 'na');
                                    touchField('upgradeRequest');
                                }}
                            />
                            <span
                                style={{ color: 'var(--aff-text-secondary)' }}
                            >
                                NA
                            </span>
                        </label>
                    </div>

                    {getFieldError('upgradeRequest') && (
                        <div
                            className={styles['form-error']}
                            style={{ marginTop: '0.5rem' }}
                        >
                            {getFieldError('upgradeRequest')}
                        </div>
                    )}

                    <p
                        style={{
                            paddingTop: '0.75rem',
                            fontSize: '0.75rem',
                            color: 'var(--aff-text-muted)',
                            fontStyle: 'italic',
                        }}
                    >
                        Note: Eligibility will be verified based on invitee
                        activity and trading volume.
                    </p>
                </div>

                <div className={styles['glass-card']}>
                    <h2
                        style={{
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            color: 'var(--aff-text-primary)',
                            marginBottom: '1rem',
                        }}
                    >
                        Recommended By
                    </h2>

                    <div className={styles['form-group']}>
                        <label className={styles['form-label']}>
                            Recommender Name
                        </label>
                        <input
                            className={styles.input}
                            value={values.recommenderName}
                            onChange={(e) =>
                                setField('recommenderName', e.target.value)
                            }
                            placeholder="Enter recommender's name (optional)"
                        />
                    </div>

                    <div className={styles['form-group']}>
                        <label className={styles['form-label']}>
                            Recommender Email
                        </label>
                        <input
                            className={styles.input}
                            type='email'
                            value={values.recommenderEmail}
                            onChange={(e) =>
                                setField('recommenderEmail', e.target.value)
                            }
                            onBlur={() => touchField('recommenderEmail')}
                            placeholder='recommender@email.com (optional)'
                        />

                        {getFieldError('recommenderEmail') && (
                            <div
                                className={styles['form-error']}
                                style={{ marginTop: '0.5rem' }}
                            >
                                {getFieldError('recommenderEmail')}
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles['glass-card']}>
                    <h2
                        style={{
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            color: 'var(--aff-text-primary)',
                            marginBottom: '1rem',
                        }}
                    >
                        Affiliate Agreement
                        <span className={styles['form-label-required']}>
                            {' '}
                            *
                        </span>
                    </h2>

                    <label className={styles['checkbox-container']}>
                        <input
                            type='checkbox'
                            checked={values.agreementAccepted}
                            onChange={(e) => {
                                setField('agreementAccepted', e.target.checked);
                                touchField('agreementAccepted');
                            }}
                        />
                        <span
                            style={{
                                color: 'var(--aff-text-secondary)',
                                fontSize: '0.875rem',
                            }}
                        >
                            I agree to the Ambient Affiliate Agreement and
                            Privacy Policy.
                            <span className={styles['form-label-required']}>
                                {' '}
                                *
                            </span>
                        </span>
                    </label>

                    {getFieldError('agreementAccepted') && (
                        <div
                            className={styles['form-error']}
                            style={{ marginTop: '0.5rem' }}
                        >
                            {getFieldError('agreementAccepted')}
                        </div>
                    )}
                </div>

                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                    }}
                >
                    {submitError && (
                        <div
                            className={styles['submit-error']}
                            role='alert'
                            aria-live='polite'
                        >
                            <IoAlertCircle
                                size={18}
                                className={styles['submit-error-icon']}
                            />
                            <div>
                                <div className={styles['submit-error-title']}>
                                    Submission failed
                                </div>
                                <div className={styles['submit-error-message']}>
                                    {submitError}
                                </div>
                            </div>
                        </div>
                    )}
                    <button
                        type='submit'
                        disabled={isSubmitting || !isFormValid}
                        className={`${styles.btn} ${styles['btn-primary']} ${styles['btn-lg']}`}
                    >
                        {isSubmitting ? 'Submitting…' : 'Submit'}
                    </button>
                </div>
            </div>
        </form>
    );
}
