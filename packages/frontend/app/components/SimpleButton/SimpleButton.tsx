import React from 'react';
import styles from './SimpleButton.module.css';

type BackgroundColor =
    | 'green'
    | 'red'
    | 'accent1'
    | 'accent2'
    | 'accent3'
    | 'accent4'
    | 'accent5'
    | 'dark1'
    | 'dark2'
    | 'dark3'
    | 'dark4'
    | 'dark5'
    | 'dark6';

export interface SimpleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    bg?: BackgroundColor;
    hoverBg?: BackgroundColor;
}

export default function SimpleButton({
    bg = 'accent1',
    hoverBg,
    className = '',
    ...props
}: SimpleButtonProps) {
    const bgClass = styles[bg];
    const hoverClass = hoverBg ? styles[`hover${capitalize(hoverBg)}`] : '';

    return (
        <button
            className={`${styles.simpleButton} ${bgClass} ${hoverClass} ${className}`}
            {...props}
        />
    );
}

function capitalize(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}
