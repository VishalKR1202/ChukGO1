from flask import Flask, request, jsonify, send_from_directory, redirect, url_for
import os
import json
from datetime import datetime
import random
import psycopg2
from psycopg2.extras import RealDictCursor

app = Flask(__name__, static_folder='.', static_url_path='')

# Database connection setup
def get_db_connection():
    conn = psycopg2.connect(
        os.environ['DATABASE_URL'],
        cursor_factory=RealDictCursor
    )
    return conn

# Initialize database tables if they don't exist
def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        full_name VARCHAR(255),
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Create stations table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS stations (
        id SERIAL PRIMARY KEY,
        code VARCHAR(10) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        city VARCHAR(100),
        state VARCHAR(100)
    )
    ''')
    
    # Create trains table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS trains (
        id SERIAL PRIMARY KEY,
        number VARCHAR(10) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        from_station_id INTEGER REFERENCES stations(id),
        to_station_id INTEGER REFERENCES stations(id),
        departure_time TIME,
        arrival_time TIME,
        duration VARCHAR(20),
        distance INTEGER,
        running_days VARCHAR(30)
    )
    ''')
    
    # Create bookings table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        pnr VARCHAR(10) UNIQUE NOT NULL,
        user_id INTEGER REFERENCES users(id),
        train_id INTEGER REFERENCES trains(id),
        journey_date DATE,
        booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        travel_class VARCHAR(5),
        total_fare DECIMAL(10, 2),
        status VARCHAR(20) DEFAULT 'Confirmed',
        quota VARCHAR(10),
        chart_status VARCHAR(50)
    )
    ''')
    
    # Create passengers table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS passengers (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER REFERENCES bookings(id),
        name VARCHAR(255) NOT NULL,
        age INTEGER,
        gender VARCHAR(10),
        berth_type VARCHAR(5),
        berth_number INTEGER,
        coach VARCHAR(5),
        booking_status VARCHAR(30),
        current_status VARCHAR(30)
    )
    ''')
    
    # Create food_orders table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS food_orders (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(20) UNIQUE NOT NULL,
        pnr VARCHAR(10) NOT NULL,
        delivery_station VARCHAR(255) NOT NULL,
        total_amount DECIMAL(10, 2),
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'Confirmed',
        delivery_time VARCHAR(100)
    )
    ''')
    
    # Create food_order_items table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS food_order_items (
        id SERIAL PRIMARY KEY,
        food_order_id INTEGER REFERENCES food_orders(id),
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2),
        quantity INTEGER DEFAULT 1
    )
    ''')
    
    conn.commit()
    cursor.close()
    conn.close()

# Initialize the database
try:
    init_db()
    print("Database initialized successfully")
except Exception as e:
    print(f"Error initializing database: {e}")

# In-memory storage for demo purposes (fallback)
users = {}
bookings = {}

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    
    if username in users:
        return jsonify({'error': 'Username already exists'}), 400
    
    users[username] = {
        'username': username,
        'password': data.get('password'),  # In a real app, this would be hashed
        'email': data.get('email'),
        'fullName': data.get('fullName'),
        'phone': data.get('phone'),
        'created_at': datetime.now().isoformat()
    }
    
    return jsonify({'message': 'User registered successfully', 'userId': username}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if username not in users or users[username]['password'] != password:
        return jsonify({'error': 'Invalid username or password'}), 401
    
    return jsonify({
        'message': 'Login successful',
        'user': {
            'username': username,
            'email': users[username].get('email'),
            'fullName': users[username].get('fullName')
        }
    })

@app.route('/api/trains', methods=['GET'])
def get_trains():
    from_station = request.args.get('from')
    to_station = request.args.get('to')
    date = request.args.get('date')
    
    # In a real app, this would query a database
    # For demo, return mock data
    mock_trains = generate_mock_trains(from_station, to_station, date)
    return jsonify(mock_trains)
    
@app.route('/search', methods=['GET'])
def search():
    from_station = request.args.get('from')
    to_station = request.args.get('to')
    date = request.args.get('date')
    travel_class = request.args.get('class')
    quota = request.args.get('quota')
    
    # For web-based search, return the index.html to handle the search on the client side
    return send_from_directory('.', 'index.html')

@app.route('/api/bookings', methods=['POST'])
def create_booking():
    data = request.get_json()
    pnr = data.get('pnr') or generate_pnr()
    
    bookings[pnr] = data
    
    return jsonify({'message': 'Booking created successfully', 'pnr': pnr})

@app.route('/api/pnr/<pnr>', methods=['GET'])
def get_booking(pnr):
    if pnr not in bookings:
        return jsonify({'error': 'PNR not found'}), 404
    
    return jsonify(bookings[pnr])

@app.route('/api/bookings/<pnr>/cancel', methods=['POST'])
def cancel_booking(pnr):
    if pnr not in bookings:
        return jsonify({'error': 'PNR not found'}), 404
    
    # In a real app, this would update the booking status
    bookings[pnr]['status'] = 'CANCELLED'
    
    return jsonify({'message': 'Booking cancelled successfully'})

@app.route('/api/food-orders', methods=['POST'])
def create_food_order():
    data = request.get_json()
    pnr = data.get('pnr')
    delivery_station = data.get('deliveryStation')
    delivery_time = data.get('deliveryTime')
    items = data.get('items', [])
    total_amount = data.get('totalAmount', 0)
    
    # Generate a unique order ID
    order_id = 'FO-' + ''.join([str(random.randint(0, 9)) for _ in range(8)])
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Insert the food order
        cursor.execute(
            '''
            INSERT INTO food_orders (order_id, pnr, delivery_station, total_amount, delivery_time, status)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
            ''',
            (order_id, pnr, delivery_station, total_amount, delivery_time, 'Confirmed')
        )
        
        food_order_id = cursor.fetchone()['id']
        
        # Insert each food item
        for item in items:
            cursor.execute(
                '''
                INSERT INTO food_order_items (food_order_id, name, price, quantity)
                VALUES (%s, %s, %s, %s)
                ''',
                (food_order_id, item['name'], item['price'], item['quantity'])
            )
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'message': 'Food order created successfully',
            'orderId': order_id
        })
    
    except Exception as e:
        # If database operation fails, fall back to memory storage
        print(f"Database error: {e}")
        
        # Store in memory
        food_orders = {}
        
        # Create order object
        order = {
            'orderId': order_id,
            'pnr': pnr,
            'deliveryStation': delivery_station,
            'deliveryTime': delivery_time,
            'items': items,
            'totalAmount': total_amount,
            'orderDate': datetime.now().isoformat(),
            'status': 'Confirmed'
        }
        
        # Store in memory
        if pnr not in food_orders:
            food_orders[pnr] = []
        
        food_orders[pnr].append(order)
        
        return jsonify({
            'message': 'Food order created successfully',
            'orderId': order_id
        })

@app.route('/api/food-orders/<pnr>', methods=['GET'])
def get_food_orders(pnr):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get all food orders for this PNR
        cursor.execute(
            '''
            SELECT fo.*, foi.name, foi.price, foi.quantity
            FROM food_orders fo
            JOIN food_order_items foi ON fo.id = foi.food_order_id
            WHERE fo.pnr = %s
            ORDER BY fo.order_date DESC
            ''',
            (pnr,)
        )
        
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # Process the rows into a format that matches the frontend
        orders = {}
        for row in rows:
            order_id = row['order_id']
            
            if order_id not in orders:
                orders[order_id] = {
                    'orderId': order_id,
                    'pnr': row['pnr'],
                    'deliveryStation': row['delivery_station'],
                    'totalAmount': float(row['total_amount']),
                    'orderDate': row['order_date'].isoformat(),
                    'status': row['status'],
                    'deliveryTime': row['delivery_time'],
                    'items': []
                }
            
            # Add item to this order
            orders[order_id]['items'].append({
                'name': row['name'],
                'price': float(row['price']),
                'quantity': row['quantity']
            })
        
        return jsonify(list(orders.values()))
    
    except Exception as e:
        print(f"Database error: {e}")
        return jsonify([])  # Return empty list if error

@app.route('/api/food-orders/<pnr>/<order_id>/cancel', methods=['POST'])
def cancel_food_order(pnr, order_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Update the food order status
        cursor.execute(
            '''
            UPDATE food_orders
            SET status = 'Cancelled'
            WHERE pnr = %s AND order_id = %s
            RETURNING id
            ''',
            (pnr, order_id)
        )
        
        result = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        
        if result:
            return jsonify({'message': 'Food order cancelled successfully. Amount will be refunded.'})
        else:
            return jsonify({'error': 'Order not found'}), 404
            
    except Exception as e:
        print(f"Database error: {e}")
        return jsonify({'error': f'Failed to cancel order: {str(e)}'}), 500

def generate_pnr():
    """Generate a random PNR number"""
    import random
    return ''.join([str(random.randint(0, 9)) for _ in range(10)])

def generate_mock_trains(from_station, to_station, date):
    """Generate mock train data"""
    # Convert date string to datetime if needed
    try:
        import datetime
        if isinstance(date, str):
            date_obj = datetime.datetime.strptime(date, "%Y-%m-%d")
            weekday = date_obj.weekday()  # 0=Monday, 6=Sunday
            weekday_map = {0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6}  # Map to JS day numbers
            day_of_week = weekday_map[weekday]
        else:
            day_of_week = 0  # Default to Monday if date parsing fails
    except:
        day_of_week = 0  # Default to Monday if date parsing fails
    
    return [
        {
            "id": 1,
            "number": "12301",
            "name": "Rajdhani Express",
            "fromStation": from_station,
            "toStation": to_station,
            "departureTime": "16:50",
            "arrivalTime": "10:05",
            "duration": "17h 15m",
            "distance": "1384",
            "journeyDate": date,
            "runningDays": [0, 1, 2, 3, 4, 5, 6],  # All days of week (0=Monday, 6=Sunday)
            "classes": {
                "1A": {"fare": 4525, "available": "Available", "seats": 15, "waitlist": 0, "racStatus": ""},
                "2A": {"fare": 2695, "available": "Available", "seats": 42, "waitlist": 0, "racStatus": ""},
                "3A": {"fare": 1845, "available": "Available", "seats": 64, "waitlist": 0, "racStatus": ""},
                "SL": {"fare": 745, "available": "WL", "seats": 0, "waitlist": 12, "racStatus": ""}
            },
            "quota": "GN"
        },
        {
            "id": 2,
            "number": "12259",
            "name": "Duronto Express",
            "fromStation": from_station,
            "toStation": to_station,
            "departureTime": "08:30",
            "arrivalTime": "04:55",
            "duration": "20h 25m",
            "distance": "1382",
            "journeyDate": date,
            "runningDays": [0, 2, 4],  # Monday, Wednesday, Friday
            "classes": {
                "2A": {"fare": 2545, "available": "Available", "seats": 12, "waitlist": 0, "racStatus": ""},
                "3A": {"fare": 1795, "available": "Available", "seats": 23, "waitlist": 0, "racStatus": ""},
                "SL": {"fare": 715, "available": "RAC", "seats": 0, "waitlist": 0, "racStatus": 5}
            },
            "quota": "GN"
        },
        {
            "id": 3,
            "number": "22691",
            "name": "Shatabdi Express",
            "fromStation": from_station,
            "toStation": to_station,
            "departureTime": "06:00",
            "arrivalTime": "12:30",
            "duration": "6h 30m",
            "distance": "580",
            "journeyDate": date,
            "runningDays": [1, 3, 5],  # Tuesday, Thursday, Saturday
            "classes": {
                "CC": {"fare": 1250, "available": "Available", "seats": 55, "waitlist": 0, "racStatus": ""},
                "EC": {"fare": 2300, "available": "Available", "seats": 18, "waitlist": 0, "racStatus": ""}
            },
            "quota": "GN"
        }
    ]

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)