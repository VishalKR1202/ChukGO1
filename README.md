# 🚂 ChukChukGO - Indian Railway Ticket Booking System

A comprehensive web-based train ticket booking platform that simulates the Indian Railways booking experience. Built with modern web technologies, it provides a complete solution for searching trains, booking tickets, managing PNR status, and even ordering food during journeys.

![ChukChukGO Logo](assets/logo.svg)

## ✨ Features

### 🎫 Core Booking Features
- **Train Search**: Search trains between stations with date and class preferences
- **Ticket Booking**: Complete booking flow with passenger details
- **PNR Status**: Check booking status using PNR numbers
- **Cancellation**: Cancel bookings with refund processing
- **Multiple Travel Classes**: Support for all Indian Railways classes (SL, 3A, 2A, 1A, CC, EC, etc.)
- **Quota System**: General, Tatkal, Ladies, Divyaang, Senior Citizen quotas

### 🍽️ TravelBites - Food Ordering
- **In-Journey Food Orders**: Order food for delivery at specific stations
- **Menu Management**: Browse and select from various food items
- **Order Tracking**: Track food order status and delivery
- **PNR Integration**: Link food orders to train bookings

### 👤 User Management
- **User Registration & Login**: Secure user authentication system
- **Profile Management**: Store user details and preferences
- **Booking History**: View past and current bookings

### 🎨 Modern UI/UX
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Bootstrap 5**: Modern, clean interface with professional styling
- **Real-time Updates**: Live time display and dynamic content updates
- **Interactive Elements**: Smooth animations and user-friendly interactions

## 🛠️ Technology Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with custom components
- **JavaScript (ES6+)** - Interactive functionality
- **Bootstrap 5** - Responsive UI framework
- **Feather Icons** - Beautiful iconography

### Backend
- **Python Flask** - RESTful API server
- **PostgreSQL** - Relational database
- **psycopg2** - PostgreSQL adapter for Python

### Additional Technologies
- **Node.js** - Development environment
- **Java** - Legacy servlet components (optional)
- **Stripe** - Payment processing integration

## 📋 Prerequisites

Before running this application, ensure you have the following installed:

- **Python 3.11+**
- **Node.js 20+**
- **PostgreSQL 16+**
- **Java** (for legacy components)

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd TrainTicketPro
```

### 2. Install Dependencies

#### Python Dependencies
```bash
pip install flask psycopg2-binary
```

#### Node.js Dependencies
```bash
npm install
```

### 3. Database Setup

#### Option A: Using PostgreSQL
1. Create a PostgreSQL database
2. Set the `DATABASE_URL` environment variable:
```bash
export DATABASE_URL="postgresql://username:password@localhost:5432/trainticketpro"
```

#### Option B: Using SQLite (Development)
The application will fall back to in-memory storage if no database is configured.

### 4. Environment Configuration
Create a `.env` file in the root directory:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/trainticketpro
FLASK_ENV=development
FLASK_DEBUG=1
```

### 5. Initialize Database
The application will automatically create database tables on first run.

## 🏃‍♂️ Running the Application

### Development Mode
```bash
python server.py
```

The application will be available at `http://localhost:5000`

### Production Mode
```bash
export FLASK_ENV=production
python server.py
```

## 📁 Project Structure

```
TrainTicketPro/
├── assets/                 # Static assets (logos, images)
├── css/                   # Stylesheets
│   ├── main.css          # Main styles
│   ├── styles.css        # Component styles
│   └── new-features.css  # Feature-specific styles
├── js/                   # JavaScript files
│   ├── main.js          # Main application logic
│   ├── booking.js       # Booking functionality
│   ├── payment.js       # Payment processing
│   └── validation.js    # Form validation
├── server/              # Server-side code
│   ├── index.ts         # TypeScript server entry
│   ├── db.ts           # Database operations
│   └── storage.ts      # Data storage utilities
├── src/main/java/      # Java servlet components
│   └── com/chukchukgo/
│       ├── dao/        # Data Access Objects
│       ├── models/     # Data models
│       ├── servlets/   # Java servlets
│       └── utils/      # Utility classes
├── server.py           # Flask application
├── index.html          # Main application page
├── package.json        # Node.js dependencies
└── README.md          # This file
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Train Operations
- `GET /api/trains` - Search trains
- `GET /search` - Web-based train search

### Booking Management
- `POST /api/bookings` - Create new booking
- `GET /api/pnr/<pnr>` - Get booking by PNR
- `POST /api/bookings/<pnr>/cancel` - Cancel booking

### Food Orders
- `POST /api/food-orders` - Create food order
- `GET /api/food-orders/<pnr>` - Get food orders for PNR
- `POST /api/food-orders/<pnr>/<order_id>/cancel` - Cancel food order

## 🎯 Usage Guide

### 1. Train Search
1. Navigate to the homepage
2. Enter source and destination stations
3. Select journey date and travel class
4. Choose number of passengers and quota
5. Click "Search Trains"

### 2. Ticket Booking
1. From search results, select a train
2. Fill in passenger details
3. Choose seat preferences
4. Complete payment process
5. Receive PNR confirmation

### 3. PNR Status Check
1. Click "PNR Status" in navigation
2. Enter your PNR number
3. View booking details and status

### 4. Food Ordering
1. Access TravelBites from navigation
2. Enter PNR number
3. Browse menu and select items
4. Choose delivery station
5. Complete order

## 🔒 Security Features

- **Input Validation**: Comprehensive form validation
- **SQL Injection Protection**: Parameterized queries
- **XSS Prevention**: Output sanitization
- **CSRF Protection**: Token-based protection

## 🧪 Testing

### Manual Testing
1. Test train search functionality
2. Verify booking flow end-to-end
3. Check PNR status retrieval
4. Test food ordering system
5. Validate cancellation processes

### Automated Testing
```bash
# Run tests (when implemented)
npm test
```

## 🚀 Deployment

### Local Development
```bash
python server.py
```

### Production Deployment
1. Set up PostgreSQL database
2. Configure environment variables
3. Use a production WSGI server (Gunicorn)
4. Set up reverse proxy (Nginx)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Frontend Development**: HTML5, CSS3, JavaScript
- **Backend Development**: Python Flask, PostgreSQL
- **UI/UX Design**: Bootstrap 5, Custom CSS
- **Database Design**: PostgreSQL schema design

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Version History

- **v1.0.0** - Initial release with core booking features
- **v1.1.0** - Added TravelBites food ordering system
- **v1.2.0** - Enhanced UI/UX and mobile responsiveness

---

**Note**: This is a demonstration project simulating Indian Railways booking system. It's not connected to the actual Indian Railways database and is intended for educational and portfolio purposes only. #   C h u k 
 
 #   C h u k 
 
 "# Chuk" 
#   C h u k  
 #   C h u k C h u k  
 #   C h u k C h u k  
 #   C h u k C h u k  
 "# ChukChuk" 
"# ChukGo" 
"# ChukGOGO" 
#   C h u k G O G O  
 "# ChukGOGO" 
