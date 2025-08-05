const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mate Backend API',
      version: '1.0.0',
      description: 'A comprehensive Node.js backend for the Mate ride-sharing/carpooling platform',
      contact: {
        name: 'Mate Team',
        email: 'support@mate.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.mate.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    example: 'email',
                  },
                  message: {
                    type: 'string',
                    example: 'Email is required',
                  },
                },
              },
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Operation completed successfully',
            },
            data: {
              type: 'object',
            },
          },
        },
        Location: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'ChIJOwg_06VPwokRYv534QaPC8g',
            },
            description: {
              type: 'string',
              example: 'New York, NY, USA',
            },
            structuredFormatting: {
              type: 'object',
              properties: {
                mainText: {
                  type: 'string',
                  example: 'New York',
                },
                secondaryText: {
                  type: 'string',
                  example: 'NY, USA',
                },
              },
            },
            types: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['locality', 'political', 'geocode'],
            },
          },
        },
        Coordinates: {
          type: 'object',
          properties: {
            latitude: {
              type: 'number',
              format: 'float',
              example: 40.7128,
            },
            longitude: {
              type: 'number',
              format: 'float',
              example: -74.0060,
            },
          },
        },
        Distance: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              example: '306 km',
            },
            value: {
              type: 'number',
              example: 306000,
            },
          },
        },
        Duration: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              example: '3 hours 15 mins',
            },
            value: {
              type: 'number',
              example: 11700,
            },
          },
        },
        Route: {
          type: 'object',
          properties: {
            routeId: {
              type: 'string',
              example: 'abc123...',
            },
            summary: {
              type: 'string',
              example: 'I-95 N',
            },
            distance: {
              $ref: '#/components/schemas/Distance',
            },
            duration: {
              $ref: '#/components/schemas/Duration',
            },
            startLocation: {
              type: 'object',
              properties: {
                address: {
                  type: 'string',
                  example: 'New York, NY, USA',
                },
                coordinates: {
                  $ref: '#/components/schemas/Coordinates',
                },
              },
            },
            endLocation: {
              type: 'object',
              properties: {
                address: {
                  type: 'string',
                  example: 'Boston, MA, USA',
                },
                coordinates: {
                  $ref: '#/components/schemas/Coordinates',
                },
              },
            },
            steps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  instruction: {
                    type: 'string',
                    example: 'Head <b>north</b> on <b>Broadway</b>',
                  },
                  distance: {
                    $ref: '#/components/schemas/Distance',
                  },
                  duration: {
                    $ref: '#/components/schemas/Duration',
                  },
                  travelMode: {
                    type: 'string',
                    example: 'DRIVING',
                  },
                  maneuver: {
                    type: 'string',
                    example: 'turn-slight-right',
                  },
                },
              },
            },
            polyline: {
              type: 'string',
              example: 'abc123...',
            },
            warnings: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            fare: {
              type: 'object',
              nullable: true,
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Location',
        description: 'Location and mapping services',
      },
      {
        name: 'Authentication',
        description: 'User authentication and authorization',
      },
      {
        name: 'Users',
        description: 'User management operations',
      },
      {
        name: 'Vehicles',
        description: 'Vehicle management operations',
      },
      {
        name: 'Rides',
        description: 'Ride management operations',
      },
      {
        name: 'Bookings',
        description: 'Booking management operations',
      },
      {
        name: 'Health',
        description: 'Health check and system status',
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Path to the API routes
};

const specs = swaggerJsdoc(options);

module.exports = specs; 