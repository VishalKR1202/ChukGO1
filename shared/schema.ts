import { integer, pgTable, serial, text, timestamp, varchar, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// User model
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  password: varchar('password', { length: 100 }).notNull(),
  email: varchar('email', { length: 100 }).notNull().unique(),
  fullName: varchar('full_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 15 }).notNull(),
  dateCreated: timestamp('date_created').defaultNow().notNull(),
  lastLogin: timestamp('last_login'),
});

export const userRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
}));

// Define train classes
export const trainClassEnum = pgEnum('train_class', [
  'SL',  // Sleeper
  '3A',  // AC 3 Tier
  '2A',  // AC 2 Tier
  '1A',  // AC 1st Class
  'CC',  // Chair Car
  'EC',  // Executive Chair Car
  'GN',  // General
  '3E',  // AC 3 Tier Economy
  'FC',  // First Class
  'EA',  // Anubhuti Class (Executive Anubhuti)
  'UR',  // Unreserved
  '2S',  // Second Sitting
  'HO',  // Head On Generation
  'EOG', // End On Generation
  'PC',  // Pantry Car
  'SLRD', // Sleeper cum Luggage/Generator Car
]);

// Define quota types
export const quotaEnum = pgEnum('quota', [
  'GN', // General
  'TQ', // Tatkal
  'LD', // Ladies
  'DF', // Defense
  'PH', // Physically Handicapped
  'FT', // Foreign Tourist
  'SS', // Senior Citizen
]);

// Define train statuses
export const trainStatusEnum = pgEnum('train_status', [
  'ON_TIME',
  'DELAYED',
  'CANCELLED',
  'RESCHEDULED',
]);

// Stations model
export const stations = pgTable('stations', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 10 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  city: varchar('city', { length: 50 }).notNull(),
  state: varchar('state', { length: 50 }).notNull(),
  zone: varchar('zone', { length: 10 }),
});

export const stationRelations = relations(stations, ({ many }) => ({
  departureTrains: many(trains, { relationName: 'departure_trains' }),
  arrivalTrains: many(trains, { relationName: 'arrival_trains' }),
  stops: many(trainStops),
}));

// Trains model
export const trains = pgTable('trains', {
  id: serial('id').primaryKey(),
  number: varchar('number', { length: 10 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  fromStationId: integer('from_station_id').notNull().references(() => stations.id),
  toStationId: integer('to_station_id').notNull().references(() => stations.id),
  departureTime: varchar('departure_time', { length: 5 }).notNull(), // Format: "HH:MM"
  arrivalTime: varchar('arrival_time', { length: 5 }).notNull(), // Format: "HH:MM"
  duration: varchar('duration', { length: 10 }).notNull(), // Format: "XXh YYm"
  distance: integer('distance').notNull(), // in kilometers
  runsOn: text('runs_on').notNull(), // JSON array of days: ["Mon", "Tue", etc.]
  status: trainStatusEnum('status').default('ON_TIME').notNull(),
});

export const trainRelations = relations(trains, ({ one, many }) => ({
  fromStation: one(stations, {
    fields: [trains.fromStationId],
    references: [stations.id],
    relationName: 'departure_trains',
  }),
  toStation: one(stations, {
    fields: [trains.toStationId],
    references: [stations.id],
    relationName: 'arrival_trains',
  }),
  stops: many(trainStops),
  classes: many(trainClasses),
  availabilities: many(availability),
}));

// Train stops model
export const trainStops = pgTable('train_stops', {
  id: serial('id').primaryKey(),
  trainId: integer('train_id').notNull().references(() => trains.id),
  stationId: integer('station_id').notNull().references(() => stations.id),
  stopNumber: integer('stop_number').notNull(),
  arrivalTime: varchar('arrival_time', { length: 5 }),
  departureTime: varchar('departure_time', { length: 5 }),
  haltTime: integer('halt_time'), // in minutes
  distance: integer('distance'), // distance from origin in km
  dayCount: integer('day_count').default(1), // day of journey (1 = same day, 2 = next day, etc.)
});

export const trainStopRelations = relations(trainStops, ({ one }) => ({
  train: one(trains, {
    fields: [trainStops.trainId],
    references: [trains.id],
  }),
  station: one(stations, {
    fields: [trainStops.stationId],
    references: [stations.id],
  }),
}));

// Train classes model
export const trainClasses = pgTable('train_classes', {
  id: serial('id').primaryKey(),
  trainId: integer('train_id').notNull().references(() => trains.id),
  class: trainClassEnum('class').notNull(),
  baseFare: integer('base_fare').notNull(), // in INR
  totalSeats: integer('total_seats').notNull(),
});

export const trainClassRelations = relations(trainClasses, ({ one }) => ({
  train: one(trains, {
    fields: [trainClasses.trainId],
    references: [trains.id],
  }),
}));

// Availability model
export const availability = pgTable('availability', {
  id: serial('id').primaryKey(),
  trainId: integer('train_id').notNull().references(() => trains.id),
  class: trainClassEnum('class').notNull(),
  journeyDate: timestamp('journey_date').notNull(),
  availableSeats: integer('available_seats').notNull(),
  waitingList: integer('waiting_list').default(0),
  fare: integer('fare').notNull(), // in INR
});

export const availabilityRelations = relations(availability, ({ one }) => ({
  train: one(trains, {
    fields: [availability.trainId],
    references: [trains.id],
  }),
}));

// Booking model
export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  pnr: varchar('pnr', { length: 10 }).notNull().unique(),
  userId: integer('user_id').notNull().references(() => users.id),
  trainId: integer('train_id').notNull().references(() => trains.id),
  journeyDate: timestamp('journey_date').notNull(),
  fromStationId: integer('from_station_id').notNull().references(() => stations.id),
  toStationId: integer('to_station_id').notNull().references(() => stations.id),
  class: trainClassEnum('class').notNull(),
  quota: quotaEnum('quota').default('GN').notNull(),
  bookingDate: timestamp('booking_date').defaultNow().notNull(),
  totalFare: integer('total_fare').notNull(),
  status: varchar('status', { length: 20 }).default('CONFIRMED').notNull(),
  paymentId: varchar('payment_id', { length: 100 }),
  paymentMethod: varchar('payment_method', { length: 20 }),
});

export const bookingRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  train: one(trains, {
    fields: [bookings.trainId],
    references: [trains.id],
  }),
  fromStation: one(stations, {
    fields: [bookings.fromStationId],
    references: [stations.id],
  }),
  toStation: one(stations, {
    fields: [bookings.toStationId],
    references: [stations.id],
  }),
  passengers: many(passengers),
}));

// Passenger model
export const passengers = pgTable('passengers', {
  id: serial('id').primaryKey(),
  bookingId: integer('booking_id').notNull().references(() => bookings.id),
  name: varchar('name', { length: 100 }).notNull(),
  age: integer('age').notNull(),
  gender: varchar('gender', { length: 1 }).notNull(),
  seatNumber: varchar('seat_number', { length: 10 }),
  berth: varchar('berth', { length: 10 }),
  concession: varchar('concession', { length: 50 }),
  idType: varchar('id_type', { length: 20 }),
  idNumber: varchar('id_number', { length: 50 }),
});

export const passengerRelations = relations(passengers, ({ one }) => ({
  booking: one(bookings, {
    fields: [passengers.bookingId],
    references: [bookings.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Station = typeof stations.$inferSelect;
export type InsertStation = typeof stations.$inferInsert;

export type Train = typeof trains.$inferSelect;
export type InsertTrain = typeof trains.$inferInsert;

export type TrainStop = typeof trainStops.$inferSelect;
export type InsertTrainStop = typeof trainStops.$inferInsert;

export type TrainClass = typeof trainClasses.$inferSelect;
export type InsertTrainClass = typeof trainClasses.$inferInsert;

export type Availability = typeof availability.$inferSelect;
export type InsertAvailability = typeof availability.$inferInsert;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

export type Passenger = typeof passengers.$inferSelect;
export type InsertPassenger = typeof passengers.$inferInsert;