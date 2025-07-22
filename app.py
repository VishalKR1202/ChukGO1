from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
from datetime import datetime, timedelta
import random
import string
import bcrypt
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# Database connection
def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            database=os.getenv('DB_NAME', 'chukchukgo'),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', 'password'),
            port=os.getenv('DB_PORT', '5432')
        )
        return conn
    except psycopg2.Error as e:
        print(f"Database connection error: {e}")
        return None

# Initialize database tables
def init_database():
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to database")
        return False
    
    cursor = conn.cursor()
    
    try:
        # Create users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                full_name VARCHAR(100) NOT NULL,
                phone VARCHAR(15) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE
            )
        ''')
        
        # Create stations table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS stations (
                id SERIAL PRIMARY KEY,
                code VARCHAR(10) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                city VARCHAR(50) NOT NULL,
                state VARCHAR(50) NOT NULL,
                zone VARCHAR(10)
            )
        ''')
        
        # Create trains table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS trains (
                id SERIAL PRIMARY KEY,
                number VARCHAR(10) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                from_station_id INTEGER REFERENCES stations(id),
                to_station_id INTEGER REFERENCES stations(id),
                departure_time TIME NOT NULL,
                arrival_time TIME NOT NULL,
                duration VARCHAR(20) NOT NULL,
                distance INTEGER NOT NULL,
                running_days TEXT NOT NULL,
                status VARCHAR(20) DEFAULT 'ON_TIME'
            )
        ''')
        
        # Create train_classes table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS train_classes (
                id SERIAL PRIMARY KEY,
                train_id INTEGER REFERENCES trains(id),
                class_type VARCHAR(5) NOT NULL,
                base_fare DECIMAL(10,2) NOT NULL,
                total_seats INTEGER NOT NULL
            )
        ''')
        
        # Create bookings table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS bookings (
                id SERIAL PRIMARY KEY,
                pnr VARCHAR(10) UNIQUE NOT NULL,
                user_id INTEGER REFERENCES users(id),
                train_id INTEGER REFERENCES trains(id),
                journey_date DATE NOT NULL,
                from_station_id INTEGER REFERENCES stations(id),
                to_station_id INTEGER REFERENCES stations(id),
                travel_class VARCHAR(5) NOT NULL,
                quota VARCHAR(10) DEFAULT 'GN',
                booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                total_fare DECIMAL(10,2) NOT NULL,
                status VARCHAR(20) DEFAULT 'CONFIRMED',
                payment_method VARCHAR(20),
                payment_id VARCHAR(100),
                contact_email VARCHAR(100),
                contact_phone VARCHAR(15)
            )
        ''')
        
        # Create passengers table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS passengers (
                id SERIAL PRIMARY KEY,
                booking_id INTEGER REFERENCES bookings(id),
                name VARCHAR(100) NOT NULL,
                age INTEGER NOT NULL,
                gender VARCHAR(1) NOT NULL,
                berth_preference VARCHAR(5),
                concession VARCHAR(20) DEFAULT 'NONE',
                id_proof_type VARCHAR(20),
                id_proof_number VARCHAR(50),
                seat_number VARCHAR(10),
                coach VARCHAR(5),
                booking_status VARCHAR(30),
                current_status VARCHAR(30)
            )
        ''')
        
        conn.commit()
        
        # Insert sample data
        insert_sample_data(cursor, conn)
        
        print("Database initialized successfully")
        return True
        
    except psycopg2.Error as e:
        print(f"Database initialization error: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()
        conn.close()

def insert_sample_data(cursor, conn):
    # Insert sample stations
    stations_data = [
        ('NDLS', 'New Delhi', 'New Delhi', 'Delhi', 'NR'),
        ('CSTM', 'Mumbai CST', 'Mumbai', 'Maharashtra', 'CR'),
        ('MAS', 'Chennai Central', 'Chennai', 'Tamil Nadu', 'SR'),
        ('HWH', 'Howrah Junction', 'Kolkata', 'West Bengal', 'ER'),
        ('SBC', 'Bengaluru City', 'Bengaluru', 'Karnataka', 'SWR'),
        ('PUNE', 'Pune Junction', 'Pune', 'Maharashtra', 'CR'),
        ('ADI', 'Ahmedabad Junction', 'Ahmedabad', 'Gujarat', 'WR'),
        ('JP', 'Jaipur Junction', 'Jaipur', 'Rajasthan', 'NWR'),
        ('LKO', 'Lucknow', 'Lucknow', 'Uttar Pradesh', 'NR'),
        ('PNBE', 'Patna Junction', 'Patna', 'Bihar', 'ECR')
    ]
    
    for station in stations_data:
        cursor.execute('''
            INSERT INTO stations (code, name, city, state, zone)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (code) DO NOTHING
        ''', station)
    
    # Insert sample trains
    trains_data = [
        ('12301', 'Rajdhani Express', 1, 2, '16:50', '10:05', '17h 15m', 1384, '["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]'),
        ('12259', 'Duronto Express', 1, 2, '08:30', '04:55', '20h 25m', 1382, '["Mon","Wed","Fri"]'),
        ('12622', 'Tamil Nadu Express', 1, 3, '22:30', '06:45', '32h 15m', 2175, '["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]'),
        ('12302', 'Howrah Rajdhani', 1, 4, '16:50', '09:55', '17h 05m', 1445, '["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]'),
        ('12640', 'Brindavan Express', 3, 5, '07:50', '13:25', '5h 35m', 362, '["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]')
    ]
    
    for train in trains_data:
        cursor.execute('''
            INSERT INTO trains (number, name, from_station_id, to_station_id, departure_time, 
                              arrival_time, duration, distance, running_days)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (number) DO NOTHING
        ''', train)
    
    # Insert sample train classes
    classes_data = [
        (1, '1A', 4525.00, 15),
        (1, '2A', 2695.00, 42),
        (1, '3A', 1845.00, 64),
        (1, 'SL', 745.00, 72),
        (2, '2A', 2545.00, 42),
        (2, '3A', 1795.00, 64),
        (2, 'SL', 715.00, 72),
        (3, '3A', 2175.00, 64),
        (3, '2A', 3100.00, 46),
        (3, 'SL', 825.00, 72),
        (4, '1A', 4950.00, 24),
        (4, '2A', 2890.00, 46),
        (4, '3A', 1920.00, 64),
        (5, 'CC', 1250.00, 55),
        (5, 'EC', 2300.00, 18)
    ]
    
    for class_data in classes_data:
        cursor.execute('''
            INSERT INTO train_classes (train_id, class_type, base_fare, total_seats)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        ''', class_data)
    
    conn.commit()

# Utility functions
def generate_pnr():
    return ''.join(random.choices(string.digits, k=10))

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password, hashed):
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

# Routes
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if not data or not all(k in data for k in ['username', 'password', 'email', 'fullName', 'phone']):
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database connection failed'}), 500
    
    cursor = conn.cursor()
    
    try:
        # Check if username or email already exists
        cursor.execute('SELECT id FROM users WHERE username = %s OR email = %s', 
                      (data['username'], data['email']))
        if cursor.fetchone():
            return jsonify({'success': False, 'message': 'Username or email already exists'}), 400
        
        # Hash password and insert user
        hashed_password = hash_password(data['password'])
        cursor.execute('''
            INSERT INTO users (username, password, email, full_name, phone)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        ''', (data['username'], hashed_password, data['email'], data['fullName'], data['phone']))
        
        user_id = cursor.fetchone()[0]
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'User registered successfully',
            'userId': user_id
        }), 201
        
    except psycopg2.Error as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Registration failed: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not all(k in data for k in ['username', 'password']):
        return jsonify({'success': False, 'message': 'Missing username or password'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database connection failed'}), 500
    
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cursor.execute('SELECT * FROM users WHERE username = %s AND is_active = TRUE', 
                      (data['username'],))
        user = cursor.fetchone()
        
        if user and verify_password(data['password'], user['password']):
            return jsonify({
                'success': True,
                'message': 'Login successful',
                'user': {
                    'id': user['id'],
                    'username': user['username'],
                    'email': user['email'],
                    'fullName': user['full_name']
                }
            })
        else:
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
            
    except psycopg2.Error as e:
        return jsonify({'success': False, 'message': f'Login failed: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/trains/search', methods=['GET'])
def search_trains():
    from_station = request.args.get('from')
    to_station = request.args.get('to')
    journey_date = request.args.get('date')
    travel_class = request.args.get('class')
    
    if not all([from_station, to_station, journey_date]):
        return jsonify({'success': False, 'message': 'Missing required parameters'}), 400
    
    try:
        # Parse date and get day of week
        date_obj = datetime.strptime(journey_date, '%Y-%m-%d')
        if date_obj.date() < datetime.now().date():
            return jsonify({'success': False, 'message': 'Journey date cannot be in the past'}), 400
        
        day_name = date_obj.strftime('%a')
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500
        
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get stations
        cursor.execute('SELECT id FROM stations WHERE code = %s', (from_station,))
        from_station_result = cursor.fetchone()
        cursor.execute('SELECT id FROM stations WHERE code = %s', (to_station,))
        to_station_result = cursor.fetchone()
        
        if not from_station_result or not to_station_result:
            return jsonify({'success': False, 'message': 'Invalid station codes'}), 400
        
        from_station_id = from_station_result['id']
        to_station_id = to_station_result['id']
        
        # Search trains
        cursor.execute('''
            SELECT t.*, fs.code as from_code, fs.name as from_name, 
                   ts.code as to_code, ts.name as to_name
            FROM trains t
            JOIN stations fs ON t.from_station_id = fs.id
            JOIN stations ts ON t.to_station_id = ts.id
            WHERE t.from_station_id = %s AND t.to_station_id = %s
            AND t.running_days LIKE %s
        ''', (from_station_id, to_station_id, f'%{day_name}%'))
        
        trains = cursor.fetchall()
        
        # Get classes for each train
        result = []
        for train in trains:
            cursor.execute('''
                SELECT class_type, base_fare, total_seats
                FROM train_classes
                WHERE train_id = %s
            ''', (train['id'],))
            
            classes = cursor.fetchall()
            
            # Format train data
            train_data = {
                'id': train['id'],
                'number': train['number'],
                'name': train['name'],
                'fromStation': f"{train['from_name']} ({train['from_code']})",
                'toStation': f"{train['to_name']} ({train['to_code']})",
                'departureTime': str(train['departure_time']),
                'arrivalTime': str(train['arrival_time']),
                'duration': train['duration'],
                'distance': train['distance'],
                'journeyDate': journey_date,
                'runningDays': json.loads(train['running_days']),
                'classes': {}
            }
            
            # Add availability simulation
            for cls in classes:
                available_seats = random.randint(0, cls['total_seats'])
                status = 'Available' if available_seats > 10 else ('RAC' if available_seats > 0 else 'WL')
                
                train_data['classes'][cls['class_type']] = {
                    'fare': float(cls['base_fare']),
                    'available': status,
                    'seats': available_seats if status == 'Available' else 0,
                    'waitlist': random.randint(1, 20) if status == 'WL' else 0,
                    'racStatus': random.randint(1, 10) if status == 'RAC' else 0
                }
            
            result.append(train_data)
        
        return jsonify({'success': True, 'data': result})
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Search failed: {str(e)}'}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

@app.route('/api/bookings', methods=['POST'])
def create_booking():
    data = request.get_json()
    
    required_fields = ['trainId', 'journeyDate', 'travelClass', 'passengers', 'contactDetails', 'totalFare']
    if not data or not all(k in data for k in required_fields):
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database connection failed'}), 500
    
    cursor = conn.cursor()
    
    try:
        # Generate PNR
        pnr = generate_pnr()
        
        # Get train and station details
        cursor.execute('''
            SELECT t.*, fs.id as from_station_id, ts.id as to_station_id
            FROM trains t
            JOIN stations fs ON t.from_station_id = fs.id
            JOIN stations ts ON t.to_station_id = ts.id
            WHERE t.id = %s
        ''', (data['trainId'],))
        
        train = cursor.fetchone()
        if not train:
            return jsonify({'success': False, 'message': 'Train not found'}), 404
        
        # Insert booking
        cursor.execute('''
            INSERT INTO bookings (pnr, train_id, journey_date, from_station_id, to_station_id,
                                travel_class, total_fare, contact_email, contact_phone, payment_method)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        ''', (pnr, data['trainId'], data['journeyDate'], train[2], train[3],
              data['travelClass'], data['totalFare'], 
              data['contactDetails']['email'], data['contactDetails']['phone'],
              data.get('paymentMethod', 'card')))
        
        booking_id = cursor.fetchone()[0]
        
        # Insert passengers
        for i, passenger in enumerate(data['passengers']):
            status = f"CNF/B{random.randint(1,5)}/{30+i}" if i < 2 else f"RAC {i-1}"
            
            cursor.execute('''
                INSERT INTO passengers (booking_id, name, age, gender, berth_preference,
                                      concession, booking_status, current_status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ''', (booking_id, passenger['name'], passenger['age'], passenger['gender'],
                  passenger.get('berthPreference', 'LB'), passenger.get('concession', 'NONE'),
                  status, status))
        
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Booking created successfully',
            'pnr': pnr
        }), 201
        
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Booking failed: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/pnr/<pnr>', methods=['GET'])
def get_pnr_status(pnr):
    if not pnr or len(pnr) != 10 or not pnr.isdigit():
        return jsonify({'success': False, 'message': 'Invalid PNR format'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database connection failed'}), 500
    
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Get booking details
        cursor.execute('''
            SELECT b.*, t.number as train_number, t.name as train_name,
                   t.departure_time, t.arrival_time,
                   fs.code as from_code, fs.name as from_name,
                   ts.code as to_code, ts.name as to_name
            FROM bookings b
            JOIN trains t ON b.train_id = t.id
            JOIN stations fs ON b.from_station_id = fs.id
            JOIN stations ts ON b.to_station_id = ts.id
            WHERE b.pnr = %s
        ''', (pnr,))
        
        booking = cursor.fetchone()
        if not booking:
            return jsonify({'success': False, 'message': 'PNR not found'}), 404
        
        # Get passengers
        cursor.execute('''
            SELECT name, age, gender, booking_status, current_status
            FROM passengers
            WHERE booking_id = %s
            ORDER BY id
        ''', (booking['id'],))
        
        passengers = cursor.fetchall()
        
        result = {
            'pnrNumber': booking['pnr'],
            'trainNumber': booking['train_number'],
            'trainName': booking['train_name'],
            'fromStation': f"{booking['from_name']} ({booking['from_code']})",
            'toStation': f"{booking['to_name']} ({booking['to_code']})",
            'journeyDate': booking['journey_date'].strftime('%Y-%m-%d'),
            'bookingDate': booking['booking_date'].strftime('%Y-%m-%d'),
            'departureTime': str(booking['departure_time']),
            'arrivalTime': str(booking['arrival_time']),
            'travelClass': booking['travel_class'],
            'totalFare': float(booking['total_fare']),
            'bookingStatus': booking['status'],
            'chartStatus': 'Chart Not Prepared',
            'canCancel': booking['status'] == 'CONFIRMED',
            'passengers': [dict(p) for p in passengers]
        }
        
        return jsonify({'success': True, 'data': result})
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'PNR lookup failed: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/bookings/<pnr>/cancel', methods=['POST'])
def cancel_booking(pnr):
    data = request.get_json()
    email = data.get('email') if data else None
    
    if not email:
        return jsonify({'success': False, 'message': 'Email is required'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database connection failed'}), 500
    
    cursor = conn.cursor()
    
    try:
        # Verify booking exists and email matches
        cursor.execute('''
            SELECT id, total_fare, journey_date, status
            FROM bookings
            WHERE pnr = %s AND contact_email = %s
        ''', (pnr, email))
        
        booking = cursor.fetchone()
        if not booking:
            return jsonify({'success': False, 'message': 'Booking not found or email mismatch'}), 404
        
        if booking[3] == 'CANCELLED':
            return jsonify({'success': False, 'message': 'Booking already cancelled'}), 400
        
        # Calculate refund (simplified logic)
        total_fare = float(booking[1])
        journey_date = booking[2]
        days_until_journey = (journey_date - datetime.now().date()).days
        
        if days_until_journey > 2:
            refund_amount = total_fare * 0.9  # 90% refund
        elif days_until_journey > 0:
            refund_amount = total_fare * 0.5  # 50% refund
        else:
            refund_amount = 0  # No refund
        
        # Update booking status
        cursor.execute('''
            UPDATE bookings SET status = 'CANCELLED' WHERE id = %s
        ''', (booking[0],))
        
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': f'Booking cancelled successfully. Refund amount: ₹{refund_amount:.2f}',
            'refundAmount': refund_amount
        })
        
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Cancellation failed: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/stations', methods=['GET'])
def get_stations():
    search = request.args.get('search', '').upper()
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database connection failed'}), 500
    
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if search:
            cursor.execute('''
                SELECT code, name, city, state
                FROM stations
                WHERE UPPER(code) LIKE %s OR UPPER(name) LIKE %s OR UPPER(city) LIKE %s
                ORDER BY name
                LIMIT 10
            ''', (f'%{search}%', f'%{search}%', f'%{search}%'))
        else:
            cursor.execute('''
                SELECT code, name, city, state
                FROM stations
                ORDER BY name
                LIMIT 20
            ''')
        
        stations = cursor.fetchall()
        return jsonify({'success': True, 'data': [dict(s) for s in stations]})
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Station lookup failed: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return send_from_directory('.', 'index.html')

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'success': False, 'message': 'Internal server error'}), 500

if __name__ == '__main__':
    # Initialize database on startup
    if init_database():
        print("Starting ChukChukGO server...")
        app.run(host='0.0.0.0', port=5000, debug=True)
    else:
        print("Failed to initialize database. Please check your database configuration.")