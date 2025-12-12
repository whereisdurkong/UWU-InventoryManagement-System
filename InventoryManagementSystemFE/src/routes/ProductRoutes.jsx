import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
// project-imports
import DashboardLayout from 'layout/Dashboard';
import Loadable from 'components/Loadable';
import ProductTable from '../views/products/productTable';
import ViewProduct from '../views/products/viewProduct';
import EditProduct from '../views/products/editProduct';
import PerCategoryTable from '../views/products/perProductCategory';
import Cart from '../views/products/cart';

// render - add products page
const AddProduct = Loadable(lazy(() => import('views/products/addProducts')));



// ==============================|| CHART & MAP ROUTING ||============================== //


const RoleAccess = () => {

    if (localStorage.getItem("user") === null) {
        return <Navigate to="/" replace />;
    } else {
        return <DashboardLayout />
    }
}

const ProductRoutes = {
    path: '/',
    element: <RoleAccess />,
    children: [
        {
            path: 'products',
            // element: <AddProduct />
            children: [
                {
                    path: 'add-product',
                    element: <AddProduct />
                    // element: <AddProduct />
                },
                {
                    path: 'product-table',
                    element: <ProductTable />
                },
                {
                    path: 'product-view',
                    element: <ViewProduct />
                },
                {
                    path: 'edit-product',
                    element: <EditProduct />
                },
                {
                    path: 'per-product-category',
                    element: <PerCategoryTable />
                },
                {
                    path: 'Cart',
                    element: <Cart />
                }

            ]

        }

    ]
};

export default ProductRoutes;
