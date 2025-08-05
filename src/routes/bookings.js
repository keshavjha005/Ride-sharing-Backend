const express = require('express');
const { body, param, query } = require('express-validator');
const bookingController = require('../controllers/bookingController');
const { authenticate } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @swagger
 * components:
 *   schemas:
 *     Booking:
 *       type: object
 *       required:
 *         - rideId
 *         - bookedSeats
 *       properties:
 *         rideId:
 *           type: string
 *           format: uuid
 *           description: ID of the ride to book
 *         bookedSeats:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           description: Number of seats to book
 *         pickupLocationId:
 *           type: string
 *           format: uuid
 *           description: ID of pickup location
 *         dropLocationId:
 *           type: string
 *           format: uuid
 *           description: ID of drop location
 *         stopoverId:
 *           type: string
 *           format: uuid
 *           description: ID of stopover location
 *         paymentType:
 *           type: string
 *           enum: [wallet, card, cash]
 *           default: wallet
 *           description: Payment method
 *     BookingResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             booking:
 *               $ref: '#/components/schemas/Booking'
 *             ride:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 departure_datetime:
 *                   type: string
 *                   format: date-time
 *                 price_per_seat:
 *                   type: number
 *                 total_seats:
 *                   type: integer
 *                 available_seats:
 *                   type: integer
 */

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Booking'
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingResponse'
 *       400:
 *         description: Validation error or business logic error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Ride not found
 *       500:
 *         description: Server error
 */
router.post('/', [
  body('rideId')
    .isUUID()
    .withMessage('Ride ID must be a valid UUID'),
  body('bookedSeats')
    .isInt({ min: 1, max: 10 })
    .withMessage('Booked seats must be between 1 and 10'),
  body('pickupLocationId')
    .optional()
    .isUUID()
    .withMessage('Pickup location ID must be a valid UUID'),
  body('dropLocationId')
    .optional()
    .isUUID()
    .withMessage('Drop location ID must be a valid UUID'),
  body('stopoverId')
    .optional()
    .isUUID()
    .withMessage('Stopover ID must be a valid UUID'),
  body('paymentType')
    .optional()
    .isIn(['wallet', 'card', 'cash'])
    .withMessage('Payment type must be wallet, card, or cash'),
  validateRequest
], bookingController.createBooking);

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Get booking details
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     booking:
 *                       $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not authorized to view this booking
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.get('/:id', [
  param('id')
    .isUUID()
    .withMessage('Booking ID must be a valid UUID'),
  validateRequest
], bookingController.getBooking);

/**
 * @swagger
 * /api/bookings/my-bookings:
 *   get:
 *     summary: Get user's bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, cancelled, completed]
 *         description: Filter by booking status
 *     responses:
 *       200:
 *         description: User's bookings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookings:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Booking'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/my-bookings', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'cancelled', 'completed'])
    .withMessage('Status must be pending, confirmed, cancelled, or completed'),
  validateRequest
], bookingController.getMyBookings);

/**
 * @swagger
 * /api/bookings/ride/{rideId}:
 *   get:
 *     summary: Get bookings for a ride (ride owner only)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Ride ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Ride bookings retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not authorized to view bookings for this ride
 *       500:
 *         description: Server error
 */
router.get('/ride/:rideId', [
  param('rideId')
    .isUUID()
    .withMessage('Ride ID must be a valid UUID'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  validateRequest
], bookingController.getRideBookings);

/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   put:
 *     summary: Cancel a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *       400:
 *         description: Booking cannot be cancelled
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.put('/:id/cancel', [
  param('id')
    .isUUID()
    .withMessage('Booking ID must be a valid UUID'),
  validateRequest
], bookingController.cancelBooking);

/**
 * @swagger
 * /api/bookings/{id}/confirm:
 *   put:
 *     summary: Confirm a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking confirmed successfully
 *       400:
 *         description: Booking cannot be confirmed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.put('/:id/confirm', [
  param('id')
    .isUUID()
    .withMessage('Booking ID must be a valid UUID'),
  validateRequest
], bookingController.confirmBooking);

/**
 * @swagger
 * /api/bookings/{id}/complete:
 *   put:
 *     summary: Complete a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking completed successfully
 *       400:
 *         description: Booking cannot be completed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.put('/:id/complete', [
  param('id')
    .isUUID()
    .withMessage('Booking ID must be a valid UUID'),
  validateRequest
], bookingController.completeBooking);

/**
 * @swagger
 * /api/bookings/{id}/payment-status:
 *   put:
 *     summary: Update payment status
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentStatus
 *             properties:
 *               paymentStatus:
 *                 type: string
 *                 enum: [pending, paid, failed, refunded]
 *                 description: New payment status
 *     responses:
 *       200:
 *         description: Payment status updated successfully
 *       400:
 *         description: Invalid payment status
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.put('/:id/payment-status', [
  param('id')
    .isUUID()
    .withMessage('Booking ID must be a valid UUID'),
  body('paymentStatus')
    .isIn(['pending', 'paid', 'failed', 'refunded'])
    .withMessage('Payment status must be pending, paid, failed, or refunded'),
  validateRequest
], bookingController.updatePaymentStatus);

/**
 * @swagger
 * /api/bookings/statistics:
 *   get:
 *     summary: Get booking statistics
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Booking statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         total_bookings:
 *                           type: integer
 *                         pending_bookings:
 *                           type: integer
 *                         confirmed_bookings:
 *                           type: integer
 *                         cancelled_bookings:
 *                           type: integer
 *                         completed_bookings:
 *                           type: integer
 *                         total_revenue:
 *                           type: number
 *                         average_amount:
 *                           type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/statistics', bookingController.getBookingStatistics);

/**
 * @swagger
 * /api/bookings/availability/{rideId}:
 *   get:
 *     summary: Check seat availability for a ride
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Ride ID
 *     responses:
 *       200:
 *         description: Seat availability retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     rideId:
 *                       type: string
 *                     totalSeats:
 *                       type: integer
 *                     bookedSeats:
 *                       type: integer
 *                     availableSeats:
 *                       type: integer
 *                     pricePerSeat:
 *                       type: number
 *       400:
 *         description: Ride is not available for booking
 *       404:
 *         description: Ride not found
 *       500:
 *         description: Server error
 */
router.get('/availability/:rideId', [
  param('rideId')
    .isUUID()
    .withMessage('Ride ID must be a valid UUID'),
  validateRequest
], bookingController.checkSeatAvailability);

module.exports = router; 