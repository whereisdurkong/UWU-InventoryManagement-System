var express = require('express');
var bcrypt = require('bcrypt');
const nodemailer = require("nodemailer");
const router = express.Router();
var Sequelize = require('sequelize');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');                // <== Needed for fs.existsSync
const fsp = require('fs/promises');
const { type } = require('os');
require('dotenv').config();
const archiver = require('archiver');
const { DataTypes } = Sequelize;

const DIR = './uploads';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, DIR);
    },
    filename: function (req, file, cb) {
        const original = file.originalname.replace(/\s+/g, '_');
        const uniqueName = `${new Date().toISOString().replace(/[:.]/g, '-')}_${original}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 200 * 1024 * 1024 } // 200 MB
});


var knex = require("knex")({
    client: 'mssql',
    connection: {
        user: process.env.USER,
        password: process.env.PASSWORD,
        server: process.env.SERVER,
        database: process.env.DATABASE,
        port: parseInt(process.env.APP_SERVER_PORT),
        options: {
            enableArithAbort: true,

        }
    },
});

var db = new Sequelize(process.env.DATABASE, process.env.USER, process.env.PASSWORD, {
    host: process.env.SERVER,
    dialect: "mssql",
    port: parseInt(process.env.APP_SERVER_PORT),
});

const Product = db.define('product_master', {
    product_id: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    product_name: {
        type: DataTypes.STRING
    },
    product_description: {
        type: DataTypes.STRING
    },
    product_category: {
        type: DataTypes.STRING
    },
    product_subcategory: {
        type: DataTypes.STRING
    },
    attachment: {
        type: DataTypes.STRING
    },
    product_sku: {
        type: DataTypes.STRING
    },
    unit_of_measure: {
        type: DataTypes.STRING
    },
    is_active: {
        type: DataTypes.STRING
    },
    created_by: {
        type: DataTypes.STRING
    },
    created_at: {
        type: DataTypes.STRING
    },
    updated_by: {
        type: DataTypes.STRING
    },
    updated_at: {
        type: DataTypes.STRING
    }
}, {
    freezeTableName: false,
    timestamps: false,
    createdAt: false,
    updatedAt: false,
    tableName: 'product_master'
})

const ProductVairant = db.define('product_variant', {
    variant_id: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    product_id: {
        type: DataTypes.INTEGER
    },
    variant_type: {
        type: DataTypes.STRING
    },
    size: {
        type: DataTypes.STRING
    },
    color: {
        type: DataTypes.STRING
    },
    quantity_in_stock: {
        type: DataTypes.STRING
    },
    purchase_price: {
        type: DataTypes.STRING
    },
    selling_price: {
        type: DataTypes.STRING
    },
    created_at: {
        type: DataTypes.STRING
    },
    created_by: {
        type: DataTypes.STRING
    },
    updated_by: {
        type: DataTypes.STRING
    },
    updated_at: {
        type: DataTypes.STRING
    }
}, {
    freezeTableName: false,
    timestamps: false,
    createdAt: false,
    updatedAt: false,
    tableName: 'product_variant'
})

router.post('/add-product', upload.single('attachment'), async function (req, res) {
    let attachmentPath = null;

    // Handle the uploaded file - store as "uploads\filename"
    if (req.file) {
        attachmentPath = `uploads\\${req.file.filename}`;
    }

    // Parse the product data from the form
    const productData = JSON.parse(req.body.productData);

    const {
        product_name,
        product_description,
        product_category,
        product_subcategory,
        product_sku,
        unit_of_measure,
        created_by,
        variant_type,
        variants = [],
        quantity_in_stock,
        purchase_price,
        selling_price
    } = productData;

    const trx = await knex.transaction();

    try {
        // Insert into product_master table
        const [productIdResult] = await trx('product_master')
            .insert({
                attachment: attachmentPath,
                product_name,
                product_description,
                product_category,
                product_subcategory,
                product_sku,
                unit_of_measure,
                is_active: true,
                created_by,
                created_at: new Date()
            })
            .returning('product_id');

        // Extract product_id (handles both object and direct value)
        const productId = productIdResult.product_id || productIdResult;

        // If it's a variant product, insert variants
        if (variant_type !== "none" && variants.length > 0) {
            const variantData = variants.map(variant => {
                let sizeValue = null;
                let colorValue = null;

                switch (variant_type) {
                    case "size":
                        sizeValue = variant.type;
                        break;
                    case "color":
                        colorValue = variant.type;
                        break;
                    case "size-color":
                        sizeValue = variant.type;
                        colorValue = variant.color;
                        break;
                }

                return {
                    product_id: productId,
                    variant_type: variant_type,
                    size: sizeValue,
                    color: colorValue,
                    quantity_in_stock: variant.quantity_in_stock || 0,
                    purchase_price: variant.purchase_price || 0,
                    selling_price: variant.selling_price || 0,
                    created_by: created_by,
                    created_at: new Date()
                };
            });

            // Insert variants and get all variant IDs
            const insertedVariants = await trx('product_variant')
                .insert(variantData)
                .returning('variant_id');

            // Create logs for each variant
            const logEntries = insertedVariants.map(variantResult => {
                // Extract variant_id (handles both object and direct value)
                const variantId = variantResult.variant_id || variantResult;

                return {
                    product_id: productId,
                    variant_id: variantId,
                    product_changes: `${created_by} added a product variant.`,
                    created_by: created_by,
                    created_at: new Date()
                };
            });

            // Insert all logs
            if (logEntries.length > 0) {
                await trx('product_logs').insert(logEntries);
            }
        }
        // If it's a simple product without variants
        else if (variant_type === "none") {
            const [insertedVariantResult] = await trx('product_variant').insert({
                product_id: productId,
                variant_type: "none",
                size: null,
                color: null,
                quantity_in_stock: quantity_in_stock || 0,
                purchase_price: purchase_price || 0,
                selling_price: selling_price || 0,
                created_by: created_by,
                created_at: new Date()
            }).returning('variant_id');

            // Extract variant_id
            const variantId = insertedVariantResult.variant_id || insertedVariantResult;

            await trx('product_logs').insert({
                product_id: productId,
                variant_id: variantId,
                product_changes: `${created_by} added a product.`,
                created_by: created_by,
                created_at: new Date()
            });
        }

        await trx.commit();
        res.status(200).json({
            message: "Product added successfully",
            product_id: productId,
            attachment: attachmentPath
        });

    } catch (error) {
        await trx.rollback();
        console.error("Error adding product:", error);

        // Delete uploaded file if transaction fails
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            error: "Failed to add product",
            details: error.message
        });
    }
});

router.get('/get-all-product-variants', async function (req, res) {
    try {
        const fetchall = await knex('product_variant').select('*');
        res.json(fetchall);
        console.log('triggered /get-all-product-variants')
    } catch (err) {
        console.log('INTERNAL ERROR: ', err)
    }
})

router.get('/get-all-product', async function (req, res) {
    try {
        const fetchall = await knex('product_master').select('*');
        res.json(fetchall);
        console.log('triggered /get-all-product-variants')
    } catch (err) {
        console.log('INTERNAL ERROR: ', err)
    }
})

router.get('/get-product-by-id', async function (req, res) {
    try {
        const fetchall = await Product.findAll({
            where: {
                product_id: req.query.id
            }
        });
        res.json(fetchall[0]);
        console.log('triggered /get-product-by-id')

    } catch (err) {
        console.log('INTERNAL ERROR: ', err)
    }
});

router.get('/get-variant-by-id', async function (req, res) {
    try {
        const fetchall = await ProductVairant.findAll({
            where: {
                variant_id: req.query.id
            }
        });
        res.json(fetchall[0]);
        console.log('triggered /get-product-by-id')

    } catch (err) {
        console.log('INTERNAL ERROR: ', err)
    }
});


router.post('/add-cart', async function (req, res) {
    try {

        const {
            product_id,
            variant_id,
            attachment,
            variant,
            quantity,
            product_name,
            product_price,
            created_by
        } = req.body;

        await knex('product_cart').insert({
            product_id,
            variant_id,
            attachment,
            variant,
            quantity,
            product_name,
            product_price,
            created_by
        })

        await knex('product_logs').insert({
            product_id,
            variant_id,
            product_changes: `${created_by} added to the cart`,
            created_by,
            created_at: new Date()
        })


        res.status(200).json({ message: "Added to cart successfully" });
    } catch (err) {
        console.log('INTERNAL ERROR: ', err)
    }
});

router.get('/get-all-cart', async function (req, res) {
    try {
        const getCarts = await knex('product_cart').select('*');
        res.json(getCarts)
    } catch (err) {
        console.log('INternal error: ', err)
    }
})

router.post('/update-cart', async function (req, res) {
    console.log(' triggered /update-cart ')
    try {
        const { product_cart_id, quantity, updated_by } = req.body;

        await knex('product_cart').where({ product_cart_id: product_cart_id }).update({
            quantity: quantity,
            updated_by: updated_by,
            updated_at: new Date()
        });
        res.status(200).json({ message: "Cart was updated" });

    } catch (err) {
        console.log('INTERNAL ERROR: ', err)
    }
});

router.post('/remove-from-cart', async function (req, res) {
    console.log('triggered /remove-cart');
    try {
        const { product_cart_id } = req.body;

        await knex('product_cart').where({ product_cart_id: product_cart_id }).del();

        res.status(200).json({ message: 'Product was removed from the cart' })
    } catch (err) {
        console.log('Internal Error: ', err)
    }
})

router.post('/update-product', upload.single('attachment'), async function (req, res) {
    try {
        let attachmentPath = null; // DECLARE the variable here

        if (!req.body.productData) {
            console.log('productData is missing');
            return res.status(400).json({ success: false, message: 'productData is required' });
        }

        const productData = JSON.parse(req.body.productData);
        console.log('Parsed productData:', productData);

        if (req.file) {
            attachmentPath = `uploads\\${req.file.filename}`; // Now this is properly defined
            console.log('New attachment path:', attachmentPath);
        } else {
            // Keep existing attachment if no new file is uploaded
            const existingProduct = await knex('product_master')
                .where({ product_id: productData.product_id })
                .select('attachment')
                .first();

            if (existingProduct && existingProduct.attachment) {
                attachmentPath = existingProduct.attachment;
                console.log('Keeping existing attachment:', attachmentPath);
            }
        }

        // Prepare update data
        const updateData = {
            product_name: productData.product_name,
            product_description: productData.product_description,
            product_category: productData.product_category,
            product_subcategory: productData.product_subcategory,
            product_sku: productData.product_sku,
            unit_of_measure: productData.unit_of_measure
        };

        // Only update attachment if we have a new path
        if (attachmentPath !== null) {
            updateData.attachment = attachmentPath;
        }

        // Update product master
        await knex('product_master')
            .where({ product_id: productData.product_id })
            .update(updateData);

        // Handle variants if they exist
        if (productData.variants && Array.isArray(productData.variants)) {
            for (const variant of productData.variants) {
                // Check if variant has variant_id (for updates) or needs to be inserted
                if (variant.variant_id) {
                    await knex('product_variant')
                        .where({
                            variant_id: variant.variant_id,
                            product_id: productData.product_id
                        })
                        .update({
                            size: variant.size || null,
                            color: variant.color || null,
                            quantity_in_stock: variant.quantity_in_stock || 0,
                            purchase_price: variant.purchase_price || 0,
                            selling_price: variant.selling_price || 0
                        });
                } else {
                    // Insert new variant
                    await knex('product_variant').insert({
                        product_id: productData.product_id,
                        size: variant.size || null,
                        color: variant.color || null,
                        quantity_in_stock: variant.quantity_in_stock || 0,
                        purchase_price: variant.purchase_price || 0,
                        selling_price: variant.selling_price || 0
                    });
                }
            }
        }

        res.json({
            success: true,
            message: 'Product updated successfully',
            attachmentPath: attachmentPath
        });

    } catch (error) {
        console.log('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
});

router.post(`/archive-product`, async function (req, res) {
    try {
        const { product_id, updated_by } = req.body;

        await knex('product_master').where({ product_id: product_id }).update({
            is_active: false,
            updated_by: updated_by,
            updated_at: new Date()
        })

        res.status(200).json({ message: "archived successfully" });
    } catch (err) {
        console.log('INTERNAL ERROR: ', err)
    }
});


router.post(`/unarchive-product`, async function (req, res) {
    try {
        const { product_id, updated_by } = req.body;

        await knex('product_master').where({ product_id: product_id }).update({
            is_active: true,
            updated_by: updated_by,
            updated_at: new Date()
        })

        res.status(200).json({ message: "archived successfully" });
    } catch (err) {
        console.log('INTERNAL ERROR: ', err)
    }
});


router.post(`/delete-product`, async function (req, res) {
    try {
        const { product_id, updated_by } = req.body;

        await knex('product_master').where({ product_id: product_id }).del();
        await knex('product_variant').where({ product_id: product_id }).del();
        await knex('product_cart').where({ product_id: product_id }).del();
        res.status(200).json({ message: "archived successfully" });
    } catch (err) {
        console.log('INTERNAL ERROR: ', err)
    }
});

router.post('/product-logs', async function (req, res) {
    try {
        const { changes_made, created_by, product_id, variant_id } = req.body;

        await knex('product_logs').insert({
            product_changes: created_by + ' updated ' + changes_made,
            product_id: product_id,
            variant_id: variant_id,
            created_by: created_by,
            created_at: new Date()
        })
        res.status(200).json({ message: "edit logs successfully" });
    } catch (err) {
        console.log('INTERNAL ERROR: ', err)
    }
});

router.post('/withdraw-product', async function (req, res) {
    try {
        const { product_id, variant_id, updated_by, quantity } = req.body;

        const variantData = await knex('product_variant').where({ variant_id }).first();
        const varDataQ = Number(variantData.quantity_in_stock)
        const newQuantity = varDataQ - quantity;

        await knex('product_variant').where({ variant_id: variant_id }).update({
            quantity_in_stock: newQuantity,
            updated_by: updated_by,
            updated_at: new Date()
        })
        res.status(200).json({ message: "withdraw product successfully" });

    } catch (err) {
        console.log('INTERNAL ERROR: ', err)
    }
});


router.post('/remove-all-cart', async function (req, res) {
    try {
        const { created_by } = req.body;

        await knex('product_cart').where({ created_by: created_by }).del();
        res.status(200).json({ message: "deleted product cart successfully" });
    } catch (err) {
        console.log('INTERNAL ERROR: ', err)
    }
})













module.exports = router;