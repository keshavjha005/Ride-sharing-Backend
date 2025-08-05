const { validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Ride = require('../models/Ride');
const RideLocation = require('../models/RideLocation');
const logger = require('../utils/logger');

/**
 * Create a new booking
 * POST /api/bookings
 */
const createBooking = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      rideId,
      bookedSeats,
      pickupLocationId,
      dropLocationId,
      stopoverId,
      paymentType = 'wallet'
    } = req.body;

    const userId = req.user.id;

    // Validate ride exists and is published
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    if (ride.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Ride is not available for booking'
      });
    }

    // Check if user is trying to book their own ride
    if (ride.created_by === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book your own ride'
      });
    }

    // Check if user already has a booking for this ride
    const hasExistingBooking = await Booking.hasExistingBooking(rideId, userId);
    if (hasExistingBooking) {
      return res.status(400).json({
        success: false,
        message: 'You already have a booking for this ride'
      });
    }

    // Check seat availability
    const availableSeats = await Booking.getAvailableSeats(rideId);
    if (availableSeats.available_seats < bookedSeats) {
      return res.status(400).json({
        success: false,
        message: `Only ${availableSeats.available_seats} seats available`
      });
    }

    // Validate location IDs if provided
    if (pickupLocationId) {
      const pickupLocation = await RideLocation.findById(pickupLocationId);
      if (!pickupLocation || pickupLocation.ride_id !== rideId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid pickup location'
        });
      }
    }

    if (dropLocationId) {
      const dropLocation = await RideLocation.findById(dropLocationId);
      if (!dropLocation || dropLocation.ride_id !== rideId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid drop location'
        });
      }
    }

    if (stopoverId) {
      const stopoverLocation = await RideLocation.findById(stopoverId);
      if (!stopoverLocation || stopoverLocation.ride_id !== rideId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid stopover location'
        });
      }
    }

    // Calculate total amount
    const totalAmount = Booking.calculateTotalAmount(ride.price_per_seat, bookedSeats);

    // Create booking data
    const bookingData = {
      ride_id: rideId,
      user_id: userId,
      booked_seats: bookedSeats,
      total_amount: totalAmount,
      payment_type: paymentType,
      pickup_location_id: pickupLocationId,
      drop_location_id: dropLocationId,
      stopover_id: stopoverId
    };

    // Create the booking
    const booking = await Booking.create(bookingData);

    // Get the complete booking details
    const completeBooking = await Booking.findById(booking.id);

    logger.info(`Booking created: ${booking.id} for ride: ${rideId} by user: ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        booking: completeBooking,
        ride: {
          id: ride.id,
          departure_datetime: ride.departure_datetime,
          price_per_seat: ride.price_per_seat,
          total_seats: ride.total_seats,
          available_seats: availableSeats.available_seats - bookedSeats
        }
      }
    });

  } catch (error) {
    logger.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message
    });
  }
};

/**
 * Get booking details
 * GET /api/bookings/:id
 */
const getBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user is authorized to view this booking
    if (booking.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }

    res.json({
      success: true,
      data: { booking }
    });

  } catch (error) {
    logger.error('Error getting booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get booking',
      error: error.message
    });
  }
};

/**
 * Get user's bookings
 * GET /api/bookings/my-bookings
 */
const getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, status } = req.query;

    let result = await Booking.findByUserId(userId, parseInt(page), parseInt(limit));

    // Filter by status if provided
    if (status) {
      result.bookings = result.bookings.filter(booking => booking.status === status);
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Error getting user bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bookings',
      error: error.message
    });
  }
};

/**
 * Get bookings for a ride (ride owner only)
 * GET /api/bookings/ride/:rideId
 */
const getRideBookings = async (req, res) => {
  try {
    const { rideId } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    // Verify user owns the ride
    const ride = await Ride.findById(rideId);
    if (!ride || ride.created_by !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view bookings for this ride'
      });
    }

    const result = await Booking.findByRideId(rideId, parseInt(page), parseInt(limit));

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Error getting ride bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ride bookings',
      error: error.message
    });
  }
};

/**
 * Cancel booking
 * PUT /api/bookings/:id/cancel
 */
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const booking = await Booking.cancel(id, userId);

    logger.info(`Booking cancelled: ${id} by user: ${userId}`);

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: { booking }
    });

  } catch (error) {
    logger.error('Error cancelling booking:', error);
    
    if (error.message.includes('not found') || error.message.includes('not authorized')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('already cancelled') || error.message.includes('completed')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message
    });
  }
};

/**
 * Confirm booking
 * PUT /api/bookings/:id/confirm
 */
const confirmBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const booking = await Booking.confirm(id, userId);

    logger.info(`Booking confirmed: ${id} by user: ${userId}`);

    res.json({
      success: true,
      message: 'Booking confirmed successfully',
      data: { booking }
    });

  } catch (error) {
    logger.error('Error confirming booking:', error);
    
    if (error.message.includes('not found') || error.message.includes('not authorized')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('not in pending status')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to confirm booking',
      error: error.message
    });
  }
};

/**
 * Complete booking
 * PUT /api/bookings/:id/complete
 */
const completeBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const booking = await Booking.complete(id, userId);

    logger.info(`Booking completed: ${id} by user: ${userId}`);

    res.json({
      success: true,
      message: 'Booking completed successfully',
      data: { booking }
    });

  } catch (error) {
    logger.error('Error completing booking:', error);
    
    if (error.message.includes('not found') || error.message.includes('not authorized')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('must be confirmed')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to complete booking',
      error: error.message
    });
  }
};

/**
 * Update payment status
 * PUT /api/bookings/:id/payment-status
 */
const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;
    const userId = req.user.id;

    // Validate payment status
    const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status'
      });
    }

    const booking = await Booking.updatePaymentStatus(id, paymentStatus, userId);

    logger.info(`Payment status updated: ${id} to ${paymentStatus} by user: ${userId}`);

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: { booking }
    });

  } catch (error) {
    logger.error('Error updating payment status:', error);
    
    if (error.message.includes('not found') || error.message.includes('not authorized')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update payment status',
      error: error.message
    });
  }
};

/**
 * Get booking statistics
 * GET /api/bookings/statistics
 */
const getBookingStatistics = async (req, res) => {
  try {
    const userId = req.user.id;
    const statistics = await Booking.getStatistics(userId);

    res.json({
      success: true,
      data: { statistics }
    });

  } catch (error) {
    logger.error('Error getting booking statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get booking statistics',
      error: error.message
    });
  }
};

/**
 * Check seat availability for a ride
 * GET /api/bookings/availability/:rideId
 */
const checkSeatAvailability = async (req, res) => {
  try {
    const { rideId } = req.params;

    // Verify ride exists and is published
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    if (ride.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Ride is not available for booking'
      });
    }

    const availability = await Booking.getAvailableSeats(rideId);

    res.json({
      success: true,
      data: {
        rideId,
        totalSeats: availability.total_seats,
        bookedSeats: availability.booked_seats,
        availableSeats: availability.available_seats,
        pricePerSeat: ride.price_per_seat
      }
    });

  } catch (error) {
    logger.error('Error checking seat availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check seat availability',
      error: error.message
    });
  }
};

module.exports = {
  createBooking,
  getBooking,
  getMyBookings,
  getRideBookings,
  cancelBooking,
  confirmBooking,
  completeBooking,
  updatePaymentStatus,
  getBookingStatistics,
  checkSeatAvailability
}; 