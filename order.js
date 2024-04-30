const mongoose = require('mongoose');

// Define the schema for the order data
const orderSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    email: {
        type: String,
    },
    phoneNumber: {
        type: String,
    },
    address: {
        type: String,
    },
    order: [
        {
            id: {
                type: String,
            },
            title: {
                type: String,
            },
            description: {
                type: String,
            },
            image: {
                type: String,
            },
            price: {
                type: Number,
            },
            color: {
                type: String,
            },
            tone: {
                type: String,
            },
            shade: String, // Optional field, can be empty or a string
        },
    ],
});

// Create a model based on the schema
const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
