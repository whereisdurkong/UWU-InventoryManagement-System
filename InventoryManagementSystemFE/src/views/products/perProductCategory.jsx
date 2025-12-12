import axios from 'axios';
import config from 'config';
import { useEffect, useState } from 'react';
import { Table, Badge, Image } from 'react-bootstrap';
// project-imports
import MainCard from 'components/MainCard';
import { useNavigate, useSearchParams } from 'react-router-dom';


export default function PerCategoryTable() {
    const [products, setProducts] = useState([]);
    const [productVariants, setProductVariants] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchParams] = useSearchParams();
    const category = searchParams.get('category');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            try {
                const decodedCategory = decodeURIComponent(category);

                const [variantsResponse, productsResponse] = await Promise.all([
                    axios.get(`${config.baseApi}/product/get-all-product-variants`),
                    axios.get(`${config.baseApi}/product/get-all-product`)
                ]);

                setProductVariants(variantsResponse.data);

                const allProducts = productsResponse.data;
                const CategoryFilter = allProducts.filter(product => {
                    if (!product.product_category) return false;

                    if (product.product_category === decodedCategory) return true;

                    if (product.product_category.toLowerCase() === decodedCategory.toLowerCase()) return true;

                    const normalizedDB = product.product_category.trim().toLowerCase();
                    const normalizedURL = decodedCategory.trim().toLowerCase();
                    if (normalizedDB === normalizedURL) return true;

                    return false;
                });

                console.log(`Found ${CategoryFilter.length} products for category: ${decodedCategory}`);
                setProducts(CategoryFilter);

            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [category]);

    // Function to count how many variants a product has
    const countVariants = (productId) => {
        return productVariants.filter(variant =>
            variant.product_id.toString() === productId.toString()
        ).length;
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

    if (loading) {
        return (
            <MainCard title="Products">
                <div className="text-center">Loading products...</div>
            </MainCard>
        );
    }

    const handleView = (product) => {
        console.log('WORKING');
        const params = new URLSearchParams({ id: product.product_id });
        navigate(`/products/product-view?${params.toString()}`);
    }

    return (
        <MainCard
            title={category}

        >
            <Table responsive hover className="mb-0">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Image</th>
                        <th>Product Name</th>
                        <th>Status</th>
                        <th>Category</th>
                        <th>Sub-category</th>
                        <th>Product SKU</th>
                        <th>Variants</th>
                    </tr>
                </thead>
                <tbody>
                    {products.length > 0 ? (
                        products.map((product) => {
                            const imageUrl = getImageUrl(product.attachment);
                            const variantCount = countVariants(product.product_id);
                            const productHasVariants = variantCount >= 2;

                            return (
                                <tr key={product.product_id} onClick={() => handleView(product)}>
                                    <td>{product.product_id}</td>
                                    <td>
                                        {imageUrl ? (
                                            <div>
                                                <Image
                                                    src={imageUrl}
                                                    alt={product.product_name}
                                                    width={80}
                                                    height={80}
                                                    style={{
                                                        objectFit: 'cover',
                                                        borderRadius: '4px'
                                                    }}
                                                    onError={(e) => {
                                                        console.log('Image failed to load:', imageUrl);
                                                        e.target.style.display = 'none';
                                                        // Create fallback if it doesn't exist
                                                        if (!e.target.nextSibling) {
                                                            const fallback = document.createElement('div');
                                                            fallback.style.cssText = `
                                                                width: 50px;
                                                                height: 50px;
                                                                background-color: #f8f9fa;
                                                                display: flex;
                                                                align-items: center;
                                                                justify-content: center;
                                                                border-radius: 4px;
                                                                font-size: 12px;
                                                                color: #6c757d;
                                                            `;
                                                            fallback.textContent = 'No Image';
                                                            e.target.parentNode.appendChild(fallback);
                                                        }
                                                    }}

                                                />
                                            </div>
                                        ) : (
                                            <div
                                                style={{
                                                    width: '50px',
                                                    height: '50px',
                                                    backgroundColor: '#f8f9fa',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderRadius: '4px',
                                                    fontSize: '12px',
                                                    color: '#6c757d'
                                                }}
                                            >
                                                No Image
                                            </div>
                                        )}
                                    </td>

                                    <td>{product.product_name}</td>
                                    <td>
                                        <Badge
                                            bg={product.is_active ? "success" : "secondary"}
                                        >
                                            {product.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                    </td>
                                    <td>{product.product_category || 'n/a'}</td>
                                    <td>{product.product_subcategory || 'n/a'}</td>
                                    <td>{product.product_sku || 'n/a'}</td>
                                    <td>
                                        {productHasVariants ? (
                                            <Badge bg="info" className="me-1">
                                                Has Variants ({variantCount})
                                            </Badge>
                                        ) : (
                                            <Badge bg="light" text="dark">
                                                No Variants
                                            </Badge>
                                        )}
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan="8" className="text-center">
                                No products found
                            </td>
                        </tr>
                    )}
                </tbody>
            </Table>
        </MainCard>
    );
}