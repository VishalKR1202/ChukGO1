import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as schema from '../shared/schema';

// Load environment variables
dotenv.config();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('DATABASE_URL is not defined');
    process.exit(1);
  }
  
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);
  
  console.log('Running migrations...');
  
  try {
    // Create enums one by one to avoid multiple statements in a prepared statement
    try {
      await sql`
        DO $$ BEGIN
          CREATE TYPE train_class AS ENUM ('SL', '3A', '2A', '1A', 'CC', 'EC', 'GN');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `;
    } catch (error) {
      console.log('Train class enum might already exist:', error.message);
    }
    
    try {
      await sql`
        DO $$ BEGIN
          CREATE TYPE quota AS ENUM ('GN', 'TQ', 'LD', 'DF', 'PH', 'FT', 'SS');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `;
    } catch (error) {
      console.log('Quota enum might already exist:', error.message);
    }
    
    try {
      await sql`
        DO $$ BEGIN
          CREATE TYPE train_status AS ENUM ('ON_TIME', 'DELAYED', 'CANCELLED', 'RESCHEDULED');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `;
    } catch (error) {
      console.log('Train status enum might already exist:', error.message);
    }
    
    // Create tables one by one to avoid multiple statements in a prepared statement
    try {
      await sql`
        -- Users table
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) NOT NULL UNIQUE,
          password VARCHAR(100) NOT NULL,
          email VARCHAR(100) NOT NULL UNIQUE,
          full_name VARCHAR(100) NOT NULL,
          phone VARCHAR(15) NOT NULL,
          date_created TIMESTAMP NOT NULL DEFAULT NOW(),
          last_login TIMESTAMP
        )
      `;
      console.log('Users table created');
    } catch (error) {
      console.error('Error creating users table:', error.message);
    }
    
    try {
      await sql`
        -- Stations table
        CREATE TABLE IF NOT EXISTS stations (
          id SERIAL PRIMARY KEY,
          code VARCHAR(10) NOT NULL UNIQUE,
          name VARCHAR(100) NOT NULL,
          city VARCHAR(50) NOT NULL,
          state VARCHAR(50) NOT NULL,
          zone VARCHAR(10)
        )
      `;
      console.log('Stations table created');
    } catch (error) {
      console.error('Error creating stations table:', error.message);
    }
    
    try {
      await sql`
        -- Trains table
        CREATE TABLE IF NOT EXISTS trains (
          id SERIAL PRIMARY KEY,
          number VARCHAR(10) NOT NULL UNIQUE,
          name VARCHAR(100) NOT NULL,
          from_station_id INTEGER NOT NULL REFERENCES stations(id),
          to_station_id INTEGER NOT NULL REFERENCES stations(id),
          departure_time VARCHAR(5) NOT NULL,
          arrival_time VARCHAR(5) NOT NULL,
          duration VARCHAR(10) NOT NULL,
          distance INTEGER NOT NULL,
          runs_on TEXT NOT NULL,
          status train_status NOT NULL DEFAULT 'ON_TIME'
        )
      `;
      console.log('Trains table created');
    } catch (error) {
      console.error('Error creating trains table:', error.message);
    }
    
    try {
      await sql`
        -- Train stops
        CREATE TABLE IF NOT EXISTS train_stops (
          id SERIAL PRIMARY KEY,
          train_id INTEGER NOT NULL REFERENCES trains(id),
          station_id INTEGER NOT NULL REFERENCES stations(id),
          stop_number INTEGER NOT NULL,
          arrival_time VARCHAR(5),
          departure_time VARCHAR(5),
          halt_time INTEGER,
          distance INTEGER,
          day_count INTEGER DEFAULT 1
        )
      `;
      console.log('Train stops table created');
    } catch (error) {
      console.error('Error creating train_stops table:', error.message);
    }
    
    try {
      await sql`
        -- Train classes
        CREATE TABLE IF NOT EXISTS train_classes (
          id SERIAL PRIMARY KEY,
          train_id INTEGER NOT NULL REFERENCES trains(id),
          class train_class NOT NULL,
          base_fare INTEGER NOT NULL,
          total_seats INTEGER NOT NULL
        )
      `;
      console.log('Train classes table created');
    } catch (error) {
      console.error('Error creating train_classes table:', error.message);
    }
    
    try {
      await sql`
        -- Availability
        CREATE TABLE IF NOT EXISTS availability (
          id SERIAL PRIMARY KEY,
          train_id INTEGER NOT NULL REFERENCES trains(id),
          class train_class NOT NULL,
          journey_date TIMESTAMP NOT NULL,
          available_seats INTEGER NOT NULL,
          waiting_list INTEGER DEFAULT 0,
          fare INTEGER NOT NULL
        )
      `;
      console.log('Availability table created');
    } catch (error) {
      console.error('Error creating availability table:', error.message);
    }
    
    try {
      await sql`
        -- Bookings
        CREATE TABLE IF NOT EXISTS bookings (
          id SERIAL PRIMARY KEY,
          pnr VARCHAR(10) NOT NULL UNIQUE,
          user_id INTEGER NOT NULL REFERENCES users(id),
          train_id INTEGER NOT NULL REFERENCES trains(id),
          journey_date TIMESTAMP NOT NULL,
          from_station_id INTEGER NOT NULL REFERENCES stations(id),
          to_station_id INTEGER NOT NULL REFERENCES stations(id),
          class train_class NOT NULL,
          quota quota NOT NULL DEFAULT 'GN',
          booking_date TIMESTAMP NOT NULL DEFAULT NOW(),
          total_fare INTEGER NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED',
          payment_id VARCHAR(100),
          payment_method VARCHAR(20)
        )
      `;
      console.log('Bookings table created');
    } catch (error) {
      console.error('Error creating bookings table:', error.message);
    }
    
    try {
      await sql`
        -- Passengers
        CREATE TABLE IF NOT EXISTS passengers (
          id SERIAL PRIMARY KEY,
          booking_id INTEGER NOT NULL REFERENCES bookings(id),
          name VARCHAR(100) NOT NULL,
          age INTEGER NOT NULL,
          gender VARCHAR(1) NOT NULL,
          seat_number VARCHAR(10),
          berth VARCHAR(10),
          concession VARCHAR(50),
          id_type VARCHAR(20),
          id_number VARCHAR(50)
        )
      `;
      console.log('Passengers table created');
    } catch (error) {
      console.error('Error creating passengers table:', error.message);
    }
    
    console.log('Migrations completed successfully');
    
    // Insert some sample data for stations
    await sql`
      INSERT INTO stations (code, name, city, state, zone)
      VALUES 
        ('NDLS', 'New Delhi', 'New Delhi', 'Delhi', 'NR'),
        ('MAS', 'Chennai Central', 'Chennai', 'Tamil Nadu', 'SR'),
        ('HWH', 'Howrah Junction', 'Kolkata', 'West Bengal', 'ER'),
        ('CSTM', 'Chhatrapati Shivaji Terminus', 'Mumbai', 'Maharashtra', 'CR'),
        ('BNC', 'Bengaluru Cantt', 'Bengaluru', 'Karnataka', 'SWR'),
        ('SBC', 'Bengaluru City Junction', 'Bengaluru', 'Karnataka', 'SWR'),
        ('JAT', 'Jammu Tawi', 'Jammu', 'Jammu & Kashmir', 'NR'),
        ('LKO', 'Lucknow', 'Lucknow', 'Uttar Pradesh', 'NR'),
        ('PUNE', 'Pune Junction', 'Pune', 'Maharashtra', 'CR'),
        ('ADI', 'Ahmedabad Junction', 'Ahmedabad', 'Gujarat', 'WR'),
        ('PNBE', 'Patna Junction', 'Patna', 'Bihar', 'ECR'),
        ('BZA', 'Vijayawada Junction', 'Vijayawada', 'Andhra Pradesh', 'SCR'),
        ('VSKP', 'Visakhapatnam', 'Visakhapatnam', 'Andhra Pradesh', 'ECoR'),
        ('TVC', 'Thiruvananthapuram Central', 'Thiruvananthapuram', 'Kerala', 'SR'),
        ('ERS', 'Ernakulam Junction', 'Kochi', 'Kerala', 'SR'),
        ('INDB', 'Indore Junction', 'Indore', 'Madhya Pradesh', 'WR'),
        ('JP', 'Jaipur Junction', 'Jaipur', 'Rajasthan', 'NWR'),
        ('SC', 'Secunderabad Junction', 'Hyderabad', 'Telangana', 'SCR'),
        ('ALD', 'Allahabad Junction', 'Prayagraj', 'Uttar Pradesh', 'NCR'),
        ('GHY', 'Guwahati', 'Guwahati', 'Assam', 'NFR'),
        ('CSMT', 'Mumbai CSMT', 'Mumbai', 'Maharashtra', 'CR'),
        ('MGS', 'Mughal Sarai Junction', 'Mughal Sarai', 'Uttar Pradesh', 'ECR'),
        ('BSB', 'Varanasi Junction', 'Varanasi', 'Uttar Pradesh', 'NER'),
        ('KYQ', 'Kanyakumari', 'Kanyakumari', 'Tamil Nadu', 'SR'),
        ('SA', 'Salem Junction', 'Salem', 'Tamil Nadu', 'SR')
      ON CONFLICT (code) DO NOTHING;
    `;
    
    console.log('Sample stations data inserted');
    
    // Insert sample train data
    await sql`
      -- First, get the station IDs
      WITH station_ids AS (
        SELECT id, code FROM stations
      )
      
      -- Insert train between New Delhi and Chennai
      INSERT INTO trains (number, name, from_station_id, to_station_id, departure_time, arrival_time, duration, distance, runs_on, status)
      SELECT 
        '12622', 'Tamil Nadu Express', 
        (SELECT id FROM station_ids WHERE code = 'NDLS'), 
        (SELECT id FROM station_ids WHERE code = 'MAS'), 
        '22:30', '06:45', '32h 15m', 2175, 
        '["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]', 
        'ON_TIME'
      ON CONFLICT (number) DO NOTHING;
    `;
    
    // Insert more sample trains
    await sql`
      WITH station_ids AS (
        SELECT id, code FROM stations
      )
      
      -- Insert train between New Delhi and Howrah
      INSERT INTO trains (number, name, from_station_id, to_station_id, departure_time, arrival_time, duration, distance, runs_on, status)
      SELECT 
        '12302', 'Howrah Rajdhani', 
        (SELECT id FROM station_ids WHERE code = 'NDLS'), 
        (SELECT id FROM station_ids WHERE code = 'HWH'), 
        '16:50', '09:55', '17h 05m', 1445, 
        '["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]', 
        'ON_TIME'
      ON CONFLICT (number) DO NOTHING;
    `;
    
    await sql`
      WITH station_ids AS (
        SELECT id, code FROM stations
      )
      
      -- Insert train between New Delhi and Mumbai
      INSERT INTO trains (number, name, from_station_id, to_station_id, departure_time, arrival_time, duration, distance, runs_on, status)
      SELECT 
        '12952', 'Mumbai Rajdhani', 
        (SELECT id FROM station_ids WHERE code = 'NDLS'), 
        (SELECT id FROM station_ids WHERE code = 'CSTM'), 
        '16:25', '08:15', '15h 50m', 1386, 
        '["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]', 
        'ON_TIME'
      ON CONFLICT (number) DO NOTHING;
    `;
    
    // Add more trains
    await sql`
      WITH station_ids AS (
        SELECT id, code FROM stations
      )
      
      -- Insert train between Chennai and Bengaluru
      INSERT INTO trains (number, name, from_station_id, to_station_id, departure_time, arrival_time, duration, distance, runs_on, status)
      SELECT 
        '12640', 'Brindavan Express', 
        (SELECT id FROM station_ids WHERE code = 'MAS'), 
        (SELECT id FROM station_ids WHERE code = 'SBC'), 
        '07:50', '13:25', '5h 35m', 362, 
        '["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]', 
        'ON_TIME'
      ON CONFLICT (number) DO NOTHING;
    `;
    
    await sql`
      WITH station_ids AS (
        SELECT id, code FROM stations
      )
      
      -- Insert train between Mumbai and Pune
      INSERT INTO trains (number, name, from_station_id, to_station_id, departure_time, arrival_time, duration, distance, runs_on, status)
      SELECT 
        '12123', 'Deccan Queen', 
        (SELECT id FROM station_ids WHERE code = 'CSMT'), 
        (SELECT id FROM station_ids WHERE code = 'PUNE'), 
        '17:10', '20:25', '3h 15m', 192, 
        '["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]', 
        'ON_TIME'
      ON CONFLICT (number) DO NOTHING;
    `;
    
    await sql`
      WITH station_ids AS (
        SELECT id, code FROM stations
      )
      
      -- Insert train between Chennai and Salem
      INSERT INTO trains (number, name, from_station_id, to_station_id, departure_time, arrival_time, duration, distance, runs_on, status)
      SELECT 
        '12637', 'Pandian Express', 
        (SELECT id FROM station_ids WHERE code = 'MAS'), 
        (SELECT id FROM station_ids WHERE code = 'SA'), 
        '21:40', '03:45', '6h 05m', 337, 
        '["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]', 
        'ON_TIME'
      ON CONFLICT (number) DO NOTHING;
    `;
    
    await sql`
      WITH station_ids AS (
        SELECT id, code FROM stations
      )
      
      -- Insert train between Hyderabad and Bengaluru
      INSERT INTO trains (number, name, from_station_id, to_station_id, departure_time, arrival_time, duration, distance, runs_on, status)
      SELECT 
        '12785', 'Kacheguda-SBC Express', 
        (SELECT id FROM station_ids WHERE code = 'SC'), 
        (SELECT id FROM station_ids WHERE code = 'SBC'), 
        '18:45', '06:50', '12h 05m', 614, 
        '["Mon", "Wed", "Fri", "Sun"]', 
        'ON_TIME'
      ON CONFLICT (number) DO NOTHING;
    `;
    
    await sql`
      WITH station_ids AS (
        SELECT id, code FROM stations
      )
      
      -- Insert train between Delhi and Jaipur
      INSERT INTO trains (number, name, from_station_id, to_station_id, departure_time, arrival_time, duration, distance, runs_on, status)
      SELECT 
        '12986', 'Double-Decker Express', 
        (SELECT id FROM station_ids WHERE code = 'NDLS'), 
        (SELECT id FROM station_ids WHERE code = 'JP'), 
        '17:40', '22:05', '4h 25m', 309, 
        '["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]', 
        'ON_TIME'
      ON CONFLICT (number) DO NOTHING;
    `;
    
    await sql`
      WITH station_ids AS (
        SELECT id, code FROM stations
      )
      
      -- Insert train between Chennai and Kerala
      INSERT INTO trains (number, name, from_station_id, to_station_id, departure_time, arrival_time, duration, distance, runs_on, status)
      SELECT 
        '12624', 'Chennai - Thiruvananthapuram SF Express', 
        (SELECT id FROM station_ids WHERE code = 'MAS'), 
        (SELECT id FROM station_ids WHERE code = 'TVC'), 
        '19:45', '15:55', '20h 10m', 921, 
        '["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]', 
        'ON_TIME'
      ON CONFLICT (number) DO NOTHING;
    `;
    
    // Insert a few more trains to have a good selection
    await sql`
      WITH station_ids AS (
        SELECT id, code FROM stations
      )
      
      -- Insert Vande Bharat Express between New Delhi and Varanasi
      INSERT INTO trains (number, name, from_station_id, to_station_id, departure_time, arrival_time, duration, distance, runs_on, status)
      SELECT 
        '22436', 'Vande Bharat Express', 
        (SELECT id FROM station_ids WHERE code = 'NDLS'), 
        (SELECT id FROM station_ids WHERE code = 'BSB'), 
        '06:00', '14:00', '8h 00m', 759, 
        '["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]', 
        'ON_TIME'
      ON CONFLICT (number) DO NOTHING;
    `;
    
    await sql`
      WITH station_ids AS (
        SELECT id, code FROM stations
      )
      
      -- Insert Tejas Express between Mumbai and Ahmedabad
      INSERT INTO trains (number, name, from_station_id, to_station_id, departure_time, arrival_time, duration, distance, runs_on, status)
      SELECT 
        '82902', 'Mumbai - Ahmedabad Tejas Express', 
        (SELECT id FROM station_ids WHERE code = 'CSTM'), 
        (SELECT id FROM station_ids WHERE code = 'ADI'), 
        '06:40', '13:10', '6h 30m', 493, 
        '["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]', 
        'ON_TIME'
      ON CONFLICT (number) DO NOTHING;
    `;
    
    console.log('Sample trains data inserted');
    
    // Insert sample train classes
    await sql`
      -- Get train IDs
      WITH train_ids AS (
        SELECT id, number FROM trains WHERE number IN ('12622', '12302', '12952')
      )
      
      -- Insert classes for Tamil Nadu Express (12622)
      INSERT INTO train_classes (train_id, class, base_fare, total_seats)
      SELECT 
        (SELECT id FROM train_ids WHERE number = '12622'),
        'SL', 825, 72
      ON CONFLICT DO NOTHING;
      
      INSERT INTO train_classes (train_id, class, base_fare, total_seats)
      SELECT 
        (SELECT id FROM train_ids WHERE number = '12622'),
        '3A', 2175, 64
      ON CONFLICT DO NOTHING;
      
      INSERT INTO train_classes (train_id, class, base_fare, total_seats)
      SELECT 
        (SELECT id FROM train_ids WHERE number = '12622'),
        '2A', 3100, 46
      ON CONFLICT DO NOTHING;
    `;
    
    // Insert for Howrah Rajdhani (12302)
    await sql`
      WITH train_ids AS (
        SELECT id, number FROM trains WHERE number IN ('12622', '12302', '12952')
      )
      
      INSERT INTO train_classes (train_id, class, base_fare, total_seats)
      SELECT 
        (SELECT id FROM train_ids WHERE number = '12302'),
        '3A', 1920, 64
      ON CONFLICT DO NOTHING;
      
      INSERT INTO train_classes (train_id, class, base_fare, total_seats)
      SELECT 
        (SELECT id FROM train_ids WHERE number = '12302'),
        '2A', 2890, 46
      ON CONFLICT DO NOTHING;
      
      INSERT INTO train_classes (train_id, class, base_fare, total_seats)
      SELECT 
        (SELECT id FROM train_ids WHERE number = '12302'),
        '1A', 4950, 24
      ON CONFLICT DO NOTHING;
    `;
    
    // Insert for Mumbai Rajdhani (12952)
    await sql`
      WITH train_ids AS (
        SELECT id, number FROM trains WHERE number IN ('12622', '12302', '12952')
      )
      
      INSERT INTO train_classes (train_id, class, base_fare, total_seats)
      SELECT 
        (SELECT id FROM train_ids WHERE number = '12952'),
        '3A', 1850, 64
      ON CONFLICT DO NOTHING;
      
      INSERT INTO train_classes (train_id, class, base_fare, total_seats)
      SELECT 
        (SELECT id FROM train_ids WHERE number = '12952'),
        '2A', 2750, 46
      ON CONFLICT DO NOTHING;
      
      INSERT INTO train_classes (train_id, class, base_fare, total_seats)
      SELECT 
        (SELECT id FROM train_ids WHERE number = '12952'),
        '1A', 4800, 24
      ON CONFLICT DO NOTHING;
    `;
    
    console.log('Sample train classes data inserted');
    
    // Generate some availability data for the next 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      await sql`
        WITH train_ids AS (
          SELECT t.id, t.number, tc.class, tc.base_fare
          FROM trains t
          JOIN train_classes tc ON t.id = tc.train_id
          WHERE t.number IN ('12622', '12302', '12952')
        )
        
        INSERT INTO availability (train_id, class, journey_date, available_seats, waiting_list, fare)
        SELECT 
          id,
          class,
          ${date},
          CASE 
            WHEN class = 'SL' THEN FLOOR(RANDOM() * 72)
            WHEN class = '3A' THEN FLOOR(RANDOM() * 64)
            WHEN class = '2A' THEN FLOOR(RANDOM() * 46)
            WHEN class = '1A' THEN FLOOR(RANDOM() * 24)
            ELSE 0
          END,
          CASE 
            WHEN RANDOM() > 0.7 THEN FLOOR(RANDOM() * 10)
            ELSE 0
          END,
          base_fare + FLOOR(RANDOM() * 500)
        FROM train_ids
        ON CONFLICT DO NOTHING;
      `;
    }
    
    console.log('Sample availability data inserted');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
  
  await sql.end();
  console.log('Database setup completed');
}

main();