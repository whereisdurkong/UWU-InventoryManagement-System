import React from "react";
import { Modal, Button } from "react-bootstrap";

const ModalCard = ({ show, onClose, onConfirm, title, message }) => {
    return (
        <Modal show={show} onHide={onClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>{title || "Are you sure?"}</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {message || "Do you really want to continue?"}
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>
                    Cancel
                </Button>

                <Button variant="danger" onClick={onConfirm}>
                    Yes
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalCard;
