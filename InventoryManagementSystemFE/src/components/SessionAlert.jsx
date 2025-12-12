import React, { useState, useEffect } from 'react';
import './SessionAlert.css';

// Success icon component
const SuccessIcon = ({ size = 24 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M22 4L12 14.01L9 11.01"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

// Error icon component
const ErrorIcon = ({ size = 24 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M15 9L9 15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M9 9L15 15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

// Warning icon component
const WarningIcon = ({ size = 24 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M12 9V13"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M12 17H12.01"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M10.29 3.86L1.82 18C1.64537 18.3024 1.55296 18.6453 1.55199 18.9945C1.55102 19.3437 1.64152 19.6871 1.81445 19.9905C1.98738 20.2939 2.23675 20.5467 2.53773 20.7239C2.83871 20.901 3.18082 20.9962 3.53 21H20.47C20.8192 20.9962 21.1613 20.901 21.4623 20.7239C21.7632 20.5467 22.0126 20.2939 22.1855 19.9905C22.3585 19.6871 22.449 19.3437 22.448 18.9945C22.447 18.6453 22.3546 18.3024 22.18 18L13.71 3.86C13.5318 3.56611 13.2807 3.32312 12.9812 3.15448C12.6817 2.98585 12.3437 2.89725 12 2.89725C11.6563 2.89725 11.3183 2.98585 11.0188 3.15448C10.7193 3.32312 10.4682 3.56611 10.29 3.86Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

// Info icon component
const InfoIcon = ({ size = 24 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M12 16V12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M12 8H12.01"
            stroke="currentColor"
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
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M6 6L18 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const SessionAlert = ({
    type = "success", // 'success', 'error', 'warning', 'info'
    title = "",
    message = "",
    duration = 5000, // Auto-dismiss after ms (0 = no auto-dismiss)
    onClose,
    showIcon = true,
    showCloseButton = true,
    isOpen = true,
    actionButton = null, // Optional action button config: { label: string, onClick: function }
    position = "top-right" // 'top-right', 'top-left', 'bottom-right', 'bottom-left', 'center'
}) => {
    const [visible, setVisible] = useState(isOpen);
    const [fadeOut, setFadeOut] = useState(false);

    // Handle auto-dismiss if duration is set
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

    // Get alert type configuration
    const getTypeConfig = () => {
        const configs = {
            success: {
                icon: <SuccessIcon size={24} />,
                title: title || "Success!",
                color: "#10B981",
                bgColor: "#ECFDF5",
                borderColor: "#A7F3D0",
                iconBgColor: "#D1FAE5"
            },
            error: {
                icon: <ErrorIcon size={24} />,
                title: title || "Error",
                color: "#EF4444",
                bgColor: "#FEF2F2",
                borderColor: "#FECACA",
                iconBgColor: "#FEE2E2"
            },
            warning: {
                icon: <WarningIcon size={24} />,
                title: title || "Warning",
                color: "#F59E0B",
                bgColor: "#FFFBEB",
                borderColor: "#FDE68A",
                iconBgColor: "#FEF3C7"
            },
            info: {
                icon: <InfoIcon size={24} />,
                title: title || "Information",
                color: "#3B82F6",
                bgColor: "#EFF6FF",
                borderColor: "#BFDBFE",
                iconBgColor: "#DBEAFE"
            }
        };

        return configs[type] || configs.success;
    };

    const typeConfig = getTypeConfig();

    // Get position classes
    const getPositionClass = () => {
        const positionClasses = {
            'top-right': 'session-alert-top-right',
            'top-left': 'session-alert-top-left',
            'bottom-right': 'session-alert-bottom-right',
            'bottom-left': 'session-alert-bottom-left',
            'center': 'session-alert-center'
        };

        return positionClasses[position] || 'session-alert-top-right';
    };

    if (!visible) return null;

    return (
        <div className={`session-alert-container ${getPositionClass()}`}>
            <div
                className={`session-alert ${fadeOut ? 'fade-out' : ''}`}
                style={{
                    backgroundColor: typeConfig.bgColor,
                    borderColor: typeConfig.borderColor
                }}
            >
                <div className="session-alert-content">
                    {showIcon && (
                        <div
                            className="session-alert-icon-container"
                            style={{ backgroundColor: typeConfig.iconBgColor }}
                        >
                            <div style={{ color: typeConfig.color }}>
                                {typeConfig.icon}
                            </div>
                        </div>
                    )}

                    <div className="session-alert-body">
                        <h4 className="session-alert-title" style={{ color: typeConfig.color }}>
                            {typeConfig.title}
                        </h4>

                        {message && (
                            <p className="session-alert-message">{message}</p>
                        )}

                        {actionButton && (
                            <button
                                className="session-alert-action-button"
                                onClick={actionButton.onClick}
                                style={{
                                    backgroundColor: typeConfig.color,
                                    borderColor: typeConfig.color
                                }}
                            >
                                {actionButton.label}
                            </button>
                        )}
                    </div>

                    {showCloseButton && (
                        <button
                            className="session-alert-close"
                            onClick={handleClose}
                            style={{ color: typeConfig.color }}
                            aria-label="Close alert"
                        >
                            <CloseIcon size={20} />
                        </button>
                    )}
                </div>

                {/* Progress bar for auto-dismiss */}
                {duration > 0 && (
                    <div
                        className="session-alert-progress"
                        style={{ backgroundColor: typeConfig.color }}
                    >
                        <div
                            className="session-alert-progress-bar"
                            style={{ backgroundColor: typeConfig.color }}
                        ></div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Additional component for displaying multiple alerts
export const SessionAlertManager = ({ alerts, setAlerts, maxAlerts = 3 }) => {
    const removeAlert = (id) => {
        setAlerts(prev => prev.filter(alert => alert.id !== id));
    };

    return (
        <div className="session-alert-manager">
            {alerts.slice(0, maxAlerts).map((alert) => (
                <SessionAlert
                    key={alert.id}
                    type={alert.type}
                    title={alert.title}
                    message={alert.message}
                    duration={alert.duration || 5000}
                    onClose={() => removeAlert(alert.id)}
                    position={alert.position || "top-right"}
                    actionButton={alert.actionButton}
                />
            ))}
        </div>
    );
};

export default SessionAlert;