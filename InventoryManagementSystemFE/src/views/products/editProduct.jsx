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

// Image component with fallback
const ImageWithFallback = ({ src, alt, style, ...props }) => {
    const [imgSrc, setImgSrc] = useState(src);
    const [hasError, setHasError] = useState(false);

    const handleError = () => {
        if (!hasError) {
            setHasError(true);
            setImgSrc('/images/placeholder-image.png');
        }
    };

    if (hasError) {
        return (
            <div className="text-muted text-center">
                <i className="fas fa-image fa-3x mb-2"></i>
                <p>Image not available</p>
            </div>
        );
    }

    return (
        <img
            src={imgSrc}
            alt={alt}
            style={style}
            onError={handleError}
            {...props}
        />
    );
};

// ==============================|| EDIT PRODUCT PAGE ||============================== //

export default function EditProduct() {
    const product_id = new URLSearchParams(window.location.search).get('id');

    // State management
    const [selectedCategory, setSelectedCategory] = useState("");
    const [subcategories, setSubcategories] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [productVariant, setProductVariant] = useState("none");
    const [variants, setVariants] = useState([]); // For multiple variants
    const [productImage, setProductImage] = useState(null); // Add this line
    // Form fields state
    const [formData, setFormData] = useState({
        productName: "",
        description: "",
        category: "",
        subCategory: "",
        sku: "",
        uom: "",
        quantityInStock: "",
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

    // Categories data
    const categories = [
        { category: "Electronics", subcategories: ["Laptops", "Desktops", "Printers", "Monitors", "Mobile Phones", "Accessories"] },
        { category: "Office Supplies", subcategories: ["Paper Products", "Writing Instruments", "Desk Accessories", "Binders & Folders", "Printer Ink & Toner"] },
        { category: "Furniture", subcategories: ["Chairs", "Tables", "Cabinets", "Shelving", "Workstations"] },
        { category: "Appliances", subcategories: ["Small Appliances", "Large Appliances", "Air-conditioning", "Kitchen Equipment"] },
        { category: "Tools & Hardware", subcategories: ["Hand Tools", "Power Tools", "Fasteners", "Construction Materials", "Safety Equipment"] },
        { category: "Cleaning Supplies", subcategories: ["Chemicals", "Mops & Brooms", "Towels", "Disinfectants", "Trash Bags"] },
        { category: "Food & Beverages", subcategories: ["Canned Goods", "Dry Goods", "Snacks", "Drinks", "Frozen Items"] },
        { category: "Clothing & Apparel", subcategories: ["Shirts", "Pants", "Uniforms", "Shoes", "Accessories"] },
        { category: "Automotive", subcategories: ["Car Parts", "Motorcycle Parts", "Oils & Fluids", "Accessories", "Batteries"] },
        { category: "Medical Supplies", subcategories: ["First Aid", "Medicines", "Consumables", "Equipment", "PPE"] }
    ];

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

    // Helper function to determine variant type
    const determineVariantType = (variant) => {
        if (variant.size && variant.color) return "size-color";
        if (variant.size) return "size";
        if (variant.color) return "color";
        return "none";
    };

    const setFormDataFromAPI = (productDetails, productVariants) => {
        // Set main product details (common to all variants)
        setFormData({
            productName: productDetails.product_name || "",
            description: productDetails.product_description || "",
            category: productDetails.product_category || "",
            subCategory: productDetails.product_subcategory || "",
            sku: productDetails.product_sku || "",
            uom: productDetails.unit_of_measure || "",
            // Don't store variant-specific data here initially
            quantityInStock: "",
            purchasePrice: "",
            sellingPrice: ""
        });

        // Set category and subcategory
        setSelectedCategory(productDetails.category || "");

        // Find and set subcategories based on selected category
        if (productDetails.category) {
            const categoryObj = categories.find(cat => cat.category === productDetails.category);
            if (categoryObj) {
                setSubcategories(categoryObj.subcategories);
            }
        }
        if (productDetails.attachment) {
            setProductImage(getImageUrl(productDetails.attachment));
        }

        // Handle variants based on count
        if (productVariants.length === 1) {
            // Single variant - store in formData
            const singleVariant = productVariants[0];
            setFormData(prev => ({
                ...prev,
                quantityInStock: singleVariant.quantity_in_stock || "",
                purchasePrice: singleVariant.purchase_price || "",
                sellingPrice: singleVariant.selling_price || ""
            }));
            setProductVariant("none");
            setVariants([]); // Clear variants state since we're using formData
        } else if (productVariants.length > 1) {
            // Multiple variants - store in variants state
            const variantType = determineVariantType(productVariants[0]);
            setProductVariant(variantType);
            setVariants(productVariants);

            // Clear variant fields from formData
            setFormData(prev => ({
                ...prev,
                quantityInStock: "",
                purchasePrice: "",
                sellingPrice: ""
            }));
        }
    };

    // Fetch product data and variants
    useEffect(() => {
        console.log(formData)
        const fetchProductData = async () => {
            try {
                // Fetch main product details
                const productResponse = await axios.get(`${config.baseApi}/product/get-product-by-id`, {
                    params: { id: product_id }
                });
                const productDetails = productResponse.data;

                // Fetch product variants
                const variantsResponse = await axios.get(`${config.baseApi}/product/get-all-product-variants`);
                const allVariants = variantsResponse.data;
                const productVariants = allVariants.filter(variant => variant.product_id === product_id);

                console.log('PRODUCT DETAILS: ', productDetails);
                console.log('PRODUCT VARIANT DETAILS: ', productVariants);

                setFormDataFromAPI(productDetails, productVariants)

                if (productVariants.length === 1) {
                    console.log('THIS PRODUCT HAS NO VARIANT');
                    // If only 1 variant, show input fields
                } else if (productVariants.length > 1) {
                    console.log('THIS PRODUCT HAS VARIANTS')
                    // If more than 1 variant, show table
                }

            } catch (err) {
                console.log('Unable to fetch product details: ', err);
            }
        };

        if (product_id) {
            fetchProductData();
        }
    }, [product_id]);

    // Add this useEffect to track formData changes
    useEffect(() => {
        console.log('Form Data Updated:', formData);
        console.log('Variants Updated:', variants);
        console.log('Product Variant Type:', productVariant);
    }, [formData, variants, productVariant]);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle category change
    const handleCategoryChange = (e) => {
        const category = e.target.value;
        setSelectedCategory(category);
        setFormData(prev => ({
            ...prev,
            category: category
        }));

        // Find and set subcategories
        const categoryObj = categories.find(cat => cat.category === category);
        if (categoryObj) {
            setSubcategories(categoryObj.subcategories);
        } else {
            setSubcategories([]);
        }
    };

    // Handle variant type change
    const handleVariantChange = (e) => {
        setProductVariant(e.target.value);
    };

    const getImageUrl = (attachmentPath) => {
        if (!attachmentPath) return "https://via.placeholder.com/400x400";
        if (attachmentPath.startsWith('http')) {
            return attachmentPath;
        }
        return `${config.baseApi}/${attachmentPath}`;
    };

    return (
        <MainCard title="Edit Product">
            <Row>
                <Col lg={12}>
                    <h6 className="text-muted fw-semibold mt-4 mb-2">Product Details</h6>

                    <Row className="g-4">
                        {/* LEFT COLUMN - File & Variants Section */}
                        <Col md={6}>
                            {/* Image Preview Section */}
                            <div className="mb-4">
                                <Form.Label className="fw-semibold">Product Image</Form.Label>
                                <div style={previewStyle}>
                                    {productImage ? (
                                        <ImageWithFallback
                                            src={productImage}
                                            alt="Product preview"
                                            style={imageStyle}
                                        />
                                    ) : (
                                        <div className="text-muted">
                                            <i className="fas fa-image fa-3x mb-2"></i>
                                            <p>No image available</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* File Upload */}
                            <div className="mb-4">
                                <Form.Label className="fw-semibold">Upload New Image</Form.Label>
                                <Form.Control type="file" accept="image/jpeg, image/png" />
                                <Form.Text className="text-muted">Supported formats: JPEG, PNG</Form.Text>
                            </div>

                            {/* Variant Selection */}
                            <div className="mb-4">
                                <Form.Label className="fw-semibold">Product Variant</Form.Label>
                                <Form.Select
                                    value={productVariant}
                                    onChange={handleVariantChange}
                                >
                                    <option value="none">None</option>
                                    <option value="size">Size</option>
                                    <option value="color">Color</option>
                                    <option value="size-color">Size & Color</option>
                                </Form.Select>
                                <Form.Text className="text-muted">Select if this product has variations</Form.Text>
                            </div>

                            {/* Variants Table - Shows only when variants exist */}
                            {variants.length > 0 && (
                                <div className="mb-4">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <Form.Label className="fw-semibold mb-0">Variant Details ({variants.length} variants)</Form.Label>
                                        <Button variant="outline-primary" size="sm">
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

                                                    <th>Purchase Price</th>
                                                    <th>Selling Price</th>
                                                    <th>Stock</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {variants.map((variant, index) => (
                                                    <tr key={index}>
                                                        <td>
                                                            <Form.Control
                                                                type="text"
                                                                value={variant.size || variant.color || ""}
                                                                placeholder={getVariantPlaceholder()}
                                                                size="sm"
                                                                readOnly
                                                            />
                                                        </td>
                                                        {productVariant === "size-color" && (
                                                            <td>
                                                                <Form.Control
                                                                    type="text"
                                                                    value={variant.color || ""}
                                                                    placeholder="e.g., Red, Blue, Green"
                                                                    size="sm"
                                                                    readOnly
                                                                />
                                                            </td>
                                                        )}
                                                        <td>
                                                            <Form.Control
                                                                type="number"
                                                                value={variant.purchase_price || ""}
                                                                placeholder="0.00"
                                                                size="sm"
                                                            />
                                                        </td>
                                                        <td>
                                                            <Form.Control
                                                                type="number"
                                                                value={variant.selling_price || ""}
                                                                placeholder="0.00"
                                                                size="sm"
                                                            />
                                                        </td>
                                                        <td>
                                                            <Form.Control
                                                                type="number"
                                                                value={variant.quantity_in_stock || ""}
                                                                placeholder="0"
                                                                size="sm"
                                                            />
                                                        </td>
                                                        <td className="text-center">
                                                            <Button variant="outline-danger" size="sm">
                                                                Remove
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
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
                                        value={formData.category}
                                        onChange={handleCategoryChange}
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
                                        name="subCategory"
                                        value={formData.subCategory}
                                        onChange={handleInputChange}
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

                                {/* Pricing & Stock - Show input fields only when no variants exist */}
                                {variants.length === 0 && (
                                    <>
                                        <Col md={6} className="mb-3">
                                            <Form.Label>Stock</Form.Label>
                                            <Form.Control
                                                type="number"
                                                placeholder="Enter stock quantity"
                                                name="quantityInStock"
                                                value={formData.quantityInStock}
                                                onChange={handleInputChange}
                                            />
                                        </Col>
                                        <Col md={6} className="mb-3">
                                            <Form.Label>Purchase Price</Form.Label>
                                            <Form.Control
                                                type="number"
                                                placeholder="Enter purchase price"
                                                name="purchasePrice"
                                                value={formData.purchasePrice}
                                                onChange={handleInputChange}
                                            />
                                        </Col>
                                        <Col md={6} className="mb-3">
                                            <Form.Label>Selling Price</Form.Label>
                                            <Form.Control
                                                type="number"
                                                placeholder="Enter selling price"
                                                name="sellingPrice"
                                                value={formData.sellingPrice}
                                                onChange={handleInputChange}
                                            />
                                        </Col>
                                    </>
                                )}

                            </Row>
                        </Col>
                    </Row>

                    {/* Save Button */}
                    <Row className="mt-4">
                        <Col className="text-end">
                            <Button variant="primary" size="lg">
                                Update Product
                            </Button>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </MainCard>
    );
}