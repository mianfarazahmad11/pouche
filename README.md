# LuxeShop - Premium E-Commerce Platform

A full-stack Next.js e-commerce application built with Next.js App Router, MongoDB, Tailwind CSS, and custom JWT authentication.

## Features
- **User Authentication**: Secure JWT-based auth stored in HTTP-only cookies.
- **Role-based Access**: Separate flows for `user` and `admin`.
- **Storefront**: Premium design aesthetic, product grids, dynamic product detail pages.
- **Cart & Checkout**: Global state management with Zustand, mock Stripe test integration.
- **Orders & Invoices**: Track status, print styled HTML invoices for record-keeping.
- **Admin Dashboard**: Full CRUD for products, manage order statuses, track revenue.

## Requirements
- Node.js 18+
- MongoDB instance (local or Atlas)

## Setup Instructions

1. **Environment Variables**
   Rename `.env.example` to `.env.local` or copy its contents and add a valid MongoDB connection string.
   ```bash
   cp .env.example .env.local
   ```
   Provide your MongoDB URI:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/ecommerce
   JWT_SECRET=your_super_secret_jwt_key
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

## Demo Notes
- Create your first user account through `/register`.
- *Wait, how do I make an admin?* Since this is a demo, you can change your role directly in the MongoDB cluster collection `users` from `"user"` to `"admin"`, or change the register endpoint's default role assignment for testing.

## Deployment to Vercel
1. Push this repository to GitHub.
2. Link the repository to your Vercel account.
3. In Vercel Project Settings, add the environment variables defined in `.env.local`.
4. Deploy!
