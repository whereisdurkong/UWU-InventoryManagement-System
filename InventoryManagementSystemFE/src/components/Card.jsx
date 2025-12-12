import { forwardRef } from 'react';

// react-bootstrap
import Card from 'react-bootstrap/Card';
import Stack from 'react-bootstrap/Stack';

// ==============================|| MAIN CARD ||============================== //

const CardX = forwardRef(
    (
        {
            children,
            subheader,
            footer,
            secondary,
            content = true,
            codeString,
            title,
            className,
            headerClassName,
            bodyClassName,
            footerClassName
        },
        ref
    ) => {
        return (
            <Card ref={ref} className={className}>
                {/* Header Section */}
                {/* Content */}
                {content && <Card.Body className={bodyClassName}>{children}</Card.Body>}
                {!content && children}
                {/* Footer Section for Code Highlighting */}
                {codeString && <hr />}
                {footer && <Card.Footer className={footerClassName}>{footer}</Card.Footer>}
            </Card>
        );
    }
);

export default CardX;
