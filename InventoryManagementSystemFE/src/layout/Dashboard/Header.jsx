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
  const { menuMaster } = useGetMenuMaster();
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

    // Replace backslashes with forward slashes for URLs
    const normalizedPath = imagePath.replace(/\\/g, '/');

    // If the path is already a full URL, return it as is
    if (normalizedPath.startsWith('http')) return normalizedPath;

    // Remove leading slash if present to avoid double slashes
    const cleanPath = normalizedPath.startsWith('/') ? normalizedPath.slice(1) : normalizedPath;

    // Construct the full URL
    const fullUrl = `${config.baseApi}/${cleanPath}`;

    return fullUrl;
  };

  const [cartData, setCartData] = useState([])

  // Calculate total function
  const calculateTotal = () => {
    return cartData.reduce((sum, item) => {
      const price = parseFloat(item.product_price) || 0;
      const quantity = parseInt(item.quantity) || 1;
      return sum + (price * quantity);
    }, 0);
  };

  const cartTotal = calculateTotal();

  // Function to handle quantity change
  const handleQuantityChange = async (cartId, newQuantity) => {
    if (newQuantity < 1) return; // Prevent negative quantities

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
      await axios.post(`${config.baseApi}/product/clear-cart`);
      setCartData([]);
    } catch (err) {
      console.error('Unable to clear cart: ', err);
    }
  };

  useEffect(() => {
    const fetchCartData = async () => {
      try {
        const fetchcart = await axios.get(`${config.baseApi}/product/get-all-cart`);
        const cartdata = fetchcart.data;
        setCartData(cartdata);
        console.log('ALL CART DATA: ', cartdata);
      } catch (err) {
        console.error('Unable to fetch cart data: ', err);
      }
    };

    fetchCartData();
  }, []);

  return (
    <header className="pc-header">
      <div className="header-wrapper">
        <div className="me-auto pc-mob-drp">
          <Nav className="list-unstyled">
            <Nav.Item className="pc-h-item pc-sidebar-collapse">
              <Nav.Link
                as={Link}
                to="#"
                className="pc-head-link ms-0"
                id="sidebar-hide"
                onClick={() => {
                  handlerDrawerOpen(!drawerOpen);
                }}
              >
                <i className="ph ph-list" />
              </Nav.Link>
            </Nav.Item>

            <Nav.Item className="pc-h-item pc-sidebar-popup">
              <Nav.Link as={Link} to="#" className="pc-head-link ms-0" id="mobile-collapse" onClick={() => handlerDrawerOpen(!drawerOpen)}>
                <i className="ph ph-list" />
              </Nav.Link>
            </Nav.Item>

            <Dropdown className="pc-h-item dropdown">
              <Dropdown.Toggle variant="link" className="pc-head-link arrow-none m-0 trig-drp-search" id="dropdown-search">
                <i className="ph ph-magnifying-glass" />
              </Dropdown.Toggle>
              <Dropdown.Menu className="pc-h-dropdown drp-search">
                <Form className="px-3 py-2">
                  <Form.Control type="search" placeholder="Search here. . ." className="border-0 shadow-none" />
                </Form>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </div>
        <div className="ms-auto">

          {/* Notification */}
          <Nav className="list-unstyled">

            {/* CART NOTIF */}
            <Dropdown className="pc-h-item" align="end">
              <Dropdown.Toggle className="pc-head-link me-0 arrow-none" variant="link" id="notification-dropdown">
                <i className="ph ph-shopping-cart" />
                <span className="badge bg-success pc-h-badge">{cartData.length}</span>
              </Dropdown.Toggle>

              <Dropdown.Menu className="dropdown-notification pc-h-dropdown">
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
                      cartData.map((cart) => (
                        <MainCard key={cart.id} className="mb-2">
                          <Stack direction="horizontal" gap={3} className="align-items-start">
                            {cart.attachment && (
                              <Image
                                className="img-radius avatar rounded-0"
                                src={getImageUrl(cart.attachment)}
                                alt={cart.product_name || 'Product image'}
                                width={80}
                                height={80}
                                style={{
                                  objectFit: 'cover',
                                  minWidth: '80px',  /* Ensure minimum size */
                                  minHeight: '80px'   /* Ensure minimum size */
                                }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            )}
                            <div className="flex-grow-1">
                              <div className="d-flex justify-content-between align-items-start mb-1">
                                <h6 className="text-body mb-0">{cart.product_name || 'Product'}</h6>
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

                              <div className="d-flex justify-content-between align-items-center">
                                <p className="mb-0 fw-bold">
                                  ${cart.product_price}
                                </p>

                                {/* Quantity Selection - Now on the right side */}
                                <div className="d-flex align-items-center">
                                  <span className="text-muted small me-2">Qty:</span>
                                  <div className="d-flex align-items-center border rounded">
                                    <Button
                                      variant="link"
                                      className="p-1 text-decoration-none"
                                      onClick={() => handleQuantityChange(cart.product_cart_id, (parseInt(cart.quantity) || 1) - 1)}
                                      disabled={(parseInt(cart.quantity) || 1) <= 1}
                                    >
                                      <i className="ph ph-minus" style={{ fontSize: '12px' }} />
                                    </Button>
                                    <span className="px-2" style={{ minWidth: '30px', textAlign: 'center' }}>
                                      {cart.quantity || 1}
                                    </span>
                                    <Button
                                      variant="link"
                                      className="p-1 text-decoration-none"
                                      onClick={() => handleQuantityChange(cart.product_cart_id, (parseInt(cart.quantity) || 1) + 1)}
                                    >
                                      <i className="ph ph-plus" style={{ fontSize: '12px' }} />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Stack>
                        </MainCard>
                      ))
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

                    {/* Checkout button row */}
                    <div className="d-flex justify-content-end px-3">
                      <BTN label={'Checkout'} size="small" />
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
                <Dropdown.Header className="bg-primary">
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
                      <Button onClick={HandleLogOut}>
                        <i className="ph ph-sign-out align-middle me-2" />
                        Logout
                      </Button>
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