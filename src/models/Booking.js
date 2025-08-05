const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const logger = require('../utils/logger');

class Booking {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.ride_id = data.ride_id;
    this.user_id = data.user_id;
    this.booked_seats = data.booked_seats;
    this.total_amount = data.total_amount;
    this.status = data.status || 'pending';
    this.payment_status = data.payment_status || 'pending';
    this.payment_type = data.payment_type || 'wallet';
    this.pickup_location_id = data.pickup_location_id;
    this.drop_location_id = data.drop_location_id;
    this.stopover_id = data.stopover_id;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  // Create a new booking
  static async create(bookingData) {
    try {
      const booking = new Booking(bookingData);
      
      const query = `
        INSERT INTO bookings (
          id, ride_id, user_id, booked_seats, total_amount, 
          status, payment_status, payment_type, pickup_location_id, 
          drop_location_id, stopover_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        booking.id, booking.ride_id, booking.user_id, booking.booked_seats,
        booking.total_amount, booking.status, booking.payment_status,
        booking.payment_type, booking.pickup_location_id, booking.drop_location_id,
        booking.stopover_id, booking.created_at, booking.updated_at
      ];

      await db.execute(query, values);
      
      // Update ride's booked seats
      await this.updateRideBookedSeats(booking.ride_id, booking.booked_seats);
      
      return booking;
    } catch (error) {
      logger.error('Error creating booking:', error);
      throw error;
    }
  }

  // Find booking by ID
  static async findById(id) {
    try {
      const query = `
        SELECT b.*, 
               r.departure_datetime, r.price_per_seat, r.total_seats, r.booked_seats as ride_booked_seats,
               rl_pickup.address as pickup_address, rl_pickup.latitude as pickup_latitude, rl_pickup.longitude as pickup_longitude,
               rl_drop.address as drop_address, rl_drop.latitude as drop_latitude, rl_drop.longitude as drop_longitude,
               rl_stop.address as stopover_address, rl_stop.latitude as stopover_latitude, rl_stop.longitude as stopover_longitude
        FROM bookings b
        LEFT JOIN rides r ON b.ride_id = r.id
        LEFT JOIN ride_locations rl_pickup ON b.pickup_location_id = rl_pickup.id
        LEFT JOIN ride_locations rl_drop ON b.drop_location_id = rl_drop.id
        LEFT JOIN ride_locations rl_stop ON b.stopover_id = rl_stop.id
        WHERE b.id = ?
      `;

      const [rows] = await db.execute(query, [id]);
      
      if (rows.length === 0) {
        return null;
      }

      return new Booking(rows[0]);
    } catch (error) {
      logger.error('Error finding booking by ID:', error);
      throw error;
    }
  }

  // Find bookings by user ID
  static async findByUserId(userId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      
      const query = `
        SELECT b.*, 
               r.departure_datetime, r.price_per_seat, r.total_seats,
               rl_pickup.address as pickup_address,
               rl_drop.address as drop_address
        FROM bookings b
        LEFT JOIN rides r ON b.ride_id = r.id
        LEFT JOIN ride_locations rl_pickup ON b.pickup_location_id = rl_pickup.id
        LEFT JOIN ride_locations rl_drop ON b.drop_location_id = rl_drop.id
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM bookings
        WHERE user_id = ?
      `;

      const [rows] = await db.execute(query, [userId, limit, offset]);
      const [countRows] = await db.execute(countQuery, [userId]);

      const bookings = rows.map(row => new Booking(row));
      const total = countRows[0].total;

      return {
        bookings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error finding bookings by user ID:', error);
      throw error;
    }
  }

  // Find bookings by ride ID
  static async findByRideId(rideId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      
      const query = `
        SELECT b.*, 
               u.first_name, u.last_name, u.email, u.phone,
               rl_pickup.address as pickup_address,
               rl_drop.address as drop_address
        FROM bookings b
        LEFT JOIN users u ON b.user_id = u.id
        LEFT JOIN ride_locations rl_pickup ON b.pickup_location_id = rl_pickup.id
        LEFT JOIN ride_locations rl_drop ON b.drop_location_id = rl_drop.id
        WHERE b.ride_id = ?
        ORDER BY b.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM bookings
        WHERE ride_id = ?
      `;

      const [rows] = await db.execute(query, [rideId, limit, offset]);
      const [countRows] = await db.execute(countQuery, [rideId]);

      const bookings = rows.map(row => new Booking(row));
      const total = countRows[0].total;

      return {
        bookings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error finding bookings by ride ID:', error);
      throw error;
    }
  }

  // Update booking status
  static async updateStatus(id, status, userId = null) {
    try {
      let query = 'UPDATE bookings SET status = ?, updated_at = ? WHERE id = ?';
      let values = [status, new Date(), id];

      // If userId is provided, ensure the booking belongs to the user
      if (userId) {
        query += ' AND user_id = ?';
        values.push(userId);
      }

      const [result] = await db.execute(query, values);
      
      if (result.affectedRows === 0) {
        throw new Error('Booking not found or not authorized');
      }

      return await this.findById(id);
    } catch (error) {
      logger.error('Error updating booking status:', error);
      throw error;
    }
  }

  // Update payment status
  static async updatePaymentStatus(id, paymentStatus, userId = null) {
    try {
      let query = 'UPDATE bookings SET payment_status = ?, updated_at = ? WHERE id = ?';
      let values = [paymentStatus, new Date(), id];

      // If userId is provided, ensure the booking belongs to the user
      if (userId) {
        query += ' AND user_id = ?';
        values.push(userId);
      }

      const [result] = await db.execute(query, values);
      
      if (result.affectedRows === 0) {
        throw new Error('Booking not found or not authorized');
      }

      return await this.findById(id);
    } catch (error) {
      logger.error('Error updating payment status:', error);
      throw error;
    }
  }

  // Cancel booking
  static async cancel(id, userId) {
    try {
      const booking = await this.findById(id);
      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.user_id !== userId) {
        throw new Error('Not authorized to cancel this booking');
      }

      if (booking.status === 'cancelled') {
        throw new Error('Booking is already cancelled');
      }

      if (booking.status === 'completed') {
        throw new Error('Cannot cancel completed booking');
      }

      // Update booking status to cancelled
      await this.updateStatus(id, 'cancelled', userId);

      // Reduce booked seats on the ride
      await this.updateRideBookedSeats(booking.ride_id, -booking.booked_seats);

      return await this.findById(id);
    } catch (error) {
      logger.error('Error cancelling booking:', error);
      throw error;
    }
  }

  // Confirm booking
  static async confirm(id, userId) {
    try {
      const booking = await this.findById(id);
      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.user_id !== userId) {
        throw new Error('Not authorized to confirm this booking');
      }

      if (booking.status !== 'pending') {
        throw new Error('Booking is not in pending status');
      }

      return await this.updateStatus(id, 'confirmed', userId);
    } catch (error) {
      logger.error('Error confirming booking:', error);
      throw error;
    }
  }

  // Complete booking
  static async complete(id, userId) {
    try {
      const booking = await this.findById(id);
      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.user_id !== userId) {
        throw new Error('Not authorized to complete this booking');
      }

      if (booking.status !== 'confirmed') {
        throw new Error('Booking must be confirmed before completion');
      }

      return await this.updateStatus(id, 'completed', userId);
    } catch (error) {
      logger.error('Error completing booking:', error);
      throw error;
    }
  }

  // Check if user has existing booking for a ride
  static async hasExistingBooking(rideId, userId) {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM bookings
        WHERE ride_id = ? AND user_id = ? AND status IN ('pending', 'confirmed')
      `;

      const [rows] = await db.execute(query, [rideId, userId]);
      return rows[0].count > 0;
    } catch (error) {
      logger.error('Error checking existing booking:', error);
      throw error;
    }
  }

  // Get available seats for a ride
  static async getAvailableSeats(rideId) {
    try {
      const query = `
        SELECT r.total_seats, r.booked_seats,
               (r.total_seats - r.booked_seats) as available_seats
        FROM rides r
        WHERE r.id = ?
      `;

      const [rows] = await db.execute(query, [rideId]);
      
      if (rows.length === 0) {
        throw new Error('Ride not found');
      }

      return rows[0];
    } catch (error) {
      logger.error('Error getting available seats:', error);
      throw error;
    }
  }

  // Update ride's booked seats
  static async updateRideBookedSeats(rideId, seatsToAdd) {
    try {
      const query = `
        UPDATE rides 
        SET booked_seats = booked_seats + ?, updated_at = ?
        WHERE id = ? AND (booked_seats + ?) >= 0
      `;

      const [result] = await db.execute(query, [seatsToAdd, new Date(), rideId, seatsToAdd]);
      
      if (result.affectedRows === 0) {
        throw new Error('Cannot update ride seats - invalid operation');
      }

      return result;
    } catch (error) {
      logger.error('Error updating ride booked seats:', error);
      throw error;
    }
  }

  // Validate booking data
  static validateBookingData(data) {
    const errors = [];

    if (!data.ride_id) {
      errors.push('Ride ID is required');
    }

    if (!data.user_id) {
      errors.push('User ID is required');
    }

    if (!data.booked_seats || data.booked_seats < 1) {
      errors.push('Booked seats must be at least 1');
    }

    if (!data.total_amount || data.total_amount <= 0) {
      errors.push('Total amount must be greater than 0');
    }

    if (data.status && !['pending', 'confirmed', 'cancelled', 'completed'].includes(data.status)) {
      errors.push('Invalid status');
    }

    if (data.payment_status && !['pending', 'paid', 'failed', 'refunded'].includes(data.payment_status)) {
      errors.push('Invalid payment status');
    }

    if (data.payment_type && !['wallet', 'card', 'cash'].includes(data.payment_type)) {
      errors.push('Invalid payment type');
    }

    return errors;
  }

  // Calculate total amount for booking
  static calculateTotalAmount(pricePerSeat, bookedSeats, taxes = []) {
    const subtotal = pricePerSeat * bookedSeats;
    const taxAmount = taxes.reduce((sum, tax) => sum + tax.amount, 0);
    return subtotal + taxAmount;
  }

  // Get booking statistics
  static async getStatistics(userId = null) {
    try {
      let query = `
        SELECT 
          COUNT(*) as total_bookings,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
          SUM(total_amount) as total_revenue,
          AVG(total_amount) as average_amount
        FROM bookings
      `;

      const values = [];
      if (userId) {
        query += ' WHERE user_id = ?';
        values.push(userId);
      }

      const [rows] = await db.execute(query, values);
      return rows[0];
    } catch (error) {
      logger.error('Error getting booking statistics:', error);
      throw error;
    }
  }
}

module.exports = Booking; 