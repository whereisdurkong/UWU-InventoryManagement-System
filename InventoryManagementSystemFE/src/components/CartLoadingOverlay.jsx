import Spinner from 'react-bootstrap/Spinner';
import React from 'react';

export default function CartLoadingOverlay({ text }) {
    return (
        <div
            style={{
                position: "absolute", // Changed from fixed to absolute
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(0, 0, 0, 0.63)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 9999,
                borderRadius: "inherit" // Match dropdown border radius
            }}
        >
            <div className="text-center">
                <Spinner animation="border" variant="light" />
                {text && (
                    <p className="text-light mt-2 mb-0">{text}</p>
                )}
            </div>
        </div>
    );
}