// react-bootstrap
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import { useEffect, useState, useRef } from 'react';

import axios from 'axios';
import config from 'config';

// project-import
import MainCard from 'components/MainCard';
import BTN from '../../components/reactBits/BTN';
import CardX from '../../components/Card';
import { Dropdown } from 'react-bootstrap';
import ModalCard from '../../components/ModalCard';
import Spinner from '../../routes/Spinner';
import LoadingSpinner from '../../routes/Spinner';
import { categories } from '../../components/categories';
import SessionAlert from '../../components/SessionAlert';
// ==============================|| EDIT PRODUCT PAGE ||============================== //

export default function EditProduct() {
    // Get product ID from URL query parameters
    const product_id = new URLSearchParams(window.location.search).get('id');

    // State management
    const [selectedCategory, setSelectedCategory] = useState("");
    const [subcategories, setSubcategories] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [productVariant, setProductVariant] = useState("none");
    const [variants, setVariants] = useState([]);
    const [productImage, setProductImage] = useState(null);
    const [showVariantTable, setShowVariantTable] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const empInfo = JSON.parse(localStorage.getItem('user'));

    const [showConfirm, setShowConfirm] = useState(false);
    const [actionType, setActionType] = useState("");
    const [archiveState, setarchiveState] = useState(false);

    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(false);

    // Reference to store original product data for comparison
    const originalDataRef = useRef({
        formData: null,
        productVariant: null,
        variants: null,
        productImage: null
    });

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



    // Archive Checker - Checks if product is archived
    useEffect(() => {
        const fetch = async () => {
            const productResponse = await axios.get(`${config.baseApi}/product/get-product-by-id`, {
                params: { id: product_id }
            });
            const productDetails = productResponse.data;

            if (productDetails.is_active === true) {
                console.log('PRODUCT NOT ARHCIVED')
                setarchiveState(false)
            }
            if (productDetails.is_active === false) {
                setarchiveState(true)
            }
        }
        fetch()
    }, [])

    // Modal for confirmation actions (archive/unarchive/delete)
    const ConfirmModal = async () => {
        if (actionType === 'archive') {
            try {
                setIsLoading(true)
                await axios.post(`${config.baseApi}/product/archive-product`, {
                    product_id: product_id,
                    updated_by: empInfo.user_name
                });

                setSuccess("Product was successfully archived! ")
                setTimeout(() => {
                    window.location.reload();
                }, 1000);

            } catch (err) {
                console.log('Unable to update this product: ', err)
            }
        }

        if (actionType === 'unarchive') {
            try {
                setIsLoading(true)
                await axios.post(`${config.baseApi}/product/unarchive-product`, {
                    product_id: product_id,
                    updated_by: empInfo.user_name
                });

                setSuccess("Product was successfully un-archived! ");
                setTimeout(() => {
                    window.location.reload();
                }, 1000);

            } catch (err) {
                console.log('Unable to update this product: ', err)
            }
        }

        if (actionType === "delete") {
            try {
                setIsLoading(true)
                await axios.post(`${config.baseApi}/product/delete-product`, {
                    product_id: product_id,
                });

                setSuccess("Product was successfully delete! ");

                setTimeout(() => {
                    window.location.replace('/IMS/products/product-table');
                }, 1000);

            } catch (err) {
                console.log('Unable to update this product: ', err)
            }
        }

        setShowConfirm(false);
    }

    // ============ EFFECT HOOKS ============ //

    // Fetch product data on component mount
    useEffect(() => {
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

                setFormDataFromAPI(productDetails, productVariants);

            } catch (err) {
                console.log('Unable to fetch product details: ', err);
            }
        };

        if (product_id) {
            fetchProductData();
        }
    }, [product_id]);

    // ============ HELPER FUNCTIONS ============ //

    // Get placeholder text based on variant type
    const getVariantPlaceholder = () => {
        const placeholders = {
            "size": "e.g., Small, Medium, Large",
            "color": "e.g., Red, Blue, Green",
            "size-color": "e.g., Small, Medium, Large"
        };
        return placeholders[productVariant] || "Enter variant type";
    };

    // Get column header based on variant type
    const getVariantColumnHeader = () => {
        const headers = {
            "size": "Size",
            "color": "Color",
            "size-color": "Size"
        };
        return headers[productVariant] || "Type";
    };

    // Determine variant type based on variant properties
    const determineVariantType = (variant) => {
        if (variant.size && variant.color) return "size-color";
        if (variant.size) return "size";
        if (variant.color) return "color";
        return "none";
    };

    // Construct full image URL from attachment path
    const getImageUrl = (attachmentPath) => {
        if (!attachmentPath) return null;
        if (attachmentPath.startsWith('http')) {
            return attachmentPath;
        }
        return `${config.baseApi}/${attachmentPath}`;
    };

    // ============ VALIDATION FUNCTIONS ============ //

    // Validate form data before submission
    const validateForm = () => {
        const requiredFields = [
            'productName', 'description', 'category',
            'subCategory', 'sku', 'uom'
        ];

        const emptyFields = requiredFields.filter(field => !formData[field]?.trim());

        if (emptyFields.length > 0) {
            setIsLoading(false)
            setError(`Please fill up the following fields: ${emptyFields.join(', ')}`);
            return false;
        }
        if (!productImage && !selectedFile) {
            setIsLoading(false)
            setError('Please add a product image');
            return false;
        }

        // Validate SKU format
        if (formData.sku && !/^[A-Za-z0-9-_]+$/.test(formData.sku)) {
            setIsLoading(false)
            setError('SKU can only contain letters, numbers, hyphens, and underscores');
            return false;
        }

        // Validate variants if they exist
        if (productVariant !== "none" && variants.length > 0) {
            for (let variant of variants) {
                if (!variant.size && !variant.color) {
                    setIsLoading(false)
                    setError('Please fill in variant details (size or color) for all variants');
                    return false;
                }

                if (parseFloat(variant.selling_price) < parseFloat(variant.purchase_price)) {
                    setIsLoading(false)
                    setError('Selling price cannot be less than purchase price');
                    return false;
                }
            }
        } else if (productVariant === "none") {
            // Validate non-variant pricing
            if (parseFloat(formData.sellingPrice) < parseFloat(formData.purchasePrice)) {
                setIsLoading(false)
                setError('Selling price cannot be less than purchase price');
                return false;
            }
        }

        return true;
    };

    // Validate product data for negative values
    const validateProductData = (data) => {
        // Check for negative prices/quantities
        if (data.variants.length > 0) {
            const invalidVariants = data.variants.filter(variant =>
                variant.quantity_in_stock < 0 ||
                variant.purchase_price < 0 ||
                variant.selling_price < 0
            );
            if (invalidVariants.length > 0) {
                setIsLoading(false)
                setError('Prices and quantities cannot be negative');
                return false;
            }
        } else {
            if (data.quantity_in_stock < 0 || data.purchase_price < 0 || data.selling_price < 0) {
                setIsLoading(false)
                setError('Prices and quantities cannot be negative');
                return false;
            }
        }

        return true;
    };

    // ============ VARIANT MANAGEMENT ============ //

    // Add a new variant row
    const addVariantRow = () => {
        const newVariant = {
            variant_id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            size: productVariant === "size" || productVariant === "size-color" ? "" : undefined,
            color: productVariant === "color" || productVariant === "size-color" ? "" : undefined,
            purchase_price: "",
            selling_price: "",
            quantity_in_stock: ""
        };
        setVariants(prev => [...prev, newVariant]);
    };

    // Remove a variant row
    const removeVariantRow = (variant_id) => {
        if (variants.length > 1) {
            setVariants(prev => prev.filter(variant => variant.variant_id !== variant_id));
        } else {
            setIsLoading(false)
            setError('At least one variant is required');
        }
    };

    // Handle variant input changes
    const handleVariantInputChange = (variant_id, field, value) => {
        setVariants(prev =>
            prev.map(variant =>
                variant.variant_id === variant_id ? { ...variant, [field]: value } : variant
            )
        );
    };

    // ============ DATA PREPARATION FUNCTIONS ============ //

    // Prepare variant data for API submission
    const prepareVariantsData = () => {
        return variants.map(variant => ({
            variant_id: variant.variant_id,
            size: variant.size?.trim() || null,
            color: variant.color?.trim() || null,
            quantity_in_stock: Math.max(0, parseInt(variant.quantity_in_stock) || 0),
            purchase_price: Math.max(0, parseFloat(variant.purchase_price) || 0),
            selling_price: Math.max(0, parseFloat(variant.selling_price) || 0)
        }));
    };

    // Prepare non-variant data for API submission
    const prepareNonVariantData = () => {
        return {
            quantity_in_stock: Math.max(0, parseInt(formData.quantityInStock) || 0),
            purchase_price: Math.max(0, parseFloat(formData.purchasePrice) || 0),
            selling_price: Math.max(0, parseFloat(formData.sellingPrice) || 0)
        };
    };

    // ============ ERROR HANDLING ============ //

    // Handle update errors with appropriate messages
    const handleUpdateError = (error) => {
        if (error.response) {
            switch (error.response.status) {
                case 400:
                    setError('Invalid data. Please check your inputs.');
                    break;
                case 401:
                    setError('Authentication failed. Please login again.');
                    break;
                case 404:
                    setError('Product not found.');
                    break;
                case 409:
                    setError('SKU already exists. Please use a different SKU.');
                    break;
                case 413:
                    setError('File too large. Please select a smaller image.');
                    break;
                case 500:
                    setError('Server error. Please try again later.');
                    break;
                default:
                    setError('Error updating product. Please try again.');
            }
        } else if (error.request) {
            setError('Network error. Please check your connection.');
        } else {
            setError('Error updating product. Please try again.');
        }
    };

    // ============ DATA INITIALIZATION ============ //

    // Initialize form data from API response
    const setFormDataFromAPI = (productDetails, productVariants) => {
        setIsLoading(true);

        // Set main product details (common to all variants)
        const initialFormData = {
            productName: productDetails.product_name || "",
            description: productDetails.product_description || "",
            category: productDetails.product_category || "",
            subCategory: productDetails.product_subcategory || "",
            sku: productDetails.product_sku || "",
            uom: productDetails.unit_of_measure || "",
            quantityInStock: "",
            purchasePrice: "",
            sellingPrice: ""
        };

        setFormData(initialFormData);

        // Set category and subcategory
        setSelectedCategory(productDetails.product_category || "");

        // Find and set subcategories based on selected category
        if (productDetails.product_category) {
            const categoryObj = categories.find(cat => cat.category === productDetails.product_category);
            if (categoryObj) {
                setSubcategories(categoryObj.subcategories);
            }
        }

        // Get image URL
        const imageUrl = productDetails.attachment ? getImageUrl(productDetails.attachment) : null;
        setProductImage(imageUrl);

        // Handle variants based on count
        let initialVariants = [];
        let initialProductVariant = "none";

        if (productVariants.length === 1) {
            // Single variant - store in formData
            const singleVariant = productVariants[0];
            setFormData(prev => ({
                ...prev,
                quantityInStock: singleVariant.quantity_in_stock || "",
                purchasePrice: singleVariant.purchase_price || "",
                sellingPrice: singleVariant.selling_price || ""
            }));
            setShowVariantTable(false);
        } else if (productVariants.length > 1) {
            // Multiple variants - store in variants state
            initialProductVariant = determineVariantType(productVariants[0]);
            setProductVariant(initialProductVariant);
            setShowVariantTable(true);

            // Transform API variants to include IDs
            initialVariants = productVariants.map((variant, index) => ({
                ...variant,
                variant_id: variant.variant_id || `variant-${index}-${Date.now()}`
            }));

            setVariants(initialVariants);

            // Clear variant fields from formData
            setFormData(prev => ({
                ...prev,
                quantityInStock: "",
                purchasePrice: "",
                sellingPrice: ""
            }));
        }

        // Store original data for comparison
        originalDataRef.current = {
            formData: initialFormData,
            productVariant: initialProductVariant,
            variants: JSON.parse(JSON.stringify(initialVariants)), // Deep copy
            productImage: imageUrl
        };

        console.log('Original data stored:', originalDataRef.current);

        setIsLoading(false);
    };

    // ============ CHANGE DETECTION FUNCTIONS ============ //

    // Check if form data has been changed
    const hasFormDataChanged = () => {
        const currentFormData = {
            productName: formData.productName,
            description: formData.description,
            category: formData.category,
            subCategory: formData.subCategory,
            sku: formData.sku,
            uom: formData.uom,
            quantityInStock: formData.quantityInStock,
            purchasePrice: formData.purchasePrice,
            sellingPrice: formData.sellingPrice
        };

        const originalFormData = originalDataRef.current.formData;

        // Compare each field in formData
        for (let key in currentFormData) {
            if (currentFormData[key] !== originalFormData[key]) {
                console.log(`Form field changed: ${key}`, {
                    original: originalFormData[key],
                    current: currentFormData[key]
                });
                return true;
            }
        }
        return false;
    };

    // Check if variants have been changed
    const hasVariantsChanged = () => {
        const currentVariants = variants.map(v => ({
            size: v.size || null,
            color: v.color || null,
            purchase_price: v.purchase_price || "",
            selling_price: v.selling_price || "",
            quantity_in_stock: v.quantity_in_stock || ""
        }));

        const originalVariants = originalDataRef.current.variants.map(v => ({
            size: v.size || null,
            color: v.color || null,
            purchase_price: v.purchase_price || "",
            selling_price: v.selling_price || "",
            quantity_in_stock: v.quantity_in_stock || ""
        }));

        // Check if variant types are different
        if (productVariant !== originalDataRef.current.productVariant) {
            console.log('Variant type changed:', {
                original: originalDataRef.current.productVariant,
                current: productVariant
            });
            return true;
        }

        // Check if number of variants changed
        if (currentVariants.length !== originalVariants.length) {
            console.log('Number of variants changed:', {
                original: originalVariants.length,
                current: currentVariants.length
            });
            return true;
        }

        // Compare each variant
        for (let i = 0; i < currentVariants.length; i++) {
            const current = currentVariants[i];
            const original = originalVariants[i];

            for (let key in current) {
                if (current[key] !== original[key]) {
                    console.log(`Variant changed at index ${i}, field ${key}:`, {
                        original: original[key],
                        current: current[key]
                    });
                    return true;
                }
            }
        }

        return false;
    };

    // Check if image has been changed
    const hasImageChanged = () => {
        // If a new file is selected
        if (selectedFile) {
            console.log('New image file selected');
            return true;
        }

        // If image was removed (productImage is null but original had an image)
        if (!productImage && originalDataRef.current.productImage) {
            console.log('Image removed');
            return true;
        }

        return false;
    };

    // Check if anything has been changed
    const hasChanges = () => {
        const formChanged = hasFormDataChanged();
        const variantsChanged = hasVariantsChanged();
        const imageChanged = hasImageChanged();

        console.log('Change detection:', {
            formChanged,
            variantsChanged,
            imageChanged
        });

        return formChanged || variantsChanged || imageChanged;
    };

    // ============ EVENT HANDLERS ============ //

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
            category: category,
            subCategory: "" // Reset subcategory when category changes
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
        const newVariantType = e.target.value;
        setProductVariant(newVariantType);

        // Show table for any variant type except "none"
        const shouldShowTable = newVariantType !== "none";
        setShowVariantTable(shouldShowTable);

        if (newVariantType === "none") {
            // If switching to "none", clear variants and move data to formData if only one variant exists
            if (variants.length === 1) {
                const variant = variants[0];
                setFormData(prev => ({
                    ...prev,
                    quantityInStock: variant.quantity_in_stock || "",
                    purchasePrice: variant.purchase_price || "",
                    sellingPrice: variant.selling_price || ""
                }));
            }
            setVariants([]);
        } else if (variants.length === 0) {
            // Initialize with empty variant if switching from "none" or no variants
            addVariantRow();

            // Clear variant fields from formData
            setFormData(prev => ({
                ...prev,
                quantityInStock: "",
                purchasePrice: "",
                sellingPrice: ""
            }));
        }
    };

    // Handle file change
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) {
            setSelectedFile(null);
            return;
        }

        // Check file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            setIsLoading(false)
            setError("Please select a JPEG or PNG image.");
            e.target.value = null;
            setSelectedFile(null);
            return;
        }

        // Check file size (5MB limit)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            setIsLoading(false)
            setError("File size too large. Please select an image smaller than 5MB.");
            e.target.value = null;
            setSelectedFile(null);
            return;
        }

        setSelectedFile(file);
        setProductImage(URL.createObjectURL(file));
    };

    // Handle image removal
    const handleRemoveImage = () => {
        setSelectedFile(null);
        setProductImage(null);
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
    };

    // ============ MAIN UPDATE FUNCTION ============ //

    const handleUpdate = async () => {
        setIsLoading(true);
        // First check if anything has been changed
        if (!hasChanges()) {
            setIsLoading(false)
            setError("Nothing to update. No changes detected.");
            return;
        }

        // Arrays to store changes and variant IDs
        const allChanges = [];
        const variantIdsForChanges = [];
        let hasAnyChange = false;

        // Check form data changes
        const formChanged = hasFormDataChanged();
        if (formChanged) {
            hasAnyChange = true;
            const currentFormData = {
                productName: formData.productName,
                description: formData.description,
                category: formData.category,
                subCategory: formData.subCategory,
                sku: formData.sku,
                uom: formData.uom,
                quantityInStock: formData.quantityInStock,
                purchasePrice: formData.purchasePrice,
                sellingPrice: formData.sellingPrice
            };

            const originalFormData = originalDataRef.current.formData;

            for (let key in currentFormData) {
                const original = originalFormData[key];
                const current = currentFormData[key];

                if (current !== original) {
                    // Format the output nicely
                    const fieldName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    const changeText = `${fieldName}: "${original || 'empty'}" to "${current || 'empty'}"`;
                    allChanges.push(changeText);
                    console.log(changeText);
                }
            }
        }

        // Check variant type changes
        if (productVariant !== originalDataRef.current.productVariant) {
            hasAnyChange = true;
            const changeText = `Variant Type: "${originalDataRef.current.productVariant}" to "${productVariant}"`;
            allChanges.push(changeText);
            console.log(changeText);
        }

        // Check variants changes
        let variantChanges = [];
        if (hasVariantsChanged() && productVariant !== "none") {
            hasAnyChange = true;

            const currentVariants = variants.map(v => ({
                id: v.id, // Assuming variant has an ID field
                size: v.size || 'empty',
                color: v.color || 'empty',
                purchase_price: v.purchase_price || '0',
                selling_price: v.selling_price || '0',
                quantity_in_stock: v.quantity_in_stock || '0'
            }));

            const originalVariants = originalDataRef.current.variants.map(v => ({
                id: v.id,
                size: v.size || 'empty',
                color: v.color || 'empty',
                purchase_price: v.purchase_price || '0',
                selling_price: v.selling_price || '0',
                quantity_in_stock: v.quantity_in_stock || '0'
            }));

            // Variant count changes
            if (currentVariants.length !== originalVariants.length) {
                const changeText = `Variants Count: ${originalVariants.length} to ${currentVariants.length}`;
                variantChanges.push(changeText);
                console.log(changeText);
            }

            // Compare each variant
            for (let i = 0; i < Math.max(currentVariants.length, originalVariants.length); i++) {
                const current = currentVariants[i];
                const original = originalVariants[i];
                let variantSpecificChanges = [];

                if (!original && current) {
                    // New variant added
                    const variantName = current.size !== 'empty' ? current.size : current.color;
                    const changeText = `Variant ${i + 1}: ADDED "${variantName}"`;
                    variantChanges.push(changeText);
                    console.log(changeText);

                    // Note: New variants won't have an ID until saved to database
                    if (current.id) {
                        variantIdsForChanges.push(current.id);
                    }
                } else if (!current && original) {
                    // Variant removed
                    const variantName = original.size !== 'empty' ? original.size : original.color;
                    const changeText = `Variant ${i + 1}: REMOVED "${variantName}"`;
                    variantChanges.push(changeText);
                    console.log(changeText);

                    if (original.id) {
                        variantIdsForChanges.push(original.id);
                    }
                } else if (current && original) {
                    // Existing variant modified
                    if (current.id !== original.id) {
                        const variantName = current.size !== 'empty' ? current.size : current.color;
                        const changeText = `Variant ${i + 1}: ID changed from "${original.id}" to "${current.id}"`;
                        variantChanges.push(changeText);
                        console.log(changeText);
                    }

                    // Track individual field changes
                    if (current.size !== original.size) {
                        variantSpecificChanges.push(`Size: "${original.size}" to "${current.size}"`);
                    }
                    if (current.color !== original.color) {
                        variantSpecificChanges.push(`Color: "${original.color}" to "${current.color}"`);
                    }
                    if (current.purchase_price !== original.purchase_price) {
                        variantSpecificChanges.push(`Purchase Price: ${original.purchase_price} to ${current.purchase_price}`);
                    }
                    if (current.selling_price !== original.selling_price) {
                        variantSpecificChanges.push(`Selling Price: ${original.selling_price} to ${current.selling_price}`);
                    }
                    if (current.quantity_in_stock !== original.quantity_in_stock) {
                        variantSpecificChanges.push(`Stock Quantity: ${original.quantity_in_stock} to ${current.quantity_in_stock}`);
                    }

                    if (variantSpecificChanges.length > 0) {
                        const variantName = current.size !== 'empty' ? current.size : current.color;
                        const variantIndex = i + 1;
                        const changeText = `Variant ${variantIndex} (${variantName}): ${variantSpecificChanges.join(', ')}`;
                        variantChanges.push(changeText);
                        console.log(changeText);

                        // Add variant ID for tracking
                        if (current.id) {
                            variantIdsForChanges.push(current.id);
                        }
                    }
                }
            }

            // Add all variant changes to main changes array
            allChanges.push(...variantChanges);
        }

        // Check image changes
        if (hasImageChanged()) {
            hasAnyChange = true;
            let imageChangeText;
            if (selectedFile) {
                imageChangeText = `Image: "${originalDataRef.current.productImage ? 'existing' : 'none'}" to "${selectedFile.name}"`;
            } else if (!productImage && originalDataRef.current.productImage) {
                imageChangeText = 'Image: removed';
            } else {
                imageChangeText = 'Image: updated';
            }
            allChanges.push(imageChangeText);
            console.log(imageChangeText);
        }

        console.log('===================================');

        if (!validateForm()) {
            return;
        }

        try {
            setIsUploading(true);

            // Create FormData for file upload
            const formDataToSend = new FormData();

            // Append file if selected
            if (selectedFile) {
                formDataToSend.append('attachment', selectedFile);
                console.log('Selected file:', selectedFile.name);
            } else if (productImage && !hasImageChanged()) {
                // If keeping existing image, you might need to pass the image path/URL
                // This depends on your backend implementation
                console.log('Keeping existing image');
            }

            // Prepare product data - WITHOUT attachmentPath
            const productData = {
                product_id: product_id,
                product_name: formData.productName.trim(),
                product_description: formData.description.trim(),
                product_category: formData.category,
                product_subcategory: formData.subCategory,
                product_sku: formData.sku.trim(),
                unit_of_measure: formData.uom,
                variant_type: productVariant,
                variants: productVariant !== "none" ? prepareVariantsData() : [],
                ...(productVariant === "none" && prepareNonVariantData())
            };

            // Log the product data to debug
            console.log('Product data to send:', productData);

            // Final validation
            if (!validateProductData(productData)) {
                return;
            }

            console.log("Updating product...");
            formDataToSend.append('productData', JSON.stringify(productData));

            // Make API call to update product
            const response = await axios.post(`${config.baseApi}/product/update-product`, formDataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            // After successful update, log the changes
            if (response.data.success) {
                // Prepare variant IDs string - either single ID or comma-separated list
                let variantIdString = '';
                if (variantIdsForChanges.length > 0) {
                    // Remove duplicates and join with commas
                    const uniqueVariantIds = [...new Set(variantIdsForChanges)];
                    variantIdString = uniqueVariantIds.join(',');
                }

                // Create a changes summary
                const changesSummary = allChanges.join('\n');

                // Log changes to product-logs
                await axios.post(`${config.baseApi}/product/product-logs`, {
                    changes_made: changesSummary,
                    created_by: empInfo.user_name,
                    product_id: product_id,
                    variant_id: variantIdString || null, // Send null if no variant changes
                });

                // If successful 
                setSuccess("Product updated successfully!");

                // Update original data reference with current data
                originalDataRef.current = {
                    formData: { ...formData },
                    productVariant: productVariant,
                    variants: JSON.parse(JSON.stringify(variants)),
                    productImage: productImage
                };
                setSelectedFile(null);

                setTimeout(() => {
                    window.location.reload();
                }, 2000);

                console.log('Update completed with changes logged');
                console.log('Changes Summary:', changesSummary);
                console.log('Variant IDs affected:', variantIdString || 'None');
            } else {
                throw new Error(response.data.message || 'Update failed');
            }

        } catch (err) {
            console.error("Update error:", err);

            // Handle error without using attachmentPath
            if (err.response) {
                // Server responded with error
                setIsLoading(false)
                setError(`Update failed: ${err.response.data.message || err.response.statusText}`);
            } else if (err.request) {
                // Request was made but no response
                setIsLoading(false)
                setError('Update failed: No response from server. Please check your network connection.');
            } else {
                // Error in setting up request
                setIsLoading(false)
                setError(`Update failed: ${err.message}`);
            }
        } finally {
            setIsUploading(false);
        }
    };
    return (
        <MainCard
            title={
                `Edit Page ${archiveState &&
                `(archived)`} `}
            secondary={
                <Dropdown align="end">
                    <Dropdown.Toggle
                        variant="light"
                        id="dropdown-basic"
                        style={{ background: "none", border: "none", padding: 0 }}
                    >
                        <i className="ph ph-dots-three-vertical" style={{ fontSize: 22 }}></i>
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                        <Dropdown.Item
                            onClick={() => {
                                const action = archiveState ? "unarchive" : "archive";
                                setActionType(action);
                                setShowConfirm(true);
                            }}
                        >
                            {archiveState ? "Unarchive" : "Archive"}
                        </Dropdown.Item>

                        <Dropdown.Item onClick={() => {
                            setActionType("delete");
                            setShowConfirm(true);
                        }}>
                            Delete
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            }>
            {isLoading &&
                <LoadingSpinner text="Fetching product details..." />
            }

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

                    <Row className="g-4">

                        <ModalCard
                            show={showConfirm}
                            onClose={() => setShowConfirm(false)}
                            onConfirm={ConfirmModal}
                            message={`Do you want to ${actionType} this item?`}
                        />

                        <Col md={6}>
                            {/* Image Preview Section */}
                            <div className="mb-4">
                                <div className="row align-items-center mb-2">
                                    <div className="col">
                                        <Form.Label className="fw-semibold mb-0">
                                            Product Image {selectedFile && <span className="text-success">(New image selected)</span>}
                                        </Form.Label>
                                    </div>
                                </div>
                                <div style={{ ...previewStyle, position: 'relative' }}>
                                    {productImage ? (
                                        <>
                                            <img
                                                src={productImage}
                                                alt="Product preview"
                                                style={imageStyle}
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'block';
                                                }}
                                            />
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={handleRemoveImage}
                                                style={{
                                                    position: 'absolute',
                                                    top: '8px',
                                                    right: '8px',
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    padding: 0,
                                                    fontSize: '14px',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                ×
                                            </Button>
                                            <div className="text-muted" style={{ display: 'none' }}>
                                                <i className="fas fa-image fa-3x mb-2"></i>
                                                <p>Image not available</p>
                                            </div>
                                        </>
                                    ) : (
                                        // No image
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
                                <Form.Control
                                    type="file"
                                    name="attachment"
                                    accept="image/jpeg, image/png, image/jpg"
                                    onChange={handleFileChange}
                                />
                                <Form.Text className="text-muted">
                                    Supported formats: JPEG, PNG (Max: 5MB)
                                </Form.Text>
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

                            {/* Variants Table - Shows when variant type is selected */}
                            {(showVariantTable || variants.length > 0) && (
                                <div className="mb-4">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <Form.Label className="fw-semibold mb-0">
                                            Variant Details {variants.length > 0 && `(${variants.length} variants)`}
                                        </Form.Label>
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={addVariantRow}
                                        >
                                            + Add Row
                                        </Button>
                                    </div>

                                    <div className="table-responsive">
                                        <Table striped bordered hover size="sm">
                                            <thead>
                                                <tr>
                                                    <th>{getVariantColumnHeader()}</th>
                                                    {productVariant === "size-color" && <th>Color</th>}
                                                    <th>Purchase Price</th>
                                                    <th>Selling Price</th>
                                                    <th>Stock</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {variants.map((variant) => (
                                                    <tr key={variant.variant_id}>
                                                        <td>
                                                            <Form.Control
                                                                type="text"
                                                                value={variant.size || variant.color || ""}
                                                                placeholder={getVariantPlaceholder()}
                                                                onChange={(e) => handleVariantInputChange(
                                                                    variant.variant_id,
                                                                    productVariant === "color" ? "color" : "size",
                                                                    e.target.value
                                                                )}
                                                                size="sm"
                                                            />
                                                        </td>
                                                        {productVariant === "size-color" && (
                                                            <td>
                                                                <Form.Control
                                                                    type="text"
                                                                    value={variant.color || ""}
                                                                    placeholder="e.g., Red, Blue, Green"
                                                                    onChange={(e) => handleVariantInputChange(variant.variant_id, "color", e.target.value)}
                                                                    size="sm"
                                                                />
                                                            </td>
                                                        )}
                                                        <td>
                                                            <Form.Control
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={variant.purchase_price || ""}
                                                                placeholder="0.00"
                                                                onChange={(e) => handleVariantInputChange(variant.variant_id, "purchase_price", e.target.value)}
                                                                size="sm"
                                                            />
                                                        </td>
                                                        <td>
                                                            <Form.Control
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={variant.selling_price || ""}
                                                                placeholder="0.00"
                                                                onChange={(e) => handleVariantInputChange(variant.variant_id, "selling_price", e.target.value)}
                                                                size="sm"
                                                            />
                                                        </td>
                                                        <td>
                                                            <Form.Control
                                                                type="number"
                                                                min="0"
                                                                value={variant.quantity_in_stock || ""}
                                                                placeholder="0"
                                                                onChange={(e) => handleVariantInputChange(variant.variant_id, "quantity_in_stock", e.target.value)}
                                                                size="sm"
                                                            />
                                                        </td>
                                                        <td className="text-center">
                                                            <Button
                                                                variant="outline-danger"
                                                                size="sm"
                                                                onClick={() => removeVariantRow(variant.variant_id)}
                                                                disabled={variants.length <= 1}
                                                            >
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
                                {productVariant === "none" && variants.length === 0 && (
                                    <>
                                        <Col md={6} className="mb-3">
                                            <Form.Label>Stock</Form.Label>
                                            <Form.Control
                                                type="number"
                                                min="0"
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
                                                step="0.01"
                                                min="0"
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
                                                step="0.01"
                                                min="0"
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
                            <BTN
                                label={isUploading ? 'Updating...' : 'Update Product'}
                                size="lg"
                                onClick={handleUpdate}
                                disabled={isUploading}
                            />
                        </Col>
                    </Row>
                </Col>
            </Row>
        </MainCard>
    );
}