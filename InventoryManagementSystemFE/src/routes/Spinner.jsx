import Spinner from 'react-bootstrap/Spinner';
import React from 'react';

export default function LoadingSpinner() {
    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                backgroundColor: "rgba(0, 0, 0, 0.63)", // black transparent bg
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 9999,
            }}
        >
            <Spinner animation="border" variant="light" />

        </div>
    );
}
