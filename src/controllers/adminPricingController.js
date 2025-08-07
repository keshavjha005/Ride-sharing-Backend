const { validationResult } = require('express-validator');
const PricingService = require('../services/pricingService');
const PricingMultiplier = require('../models/PricingMultiplier');
const PricingEvent = require('../models/PricingEvent');
const VehicleType = require('../models/VehicleType');
const logger = require('../utils/logger');

class AdminPricingController {
    /**
     * Get comprehensive pricing dashboard data
     * GET /api/admin/pricing/dashboard
     */
    static async getPricingDashboard(req, res) {
        try {
            const { period = '7d' } = req.query;
            
            // Get all pricing statistics
            const [
                vehicleTypes,
                pricingStats,
                activeEvents,
                recentCalculationsResponse,
                multiplierStats
            ] = await Promise.all([
                VehicleType.findWithPricing(true),
                PricingService.getOverallPricingStatistics(period),
                PricingEvent.findActiveEventsForDashboard(),
                PricingService.getRecentPricingCalculations({ limit: 10 }),
                PricingMultiplier.findAll(true)
            ]);

            // Extract the data array from recentCalculations response
            const recentCalculations = recentCalculationsResponse.data || [];

            // Calculate dashboard metrics
            const totalRevenue = pricingStats.total_revenue || 0;
            const avgFare = pricingStats.average_final_fare || 0;
            const totalCalculations = pricingStats.total_calculations || 0;
            const activeMultipliers = multiplierStats.length;
            const activeEventCount = activeEvents.length;

            res.json({
                success: true,
                data: {
                    overview: {
                        totalRevenue: totalRevenue,
                        averageFare: avgFare,
                        totalCalculations: totalCalculations,
                        activeMultipliers: activeMultipliers,
                        activeEvents: activeEventCount
                    },
                    vehicleTypes: vehicleTypes,
                    recentCalculations: recentCalculations,
                    activeEvents: activeEvents,
                    multiplierStats: {
                        total: multiplierStats.length,
                        byType: multiplierStats.reduce((acc, m) => {
                            acc[m.multiplier_type] = (acc[m.multiplier_type] || 0) + 1;
                            return acc;
                        }, {})
                    }
                }
            });
        } catch (error) {
            logger.error('Error getting pricing dashboard:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get pricing dashboard',
                error: error.message
            });
        }
    }

    /**
     * Get all vehicle types with pricing management
     * GET /api/admin/pricing/vehicle-types
     */
    static async getVehicleTypesManagement(req, res) {
        try {
            const { activeOnly = 'true', search = '' } = req.query;
            
            let vehicleTypes = await VehicleType.findWithPricing(activeOnly === 'true');
            
            // Apply search filter if provided
            if (search) {
                vehicleTypes = vehicleTypes.filter(vt => 
                    vt.name.toLowerCase().includes(search.toLowerCase()) ||
                    vt.description?.toLowerCase().includes(search.toLowerCase())
                );
            }

            res.json({
                success: true,
                data: vehicleTypes,
                message: 'Vehicle types retrieved successfully'
            });
        } catch (error) {
            logger.error('Error getting vehicle types management:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get vehicle types',
                error: error.message
            });
        }
    }

    /**
     * Update vehicle type pricing (admin only)
     * PUT /api/admin/pricing/vehicle-types/:id
     */
    static async updateVehicleTypePricing(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }

            const { id } = req.params;
            const { per_km_charges, minimum_fare, maximum_fare, is_active } = req.body;

            const result = await PricingService.updateVehicleTypePricing(id, {
                per_km_charges,
                minimum_fare,
                maximum_fare,
                is_active
            });

            res.json(result);
        } catch (error) {
            logger.error('Error updating vehicle type pricing:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update vehicle type pricing',
                error: error.message
            });
        }
    }

    /**
     * Get pricing multipliers management
     * GET /api/admin/pricing/multipliers
     */
    static async getMultipliersManagement(req, res) {
        try {
            const { 
                vehicleTypeId, 
                multiplierType, 
                activeOnly = 'true',
                page = 1,
                limit = 20
            } = req.query;

            let multipliers = [];

            if (vehicleTypeId && multiplierType) {
                multipliers = await PricingMultiplier.findByType(vehicleTypeId, multiplierType, activeOnly === 'true');
            } else if (vehicleTypeId) {
                multipliers = await PricingMultiplier.findByVehicleTypeId(vehicleTypeId, activeOnly === 'true');
            } else {
                multipliers = await PricingMultiplier.findAll(activeOnly === 'true');
            }

            // Apply pagination
            const offset = (parseInt(page) - 1) * parseInt(limit);
            const paginatedMultipliers = multipliers.slice(offset, offset + parseInt(limit));

            res.json({
                success: true,
                data: {
                    multipliers: paginatedMultipliers,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: multipliers.length,
                        totalPages: Math.ceil(multipliers.length / parseInt(limit))
                    }
                },
                message: 'Pricing multipliers retrieved successfully'
            });
        } catch (error) {
            logger.error('Error getting multipliers management:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get pricing multipliers',
                error: error.message
            });
        }
    }

    /**
     * Create pricing multiplier (admin only)
     * POST /api/admin/pricing/multipliers
     */
    static async createMultiplier(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }

            const { vehicle_type_id, multiplier_type, multiplier_value, is_active = true } = req.body;

            const multiplier = await PricingMultiplier.create({
                vehicle_type_id,
                multiplier_type,
                multiplier_value,
                is_active
            });

            res.status(201).json({
                success: true,
                data: multiplier,
                message: 'Pricing multiplier created successfully'
            });
        } catch (error) {
            logger.error('Error creating pricing multiplier:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create pricing multiplier',
                error: error.message
            });
        }
    }

    /**
     * Update pricing multiplier (admin only)
     * PUT /api/admin/pricing/multipliers/:id
     */
    static async updateMultiplier(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }

            const { id } = req.params;
            const { multiplier_type, multiplier_value, is_active } = req.body;

            const result = await PricingMultiplier.update(id, {
                multiplier_type,
                multiplier_value,
                is_active
            });

            res.json(result);
        } catch (error) {
            logger.error('Error updating pricing multiplier:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update pricing multiplier',
                error: error.message
            });
        }
    }

    /**
     * Delete pricing multiplier (admin only)
     * DELETE /api/admin/pricing/multipliers/:id
     */
    static async deleteMultiplier(req, res) {
        try {
            const { id } = req.params;

            const result = await PricingMultiplier.delete(id);

            res.json(result);
        } catch (error) {
            logger.error('Error deleting pricing multiplier:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete pricing multiplier',
                error: error.message
            });
        }
    }

    /**
     * Get pricing events management
     * GET /api/admin/pricing/events
     */
    static async getEventsManagement(req, res) {
        try {
            const { 
                activeOnly = 'true', 
                eventType, 
                page = 1, 
                limit = 20,
                search = ''
            } = req.query;

            let events = await PricingEvent.findAll({
                activeOnly: activeOnly === 'true',
                eventType,
                search,
                limit: parseInt(limit),
                offset: (parseInt(page) - 1) * parseInt(limit)
            });

            res.json({
                success: true,
                data: events,
                message: 'Pricing events retrieved successfully'
            });
        } catch (error) {
            logger.error('Error getting events management:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get pricing events',
                error: error.message
            });
        }
    }

    /**
     * Create pricing event (admin only)
     * POST /api/admin/pricing/events
     */
    static async createEvent(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }

            const result = await PricingService.createPricingEvent(req.body);

            res.status(201).json(result);
        } catch (error) {
            logger.error('Error creating pricing event:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create pricing event',
                error: error.message
            });
        }
    }

    /**
     * Update pricing event (admin only)
     * PUT /api/admin/pricing/events/:id
     */
    static async updateEvent(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }

            const { id } = req.params;
            const result = await PricingService.updatePricingEvent(id, req.body);

            res.json(result);
        } catch (error) {
            logger.error('Error updating pricing event:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update pricing event',
                error: error.message
            });
        }
    }

    /**
     * Delete pricing event (admin only)
     * DELETE /api/admin/pricing/events/:id
     */
    static async deleteEvent(req, res) {
        try {
            const { id } = req.params;
            const result = await PricingService.deletePricingEvent(id);

            res.json(result);
        } catch (error) {
            logger.error('Error deleting pricing event:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete pricing event',
                error: error.message
            });
        }
    }

    /**
     * Get pricing analytics and reports
     * GET /api/admin/pricing/analytics
     */
    static async getPricingAnalytics(req, res) {
        try {
            const { 
                period = '30d', 
                vehicleTypeId, 
                eventId,
                type = 'overview'
            } = req.query;

            let analytics = {};

            switch (type) {
                case 'overview':
                    if (vehicleTypeId) {
                        analytics = await PricingService.getPricingStatistics(vehicleTypeId, period);
                    } else {
                        analytics = await PricingService.getOverallPricingStatistics(period);
                    }
                    break;
                case 'events':
                    analytics = await PricingService.getPricingEventAnalytics(eventId, period);
                    break;
                case 'multipliers':
                    if (vehicleTypeId) {
                        analytics = await PricingService.getMultiplierUsageAnalytics(vehicleTypeId, period);
                    } else {
                        analytics = await PricingService.getOverallMultiplierUsageAnalytics(period);
                    }
                    break;
                case 'revenue':
                    analytics = await PricingService.getRevenueAnalytics(period);
                    break;
                default:
                    if (vehicleTypeId) {
                        analytics = await PricingService.getPricingStatistics(vehicleTypeId, period);
                    } else {
                        analytics = await PricingService.getOverallPricingStatistics(period);
                    }
            }

            res.json({
                success: true,
                data: analytics,
                message: 'Pricing analytics retrieved successfully'
            });
        } catch (error) {
            logger.error('Error getting pricing analytics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get pricing analytics',
                error: error.message
            });
        }
    }

    /**
     * Bulk update pricing settings (super admin only)
     * POST /api/admin/pricing/bulk-update
     */
    static async bulkUpdatePricing(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }

            const { 
                vehicleTypes, 
                multipliers, 
                events,
                operation = 'update' // 'update' or 'delete'
            } = req.body;

            const results = {
                vehicleTypes: [],
                multipliers: [],
                events: []
            };

            // Process vehicle types
            if (vehicleTypes && vehicleTypes.length > 0) {
                for (const vt of vehicleTypes) {
                    try {
                        const result = await PricingService.updateVehicleTypePricing(vt.id, vt);
                        results.vehicleTypes.push({ id: vt.id, success: true, data: result });
                    } catch (error) {
                        results.vehicleTypes.push({ id: vt.id, success: false, error: error.message });
                    }
                }
            }

            // Process multipliers
            if (multipliers && multipliers.length > 0) {
                for (const m of multipliers) {
                    try {
                        if (operation === 'delete') {
                            await PricingMultiplier.delete(m.id);
                            results.multipliers.push({ id: m.id, success: true, operation: 'deleted' });
                        } else {
                            const result = await PricingMultiplier.update(m.id, m);
                            results.multipliers.push({ id: m.id, success: true, data: result });
                        }
                    } catch (error) {
                        results.multipliers.push({ id: m.id, success: false, error: error.message });
                    }
                }
            }

            // Process events
            if (events && events.length > 0) {
                for (const e of events) {
                    try {
                        if (operation === 'delete') {
                            await PricingService.deletePricingEvent(e.id);
                            results.events.push({ id: e.id, success: true, operation: 'deleted' });
                        } else {
                            const result = await PricingService.updatePricingEvent(e.id, e);
                            results.events.push({ id: e.id, success: true, data: result });
                        }
                    } catch (error) {
                        results.events.push({ id: e.id, success: false, error: error.message });
                    }
                }
            }

            res.json({
                success: true,
                data: results,
                message: 'Bulk pricing update completed'
            });
        } catch (error) {
            logger.error('Error in bulk pricing update:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to perform bulk pricing update',
                error: error.message
            });
        }
    }

    /**
     * Export pricing data (admin only)
     * GET /api/admin/pricing/export
     */
    static async exportPricingData(req, res) {
        try {
            const { 
                type = 'all', 
                format = 'json',
                dateFrom,
                dateTo
            } = req.query;

            let exportData = {};

            switch (type) {
                case 'vehicle-types':
                    exportData.vehicleTypes = await VehicleType.findWithPricing(false);
                    break;
                case 'multipliers':
                    exportData.multipliers = await PricingMultiplier.findAll(false);
                    break;
                case 'events':
                    exportData.events = await PricingEvent.findAll({ activeOnly: false });
                    break;
                case 'calculations':
                    exportData.calculations = await PricingService.getPricingHistory({ 
                        dateFrom, 
                        dateTo,
                        limit: 1000 
                    });
                    break;
                case 'all':
                default:
                    exportData = {
                        vehicleTypes: await VehicleType.findWithPricing(false),
                        multipliers: await PricingMultiplier.findAll(false),
                        events: await PricingEvent.findAll({ activeOnly: false }),
                        calculations: await PricingService.getPricingHistory({ 
                            dateFrom, 
                            dateTo,
                            limit: 1000 
                        })
                    };
            }

            if (format === 'csv') {
                // TODO: Implement CSV export
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="pricing-export-${Date.now()}.csv"`);
                res.send('CSV export not yet implemented');
            } else {
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', `attachment; filename="pricing-export-${Date.now()}.json"`);
                res.json(exportData);
            }
        } catch (error) {
            logger.error('Error exporting pricing data:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to export pricing data',
                error: error.message
            });
        }
    }
}

module.exports = AdminPricingController; 