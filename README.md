# ChukChukGO - Train Ticket Booking System

A modern train ticket booking system with HTML/CSS/JavaScript frontend and Python Flask backend.

## Features

- **Train Search**: Search trains between stations with real-time availability
- **Ticket Booking**: Complete booking flow with passenger details and payment
- **PNR Status**: Check booking status and passenger details
- **Ticket Cancellation**: Cancel bookings with refund calculation
- **User Authentication**: Register and login functionality
- **Responsive Design**: Mobile-friendly interface

## Technology Stack

### Frontend
- **HTML5**: Semantic markup and structure
- **CSS3**: Modern styling with Bootstrap 5
- **JavaScript**: Vanilla JS with modern ES6+ features
- **Bootstrap 5**: Responsive UI framework
- **Feather Icons**: Beautiful icon set

### Backend
- **Python 3.11+**: Core backend language
- **Flask**: Lightweight web framework
- **PostgreSQL**: Relational database
- **psycopg2**: PostgreSQL adapter
- **bcrypt**: Password hashing
- **python-dotenv**: Environment variable management

## Installation

### Prerequisites
- Python 3.11 or higher
- PostgreSQL 12 or higher
- pip (Python package manager)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chukchukgo
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Database Setup**
   - Create a PostgreSQL database named `chukchukgo`
   - Update database credentials in `.env` file

4. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

5. **Run the application**
   ```bash
   python run.py
   ```

6. **Access the application**
   - Open your browser and go to `http://localhost:5000`

## Project Structure

```
chukchukgo/
├── app.py                 # Main Flask application
├── run.py                 # Application entry point
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables
├── index.html            # Main HTML page
├── css/                  # Stylesheets
│   ├── styles.css        # Main styles
│   ├── main.css          # Additional styles
│   └── new-features.css  # Feature-specific styles
├── js/                   # Original JavaScript files
│   ├── main.js
│   ├── booking.js
│   ├── payment.js
│   └── validation.js
└── static/               # New frontend assets
    ├── js/
    │   ├── api.js        # API client
    │   └── app.js        # Main application logic
    └── css/
        ├── styles.css    # Style imports
        └── app.css       # New application styles
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Train Operations
- `GET /api/trains/search` - Search trains
- `GET /api/stations` - Get station list

### Booking Operations
- `POST /api/bookings` - Create new booking
- `GET /api/pnr/<pnr>` - Get PNR status
- `POST /api/bookings/<pnr>/cancel` - Cancel booking

## Database Schema

### Tables
- **users**: User account information
- **stations**: Railway station data
- **trains**: Train information and schedules
- **train_classes**: Available classes for each train
- **bookings**: Ticket booking records
- **passengers**: Passenger details for bookings

## Configuration

### Environment Variables (.env)
```
DB_HOST=localhost
DB_NAME=chukchukgo
DB_USER=postgres
DB_PASSWORD=your_password
DB_PORT=5432
FLASK_ENV=development
SECRET_KEY=your-secret-key
DEBUG=True
```

## Features Implemented

### Frontend
- ✅ Responsive design with Bootstrap 5
- ✅ Real-time station search with autocomplete
- ✅ Train search with filters
- ✅ Interactive booking flow
- ✅ PNR status checking
- ✅ Ticket cancellation
- ✅ User authentication forms
- ✅ Loading indicators and error handling

### Backend
- ✅ RESTful API design
- ✅ Database integration with PostgreSQL
- ✅ User authentication with password hashing
- ✅ Train search with date validation
- ✅ Booking creation and management
- ✅ PNR status retrieval
- ✅ Cancellation with refund calculation
- ✅ Error handling and validation

## Development

### Running in Development Mode
```bash
export FLASK_ENV=development
export DEBUG=True
python run.py
```

### Database Migration
The application automatically creates tables on first run. Sample data is also inserted for testing.

### Adding New Features
1. Add API endpoints in `app.py`
2. Update frontend JavaScript in `static/js/app.js`
3. Add new styles in `static/css/app.css`

## Production Deployment

### Using Gunicorn
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Environment Setup
- Set `FLASK_ENV=production`
- Set `DEBUG=False`
- Use a production PostgreSQL database
- Configure proper secret keys

## Migration Notes

This project has been migrated from a Java-based architecture to a modern Python stack:

### What Changed
- **Backend**: Java Servlets → Python Flask
- **Database**: MySQL → PostgreSQL
- **Frontend**: JSP → Pure HTML/CSS/JavaScript
- **Architecture**: Monolithic → API-based separation

### What Stayed
- Core functionality and features
- UI design and user experience
- Database schema structure
- Business logic and validation rules

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.