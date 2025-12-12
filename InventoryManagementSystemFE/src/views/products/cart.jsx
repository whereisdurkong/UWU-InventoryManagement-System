import axios from 'axios';
import config from 'config';
import React, { useEffect, useState } from 'react';
import { Table, Badge, Image, Form, Button, Modal, Row, Col, Card, Container, ButtonGroup, Dropdown, Nav, Stack } from 'react-bootstrap';
// project-imports
import MainCard from 'components/MainCard';
import BTN from '../../components/reactBits/BTN';
import { useNavigate } from 'react-router-dom';
import { categories } from '../../components/categories';
import SimpleBarScroll from 'components/third-party/SimpleBar';
import SessionAlert from '../../components/SessionAlert';
import CartLoadingOverlay from '../../components/CartLoadingOverlay';
import LoadingSpinner from '../../routes/Spinner';

// Debounce hook for search optimization
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

export default function Cart() {
    const [products, setProducts] = useState([]);
    const [productVariants, setProductVariants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
    const [searchQuery, setSearchQuery] = useState(''); // Search state

    // Debounced search query for better performance
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const navigate = useNavigate();

    // Cart state and functions from Header
    const [cartData, setCartData] = useState([]);
    const [variantStock, setVariantStock] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const empInfo = JSON.parse(localStorage.getItem('user'));

    // Function to construct the full image URL
    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        const normalizedPath = imagePath.replace(/\\/g, '/');
        if (normalizedPath.startsWith('http')) return normalizedPath;
        const cleanPath = normalizedPath.startsWith('/') ? normalizedPath.slice(1) : normalizedPath;
        const fullUrl = `${config.baseApi}/${cleanPath}`;
        return fullUrl;
    };

    // Calculate total function
    const calculateTotal = () => {
        return cartData.reduce((sum, item) => {
            const price = parseFloat(item.product_price) || 0;
            const quantity = parseInt(item.quantity) || 1;
            return sum + (price * quantity);
        }, 0);
    };

    const cartTotal = calculateTotal();

    // Function to fetch variant stock information
    const fetchVariantStock = async (variantId) => {
        try {
            const response = await axios.get(`${config.baseApi}/product/get-variant-by-id`, {
                params: { id: variantId }
            });

            if (response.data) {
                const stock = parseInt(response.data.quantity_in_stock) || 0;
                return {
                    variantId,
                    stock,
                    isOutOfStock: stock <= 0,
                    variantData: response.data
                };
            }
            return { variantId, stock: 0, isOutOfStock: true };
        } catch (error) {
            console.error(`Error fetching stock for variant ${variantId}:`, error);
            return { variantId, stock: 0, isOutOfStock: true };
        }
    };

    // Function to handle quantity change with stock validation
    const handleQuantityChange = async (cartId, variantId, newQuantity) => {
        if (newQuantity < 1) return;

        const stockInfo = variantStock[variantId];
        if (stockInfo && stockInfo.stock < newQuantity) {
            setError(`Only ${stockInfo.stock} items available in stock`);
            return;
        }

        try {
            await axios.post(`${config.baseApi}/product/update-cart`, {
                product_cart_id: cartId,
                updated_by: empInfo.user_name,
                quantity: newQuantity
            });

            setCartData(prevCartData =>
                prevCartData.map(item =>
                    item.product_cart_id === cartId
                        ? { ...item, quantity: newQuantity }
                        : item
                )
            );
        } catch (err) {
            console.error('Unable to update quantity: ', err);
        }
    };

    // Function to remove item from cart
    const handleRemoveItem = async (cartId) => {
        try {
            await axios.post(`${config.baseApi}/product/remove-from-cart`, {
                product_cart_id: cartId
            });

            setCartData(prevCartData =>
                prevCartData.filter(item => item.product_cart_id !== cartId)
            );
        } catch (err) {
            console.error('Unable to remove item: ', err);
        }
    };

    // Function to remove all items
    const handleRemoveAll = async () => {
        try {
            await axios.post(`${config.baseApi}/product/remove-all-cart`, {
                created_by: empInfo.user_name
            });
            setCartData([]);

        } catch (err) {
            console.error('Unable to clear cart: ', err);
        }
    };

    // Function to handle product click with stock check
    const handleProductClick = (cart) => {
        const stockInfo = variantStock[cart.variant_id];
        if (stockInfo && stockInfo.isOutOfStock) {
            return;
        }
        navigate(`/products/product-view?id=${cart.product_id}`);
    };

    // Fetch cart data and variant stock
    useEffect(() => {
        let isMounted = true;
        let intervalID = null;

        const fetchCartData = async () => {
            if (!isMounted) return;

            try {
                const currentUser = JSON.parse(localStorage.getItem('user'));
                if (!currentUser?.user_name) return;

                const fetchcart = await axios.get(`${config.baseApi}/product/get-all-cart`);
                const cartdata = fetchcart.data;
                const cartUser = cartdata.filter(e => e.created_by === currentUser.user_name);

                if (isMounted) {
                    setCartData(cartUser);

                    const variantIds = [...new Set(cartUser.map(item => item.variant_id))];
                    const stockPromises = variantIds.map(variantId => fetchVariantStock(variantId));
                    const stockResults = await Promise.all(stockPromises);

                    const stockMap = {};
                    stockResults.forEach(result => {
                        stockMap[result.variantId] = {
                            stock: result.stock,
                            isOutOfStock: result.isOutOfStock
                        };
                    });

                    setVariantStock(stockMap);
                }
            } catch (err) {
                if (isMounted) {
                    console.error('Unable to fetch cart data: ', err);
                }
            }
        };

        fetchCartData();
        intervalID = setInterval(fetchCartData, 5000);

        return () => {
            isMounted = false;
            if (intervalID) clearInterval(intervalID);
        };
    }, []);

    // Checkout functions
    const validateCartStock = async (cartItems) => {
        const stockResults = await Promise.all(
            cartItems.map(checkVariantStock)
        );

        const outOfStockItems = stockResults.filter(item => item.isOutOfStock);
        const insufficientStockItems = stockResults.filter(item =>
            parseInt(item.cart.quantity) > item.stock
        );
        const errorItems = stockResults.filter(item => item.error);

        return {
            stockResults,
            outOfStockItems,
            insufficientStockItems,
            errorItems,
            hasErrors: outOfStockItems.length > 0 ||
                insufficientStockItems.length > 0 ||
                errorItems.length > 0
        };
    };

    const checkVariantStock = async (cartItem) => {
        try {
            const response = await axios.get(`${config.baseApi}/product/get-variant-by-id`, {
                params: { id: cartItem.variant_id }
            });

            const stock = parseInt(response.data?.quantity_in_stock) || 0;

            return {
                cart: cartItem,
                stock,
                isOutOfStock: stock <= 0,
                variantData: response.data,
                error: false
            };
        } catch (error) {
            console.error(`Error checking stock for variant ${cartItem.variant_id}:`, error);
            return {
                cart: cartItem,
                stock: 0,
                isOutOfStock: true,
                error: true
            };
        }
    };

    const handleValidationErrors = (validation) => {
        const { outOfStockItems, insufficientStockItems, errorItems } = validation;

        if (outOfStockItems.length > 0) {
            const itemNames = outOfStockItems.map(item => item.cart.product_name).join(', ');
            setError(`Cannot checkout. The following item(s) are out of stock: ${itemNames}. Please remove them from your cart.`);
            return;
        }

        if (insufficientStockItems.length > 0) {
            const itemDetails = insufficientStockItems.map(item =>
                `${item.cart.product_name} (Available: ${item.stock}, In Cart: ${item.cart.quantity})`
            ).join('\n');

            setError(`Cannot checkout. The following item(s) have quantity exceeding available stock:\n\n${itemDetails}\n\nPlease adjust quantities.`);
            return;
        }

        if (errorItems.length > 0) {
            setError('Unable to verify stock for some items. Please try again.');
        }
    };

    const updateLocalStockState = (stockResults) => {
        const updatedStock = { ...variantStock };
        stockResults.forEach(result => {
            updatedStock[result.cart.variant_id] = {
                stock: result.stock,
                isOutOfStock: result.isOutOfStock
            };
        });
        setVariantStock(updatedStock);
    };

    const processStockUpdates = async (stockResults) => {
        const updatePromises = stockResults.map(updateVariantStock);
        const updateResults = await Promise.all(updatePromises);
        return updateResults.every(result => result.success);
    };

    const updateVariantStock = async (result) => {
        try {
            setIsLoading(true);
            await axios.post(`${config.baseApi}/product/withdraw-product`, {
                variant_id: result.cart.variant_id,
                updated_by: empInfo.user_name,
                quantity: parseInt(result.cart.quantity)
            });
            return { success: true, variant_id: result.cart.variant_id };
        } catch (error) {
            console.error(`Error updating stock for variant ${result.cart.variant_id}:`, error);
            return { success: false, variant_id: result.cart.variant_id };
        }
    };

    const completeCheckout = async () => {
        console.log('All stock checks passed. Proceeding to checkout...');
        setIsLoading(true)
        setSuccess('Checkout successful!');

        setTimeout(() => {
            window.location.reload();
        }, 1000);
        await handleRemoveAll();
    };

    const handleCheckOut = async () => {
        try {
            const validationResult = await validateCartStock(cartData);

            if (validationResult.hasErrors) {
                handleValidationErrors(validationResult);
                return;
            }

            updateLocalStockState(validationResult.stockResults);
            const updateSuccess = await processStockUpdates(validationResult.stockResults);

            if (!updateSuccess) {
                setError('Some items could not be processed. Please try again.');
                return;
            }

            await completeCheckout();

        } catch (error) {
            console.error('Error during checkout process:', error);
            setError('An error occurred during checkout. Please try again.');
        }
    };

    // Original product functions
    useEffect(() => {
        const fetchData = async () => {
            try {
                const rawDataVariant = await axios.get(`${config.baseApi}/product/get-all-product-variants`);
                const productsDataVairant = rawDataVariant.data;
                setProductVariants(productsDataVairant);
            } catch (err) {
                console.log('Unable to fetch all products variant: ', err);
            } finally {
                setLoading(false);
            }

            try {
                const rawData = await axios.get(`${config.baseApi}/product/get-all-product`);
                const productsData = rawData.data;
                setProducts(productsData);
                setFilteredProducts(sortProducts(productsData, 'desc'));
            } catch (err) {
                console.log('Unable to fetch all products: ', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Sort products function
    const sortProducts = (productsArray, order) => {
        const sortedProducts = [...productsArray];
        sortedProducts.sort((a, b) => {
            const dateA = new Date(a.created_at);
            const dateB = new Date(b.created_at);

            if (order === 'asc') {
                return dateA - dateB;
            } else {
                return dateB - dateA;
            }
        });
        return sortedProducts;
    };

    // Filter products when category or search changes
    useEffect(() => {
        let filtered = products;

        // Apply category filter
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(product =>
                product.product_category?.toString() === selectedCategory.toString()
            );
        }

        // Apply search filter
        if (debouncedSearchQuery.trim() !== '') {
            const query = debouncedSearchQuery.toLowerCase().trim();
            filtered = filtered.filter(product => {
                return (
                    (product.product_name && product.product_name.toLowerCase().includes(query)) ||
                    (product.product_sku && product.product_sku.toLowerCase().includes(query)) ||
                    (product.product_description && product.product_description.toLowerCase().includes(query))
                );
            });
        }

        const sorted = sortProducts(filtered, sortOrder);
        setFilteredProducts(sorted);

    }, [selectedCategory, products, sortOrder, debouncedSearchQuery]);

    // Handle sort order change
    const handleSortChange = (order) => {
        setSortOrder(order);
    };

    // Function to get all variants for a product
    const getProductVariants = (productId) => {
        return productVariants.filter(variant =>
            variant.product_id.toString() === productId.toString()
        );
    };

    const handleCategoryChange = (e) => {
        setSelectedCategory(e.target.value);
    };

    // Function to clear search
    const clearSearch = () => {
        setSearchQuery('');
    };

    if (loading) {
        return (
            <MainCard title="Products">
                <div className="text-center">Loading products...</div>
            </MainCard>
        );
    }

    // Extract unique categories from products for dropdown
    const extractCategories = () => {
        const categoriesSet = new Set();
        products.forEach(product => {
            if (product.product_category) {
                categoriesSet.add(product.product_category);
            }
        });
        return Array.from(categoriesSet).sort();
    };

    const productCategories = extractCategories();

    const handleAdd = () => {
        navigate(`/products/add-product`);
    }

    // Function to get variant display text
    const getVariantDisplay = (variant) => {
        const type = variant.variant_type?.toLowerCase() || '';
        const size = variant.size || '';
        const color = variant.color || '';
        const variantName = variant.variant_name || '';

        if (type.includes('size') && type.includes('color')) {
            return `${size} • ${color}`;
        } else if (type.includes('size')) {
            return size;
        } else if (type.includes('color')) {
            return color;
        } else if (variantName) {
            return variantName;
        }
        return 'Standard';
    };

    // Grid View Component
    const GridView = () => {
        const allItems = [];

        filteredProducts.forEach((product) => {
            const variants = getProductVariants(product.product_id);

            if (variants.length === 0) {
                allItems.push({
                    ...product,
                    isVariant: false,
                    variantData: null,
                    imageUrl: getImageUrl(product.attachment),
                    displayPrice: product.selling_price || 0,
                    variantDisplay: 'Standard'
                });
            } else {
                variants.forEach((variant) => {
                    allItems.push({
                        ...product,
                        isVariant: true,
                        variantData: variant,
                        imageUrl: getImageUrl(variant.attachment) || getImageUrl(product.attachment),
                        displayPrice: variant.selling_price || variant.selling_price || product.selling_price || 0,
                        variantDisplay: getVariantDisplay(variant),
                        stock: variant.quantity_in_stock || 0
                    });
                });
            }
        });

        // Show search results message
        if (debouncedSearchQuery && allItems.length === 0) {
            return (
                <div className="text-center py-5">
                    <i className="fas fa-search fa-3x text-muted mb-3"></i>
                    <h5>No products found</h5>
                    <p className="text-muted">
                        No products found for "{debouncedSearchQuery}"
                        {selectedCategory !== 'all' && ` in "${selectedCategory}" category`}
                    </p>
                    <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => {
                            setSearchQuery('');
                            setSelectedCategory('all');
                        }}
                    >
                        Clear filters
                    </Button>
                </div>
            );
        }

        // Function to handle adding to cart (similar to ViewProduct.js)
        const handleAddToCart = async (product, variant) => {
            if (!product || !variant) {
                setError('Please select a variant');
                return;
            }

            try {
                // Get current user
                const empInfo = JSON.parse(localStorage.getItem('user'));
                if (!empInfo?.user_name) {
                    setError('Please login first');
                    return;
                }

                // Determine variant value
                let variantValue = '';
                const variantType = variant.variant_type?.toLowerCase() || 'none';

                if (variantType === 'none') {
                    variantValue = '';
                } else if (variantType === 'size') {
                    variantValue = variant.size;
                } else if (variantType === 'color') {
                    variantValue = variant.color;
                } else if (variantType.includes('size') && variantType.includes('color')) {
                    variantValue = `${variant.color}/${variant.size}`;
                }

                // Check if item already exists in cart
                const fetchcart = await axios.get(`${config.baseApi}/product/get-all-cart`);
                const allcartdata = fetchcart.data;
                const userCartItems = allcartdata.filter(item => item.created_by === empInfo.user_name);

                const existingCartItem = userCartItems.find(item =>
                    String(item.product_id) === String(product.product_id) &&
                    String(item.variant_id) === String(variant.variant_id) &&
                    item.variant === variantValue
                );

                if (existingCartItem) {
                    // Update quantity
                    const newQuantity = parseInt(existingCartItem.quantity) + 1;
                    setIsLoading(true);
                    await axios.post(`${config.baseApi}/product/update-cart`, {
                        product_cart_id: existingCartItem.product_cart_id,
                        variant_id: variant.variant_id,
                        quantity: newQuantity
                    });
                    setSuccess('Item quantity updated in cart!');

                    // Refresh cart data
                    setTimeout(() => {
                        fetchCartData();
                    }, 500);
                } else {
                    // Add new item to cart
                    setIsLoading(true);
                    await axios.post(`${config.baseApi}/product/add-cart`, {
                        product_id: String(product.product_id),
                        variant_id: String(variant.variant_id),
                        attachment: product.attachment,
                        variant: variantValue,
                        product_price: String(variant.selling_price),
                        quantity: '1', // Default quantity
                        product_name: product.product_name,
                        created_by: empInfo.user_name
                    });
                    setSuccess('Item added to cart successfully!');

                    // Refresh cart data
                    setTimeout(() => {
                        fetchCartData();
                    }, 500);
                }
            } catch (err) {
                console.log('Unable to add product to the cart: ', err);
                setError('Failed to add item to cart');
            } finally {
                setIsLoading(false);
            }
        };

        // Function to fetch cart data (needed for refresh)
        const fetchCartData = async () => {
            try {
                const currentUser = JSON.parse(localStorage.getItem('user'));
                if (!currentUser?.user_name) return;

                const fetchcart = await axios.get(`${config.baseApi}/product/get-all-cart`);
                const cartdata = fetchcart.data;
                const cartUser = cartdata.filter(e => e.created_by === currentUser.user_name);
                setCartData(cartUser);

                // Update variant stock information
                const variantIds = [...new Set(cartUser.map(item => item.variant_id))];
                const stockPromises = variantIds.map(variantId => fetchVariantStock(variantId));
                const stockResults = await Promise.all(stockPromises);

                const stockMap = {};
                stockResults.forEach(result => {
                    stockMap[result.variantId] = {
                        stock: result.stock,
                        isOutOfStock: result.isOutOfStock
                    };
                });

                setVariantStock(stockMap);
            } catch (err) {
                console.error('Unable to fetch cart data: ', err);
            }
        };

        return (
            <Container fluid className="p-0">
                {/* Search info bar */}
                {(debouncedSearchQuery || selectedCategory !== 'all') && allItems.length > 0 && (
                    <div className="mb-3 p-2 bg-light rounded">
                        <small className="text-muted">
                            Showing {allItems.length} product{allItems.length !== 1 ? 's' : ''}
                            {debouncedSearchQuery && ` for "${debouncedSearchQuery}"`}
                            {selectedCategory !== 'all' && ` in "${selectedCategory}" category`}
                            {debouncedSearchQuery && selectedCategory !== 'all' && ' and'}
                            <Button
                                variant="link"
                                size="sm"
                                className="p-0 ms-2"
                                onClick={clearSearch}
                            >
                                Clear search
                            </Button>
                        </small>
                    </div>
                )}

                <Row xs={2} md={4} lg={6} className="g-3">
                    {allItems.map((item, index) => {
                        const isOutOfStock = parseInt(item.stock) === 0;
                        const variantData = item.variantData || {
                            variant_id: null,
                            selling_price: item.displayPrice,
                            variant_type: 'none'
                        };

                        return (
                            <Col key={`${item.product_id}-${item.variantData?.product_variant_id || index}`}>
                                <Card
                                    className="h-100 border-hover shadow-sm"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => navigate(`/products/product-view?id=${item.product_id}`)}
                                >
                                    <div className="position-relative">
                                        {item.imageUrl ? (
                                            <Card.Img
                                                variant="top"
                                                src={item.imageUrl}
                                                style={{
                                                    height: '140px',
                                                    objectFit: 'cover',
                                                    borderTopLeftRadius: '0.375rem',
                                                    borderTopRightRadius: '0.375rem'
                                                }}
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.parentNode.innerHTML = `
                                                    <div style="
                                                        height: 140px;
                                                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                                        display: flex;
                                                        align-items: center;
                                                        justify-content: center;
                                                        border-top-left-radius: 0.375rem;
                                                        border-top-right-radius: 0.375rem;
                                                    ">
                                                        <div class="text-white text-center">
                                                            <i class="fas fa-box fa-2x"></i>
                                                            <div class="mt-2">No Image</div>
                                                        </div>
                                                    </div>
                                                `;
                                                }}
                                            />
                                        ) : (
                                            <div
                                                style={{
                                                    height: '140px',
                                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderTopLeftRadius: '0.375rem',
                                                    borderTopRightRadius: '0.375rem'
                                                }}
                                            >
                                                <div className="text-white text-center">
                                                    <i className="fas fa-box fa-2x"></i>
                                                    <div className="mt-2">No Image</div>
                                                </div>
                                            </div>
                                        )}

                                        <Badge
                                            bg={!isOutOfStock ? "success" : "danger"}
                                            className="position-absolute top-0 end-0 m-2"
                                        >
                                            {!isOutOfStock ? `Stock: ${item.stock}` : 'Out of Stock'}
                                        </Badge>
                                    </div>

                                    <Card.Body className="d-flex flex-column p-3" style={{ background: '#f8f9fa' }}>
                                        <div className="mb-2">
                                            <small className="text-muted d-block text-truncate">
                                                {item.product_sku || 'N/A'}
                                            </small>
                                            <Card.Title
                                                className="mb-1 text-truncate"
                                                style={{ fontSize: '0.95rem' }}
                                            >
                                                {item.product_name}
                                            </Card.Title>
                                            {item.isVariant && item.variantDisplay && (
                                                <small className="text-info d-block">
                                                    <i className="fas fa-tag me-1"></i>
                                                    {item.variantDisplay}
                                                </small>
                                            )}
                                        </div>

                                        <div className="mt-auto">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <div className="text-success fw-bold">
                                                    ${parseFloat(item.displayPrice).toFixed(2)}
                                                </div>
                                                <small className="text-muted">
                                                    {item.unit_of_measure ? `Per ${item.unit_of_measure}` : ''}
                                                </small>
                                            </div>

                                            {/* Add to Cart Button */}
                                            <Button
                                                variant={isOutOfStock ? "secondary" : "primary"}
                                                size="sm"
                                                className="w-100"
                                                disabled={isOutOfStock || isLoading}
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Prevent card click
                                                    handleAddToCart(item, variantData);
                                                }}
                                            >
                                                {isLoading ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                        Adding...
                                                    </>
                                                ) : isOutOfStock ? (
                                                    'Out of Stock'
                                                ) : (
                                                    <>
                                                        <i className="ph ph-plus-circle me-1 align-middle" />

                                                        <span className="align-middle">Add to Cart</span>
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>

                {allItems.length === 0 && !debouncedSearchQuery && (
                    <div className="text-center py-5">
                        <i className="fas fa-box-open fa-3x text-muted mb-3"></i>
                        <h5>No products found</h5>
                        <p className="text-muted">
                            {selectedCategory === 'all'
                                ? 'No products available'
                                : `No products found in "${selectedCategory}" category`}
                        </p>
                    </div>
                )}
            </Container>
        );
    };

    // Cart Notif Component
    const CartNotif = () => {
        return (
            <div className="sticky-top" style={{ top: '20px', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
                <div className="border rounded bg-white shadow-sm d-flex flex-column" style={{ flex: 1, minHeight: 0 }}>
                    {/* Header Section */}
                    <div className="p-3 border-bottom">


                        <div className="d-flex align-items-center justify-content-between mb-1">
                            <h5 className="m-0">
                                <i className="ph ph-shopping-cart me-2"></i>
                                Cart ({cartData.length} items)
                            </h5>
                            {cartData.length > 0 && (
                                <Button
                                    variant="link"
                                    className="btn-sm p-0 text-decoration-none text-danger"
                                    onClick={handleRemoveAll}
                                    size="sm"
                                >
                                    Remove All
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Loading Overlay */}


                    {/* Cart Items List - Scrollable Area */}
                    <div
                        className="p-3"
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            minHeight: 0,
                            paddingBottom: cartData.length > 0 ? '0' : '1rem'
                        }}
                    >
                        {cartData.length === 0 ? (
                            <div className="text-center py-4 h-100 d-flex flex-column justify-content-center">
                                <i className="ph ph-shopping-cart-simple fa-3x text-muted mb-3"></i>
                                <p className="text-muted mb-0">Your cart is empty</p>
                            </div>
                        ) : (
                            <div className="d-flex flex-column gap-2">
                                {cartData.map((cart) => {
                                    const stockInfo = variantStock[cart.variant_id];
                                    const isOutOfStock = stockInfo?.isOutOfStock || false;
                                    const availableStock = stockInfo?.stock || 0;
                                    const currentQuantity = parseInt(cart.quantity) || 1;

                                    return (
                                        <div
                                            key={cart.product_cart_id}
                                            className="p-2 border rounded"
                                            style={{
                                                opacity: isOutOfStock ? 0.6 : 1,
                                                cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                                                backgroundColor: isOutOfStock ? '#f8f9fa' : 'white'
                                            }}
                                            onClick={() => !isOutOfStock && handleProductClick(cart)}
                                        >
                                            <Stack direction="horizontal" gap={2} className="align-items-start">
                                                {cart.attachment && (
                                                    <div style={{ position: 'relative' }}>
                                                        <Image
                                                            className="img-radius rounded"
                                                            src={getImageUrl(cart.attachment)}
                                                            alt={cart.product_name || 'Product image'}
                                                            width={60}
                                                            height={60}
                                                            style={{
                                                                objectFit: 'cover',
                                                                minWidth: '60px',
                                                                minHeight: '60px',
                                                                filter: isOutOfStock ? 'grayscale(100%)' : 'none'
                                                            }}
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                                <div className="flex-grow-1">
                                                    <div className="d-flex justify-content-between align-items-start mb-1">
                                                        <h6 className="text-body mb-0" style={{ fontSize: '0.9rem', color: isOutOfStock ? '#999' : 'inherit' }}>
                                                            {cart.product_name || 'Product'}
                                                            {isOutOfStock && (
                                                                <Badge bg="danger" className="ms-2" style={{ fontSize: '9px' }}>
                                                                    Out of Stock
                                                                </Badge>
                                                            )}
                                                        </h6>
                                                        <Button
                                                            variant="link"
                                                            className="text-danger p-0 ms-2"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRemoveItem(cart.product_cart_id);
                                                            }}
                                                            style={{ fontSize: '11px' }}
                                                        >
                                                            <i className="ph ph-x" />
                                                        </Button>
                                                    </div>

                                                    {cart.variant && (
                                                        <p className="mb-1 text-muted small" style={{ fontSize: '0.8rem' }}>{cart.variant}</p>
                                                    )}

                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <p className="mb-0 fw-bold" style={{ fontSize: '0.9rem', color: isOutOfStock ? '#999' : 'inherit' }}>
                                                            ${cart.product_price}
                                                        </p>

                                                        <div className="d-flex align-items-center">
                                                            <span className="text-muted small me-1" style={{ fontSize: '0.8rem' }}>Qty:</span>
                                                            <div className="d-flex align-items-center border rounded" style={{ opacity: isOutOfStock ? 0.5 : 1 }}>
                                                                <Button
                                                                    variant="link"
                                                                    className="p-1 text-decoration-none"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleQuantityChange(cart.product_cart_id, cart.variant_id, currentQuantity - 1);
                                                                    }}
                                                                    disabled={isOutOfStock || currentQuantity <= 1}
                                                                >
                                                                    <i className="ph ph-minus" style={{ fontSize: '10px' }} />
                                                                </Button>
                                                                <span
                                                                    className="px-1"
                                                                    style={{
                                                                        minWidth: '25px',
                                                                        textAlign: 'center',
                                                                        fontSize: '0.8rem',
                                                                        color: isOutOfStock ? '#999' : 'inherit'
                                                                    }}
                                                                >
                                                                    {currentQuantity}
                                                                    {!isOutOfStock && availableStock > 0 && currentQuantity > availableStock && (
                                                                        <span className="text-danger ms-1" style={{ fontSize: '9px' }}>
                                                                            (Max: {availableStock})
                                                                        </span>
                                                                    )}
                                                                </span>
                                                                <Button
                                                                    variant="link"
                                                                    className="p-1 text-decoration-none"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleQuantityChange(cart.product_cart_id, cart.variant_id, currentQuantity + 1);
                                                                    }}
                                                                    disabled={isOutOfStock || currentQuantity >= availableStock}
                                                                >
                                                                    <i className="ph ph-plus" style={{ fontSize: '10px' }} />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Stack>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Total and Checkout Section - Always visible at bottom */}
                    {cartData.length > 0 && (
                        <div
                            className="border-top bg-white p-3"
                            style={{
                                position: 'sticky',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                zIndex: 10,
                                boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
                            }}
                        >
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="fw-bold">Total:</span>
                                <span className="fw-bold">${cartTotal.toFixed(2)}</span>
                            </div>

                            {cartData.some(cart => {
                                const stockInfo = variantStock[cart.variant_id];
                                return stockInfo?.isOutOfStock;
                            }) && (
                                    <div className="alert alert-danger mb-2 py-2" role="alert" style={{ fontSize: '11px' }}>
                                        <i className="ph ph-warning-circle me-1" />
                                        Some items in your cart are out of stock. Please remove them to proceed.
                                    </div>
                                )}

                            <div className="d-grid">
                                <BTN
                                    label={'Withdraw'}
                                    size="small"
                                    onClick={handleCheckOut}
                                    disabled={
                                        cartData.some(cart => {
                                            const stockInfo = variantStock[cart.variant_id];
                                            return stockInfo?.isOutOfStock;
                                        }) || cartData.length === 0
                                    }
                                    className="w-100"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <MainCard
            title="Product Inventory"
            secondary={
                <div className="d-flex align-items-center gap-2 flex-wrap">
                    {/* Search Input */}
                    <div className="position-relative" style={{ width: '200px' }}>
                        <Form.Control
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            size="sm"
                            style={{ paddingRight: '30px' }}
                        />
                        {searchQuery && (
                            <Button
                                variant="link"
                                className="position-absolute end-0 top-50 translate-middle-y p-0 me-2 d-flex align-items-center justify-content-center"
                                onClick={clearSearch}
                                style={{ height: '16px', width: '16px' }}
                            >
                                <i className="ph ph-x" style={{ fontSize: '12px', lineHeight: '1' }} />
                            </Button>
                        )}
                    </div>

                    <Form.Select
                        style={{ width: '200px' }}
                        value={sortOrder}
                        onChange={(e) => handleSortChange(e.target.value)}
                        size="sm"
                    >
                        <option value="desc">Newest - Oldest</option>
                        <option value="asc">Oldest - Newest</option>
                    </Form.Select>

                    <Form.Select
                        style={{ width: '200px' }}
                        value={selectedCategory}
                        onChange={handleCategoryChange}
                        size="sm"
                    >
                        <option value="all">All Categories</option>
                        {productCategories.map(category => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </Form.Select>

                </div>
            }
        >
            <Container fluid>
                {isLoading &&
                    <LoadingSpinner text="Loading..." />
                }

                {success && (
                    <SessionAlert
                        type="success"
                        title="Successful"
                        message={success}
                        onClose={() => setSuccess('')}
                    />
                )}

                {error && (
                    <SessionAlert
                        type="error"
                        title="Error"
                        message={error}
                        onClose={() => setError('')}
                    />
                )}
                <Row className="gy-4">
                    {/* LEFT — PRODUCT GRID */}
                    <Col xs={12} md={7} lg={8}>
                        <GridView />
                    </Col>

                    {/* RIGHT — CART SUMMARY */}
                    <Col xs={12} md={5} lg={4} className="border-start ps-md-3">
                        <CartNotif />
                    </Col>
                </Row>
            </Container>
        </MainCard>
    );
}