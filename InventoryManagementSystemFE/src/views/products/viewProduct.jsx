import { useEffect, useState } from "react";
import axios from 'axios';
import config from 'config';
import BTN from "../../components/reactBits/BTN";
import { useNavigate } from 'react-router';

export default function ViewProduct() {
    const empInfo = JSON.parse(localStorage.getItem('user'));
    const navigate = useNavigate()
    const [productData, setProductData] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [variants, setVariants] = useState([]);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [hasSizeVariant, setHasSizeVariant] = useState(false);
    const [hasBothVariant, setHasBothVariant] = useState(false);
    const [hasColorVariant, setHasColorVariant] = useState(false);
    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);

    // New state for editing
    const [isEditing, setIsEditing] = useState(false);
    const [editedData, setEditedData] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    // State for variant editing
    const [editingVariants, setEditingVariants] = useState([]);
    const [isEditingVariants, setIsEditingVariants] = useState(false);
    const [isSavingVariants, setIsSavingVariants] = useState(false);

    const product_id = new URLSearchParams(window.location.search).get('id');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${config.baseApi}/product/get-product-by-id`, {
                    params: { id: product_id }
                });
                setProductData(response.data);
                setEditedData(response.data);
                console.log('PRODUCT BY ID: ', response.data)
            } catch (err) {
                console.log('Unable to fetch product data: ', err)
            }

            try {
                const resVariant = await axios.get(`${config.baseApi}/product/get-all-product-variants`)
                const varData = resVariant.data;

                const prodVariant = varData.filter(prod => prod.product_id === product_id);
                if (prodVariant.length === 0) {
                    console.log('NO VARIANTS')
                    setVariants([]);
                    setEditingVariants([]);
                } else {
                    console.log('IT HAS VARIANT')
                    setVariants(prodVariant);
                    setEditingVariants([...prodVariant]); // Initialize editing variants

                    // Check variant types
                    const sizeVariantExists = prodVariant.some(variant => variant.variant_type === 'size');
                    const colorVariantExists = prodVariant.some(variant => variant.variant_type === 'color');
                    const bothVariantExists = prodVariant.some(variant => variant.variant_type === 'size-color');
                    setHasBothVariant(bothVariantExists);
                    setHasSizeVariant(sizeVariantExists);
                    setHasColorVariant(colorVariantExists);

                    // Auto-select first size and color if available
                    if (sizeVariantExists) {
                        const firstSize = prodVariant.find(variant => variant.variant_type === 'size');
                        setSelectedSize(firstSize?.size || null);
                    }

                    if (colorVariantExists) {
                        const firstColor = prodVariant.find(variant => variant.variant_type === 'color');
                        setSelectedColor(firstColor?.color || null);
                    }

                    if (bothVariantExists) {
                        const bothvariant = prodVariant.find(variant => variant.variant_type === 'size-color');
                        setSelectedColor(bothvariant?.color || null);
                        setSelectedSize(bothvariant?.size || null);
                    }

                    // Auto-select first variant if no size/color variants
                    if (prodVariant.length > 0 && !sizeVariantExists && !colorVariantExists) {
                        setSelectedVariant(prodVariant[0]);
                    }
                }
            } catch (err) {
                console.log('NO VARIANTS FOR THIS PRODUCT: ', err)
                setVariants([]);
                setEditingVariants([]);
            }
        }
        fetchData();
    }, [product_id]);

    // Find matching variant when size or color changes
    useEffect(() => {
        if (hasSizeVariant && hasColorVariant && selectedSize && selectedColor) {
            const matchingVariant = variants.find(variant =>
                variant.size === selectedSize && variant.color === selectedColor
            );
            setSelectedVariant(matchingVariant || null);
        } else if (hasSizeVariant && selectedSize && !hasColorVariant) {
            // Only size variants
            const matchingVariant = variants.find(variant => variant.size === selectedSize);
            setSelectedVariant(matchingVariant || null);
        } else if (hasColorVariant && selectedColor && !hasSizeVariant) {
            // Only color variants
            const matchingVariant = variants.find(variant => variant.color === selectedColor);
            setSelectedVariant(matchingVariant || null);
        }
    }, [selectedSize, selectedColor, variants, hasSizeVariant, hasColorVariant]);

    // Edit handlers for product
    const handleEditClick = () => {
        // setIsEditing(true);
        // setEditedData(productData);
        const params = new URLSearchParams({ id: product_id }).toString();
        navigate(`/products/edit-product?${params.toString()}`)
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditedData(productData);
    };

    const handleSaveEdit = async () => {
        setIsSaving(true);
        try {
            const response = await axios.put(`${config.baseApi}/product/update-product`, {
                product_id: product_id,
                ...editedData
            });

            setProductData(editedData);
            setIsEditing(false);
            alert('Product updated successfully!');
            console.log('Product updated:', response.data);
        } catch (err) {
            console.log('Unable to update product: ', err);
            alert('Error updating product');
        } finally {
            setIsSaving(false);
        }
    };

    const handleInputChange = (field, value) => {
        setEditedData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Edit handlers for variants
    const handleEditVariantsClick = () => {
        setIsEditingVariants(true);
        setEditingVariants([...variants]);
    };

    const handleCancelVariantEdit = () => {
        setIsEditingVariants(false);
        setEditingVariants([...variants]);
    };

    const handleSaveVariants = async () => {
        setIsSavingVariants(true);
        try {
            // Update each variant
            const updatePromises = editingVariants.map(variant =>
                axios.put(`${config.baseApi}/product/update-product-variant`, {
                    variant_id: variant.variant_id,
                    quantity_in_stock: variant.quantity_in_stock,
                    purchase_price: variant.purchase_price,
                    selling_price: variant.selling_price
                })
            );

            await Promise.all(updatePromises);

            setVariants([...editingVariants]);
            setIsEditingVariants(false);
            alert('Variants updated successfully!');
            console.log('Variants updated');
        } catch (err) {
            console.log('Unable to update variants: ', err);
            alert('Error updating variants');
        } finally {
            setIsSavingVariants(false);
        }
    };

    const handleVariantInputChange = (variantIndex, field, value) => {
        setEditingVariants(prev => {
            const updatedVariants = [...prev];
            updatedVariants[variantIndex] = {
                ...updatedVariants[variantIndex],
                [field]: field.includes('price') ? parseFloat(value) || 0 : parseInt(value) || 0
            };
            return updatedVariants;
        });
    };

    const handleVariantCheckboxChange = (variant) => {
        if (selectedVariant?.variant_id === variant.variant_id) {
            setSelectedVariant(null);
            setSelectedSize(null);
            setSelectedColor(null);
        } else {
            setSelectedVariant(variant);
            setSelectedSize(variant.size || null);
            setSelectedColor(variant.color || null);
        }
        setQuantity(1);
    };

    const getImageUrl = (attachmentPath) => {
        if (!attachmentPath) return "https://via.placeholder.com/400x400";
        if (attachmentPath.startsWith('http')) {
            return attachmentPath;
        }
        return `${config.baseApi}/${attachmentPath}`;
    };

    const [selectedVariantCartStore, setSelectedVariantCartStore] = useState('')

    const handleAddToCart = async () => {
        if (!productData || !selectedVariant) {
            alert('No item was selected')
            return;
        }

        try {
            let variantValue = '';

            if (selectedVariant.variant_type === 'none') {
                variantValue = '';
            } else if (selectedVariant.variant_type === 'size') {
                variantValue = selectedVariant.size;
            } else if (selectedVariant.variant_type === 'color') {
                variantValue = selectedVariant.color;
            } else if (selectedVariant.variant_type === 'size-color') {
                variantValue = `${selectedVariant.color}/${selectedVariant.size}`;
            }

            setSelectedVariantCartStore(variantValue);

            const allC = await axios.get(`${config.baseApi}/product/get-all-cart`)
            const allCartData = allC.data;

            const ownCart = allCartData.filter(ac => ac.created_by === empInfo.user_name && ac.product_name === productData.product_name);

            const fetchcart = await axios.get(`${config.baseApi}/product/get-all-cart`);
            const allcartdata = fetchcart.data;

            const userCartItems = allcartdata.filter(item => item.created_by === empInfo.user_name);

            const existingCartItem = userCartItems.find(item =>
                String(item.product_id) === String(productData.product_id) &&
                String(item.variant_id) === String(selectedVariant.variant_id) &&
                item.variant === variantValue
            );

            if (existingCartItem) {
                const newQuantity = parseInt(existingCartItem.quantity) + parseInt(quantity);
                await axios.post(`${config.baseApi}/product/update-cart`, {
                    product_cart_id: existingCartItem.product_cart_id,
                    variant_id: selectedVariant.variant_id,
                    quantity: newQuantity
                });
                alert('Item quantity updated in cart!');
            } else {
                await axios.post(`${config.baseApi}/product/add-cart`, {
                    product_id: String(productData.product_id),
                    variant_id: String(selectedVariant.variant_id),
                    attachment: productData.attachment,
                    variant: variantValue,
                    product_price: String(selectedVariant.selling_price),
                    quantity: String(quantity),
                    product_name: productData.product_name,
                    created_by: empInfo.user_name
                });
                alert('Item added to cart successfully!');
            }
        } catch (err) {
            console.log('Unable to add product to the cart: ', err)
        }
    };

    const handleBuyNow = () => {
        if (!productData || !selectedVariant) return;
        console.log('Buy now:', {
            product: productData.product_name,
            variant: selectedVariant,
            quantity: quantity
        });
    };

    if (!productData) {
        return (
            <div style={{
                padding: '20px',
                textAlign: 'center',
                fontSize: '16px',
                color: '#666'
            }}>
                Loading product...
            </div>
        );
    }

    return (
        <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '16px',
            boxSizing: 'border-box'
        }}>
            {/* Main Product Container */}
            <div style={{
                display: 'flex',
                gap: '32px',
                flexDirection: 'row',
                '@media (max-width: 768px)': {
                    flexDirection: 'column',
                    gap: '24px'
                }
            }}>
                {/* Product Image Section */}
                <div style={{
                    flex: '1',
                    minWidth: '0'
                }}>
                    <div style={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: '500px',
                        margin: '0 auto'
                    }}>
                        <img
                            src={getImageUrl(productData.attachment)}
                            alt={productData.product_name}
                            style={{
                                width: '100%',
                                height: 'auto',
                                aspectRatio: '1 / 1',
                                borderRadius: '12px',
                                objectFit: 'contain',
                                backgroundColor: '#f8f9fa'
                            }}
                            onError={(e) => {
                                e.target.src = "https://via.placeholder.com/300x300";
                            }}
                        />
                        {/* Additional Product Info */}
                        <div style={{
                            marginTop: '24px',
                            padding: '16px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px',
                            fontSize: '14px'
                        }}>
                            <div style={{
                                color: '#666',
                                display: 'grid',
                                gap: '8px'
                            }}>
                                <div><strong>Created by:</strong> {productData.created_by}</div>
                                <div><strong>Created at:</strong> {new Date(productData.created_at).toLocaleDateString()}</div>
                                <div><strong>Status:</strong> {productData.is_active ? 'Active' : 'Inactive'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Product Info Section */}
                <div style={{
                    flex: '1',
                    minWidth: '0'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '12px',
                        gap: '12px'
                    }}>
                        {/* Product Name - Editable */}
                        {isEditing ? (
                            <input
                                type="text"
                                value={editedData.product_name || ''}
                                onChange={(e) => handleInputChange('product_name', e.target.value)}
                                style={{
                                    margin: 0,
                                    fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                                    lineHeight: '1.2',
                                    fontWeight: '600',
                                    flex: '1',
                                    minWidth: '0',
                                    padding: '8px 12px',
                                    border: '2px solid #007c34ff',
                                    borderRadius: '6px',
                                    backgroundColor: 'white'
                                }}
                            />
                        ) : (
                            <h1 style={{
                                margin: 0,
                                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                                lineHeight: '1.2',
                                wordWrap: 'break-word',
                                fontWeight: '600',
                                flex: '1',
                                minWidth: '0'
                            }}>
                                {productData.product_name}
                            </h1>
                        )}

                        {/* Edit/Save/Cancel Buttons */}
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={handleSaveEdit}
                                        disabled={isSaving}
                                        style={{
                                            padding: '8px 16px',
                                            border: 'none',
                                            borderRadius: '6px',
                                            backgroundColor: '#007c34ff',
                                            color: 'white',
                                            cursor: isSaving ? 'not-allowed' : 'pointer',
                                            fontSize: '14px',
                                            opacity: isSaving ? 0.6 : 1
                                        }}
                                    >
                                        {isSaving ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        style={{
                                            padding: '8px 16px',
                                            border: '2px solid #dc3545',
                                            borderRadius: '6px',
                                            backgroundColor: 'white',
                                            color: '#dc3545',
                                            cursor: 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <>
                                    <i
                                        className="ph ph-pencil"
                                        style={{
                                            fontSize: '1.5rem',
                                            color: '#007c34ff',
                                            cursor: 'pointer',
                                            flexShrink: 0
                                        }}
                                        onClick={handleEditClick}
                                    ></i>
                                    <i className="ph ph-trash" style={{
                                        fontSize: '1.5rem',
                                        color: '#ff0000ff',
                                        cursor: 'pointer',
                                        flexShrink: 0
                                    }}></i>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Product SKU - Editable */}
                    <div style={{
                        color: '#666',
                        marginBottom: '16px',
                        fontSize: '14px',
                        fontWeight: '500'
                    }}>
                        SKU: {isEditing ? (
                            <input
                                type="text"
                                value={editedData.product_sku || ''}
                                onChange={(e) => handleInputChange('product_sku', e.target.value)}
                                style={{
                                    padding: '6px 10px',
                                    border: '2px solid #007c34ff',
                                    borderRadius: '4px',
                                    backgroundColor: 'white',
                                    fontSize: '14px',
                                    width: '200px'
                                }}
                            />
                        ) : (
                            productData.product_sku
                        )}
                    </div>

                    {/* Unit of Measure - Editable */}
                    <div style={{
                        marginBottom: '20px',
                        color: '#666',
                        fontSize: '14px'
                    }}>
                        <strong>Unit: </strong>
                        {isEditing ? (
                            <input
                                type="text"
                                value={editedData.unit_of_measure || ''}
                                onChange={(e) => handleInputChange('unit_of_measure', e.target.value)}
                                style={{
                                    padding: '6px 10px',
                                    border: '2px solid #007c34ff',
                                    borderRadius: '4px',
                                    backgroundColor: 'white',
                                    fontSize: '14px',
                                    width: '150px'
                                }}
                                placeholder="e.g., piece, kg, box"
                            />
                        ) : (
                            `Per ${productData.unit_of_measure}`
                        )}
                    </div>

                    {/* Category and Subcategory */}
                    <div style={{
                        marginBottom: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                    }}>
                        <div style={{
                            color: '#666',
                            fontSize: '14px'
                        }}>
                            <strong>Category:</strong> {productData.product_category}
                        </div>
                        <div style={{
                            color: '#666',
                            fontSize: '14px'
                        }}>
                            <strong>Subcategory:</strong> {productData.product_subcategory}
                        </div>
                    </div>

                    {/* Product Description - Editable */}
                    <div style={{
                        marginBottom: '24px',
                        lineHeight: '1.6',
                        fontSize: '14px',
                        color: '#333'
                    }}>
                        <strong>Description: </strong>
                        {isEditing ? (
                            <textarea
                                value={editedData.product_description || ''}
                                onChange={(e) => handleInputChange('product_description', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '2px solid #007c34ff',
                                    borderRadius: '6px',
                                    backgroundColor: 'white',
                                    fontSize: '14px',
                                    minHeight: '80px',
                                    resize: 'vertical',
                                    marginTop: '8px'
                                }}
                            />
                        ) : (
                            productData.product_description
                        )}
                    </div>

                    {/* Variant Selection with Checkboxes */}
                    {variants.length > 0 && (
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '16px'
                            }}>
                                <h3 style={{
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    margin: 0
                                }}>
                                    Available Variants
                                </h3>

                                {!isEditingVariants ? (
                                    <button
                                        onClick={handleEditVariantsClick}
                                        style={{
                                            padding: '6px 12px',
                                            border: '1px solid #007c34ff',
                                            borderRadius: '4px',
                                            backgroundColor: 'white',
                                            color: '#007c34ff',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            fontWeight: '500'
                                        }}
                                    >
                                        Edit Stocks & Prices
                                    </button>
                                ) : (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={handleSaveVariants}
                                            disabled={isSavingVariants}
                                            style={{
                                                padding: '6px 12px',
                                                border: 'none',
                                                borderRadius: '4px',
                                                backgroundColor: '#007c34ff',
                                                color: 'white',
                                                cursor: isSavingVariants ? 'not-allowed' : 'pointer',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                opacity: isSavingVariants ? 0.6 : 1
                                            }}
                                        >
                                            {isSavingVariants ? 'Saving...' : 'Save All'}
                                        </button>
                                        <button
                                            onClick={handleCancelVariantEdit}
                                            style={{
                                                padding: '6px 12px',
                                                border: '1px solid #dc3545',
                                                borderRadius: '4px',
                                                backgroundColor: 'white',
                                                color: '#dc3545',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                fontWeight: '500'
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Show message when combination is not available */}
                            {hasSizeVariant && hasColorVariant && selectedSize && selectedColor && !selectedVariant && (
                                <div style={{
                                    padding: '12px',
                                    backgroundColor: '#fff3cd',
                                    border: '1px solid #ffeaa7',
                                    borderRadius: '6px',
                                    color: '#856404',
                                    marginBottom: '16px',
                                    fontSize: '14px',
                                    textAlign: 'center'
                                }}>
                                    The selected combination ({selectedSize} / {selectedColor}) is not available.
                                </div>
                            )}

                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                            }}>
                                {(isEditingVariants ? editingVariants : variants).map((variant, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            padding: '16px',
                                            border: `2px solid ${selectedVariant?.variant_id === variant.variant_id ? '#007bff' : '#e0e0e0'}`,
                                            borderRadius: '8px',
                                            backgroundColor: selectedVariant?.variant_id === variant.variant_id ? '#e3f2fd' : 'white',
                                            cursor: isEditingVariants ? 'default' : 'pointer',
                                            transition: 'all 0.2s ease',
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '12px'
                                        }}
                                        onClick={isEditingVariants ? undefined : () => handleVariantCheckboxChange(variant)}
                                    >
                                        {/* Checkbox - Only show when not editing */}
                                        {!isEditingVariants && (
                                            <div style={{
                                                flexShrink: 0,
                                                marginTop: '2px'
                                            }}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedVariant?.variant_id === variant.variant_id}
                                                    onChange={() => handleVariantCheckboxChange(variant)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={{
                                                        width: '18px',
                                                        height: '18px',
                                                        cursor: 'pointer'
                                                    }}
                                                />
                                            </div>
                                        )}

                                        {/* Variant Details */}
                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                fontWeight: '600',
                                                fontSize: '14px',
                                                marginBottom: '12px'
                                            }}>
                                                {hasBothVariant && variant.size && variant.color
                                                    ? `${variant.size} / ${variant.color}`
                                                    : variant.size || variant.color || 'Standard'
                                                }
                                                {variant.variant_type && variant.variant_type !== 'none' && (
                                                    <span style={{
                                                        fontSize: '12px',
                                                        color: '#666',
                                                        fontWeight: 'normal',
                                                        marginLeft: '8px'
                                                    }}>
                                                        ({variant.variant_type})
                                                    </span>
                                                )}
                                            </div>

                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                                                gap: '12px',
                                                fontSize: '14px'
                                            }}>
                                                {/* Stock Quantity */}
                                                <div>
                                                    <strong>Stock:</strong>
                                                    {isEditingVariants ? (
                                                        <input
                                                            type="number"
                                                            value={variant.quantity_in_stock || 0}
                                                            onChange={(e) => handleVariantInputChange(index, 'quantity_in_stock', e.target.value)}
                                                            min="0"
                                                            style={{
                                                                marginLeft: '8px',
                                                                padding: '4px 8px',
                                                                border: '1px solid #007c34ff',
                                                                borderRadius: '4px',
                                                                width: '80px',
                                                                fontSize: '14px'
                                                            }}
                                                        />
                                                    ) : (
                                                        ` ${variant.quantity_in_stock}`
                                                    )}
                                                </div>

                                                {/* Purchase Price */}
                                                <div>
                                                    <strong>Purchase:</strong>
                                                    {isEditingVariants ? (
                                                        <input
                                                            type="number"
                                                            value={variant.purchase_price || 0}
                                                            onChange={(e) => handleVariantInputChange(index, 'purchase_price', e.target.value)}
                                                            min="0"
                                                            step="0.01"
                                                            style={{
                                                                marginLeft: '8px',
                                                                padding: '4px 8px',
                                                                border: '1px solid #007c34ff',
                                                                borderRadius: '4px',
                                                                width: '80px',
                                                                fontSize: '14px'
                                                            }}
                                                        />
                                                    ) : (
                                                        ` $${variant.purchase_price}`
                                                    )}
                                                </div>

                                                {/* Selling Price */}
                                                <div>
                                                    <strong>Selling:</strong>
                                                    {isEditingVariants ? (
                                                        <input
                                                            type="number"
                                                            value={variant.selling_price || 0}
                                                            onChange={(e) => handleVariantInputChange(index, 'selling_price', e.target.value)}
                                                            min="0"
                                                            step="0.01"
                                                            style={{
                                                                marginLeft: '8px',
                                                                padding: '4px 8px',
                                                                border: '1px solid #007c34ff',
                                                                borderRadius: '4px',
                                                                width: '80px',
                                                                fontSize: '14px'
                                                            }}
                                                        />
                                                    ) : (
                                                        ` $${variant.selling_price}`
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Rest of your component remains the same */}
                    {/* Quantity Selection */}
                    <div style={{
                        marginBottom: '24px',
                        padding: '16px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            flexWrap: 'wrap'
                        }}>
                            <div style={{
                                fontSize: '16px',
                                fontWeight: '600',
                                minWidth: 'fit-content'
                            }}>
                                Quantity
                            </div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}>
                                <button
                                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                                    disabled={selectedVariant && quantity <= 1}
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        border: '1px solid #ddd',
                                        background: 'white',
                                        borderRadius: '6px',
                                        cursor: quantity > 1 ? 'pointer' : 'not-allowed',
                                        opacity: quantity > 1 ? 1 : 0.5,
                                        fontSize: '18px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    -
                                </button>
                                <span style={{
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    minWidth: '50px',
                                    textAlign: 'center',
                                    padding: '8px 12px',
                                    backgroundColor: 'white',
                                    borderRadius: '6px',
                                    border: '1px solid #ddd'
                                }}>
                                    {quantity}
                                </span>
                                <button
                                    onClick={() => setQuantity(prev => prev + 1)}
                                    disabled={selectedVariant && quantity >= selectedVariant.quantity_in_stock}
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        border: '1px solid #ddd',
                                        background: 'white',
                                        borderRadius: '6px',
                                        cursor: selectedVariant && quantity < selectedVariant.quantity_in_stock ? 'pointer' : 'not-allowed',
                                        opacity: selectedVariant && quantity < selectedVariant.quantity_in_stock ? 1 : 0.5,
                                        fontSize: '18px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    +
                                </button>
                            </div>
                            {selectedVariant && (
                                <div style={{
                                    fontSize: '14px',
                                    color: '#666',
                                    width: '100%',
                                    marginTop: '8px'
                                }}>
                                    Maximum: {selectedVariant.quantity_in_stock} units available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{
                        display: 'flex',
                        gap: '16px',
                        marginTop: '24px',
                        flexDirection: 'row'
                    }}>
                        <button
                            onClick={handleAddToCart}
                            disabled={!selectedVariant}
                            style={{
                                flex: 1,
                                padding: '16px 24px',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: selectedVariant ? 'pointer' : 'not-allowed',
                                backgroundColor: selectedVariant ? '#d89df0ff' : '#ccc',
                                color: 'white',
                                opacity: selectedVariant ? 1 : 0.6,
                                minWidth: '140px',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                        >
                            Add To Cart
                        </button>

                        <button
                            onClick={handleBuyNow}
                            disabled={!selectedVariant}
                            style={{
                                flex: 1,
                                padding: '16px 24px',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: selectedVariant ? 'pointer' : 'not-allowed',
                                backgroundColor: selectedVariant ? '#7a62a0ff' : '#ccc',
                                color: 'white',
                                opacity: selectedVariant ? 1 : 0.6,
                                minWidth: '140px',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                        >
                            Withdraw
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}