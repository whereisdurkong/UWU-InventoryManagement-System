import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import config from 'config';
// react-bootstrap
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import Form from 'react-bootstrap/Form';
import Image from 'react-bootstrap/Image';
import Nav from 'react-bootstrap/Nav';
import Stack from 'react-bootstrap/Stack';
import Badge from 'react-bootstrap/Badge';

// project-imports
import MainCard from 'components/MainCard';
import SimpleBarScroll from 'components/third-party/SimpleBar';
import { handlerDrawerOpen, useGetMenuMaster } from 'api/menu';

// assets
import Img1 from 'assets/images/user/avatar-1.png';
import Img2 from 'assets/images/user/avatar-2.png';
import Img3 from 'assets/images/user/avatar-3.png';
import Img4 from 'assets/images/user/avatar-4.png';
import Img5 from 'assets/images/user/avatar-5.png';
import Cart from '../../sections/components/cart';
import BTN from '../../components/reactBits/BTN';
import { useNavigate } from 'react-router';
import SessionAlert from '../../components/SessionAlert';
import LoadingSpinner from '../../routes/Spinner';
import CartLoadingOverlay from '../../components/CartLoadingOverlay';


const notifications = [
  {
    id: 1,
    avatar: Img1,
    time: '2 min ago',
    title: 'UI/UX Design',
    description: "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
    date: 'Today'
  },
  {
    id: 2,
    avatar: Img2,
    time: '1 hour ago',
    title: 'Message',
    description: "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
    date: 'Today'
  },
  {
    id: 3,
    avatar: Img3,
    time: '2 hour ago',
    title: 'Forms',
    description: "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
    date: 'Yesterday'
  },
  {
    id: 4,
    avatar: Img4,
    time: '12 hour ago',
    title: 'Challenge invitation',
    description: 'Jonny aber invites you to join the challenge',
    actions: true,
    date: 'Yesterday'
  },
  {
    id: 5,
    avatar: Img5,
    time: '5 hour ago',
    title: 'Security',
    description: "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
    date: 'Yesterday'
  }
];

// =============================|| MAIN LAYOUT - HEADER ||============================== //

export default function Header() {
  const navigate = useNavigate();
  const { menuMaster } = useGetMenuMaster();

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('')

  const [isLoading, setIsLoading] = useState(false)

  const drawerOpen = menuMaster?.isDashboardDrawerOpened;
  const empInfo = JSON.parse(localStorage.getItem('user'));

  const HandleLogOut = () => {
    axios.post(`${config.baseApi}/authentication/isactivelogout`, {
      id_master: empInfo.id_master,
      is_active: 0
    })

    localStorage.removeItem('user');
    window.location.replace('/');
  };

  // Function to construct the full image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    const normalizedPath = imagePath.replace(/\\/g, '/');

    if (normalizedPath.startsWith('http')) return normalizedPath;

    const cleanPath = normalizedPath.startsWith('/') ? normalizedPath.slice(1) : normalizedPath;

    const fullUrl = `${config.baseApi}/${cleanPath}`;

    return fullUrl;
  };

  const [cartData, setCartData] = useState([]);
  const [variantStock, setVariantStock] = useState({}); // Store variant stock info

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
    if (newQuantity < 1) return; // Prevent negative quantities

    // Check stock before updating
    const stockInfo = variantStock[variantId];
    if (stockInfo && stockInfo.stock < newQuantity) {
      setError(`Only ${stockInfo.stock} items available in stock`);
      return;
    }

    try {

      // Update quantity in backend
      await axios.post(`${config.baseApi}/product/update-cart`, {
        product_cart_id: cartId,
        updated_by: empInfo.user_name,
        quantity: newQuantity
      });

      // Update local state
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

      // Update local state
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
      setIsLoading(false)
    } catch (err) {
      console.error('Unable to clear cart: ', err);
    }
  };

  // Function to handle product click with stock check
  const handleProductClick = (cart) => {
    const stockInfo = variantStock[cart.variant_id];
    if (stockInfo && stockInfo.isOutOfStock) {
      // If out of stock, don't navigate
      return;
    }
    navigate(`/products/product-view?id=${cart.product_id}`);
  };

  // Fetch cart data and variant stock
  // Fetch cart data and variant stock
  useEffect(() => {
    let isMounted = true;
    let intervalID = null;

    const fetchCartData = async () => {
      if (!isMounted) return;

      try {
        // Get fresh user info on each fetch to avoid stale data
        const currentUser = JSON.parse(localStorage.getItem('user'));
        if (!currentUser?.user_name) return;

        const fetchcart = await axios.get(`${config.baseApi}/product/get-all-cart`);
        const cartdata = fetchcart.data;

        const cartUser = cartdata.filter(e => e.created_by === currentUser.user_name);

        if (isMounted) {
          setCartData(cartUser);

          // Fetch stock for all variants
          const variantIds = [...new Set(cartUser.map(item => item.variant_id))];
          const stockPromises = variantIds.map(variantId => fetchVariantStock(variantId));
          const stockResults = await Promise.all(stockPromises);

          // Create a stock map
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

    // Initial fetch
    fetchCartData();

    // Set interval for polling (every 5 seconds)
    intervalID = setInterval(fetchCartData, 5000);

    // Cleanup
    return () => {
      isMounted = false;
      if (intervalID) clearInterval(intervalID);
    };
  }, []); // Empty dependency array is OK since we get user from localStorage

  // Handle checkout with stock validation
  const handleCheckOut = async () => {
    try {
      // Validate stock for all cart items
      const validationResult = await validateCartStock(cartData);

      if (validationResult.hasErrors) {
        handleValidationErrors(validationResult);
        return;
      }

      // Update local stock state
      updateLocalStockState(validationResult.stockResults);

      // Process checkout - update stock in database
      const updateSuccess = await processStockUpdates(validationResult.stockResults);

      if (!updateSuccess) {
        setError('Some items could not be processed. Please try again.');
        return;
      }

      // Complete checkout
      await completeCheckout();

    } catch (error) {
      console.error('Error during checkout process:', error);
      setError('An error occurred during checkout. Please try again.');
    }
  };

  // Helper function to validate cart stock
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

  // Check stock for a single variant
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

  // Handle different types of validation errors
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

  // Update local stock state
  const updateLocalStockState = (stockResults) => {
    const updatedStock = { ...variantStock };

    stockResults.forEach(result => {
      updatedStock[result.cart.variant_id] = {
        stock: result.stock,
        isOutOfStock: result.isOutOfStock
      };
    });

    setVariantStock(updatedStock);
    console.log('Updated stock state:', updatedStock);
  };

  // Process stock updates in database
  const processStockUpdates = async (stockResults) => {
    const updatePromises = stockResults.map(updateVariantStock);
    const updateResults = await Promise.all(updatePromises);

    return updateResults.every(result => result.success);
  };

  // Update stock for a single variant
  const updateVariantStock = async (result) => {
    try {
      setIsLoading(true)
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

  // Complete the checkout process
  const completeCheckout = async () => {
    console.log('All stock checks passed. Proceeding to checkout...');
    setSuccess('Checkout successful!');

    // Clear cart after successful checkout
    await handleRemoveAll();

    // Navigate to order confirmation or receipt page
    // navigate('/checkout/success');
  };

  return (
    <header className="pc-header">
      <div className="header-wrapper">
        <div className="me-auto pc-mob-drp">
          {/* ... (keep your existing navbar code) */}
        </div>
        <div className="ms-auto">
          {/* Notification */}
          <Nav className="list-unstyled">
            {/* CART NOTIF */}
            <Dropdown className="pc-h-item" align="end">

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



              <Dropdown.Toggle className="pc-head-link me-0 arrow-none" variant="link" id="notification-dropdown">
                <i className="ph ph-shopping-cart" />
                <span className="badge bg-success pc-h-badge">{cartData.length}</span>
              </Dropdown.Toggle>

              <Dropdown.Menu className="dropdown-notification pc-h-dropdown">

                {isLoading && (
                  <CartLoadingOverlay text="Loading..." />
                )}



                <Dropdown.Header className="d-flex align-items-center justify-content-between">
                  <h5 className="m-0">Cart ({cartData.length} items)</h5>
                  {cartData.length > 0 && (
                    <Button variant="link" className="btn-sm p-0 text-decoration-none" onClick={handleRemoveAll}>
                      Remove All
                    </Button>
                  )}
                </Dropdown.Header>
                <SimpleBarScroll style={{ maxHeight: 'calc(100vh - 215px)' }}>
                  <div className="dropdown-body text-wrap position-relative">
                    {cartData.length === 0 ? (
                      <div className="text-center py-3">
                        <p className="text-muted mb-0">Your cart is empty</p>
                      </div>
                    ) : (
                      cartData.map((cart) => {
                        const stockInfo = variantStock[cart.variant_id];
                        const isOutOfStock = stockInfo?.isOutOfStock || false;
                        const availableStock = stockInfo?.stock || 0;
                        const currentQuantity = parseInt(cart.quantity) || 1;

                        return (
                          <MainCard
                            key={cart.product_cart_id}
                            className="mb-2"
                            style={{
                              opacity: isOutOfStock ? 0.6 : 1,
                              cursor: isOutOfStock ? 'not-allowed' : 'pointer'
                            }}
                          >
                            <Stack
                              direction="horizontal"
                              gap={3}
                              className="align-items-start"
                              onClick={() => !isOutOfStock && handleProductClick(cart)}

                            >
                              {cart.attachment && (
                                <div style={{ position: 'relative' }}>
                                  <Image
                                    className="img-radius avatar rounded-0"
                                    src={getImageUrl(cart.attachment)}
                                    alt={cart.product_name || 'Product image'}
                                    width={80}
                                    height={80}
                                    style={{
                                      objectFit: 'cover',
                                      minWidth: '80px',
                                      minHeight: '80px',
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
                                  <h6 className="text-body mb-0" style={{ color: isOutOfStock ? '#999' : 'inherit' }}>
                                    {cart.product_name || 'Product'}
                                    {isOutOfStock && (
                                      <Badge bg="danger" className="ms-2" style={{ fontSize: '10px' }}>
                                        Out of Stock
                                      </Badge>
                                    )}
                                  </h6>
                                  <Button
                                    variant="link"
                                    className="text-danger p-0 ms-2"
                                    onClick={() => handleRemoveItem(cart.product_cart_id)}
                                    style={{ fontSize: '12px' }}
                                  >
                                    <i className="ph ph-x" />
                                  </Button>
                                </div>

                                {cart.variant && (
                                  <p className="mb-1 text-muted small">{cart.variant}</p>
                                )}

                                {/* Stock information */}
                                {/* {stockInfo && (
                                  <p className="mb-1 small" style={{ color: isOutOfStock ? '#dc3545' : '#28a745' }}>
                                    <i className={`ph ${isOutOfStock ? 'ph-warning-circle' : 'ph-check-circle'} me-1`} />
                                    {isOutOfStock ? 'Out of Stock' : `${availableStock} available in stock`}
                                  </p>
                                )} */}

                                <div className="d-flex justify-content-between align-items-center">
                                  <p className="mb-0 fw-bold" style={{ color: isOutOfStock ? '#999' : 'inherit' }}>
                                    ${cart.product_price}
                                  </p>

                                  {/* Quantity Selection */}
                                  <div className="d-flex align-items-center">
                                    <span className="text-muted small me-2">Qty:</span>
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
                                        <i className="ph ph-minus" style={{ fontSize: '12px' }} />
                                      </Button>
                                      <span
                                        className="px-2"
                                        style={{
                                          minWidth: '30px',
                                          textAlign: 'center',
                                          color: isOutOfStock ? '#999' : 'inherit'
                                        }}
                                      >
                                        {currentQuantity}
                                        {!isOutOfStock && availableStock > 0 && currentQuantity > availableStock && (
                                          <span className="text-danger ms-1" style={{ fontSize: '10px' }}>
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
                                        <i className="ph ph-plus" style={{ fontSize: '12px' }} />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Stack>
                          </MainCard>
                        );
                      })
                    )}
                  </div>
                </SimpleBarScroll>
                <hr />
                {cartData.length > 0 && (
                  <div className="text-center py-2">
                    {/* Total row */}
                    <div className="d-flex justify-content-between align-items-center mb-2 px-3">
                      <span className="fw-bold">Total:</span>
                      <span className="fw-bold">${cartTotal.toFixed(2)}</span>
                    </div>

                    {/* Check if any item is out of stock */}
                    {cartData.some(cart => {
                      const stockInfo = variantStock[cart.variant_id];
                      return stockInfo?.isOutOfStock;
                    }) && (
                        <div className="alert alert-danger mb-2 mx-3 py-2" role="alert" style={{ fontSize: '12px' }}>
                          <i className="ph ph-warning-circle me-1" />
                          Some items in your cart are out of stock. Please remove them to proceed.
                        </div>
                      )}

                    {/* Checkout button row */}
                    <div className="d-flex justify-content-end px-3">
                      <BTN
                        label={'Withdraw'}
                        size="small"
                        onClick={handleCheckOut}
                        disabled={cartData.some(cart => {
                          const stockInfo = variantStock[cart.variant_id];
                          return stockInfo?.isOutOfStock;
                        })}
                      />
                    </div>
                  </div>
                )}
              </Dropdown.Menu>
            </Dropdown>

            {/* Profile Section */}
            <Dropdown className="pc-h-item" align="end">
              <Dropdown.Toggle
                className="pc-head-link arrow-none me-0"
                variant="link"
                id="user-profile-dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                <i className="ph ph-user-circle" />
              </Dropdown.Toggle>

              <Dropdown.Menu className="dropdown-user-profile pc-h-dropdown p-0 overflow-hidden">
                <Dropdown.Header style={{ backgroundColor: '#b172b1ff' }} >
                  <Stack direction="horizontal" gap={3} className="my-2">
                    <div className="flex-shrink-0">
                      {/* Also increased the profile avatar size */}
                      <Image
                        src={Img2}
                        alt="user-avatar"
                        className="user-avatar"
                        width={50}
                        height={50}
                        roundedCircle
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                    <Stack gap={1}>
                      <h6 className="text-white mb-0">{
                        empInfo.first_name.charAt(0).toUpperCase() + empInfo.first_name.slice(1).toLowerCase() + ' ' +
                        empInfo.last_name.charAt(0).toUpperCase() + empInfo.last_name.slice(0).toLowerCase()
                      }</h6>
                      <span className="text-white text-opacity-75">{empInfo.user_email}</span>
                    </Stack>
                  </Stack>
                </Dropdown.Header>

                <div className="dropdown-body">
                  <div className="profile-notification-scroll position-relative" style={{ maxHeight: 'calc(100vh - 225px)' }}>
                    <Dropdown.Item as={Link} to="#" className="justify-content-start">
                      <i className="ph ph-gear me-2" />
                      Settings
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="#" className="justify-content-start">
                      <i className="ph ph-share-network me-2" />
                      Share
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="#" className="justify-content-start">
                      <i className="ph ph-lock-key me-2" />
                      Change Password
                    </Dropdown.Item>
                    <div className="d-grid my-2">
                      {/* <Button onClick={HandleLogOut} style={{ backgroundColor: '#93629cff', borderColor: '#660096ff' }}>
                        <i className="ph ph-sign-out align-middle me-2" />
                        Logout
                      </Button> */}
                      <BTN onClick={HandleLogOut} label={'Logout'} />
                    </div>
                  </div>
                </div>
              </Dropdown.Menu>
            </Dropdown>

          </Nav>
        </div>
      </div>
    </header>
  );
}