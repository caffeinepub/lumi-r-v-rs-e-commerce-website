# Lumièrè & Vërsē E commerce Website

## Overview
A luxury e-commerce website for the brand Lumièrè & Vërsē featuring a complete shopping experience with product catalog, cart functionality, secure payments, order tracking, and admin management.

## Core Features

### Home Page
- Hero banner with brand imagery
- Featured products showcase
- Collections sections
- Promotional content areas
- Brand logo prominently displayed in header and footer

### Product Catalog
- Product categories and subcategories
- Sorting options (price, popularity, newest)
- Filtering by size, color, price range, category
- Product grid view with pagination
- Individual product detail pages with:
  - Multiple product images
  - Detailed descriptions
  - Size and color selection
  - Pricing information displayed in rupees (₹) with two decimal places formatting
  - Add to cart functionality

### Shopping Cart & Checkout
- Shopping cart with item management (add, remove, update quantities)
- User authentication via Internet Identity
- Secure checkout process with prices displayed in rupees (₹)
- Stripe payment integration for credit card processing
- Order confirmation and receipt generation with rupee formatting

### Order Management
- Order history for authenticated users with prices in rupees (₹)
- Order status tracking (processing, shipped, delivered)
- Estimated delivery times
- Map-based delivery tracking showing real-time progress
- Order details and invoice access with rupee price formatting

### Admin Dashboard
- Product management (add, edit, delete products)
- Price input fields clearly labeled for rupees (₹) entry
- Inventory tracking and updates
- Order management and status updates with rupee price display
- Sales analytics and reporting with rupee formatting

### Customer Support
- Contact page with inquiry form
- Store contact information display including:
  - Email address: lumiereverseworld@gmail.com
  - Contact number: 9305150125
- Contact details prominently displayed near the contact form and in the footer
- Responsive display ensuring visibility on both desktop and mobile devices
- Customer service integration

### Design & Branding
- Elegant, minimalist luxury design aesthetic
- Responsive layout for all device sizes
- Consistent use of Lumièrè & Vërsē branding
- Clean typography and sophisticated color scheme
- English language content throughout
- Consistent rupee (₹) price formatting across all components

## Price Display Requirements
- All prices displayed in rupees (₹) with two decimal places (e.g., ₹1999.00)
- Backend priceCents values divided by 100 for frontend display
- Admin input fields clearly indicate rupee (₹) entry
- Consistent formatting across product listings, details, checkout, orders, and admin sections

## Backend Data Storage
- Product catalog with images, descriptions, pricing, inventory
- User profiles and authentication data
- Order records and transaction history
- Shopping cart persistence
- Admin user management
- Contact form submissions

## External Integrations
- Internet Identity for user authentication
- Stripe for payment processing
- Map service for delivery tracking visualization
