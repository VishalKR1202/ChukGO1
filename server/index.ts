import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { storage } from './storage';
import path from 'path';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '..')));

// API routes
// User routes
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { username, password, email, fullName, phone } = req.body;
    
    // Check if user already exists
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username already exists' 
      });
    }
    
    // Create new user
    const user = await storage.createUser({
      username,
      password, // In a production app, this should be hashed
      email,
      fullName,
      phone,
      dateCreated: new Date(),
    });
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    // Get user
    const user = await storage.getUserByUsername(username);
    
    // Check if user exists and password matches
    if (!user || user.password !== password) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }
    
    // In a production app, you would generate a JWT token here
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Train search route
app.get('/api/trains', async (req: Request, res: Response) => {
  try {
    const { from, to, date } = req.query;
    
    if (!from || !to || !date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required parameters' 
      });
    }
    
    const journeyDate = new Date(date as string);
    const trains = await storage.getTrains(
      from as string, 
      to as string, 
      journeyDate
    );
    
    res.json({
      success: true,
      data: trains
    });
  } catch (error) {
    console.error('Train search error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Booking routes
app.post('/api/bookings', async (req: Request, res: Response) => {
  try {
    const { 
      userId, trainId, journeyDate, fromStationId, toStationId, 
      classType, quota, totalFare, paymentMethod, paymentId, passengers 
    } = req.body;
    
    // Generate a unique PNR
    const pnr = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    
    // Create booking
    const booking = await storage.createBooking(
      {
        pnr,
        userId,
        trainId,
        journeyDate: new Date(journeyDate),
        fromStationId,
        toStationId,
        class: classType,
        quota,
        bookingDate: new Date(),
        totalFare,
        status: 'CONFIRMED',
        paymentId,
        paymentMethod
      },
      passengers.map((p: any) => ({
        name: p.name,
        age: p.age,
        gender: p.gender,
        seatNumber: p.seatNumber,
        berth: p.berth,
        concession: p.concession,
        idType: p.idType,
        idNumber: p.idNumber
      }))
    );
    
    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        pnr: booking.pnr
      }
    });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

app.get('/api/pnr/:pnr', async (req: Request, res: Response) => {
  try {
    const { pnr } = req.params;
    
    const booking = await storage.getBookingByPNR(pnr);
    
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }
    
    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('PNR retrieval error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

app.post('/api/bookings/:pnr/cancel', async (req: Request, res: Response) => {
  try {
    const { pnr } = req.params;
    
    const success = await storage.cancelBooking(pnr);
    
    if (!success) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found or already cancelled' 
      });
    }
    
    res.json({
      success: true,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    console.error('Cancellation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Catch-all route for SPA
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});