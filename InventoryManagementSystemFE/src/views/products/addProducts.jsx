// react-bootstrap
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import { useEffect, useState } from 'react';

import axios from 'axios';
import config from 'config';

// project-import
import MainCard from 'components/MainCard';

// ==============================|| ADD PRODUCT PAGE ||============================== //
import { categories } from '../../components/categories';
import SessionAlert from '../../components/SessionAlert';
import ModalCard from '../../components/ModalCard';
import LoadingSpinner from '../../routes/Spinner';

// Validation function to prevent negative numbers
const validateNonNegativeNumber = (value) => {
    if (value === '') return '';
    const num = Number(value);
    return isNaN(num) ? '' : Math.max(0, num).toString();
};

// Validation function to prevent negative or zero numbers (for prices)
const validatePositiveNumber = (value) => {
    if (value === '') return '';
    const num = Number(value);
    return isNaN(num) ? '' : Math.max(0.01, num).toString();
};

export default function AddProduct() {
    // State management
    const [selectedCategory, setSelectedCategory] = useState("");
    const [subcategories, setSubcategories] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [productVariant, setProductVariant] = useState("none");
    const [variants, setVariants] = useState([]);

    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const [modalState, setModalState] = useState(false);
    const [modalCntnt, setModalCntnt] = useState('')
    const empInfo = JSON.parse(localStorage.getItem('user'));
    const [isLoading, setIsLoading] = useState(false)
    // Form fields state
    const [formData, setFormData] = useState({
        productName: "",
        description: "",
        category: "",
        subCategory: "",
        sku: "",
        uom: "",
        stocks: "",
        purchasePrice: "",
        sellingPrice: ""
    });

    // Style constants
    const previewStyle = {
        border: "2px dashed #ced4da",
        borderRadius: "8px",
        padding: "20px",
        textAlign: "center",
        height: "250px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f8f9fa",
        marginBottom: "10px"
    };

    const imageStyle = {
        maxWidth: "100%",
        maxHeight: "100%",
        objectFit: "contain",
        borderRadius: "4px"
    };

    // Event handlers
    const handleCategoryChange = (e) => {
        const value = e.target.value;
        setSelectedCategory(value);
        setFormData(prev => ({ ...prev, category: value, subCategory: "" }));
        const found = categories.find(item => item.category === value);
        setSubcategories(found ? found.subcategories : []);
    };

    const handleSubCategoryChange = (e) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, subCategory: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && (file.type === "image/jpeg" || file.type === "image/png")) {
            setSelectedFile(file);
        } else {
            setError("Please select a JPEG or PNG image.");
            e.target.value = null;
            setSelectedFile(null);
        }
    };

    const handleVariantChange = (e) => {
        const value = e.target.value;
        setProductVariant(value);

        // Clear variants when switching to "none" or add first row for new variant type
        if (value === "none") {
            setVariants([]);
        } else if (variants.length === 0) {
            addVariantRow();
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // Apply validation for numeric fields
        let validatedValue = value;
        if (name === 'stocks') {
            validatedValue = validateNonNegativeNumber(value);
        } else if (name === 'purchasePrice' || name === 'sellingPrice') {
            validatedValue = validatePositiveNumber(value);
        }

        setFormData(prev => ({
            ...prev,
            [name]: validatedValue
        }));
    };

    // Variant management functions
    const addVariantRow = () => {
        const newVariant = {
            id: Date.now(),
            type: "",
            color: productVariant === "size-color" ? "" : undefined,
            purchasePrice: "",
            sellingPrice: "",
            stock: ""
        };
        setVariants([...variants, newVariant]);
    };

    const removeVariantRow = (id) => {
        setVariants(variants.filter(variant => variant.id !== id));
    };

    const updateVariantField = (id, field, value) => {
        let validatedValue = value;

        // Apply validation for variant fields
        if (field === 'stock') {
            validatedValue = validateNonNegativeNumber(value);
        } else if (field === 'purchasePrice' || field === 'sellingPrice') {
            validatedValue = validatePositiveNumber(value);
        }

        setVariants(variants.map(variant =>
            variant.id === id ? { ...variant, [field]: validatedValue } : variant
        ));
    };

    // Helper functions
    const getVariantPlaceholder = () => {
        const placeholders = {
            "size": "e.g., Small, Medium, Large",
            "color": "e.g., Red, Blue, Green",
            "size-color": "e.g., Small, Medium, Large"
        };
        return placeholders[productVariant] || "Enter variant type";
    };

    const getVariantColumnHeader = () => {
        const headers = {
            "size": "Size",
            "color": "Color",
            "size-color": "Size"
        };
        return headers[productVariant] || "Type";
    };

    const shouldShowMainProductFields = () => {
        return productVariant === "none" || variants.length === 0;
    };

    const validateFormData = () => {
        // Clear any existing errors first
        setError('');

        // Validate required fields are not empty
        if (!formData.productName.trim()) {
            setError("Product name is required!");
            return false;
        }
        if (!formData.description.trim()) {
            setError("Product description is required!");
            return false;
        }

        if (!formData.category) {
            setError("Product category is required!");
            return false;
        }

        if (!formData.subCategory && selectedCategory) {
            setError("Product sub-category is required!");
            return false;
        }

        if (!formData.uom) {
            setError("Unit of measurement is required!");
            return false;
        }
        if (!formData.sku.trim()) {
            setError("Product SKU is required!");
            return false;
        }

        if (!selectedFile) {
            setError("Product image is required!");
            return false;
        }





        // Validate main product fields if shown
        if (shouldShowMainProductFields()) {
            const stocks = parseInt(formData.stocks) || 0;
            const purchasePrice = parseFloat(formData.purchasePrice) || 0;
            const sellingPrice = parseFloat(formData.sellingPrice) || 0;

            if (stocks < 0) {
                setError("Stock quantity cannot be negative!");
                return false;
            }

            if (purchasePrice <= 0) {
                setError("Purchase price must be greater than 0!");
                return false;
            }

            if (sellingPrice <= 0) {
                setError("Selling price must be greater than 0!");
                return false;
            }

            // Check if selling price is greater than purchase price
            if (sellingPrice <= purchasePrice) {
                setModalState(true);
                setModalCntnt('Selling price is not greater than purchase price. Are you sure you want to continue?');
                // Return false here to prevent form submission until user confirms modal
                return false;
            }
        }

        // Validate variant fields if exist
        if (variants.length > 0) {
            for (const variant of variants) {
                const stock = parseInt(variant.stock) || 0;
                const purchasePrice = parseFloat(variant.purchasePrice) || 0;
                const sellingPrice = parseFloat(variant.sellingPrice) || 0;

                if (stock < 0) {
                    setError(`Stock quantity for variant "${variant.type || 'unnamed'}" cannot be negative!`);
                    return false;
                }

                if (purchasePrice <= 0) {
                    setError(`Purchase price for variant "${variant.type || 'unnamed'}" must be greater than 0!`);
                    return false;
                }

                if (sellingPrice <= 0) {
                    setError(`Selling price for variant "${variant.type || 'unnamed'}" must be greater than 0!`);
                    return false;
                }

                // Check for empty variant type
                if (!variant.type.trim()) {
                    setError('Variant type cannot be empty!')
                    return false;
                }

                // Check if selling price is greater than purchase price
                if (sellingPrice <= purchasePrice) {
                    setModalState(true);
                    setModalCntnt(`Selling price for variant "${variant.type}" is not greater than purchase price. Are you sure you want to continue?`);
                    // Return false here to prevent form submission until user confirms modal
                    return false;
                }
            }
        }

        return true;
    };

    const proceedWithSave = async () => {
        try {
            // Create FormData to handle file upload
            const formDataToSend = new FormData();

            // Append the file if selected
            if (selectedFile) {
                formDataToSend.append('attachment', selectedFile);
            }

            // Prepare product data
            const productData = {
                product_name: formData.productName,
                product_description: formData.description,
                product_category: formData.category,
                product_subcategory: formData.subCategory,
                product_sku: formData.sku,
                unit_of_measure: formData.uom,
                created_by: empInfo.user_name,
                variant_type: productVariant,
                variants: productVariant !== "none" ? variants.map(variant => {
                    const variantObj = {
                        type: variant.type,
                        quantity_in_stock: parseInt(variant.stock) || 0,
                        purchase_price: parseFloat(variant.purchasePrice) || 0,
                        selling_price: parseFloat(variant.sellingPrice) || 0,
                        created_by: empInfo.user_name
                    };

                    if (productVariant === "size-color") {
                        variantObj.color = variant.color || null;
                    }

                    return variantObj;
                }) : [],
                ...(shouldShowMainProductFields() && {
                    quantity_in_stock: parseInt(formData.stocks) || 0,
                    purchase_price: parseFloat(formData.purchasePrice) || 0,
                    selling_price: parseFloat(formData.sellingPrice) || 0
                })
            };

            // Append all product data as JSON string
            formDataToSend.append('productData', JSON.stringify(productData));

            console.log("Sending product data with file attachment...");

            // Make API call with FormData
            setIsLoading(true)
            const response = await axios.post(`${config.baseApi}/product/add-product`, formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            console.log("Product saved successfully:", response.data);


            // Reset form after successful save
            setFormData({
                productName: "",
                description: "",
                category: "",
                subCategory: "",
                sku: "",
                uom: "",
                stocks: "",
                purchasePrice: "",
                sellingPrice: ""
            });
            setSelectedCategory("");
            setSubcategories([]);
            setSelectedFile(null);
            setProductVariant("none");
            setVariants([]);

            // Reset file input
            const fileInput = document.querySelector('input[type="file"]');
            if (fileInput) fileInput.value = '';

            setSuccess('Product added successfully!');
            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (err) {
            console.error("Error saving product:", err);
            setError("Error saving product. Please try again.");
        }
    };

    const handleSave = async () => {
        // Validate form data before saving
        const isValid = validateFormData();

        // If validation returned false due to modal trigger, wait for modal confirmation
        if (!isValid && modalState) {
            // Don't proceed until user confirms via modal
            return;
        }

        // If validation failed for other reasons (not modal-related)
        if (!isValid) {
            return;
        }

        // If validation passed without modal, proceed directly
        proceedWithSave();
    };

    return (
        <MainCard title="Add Product">
            {isLoading &&
                <LoadingSpinner text="Fetching product details..." />
            }
            <ModalCard
                show={modalState}
                onClose={() => setModalState(false)}
                onConfirm={() => {
                    // When user confirms, close modal and proceed with save
                    setModalState(false);
                    // Call save logic directly after confirmation
                    proceedWithSave();
                }}
                message={modalCntnt}
            />

            {success && (
                <SessionAlert
                    type="success"
                    title='Successful'
                    message={success}
                    onClose={() => setSuccess('')}
                />
            )}

            {error && (
                <SessionAlert
                    type="error"
                    title='Error'
                    message={error}
                    onClose={() => setError('')}
                />

            )}

            <Row>

                <Col lg={12}>
                    <h6 className="text-muted fw-semibold mt-4 mb-2">Product Details</h6>

                    <Row className="g-4">
                        {/* LEFT COLUMN - File & Variants Section */}
                        <Col md={6}>
                            {/* Image Preview Section */}
                            <div className="mb-4">
                                <Form.Label className="fw-semibold">Selected File</Form.Label>
                                <div style={previewStyle}>
                                    {selectedFile ? (
                                        <img src={URL.createObjectURL(selectedFile)} alt="Preview" style={imageStyle} />
                                    ) : (
                                        <div className="text-muted">
                                            <i className="fas fa-image fa-3x mb-2"></i>
                                            <p>No image selected</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* File Upload */}
                            <div className="mb-4">
                                <Form.Label className="fw-semibold">Upload File</Form.Label>
                                <Form.Control type="file" accept="image/jpeg, image/png" onChange={handleFileChange} />
                                <Form.Text className="text-muted">Supported formats: JPEG, PNG</Form.Text>
                            </div>

                            {/* Variant Selection */}
                            <div className="mb-4">
                                <Form.Label className="fw-semibold">Product Variant</Form.Label>
                                <Form.Select value={productVariant} onChange={handleVariantChange}>
                                    <option value="none">None</option>
                                    <option value="size">Size</option>
                                    <option value="color">Color</option>
                                    <option value="size-color">Size & Color</option>
                                </Form.Select>
                                <Form.Text className="text-muted">Select if this product has variations</Form.Text>
                            </div>

                            {/* Variants Table - Shows only when variants exist */}
                            {productVariant !== "none" && variants.length > 0 && (
                                <div className="mb-4">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <Form.Label className="fw-semibold mb-0">Variant Details</Form.Label>
                                        <Button variant="outline-primary" size="sm" onClick={addVariantRow}>
                                            + Add Row
                                        </Button>
                                    </div>

                                    <div className="table-responsive">
                                        <Table striped bordered hover size="sm">
                                            <thead>
                                                <tr>
                                                    {/* Dynamic column header based on variant type */}
                                                    <th>{getVariantColumnHeader()}</th>

                                                    {/* Show Color column only for size-color variant */}
                                                    {productVariant === "size-color" && <th>Color</th>}

                                                    <th>Purchase Price*</th>
                                                    <th>Selling Price*</th>
                                                    <th>Stock</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {variants.map((variant) => (
                                                    <tr key={variant.id}>
                                                        <td>
                                                            <Form.Control
                                                                type="text"
                                                                placeholder={getVariantPlaceholder()}
                                                                value={variant.type}
                                                                onChange={(e) => updateVariantField(variant.id, 'type', e.target.value)}
                                                                size="sm"
                                                                required
                                                            />
                                                        </td>
                                                        {productVariant === "size-color" && (
                                                            <td>
                                                                <Form.Control
                                                                    type="text"
                                                                    placeholder="e.g., Red, Blue, Green"
                                                                    value={variant.color || ""}
                                                                    onChange={(e) => updateVariantField(variant.id, 'color', e.target.value)}
                                                                    size="sm"
                                                                />
                                                            </td>
                                                        )}
                                                        <td>
                                                            <Form.Control
                                                                type="number"
                                                                placeholder="0.00"
                                                                value={variant.purchasePrice}
                                                                onChange={(e) => updateVariantField(variant.id, 'purchasePrice', e.target.value)}
                                                                size="sm"
                                                                min="0.01"
                                                                step="0.01"
                                                                required
                                                            />
                                                        </td>
                                                        <td>
                                                            <Form.Control
                                                                type="number"
                                                                placeholder="0.00"
                                                                value={variant.sellingPrice}
                                                                onChange={(e) => updateVariantField(variant.id, 'sellingPrice', e.target.value)}
                                                                size="sm"
                                                                min="0.01"
                                                                step="0.01"
                                                                required
                                                            />
                                                        </td>
                                                        <td>
                                                            <Form.Control
                                                                type="number"
                                                                placeholder="0"
                                                                value={variant.stock}
                                                                onChange={(e) => updateVariantField(variant.id, 'stock', e.target.value)}
                                                                size="sm"
                                                                min="0"
                                                                step="1"
                                                            />
                                                        </td>
                                                        <td className="text-center">
                                                            <Button variant="outline-danger" size="sm"
                                                                onClick={() => removeVariantRow(variant.id)}>
                                                                Remove
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                        <Form.Text className="text-muted">* Prices must be greater than 0</Form.Text>
                                    </div>
                                </div>
                            )}
                        </Col>

                        {/* RIGHT COLUMN - Product Information */}
                        <Col md={6}>
                            <Row className="g-3">
                                {/* Basic Product Info */}
                                <Col md={12} className="mb-3">
                                    <Form.Label>Product Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter product name"
                                        name="productName"
                                        value={formData.productName}
                                        onChange={handleInputChange}
                                    />
                                </Col>
                                <Col md={12} className="mb-3">
                                    <Form.Label>Description</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        placeholder="Enter product description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                    />
                                </Col>

                                {/* Category Selection */}
                                <Col md={6} className="mb-3">
                                    <Form.Label>Product Category</Form.Label>
                                    <Form.Select
                                        onChange={handleCategoryChange}
                                        value={formData.category}
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map((item, idx) => (
                                            <option key={idx} value={item.category}>{item.category}</option>
                                        ))}
                                    </Form.Select>
                                </Col>
                                <Col md={6} className="mb-3">
                                    <Form.Label>Product Sub-Category</Form.Label>
                                    <Form.Select
                                        disabled={!selectedCategory}
                                        value={formData.subCategory}
                                        onChange={handleSubCategoryChange}
                                    >
                                        <option value="">Select Subcategory</option>
                                        {subcategories.map((sub, index) => (
                                            <option key={index} value={sub}>{sub}</option>
                                        ))}
                                    </Form.Select>
                                </Col>

                                {/* Product Identifiers */}
                                <Col md={6} className="mb-3">
                                    <Form.Label>Product SKU</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter SKU"
                                        name="sku"
                                        value={formData.sku}
                                        onChange={handleInputChange}
                                    />
                                </Col>
                                <Col md={6} className="mb-3">
                                    <Form.Label>Unit of Measurements</Form.Label>
                                    <Form.Select
                                        name="uom"
                                        value={formData.uom}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Select UOM</option>
                                        <option value="pcs">Pieces</option>
                                        <option value="box">Box</option>
                                        <option value="kg">Kilograms</option>
                                        <option value="liters">Liters</option>
                                    </Form.Select>
                                </Col>

                                {/* Pricing & Stock - Conditionally shown */}
                                {shouldShowMainProductFields() && (
                                    <>
                                        <Col md={6} className="mb-3">
                                            <Form.Label>Stocks</Form.Label>
                                            <Form.Control
                                                type="number"
                                                placeholder="Enter stock quantity"
                                                name="stocks"
                                                value={formData.stocks}
                                                onChange={handleInputChange}
                                                min="0"
                                                step="1"
                                            />
                                        </Col>
                                        <Col md={6} className="mb-3">
                                            <Form.Label>Purchase Price*</Form.Label>
                                            <Form.Control
                                                type="number"
                                                placeholder="Enter purchase price"
                                                name="purchasePrice"
                                                value={formData.purchasePrice}
                                                onChange={handleInputChange}
                                                min="0.01"
                                                step="0.01"
                                                required
                                            />
                                        </Col>
                                        <Col md={6} className="mb-3">
                                            <Form.Label>Selling Price*</Form.Label>
                                            <Form.Control
                                                type="number"
                                                placeholder="Enter selling price"
                                                name="sellingPrice"
                                                value={formData.sellingPrice}
                                                onChange={handleInputChange}
                                                min="0.01"
                                                step="0.01"
                                                required
                                            />
                                            <Form.Text className="text-muted">* Must be greater than 0</Form.Text>
                                        </Col>
                                    </>
                                )}
                            </Row>
                        </Col>
                    </Row>

                    {/* Save Button */}
                    <Row className="mt-4">
                        <Col className="text-end">
                            <Button variant="primary" size="lg" onClick={handleSave}>
                                Save Product
                            </Button>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </MainCard>
    );
}