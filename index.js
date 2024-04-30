
const express = require('express');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const cors = require('cors');
const multer = require('multer');
const Order = require('./order');
const upload = multer({ dest: 'uploads/' });
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 3000;

require('dotenv').config();
app.use(bodyParser.json());
app.use(cors());
app.use(express.json()); // Parse JSON requests


const saltRounds = 10;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

// Connect to MongoDB (replace with your MongoDB connection string)
mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
const db = mongoose.connection;

// Define a schema for storing image URLs
const imageSchema = new mongoose.Schema({
    url: String,
});

const Image = mongoose.model('Image', imageSchema);

// Define a schema for products
const productSchema = new mongoose.Schema({
    productImage: String,
    title: String,
    description: String,
    price: String,
    colors: [
        {
            color: String,
            tones: [
                {
                    tone: String,
                    shade: String, // Store image URLs here
                },
            ],
        },
    ],
});

const Product = mongoose.model('Product', productSchema);

app.post('/upload-product-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Image file not found' });
        }

        // Upload the image to Cloudinary
        const imageResult = await cloudinary.uploader.upload(req.file.path);

        // Respond with the image URL
        res.status(200).json({ imageUrl: imageResult.secure_url });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Image upload failed' });
    }
});

// Define a route to handle image uploads and product uploads
app.post('/upload-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Image file not found' });
        }

        // Upload the image to Cloudinary
        const imageResult = await cloudinary.uploader.upload(req.file.path);

        // Respond with the image URL
        res.status(200).json({ imageUrl: imageResult.secure_url });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Image upload failed' });
    }
});

app.post('/upload', async (req, res) => {
    try {
        // Create a new product with the provided data
        const newProduct = new Product(req.body);

        // Save the product to the database
        await newProduct.save();

        res.status(200).json({ message: 'Product uploaded successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Upload failed' });
    }
});
app.get('/products', async (req, res) => {
    try {
        // Fetch all products from the database
        const products = await Product.find();
        res.status(200).json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

app.delete('/products/:productId', async (req, res) => {
    const { productId } = req.params;

    try {
        // Find the product by its ID and delete it
        const deletedProduct = await Product.findByIdAndDelete(productId);

        if (!deletedProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});
app.post('/place-order', async (req, res) => {
    // const orderData = req.body;

    try {
        // Create a new Order instance based on the schema
        const order = new Order(req.body);

        // Save the order data to the database
        await order.save();

        // Send a response
        res.json({ message: 'Order received and saved successfully' });
    } catch (error) {
        console.error('Error saving order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


const secretKey = '7d0b5b0e7bb5147c33d35ec397ee88f9067cca2e4ef5cd481e2c0a3a6ba97b5d'; // Replace with a secure secret key for JWT

const adminSchema = new mongoose.Schema({
    email: String,
    passwordHash: String,
});

const Admin = mongoose.model('Admin', adminSchema);
// Endpoint to handle admin login
app.post('/admin/login', async (req, res) => {
    const { email, password } = req.body;
    // console.log(req.body)

    try {
        // Find the admin record by email
        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(401).json({ error: 'Admin not found' });
        }

        // Check if the provided password matches the hashed password in the database
        if (bcrypt.compareSync(password, admin.passwordHash)) {
            // Generate an access token
            const accessToken = jwt.sign({ email: admin.email }, secretKey, { expiresIn: '1h' });

            res.json({ message: 'Admin logged in successfully', accessToken });
        } else {
            res.status(401).json({ error: 'Invalid password' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post("/register", async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if an admin with the same email already exists
        const existingAdmin = await Admin.findOne({ email });

        if (existingAdmin) {
            return res.status(400).json({ error: 'Admin with this email already exists' });
        }

        // Hash the provided password
        const hashedPassword = bcrypt.hashSync(password, saltRounds);

        // Create a new admin document and save it to the database
        const newAdmin = new Admin({
            email,
            passwordHash: hashedPassword,
        });

        await newAdmin.save();

        res.status(201).json({ message: 'Admin registered successfully' });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
);
app.get('/orders', async (req, res) => {
    try {
        const orders = await Order.find(); // Retrieve all orders from the database

        res.json(orders); // Send the orders as a JSON response
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


