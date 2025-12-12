import React, { useState, useEffect } from 'react';
import './CafeAlert.css';

// Coffee icon component
const CoffeeIcon = ({ size = 24 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M18 6H20C21.1046 6 22 6.89543 22 8V10C22 11.1046 21.1046 12 20 12H18V6Z"
            stroke="#8A4FFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M2 6H18V17C18 19.2091 16.2091 21 14 21H6C3.79086 21 2 19.2091 2 17V6Z"
            stroke="#8A4FFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M6 3V4"
            stroke="#8A4FFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M10 3V4"
            stroke="#8A4FFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M14 3V4"
            stroke="#8A4FFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

// Café bell icon component
const CafeBellIcon = ({ size = 24 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
            stroke="#8A4FFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
            stroke="#8A4FFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

// Close icon component
const CloseIcon = ({ size = 20 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M18 6L6 18"
            stroke="#8A4FFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M6 6L18 18"
            stroke="#8A4FFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const CafeAlert = ({
    title = "Special Brew Available!",
    message = "Try our new lavender latte with a hint of vanilla. Limited time offer!",
    type = "info", // 'info', 'success', 'warning', 'promo'
    duration = 0, // 0 = doesn't auto-close
    onClose,
    showIcon = true,
    isOpen = true
}) => {
    const [visible, setVisible] = useState(isOpen);
    const [fadeOut, setFadeOut] = useState(false);

    // Handle auto-closing if duration is set
    useEffect(() => {
        if (duration > 0 && visible) {
            const timer = setTimeout(() => {
                handleClose();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [duration, visible]);

    // Handle initial visibility
    useEffect(() => {
        setVisible(isOpen);
    }, [isOpen]);

    const handleClose = () => {
        setFadeOut(true);

        setTimeout(() => {
            setVisible(false);
            setFadeOut(false);
            if (onClose) onClose();
        }, 300);
    };

    // Get alert type styles
    const getTypeStyles = () => {
        switch (type) {
            case 'success':
                return {
                    borderColor: '#B19CD9',
                    accentColor: '#9F7AEA',
                    icon: '☕',
                    label: 'Coffee Success!'
                };
            case 'warning':
                return {
                    borderColor: '#D8BFD8',
                    accentColor: '#A855F7',
                    icon: '🔥',
                    label: 'Hot Alert!'
                };
            case 'promo':
                return {
                    borderColor: '#E6E6FA',
                    accentColor: '#8B5FBF',
                    icon: '🎉',
                    label: 'Cafe Special!'
                };
            default: // info
                return {
                    borderColor: '#DDA0DD',
                    accentColor: '#8A4FFF',
                    icon: '💜',
                    label: 'Cafe Notice'
                };
        }
    };

    const typeStyles = getTypeStyles();

    if (!visible) return null;

    return (
        <div className={`cafe-alert ${fadeOut ? 'fade-out' : ''}`} style={{ borderLeftColor: typeStyles.accentColor }}>
            <div className="cafe-alert-content">
                {showIcon && (
                    <div className="cafe-alert-icon">
                        <div className="coffee-icon-wrapper">
                            <CoffeeIcon size={32} />
                        </div>
                        <span className="type-icon">{typeStyles.icon}</span>
                    </div>
                )}

                <div className="cafe-alert-text">
                    <div className="cafe-alert-header">
                        <h3 className="cafe-alert-title" style={{ color: typeStyles.accentColor }}>
                            {title}
                        </h3>
                        <span className="cafe-alert-label" style={{ backgroundColor: typeStyles.accentColor }}>
                            {typeStyles.label}
                        </span>
                    </div>

                    <p className="cafe-alert-message">{message}</p>

                    <div className="cafe-alert-footer">
                        <div className="cafe-theme-details">
                            <span className="cafe-detail">
                                <CafeBellIcon size={16} />
                                <span>Freshly brewed</span>
                            </span>
                            <span className="cafe-detail">
                                <span className="coffee-bean">⚫</span>
                                <span>100% Arabica</span>
                            </span>
                        </div>

                        {type === 'promo' && (
                            <button className="cafe-promo-button" style={{ backgroundColor: typeStyles.accentColor }}>
                                Order Now
                            </button>
                        )}
                    </div>
                </div>

                <button className="cafe-alert-close" onClick={handleClose} aria-label="Close alert">
                    <CloseIcon size={20} />
                </button>
            </div>

            {/* Decorative elements */}
            <div className="cafe-alert-decoration">
                <div className="steam steam-1"></div>
                <div className="steam steam-2"></div>
                <div className="steam steam-3"></div>
            </div>
        </div>
    );
};

export default CafeAlert;