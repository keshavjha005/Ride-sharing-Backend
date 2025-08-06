# Mate Admin Panel Frontend

A modern React-based admin panel for the Mate ride-sharing platform, built with Vite, Tailwind CSS, and following the design tokens specification.

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Backend server running on port 5000

### Installation

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   - Landing page: http://localhost:3000
   - Admin panel: http://localhost:3000/admin

## 📁 Project Structure

```
frontend/
├── public/                 # Static files
│   └── index.html         # Main HTML file
├── src/
│   ├── components/        # Reusable components
│   │   └── admin/         # Admin-specific components
│   ├── pages/            # Page components
│   │   ├── LandingPage.jsx
│   │   └── admin/        # Admin pages
│   ├── styles/           # CSS and styling
│   │   └── index.css     # Main styles with design tokens
│   ├── utils/            # Utility functions
│   │   └── AuthContext.jsx
│   ├── App.jsx           # Main app component
│   └── main.jsx          # Entry point
├── package.json
├── tailwind.config.js    # Tailwind configuration with design tokens
├── vite.config.js        # Vite configuration
└── README.md
```

## 🎨 Design System

The frontend follows the design tokens defined in `docs/sprints/sprint-5-admin-panel/design-tokens.json`:

### Colors
- **Primary**: #FD7A00 (Orange)
- **Background**: Dark theme (#1E1F25, #2A2B32, #34353D)
- **Text**: White and gray variations
- **Status Colors**: Success, Warning, Error, Info

### Typography
- **Font Family**: Inter (Google Fonts)
- **Font Sizes**: xs (12px) to 2xl (32px)
- **Font Weights**: Regular (400) to Bold (700)

### Components
- **Buttons**: Primary, Secondary, Disabled states
- **Cards**: With hover effects and shadows
- **Forms**: Input fields with proper styling
- **Tables**: Responsive with hover states
- **Modals**: Overlay with backdrop

## 🔐 Authentication

The admin panel uses JWT-based authentication:

### Default Admin Credentials
- **Email**: admin@mate.com
- **Password**: admin123

### Features
- Automatic token refresh
- Protected routes
- Session management
- Role-based access control

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### API Configuration

The frontend is configured to proxy API requests to the backend:

- **Development**: http://localhost:5000 (via Vite proxy)
- **Production**: Configure in environment variables

### Adding New Pages

1. Create a new component in `src/pages/admin/`
2. Add the route in `src/App.jsx`
3. Add navigation link in `src/components/admin/Sidebar.jsx`

### Styling Guidelines

- Use Tailwind CSS classes with the custom design tokens
- Follow the component patterns in `src/styles/index.css`
- Maintain dark theme consistency
- Use the predefined color palette

## 📱 Responsive Design

The admin panel is fully responsive:

- **Desktop**: Full sidebar navigation
- **Tablet**: Collapsible sidebar
- **Mobile**: Hamburger menu with overlay

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=Mate Admin
```

### Tailwind Configuration

The `tailwind.config.js` file includes all design tokens as custom properties, making them available as Tailwind classes.

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Serving Static Files

You can serve the built files using any static file server:

```bash
# Using serve
npx serve dist

# Using nginx
# Copy dist/ contents to your nginx web root
```

## 📋 Features Implemented

### ✅ Task 5.1: Admin Authentication & Authorization
- [x] Admin login/logout system
- [x] JWT token management
- [x] Role-based access control
- [x] Protected routes
- [x] Session management

### 🎯 Next Tasks
- [ ] Task 5.2: Admin Dashboard & Analytics
- [ ] Task 5.3: User Management System
- [ ] Task 5.4: Ride Management & Monitoring
- [ ] Task 5.5: Localization Management System
- [ ] Task 5.6: System Configuration Management
- [ ] Task 5.7: Reporting & Analytics

## 🤝 Contributing

1. Follow the existing code structure
2. Use the design tokens for styling
3. Maintain responsive design
4. Add proper error handling
5. Include loading states
6. Test on different screen sizes

## 📞 Support

For questions or issues:
1. Check the backend API documentation
2. Review the design tokens specification
3. Check the console for errors
4. Ensure the backend server is running

---

**Note**: This is the frontend implementation for Sprint 5 - Admin Panel. The backend API endpoints are implemented separately in the main backend directory. 