import { useEffect } from "react";
import { categories } from "../components/categories";

const icons = {
    product: <i className="ph ph-package" />,
    add: <i className="ph ph-plus" />,
    chest: <i className="ph ph-treasure-chest" />,
    category: <i className="ph ph-tag" />,
    subcategory: <i className="ph ph-tag-chevron" />,
    cart: <i className="ph ph-note" />
};

// Convert imported categories to menu items
const categoryItems = categories.map(cat => {
    // Create URL-friendly version
    const categoryParam = encodeURIComponent(cat.category);

    return {
        id: `category-${categoryParam}`,
        title: cat.category,
        type: 'item',
        icon: icons.category,
        url: `/products/per-product-category?category=${categoryParam}`
        // or if you prefer route: `/products/category/${categoryParam}`
    };
});

const tools = {
    id: 'Tools',
    title: 'Tools',
    type: 'group',
    icon: icons.add,
    children: [
        // {
        //     id: 'product',
        //     title: 'Products',
        //     type: 'collapse',
        //     icon: icons.product,
        //     children: [
        //         // {
        //         //     id: 'add-product',
        //         //     title: 'Add Product',
        //         //     type: 'item',
        //         //     icon: icons.add,
        //         //     url: '/products/add-product'
        //         // },
        //         {
        //             id: 'cart',
        //             title: 'Cart',
        //             type: 'item',
        //             icon: icons.cart,
        //             url: '/products/Cart'
        //         },
        //         {
        //             id: 'product-table',
        //             title: 'All Products',
        //             type: 'item',
        //             icon: icons.chest,
        //             url: '/products/product-table'
        //         },
        //         // Add categories as children of product

        //     ]
        // },
        {
            id: 'cart',
            title: 'Menu',
            type: 'item',
            icon: icons.cart,
            url: '/products/Cart'
        },
        {
            id: 'product-table',
            title: 'All Products',
            type: 'item',
            icon: icons.chest,
            url: '/products/product-table'
        },
    ]
};

export default tools;