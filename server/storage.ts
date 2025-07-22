import { 
  users, trains, stations, trainClasses, availability, bookings, passengers,
  type User, type InsertUser, type Train, type Station, type TrainClass, 
  type Availability, type Booking, type InsertBooking, type Passenger, type InsertPassenger
} from "../shared/schema";
import { db } from "./db";
import { eq, and, gte, between, inArray } from "drizzle-orm";

// Interface defining the storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Train operations
  getTrains(fromStationCode: string, toStationCode: string, journeyDate: Date): Promise<any[]>;
  getTrainById(id: number): Promise<Train | undefined>;
  
  // Booking operations
  createBooking(booking: InsertBooking, passengers: InsertPassenger[]): Promise<Booking>;
  getBookingByPNR(pnr: string): Promise<any | undefined>;
  cancelBooking(pnr: string): Promise<boolean>;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  // Train operations
  async getTrains(fromStationCode: string, toStationCode: string, journeyDate: Date): Promise<any[]> {
    // Get the station IDs
    const fromStations = await db.select().from(stations).where(eq(stations.code, fromStationCode));
    const toStations = await db.select().from(stations).where(eq(stations.code, toStationCode));
    
    if (fromStations.length === 0 || toStations.length === 0) {
      return [];
    }
    
    const fromStationId = fromStations[0].id;
    const toStationId = toStations[0].id;
    
    // Get trains between these stations
    const trainsResult = await db.select().from(trains)
      .where(
        and(
          eq(trains.fromStationId, fromStationId),
          eq(trains.toStationId, toStationId)
        )
      );
    
    // Get day of week from journeyDate (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = journeyDate.getDay();
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayName = dayNames[dayOfWeek];
    
    // Filter trains by day of week
    const filteredTrains = trainsResult.filter(train => {
      const runsOn = JSON.parse(train.runsOn);
      return runsOn.includes(dayName);
    });
    
    // Get availability and class info for each train
    const result = await Promise.all(filteredTrains.map(async (train) => {
      const trainClasses = await db.select().from(trainClasses)
        .where(eq(trainClasses.trainId, train.id));
      
      const availabilityData = await db.select().from(availability)
        .where(
          and(
            eq(availability.trainId, train.id),
            eq(availability.journeyDate, journeyDate)
          )
        );
      
      // Format the date to match the expected format in the frontend
      const formattedDate = journeyDate.toISOString().split('T')[0];
      
      // Get from and to stations
      const fromStation = await db.select().from(stations)
        .where(eq(stations.id, train.fromStationId));
      
      const toStation = await db.select().from(stations)
        .where(eq(stations.id, train.toStationId));
      
      // Prepare classes data
      const classes = trainClasses.map(tc => {
        const avail = availabilityData.find(a => a.class === tc.class);
        return {
          type: tc.class,
          available: avail ? avail.availableSeats : 0,
          fare: avail ? avail.fare : tc.baseFare,
          waitingList: avail ? avail.waitingList : 0
        };
      });
      
      return {
        id: train.id,
        number: train.number,
        name: train.name,
        from: fromStation[0].code,
        to: toStation[0].code,
        fromCity: fromStation[0].city,
        toCity: toStation[0].city,
        departureTime: train.departureTime,
        arrivalTime: train.arrivalTime,
        duration: train.duration,
        distance: train.distance,
        date: formattedDate,
        runsOn: JSON.parse(train.runsOn),
        classes: classes
      };
    }));
    
    return result;
  }

  async getTrainById(id: number): Promise<Train | undefined> {
    const [train] = await db.select().from(trains).where(eq(trains.id, id));
    return train;
  }
  
  // Booking operations
  async createBooking(insertBooking: InsertBooking, insertPassengers: InsertPassenger[]): Promise<Booking> {
    // Start a transaction
    return await db.transaction(async (tx) => {
      // Insert booking
      const [booking] = await tx.insert(bookings).values(insertBooking).returning();
      
      // Insert passengers with the booking ID
      for (const passengerData of insertPassengers) {
        await tx.insert(passengers).values({
          ...passengerData,
          bookingId: booking.id
        });
      }
      
      // Update availability by reducing available seats
      const [avail] = await tx.select().from(availability)
        .where(
          and(
            eq(availability.trainId, booking.trainId),
            eq(availability.journeyDate, booking.journeyDate),
            eq(availability.class, booking.class)
          )
        );
      
      if (avail) {
        await tx.update(availability)
          .set({ 
            availableSeats: avail.availableSeats - insertPassengers.length 
          })
          .where(eq(availability.id, avail.id));
      }
      
      return booking;
    });
  }

  async getBookingByPNR(pnr: string): Promise<any | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.pnr, pnr));
    
    if (!booking) {
      return undefined;
    }
    
    // Get passenger details
    const passengersList = await db.select().from(passengers)
      .where(eq(passengers.bookingId, booking.id));
    
    // Get train details
    const [train] = await db.select().from(trains)
      .where(eq(trains.id, booking.trainId));
    
    // Get station details
    const [fromStation] = await db.select().from(stations)
      .where(eq(stations.id, booking.fromStationId));
    
    const [toStation] = await db.select().from(stations)
      .where(eq(stations.id, booking.toStationId));
    
    // Format journey date
    const journeyDate = new Date(booking.journeyDate).toISOString().split('T')[0];
    
    return {
      pnr: booking.pnr,
      train: {
        number: train.number,
        name: train.name
      },
      date: journeyDate,
      from: fromStation.code,
      to: toStation.code,
      class: booking.class,
      fare: booking.totalFare,
      status: booking.status,
      passengers: passengersList.map(p => ({
        name: p.name,
        age: p.age,
        gender: p.gender,
        seat: p.seatNumber,
        berth: p.berth,
        status: booking.status // Passenger status is same as booking status
      }))
    };
  }

  async cancelBooking(pnr: string): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // Get the booking
      const [booking] = await tx.select().from(bookings).where(eq(bookings.pnr, pnr));
      
      if (!booking || booking.status === 'CANCELLED') {
        return false;
      }
      
      // Get passengers to count how many seats to add back
      const passengersList = await tx.select().from(passengers)
        .where(eq(passengers.bookingId, booking.id));
      
      // Update booking status
      await tx.update(bookings)
        .set({ status: 'CANCELLED' })
        .where(eq(bookings.id, booking.id));
      
      // Update availability by adding back seats
      const [avail] = await tx.select().from(availability)
        .where(
          and(
            eq(availability.trainId, booking.trainId),
            eq(availability.journeyDate, booking.journeyDate),
            eq(availability.class, booking.class)
          )
        );
      
      if (avail) {
        await tx.update(availability)
          .set({ 
            availableSeats: avail.availableSeats + passengersList.length 
          })
          .where(eq(availability.id, avail.id));
      }
      
      return true;
    });
  }
}

// Export a singleton instance
export const storage = new DatabaseStorage();