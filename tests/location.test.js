const request = require('supertest');
const app = require('../src/app');

describe('Location API Endpoints', () => {
  describe('GET /api/location/search', () => {
    it('should search for locations', async () => {
      const response = await request(app)
        .get('/api/location/search')
        .query({ query: 'New York' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('places');
      expect(Array.isArray(response.body.data.places)).toBe(true);
    });

    it('should return 400 for short query', async () => {
      const response = await request(app)
        .get('/api/location/search')
        .query({ query: 'A' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('at least 2 characters');
    });

    it('should return 400 for missing query', async () => {
      const response = await request(app)
        .get('/api/location/search')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/location/geocode', () => {
    it('should geocode an address', async () => {
      const response = await request(app)
        .get('/api/location/geocode')
        .query({ address: '1600 Pennsylvania Avenue NW, Washington, DC' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('coordinates');
      expect(response.body.data.coordinates).toHaveProperty('latitude');
      expect(response.body.data.coordinates).toHaveProperty('longitude');
    });

    it('should return 400 for missing address and placeId', async () => {
      const response = await request(app)
        .get('/api/location/geocode')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Either address or placeId is required');
    });
  });

  describe('GET /api/location/distance', () => {
    it('should calculate distance between two points', async () => {
      const response = await request(app)
        .get('/api/location/distance')
        .query({
          origin: 'New York, NY',
          destination: 'Los Angeles, CA'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('distance');
      expect(response.body.data).toHaveProperty('duration');
    });

    it('should return 400 for missing origin', async () => {
      const response = await request(app)
        .get('/api/location/distance')
        .query({ destination: 'Los Angeles, CA' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Origin is required');
    });

    it('should return 400 for missing destination', async () => {
      const response = await request(app)
        .get('/api/location/distance')
        .query({ origin: 'New York, NY' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Destination is required');
    });
  });

  describe('GET /api/location/route', () => {
    it('should get route information', async () => {
      const response = await request(app)
        .get('/api/location/route')
        .query({
          origin: 'New York, NY',
          destination: 'Boston, MA'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('routes');
      expect(Array.isArray(response.body.data.routes)).toBe(true);
    });

    it('should return 400 for missing origin', async () => {
      const response = await request(app)
        .get('/api/location/route')
        .query({ destination: 'Boston, MA' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Origin is required');
    });

    it('should return 400 for missing destination', async () => {
      const response = await request(app)
        .get('/api/location/route')
        .query({ origin: 'New York, NY' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Destination is required');
    });
  });

  describe('POST /api/location/validate', () => {
    it('should validate valid coordinates', async () => {
      const response = await request(app)
        .post('/api/location/validate')
        .send({
          latitude: 40.7128,
          longitude: -74.0060
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(true);
    });

    it('should validate valid address', async () => {
      const response = await request(app)
        .post('/api/location/validate')
        .send({
          address: '1600 Pennsylvania Avenue NW, Washington, DC'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(true);
    });

    it('should return 400 for invalid coordinates', async () => {
      const response = await request(app)
        .post('/api/location/validate')
        .send({
          latitude: 100, // Invalid latitude
          longitude: -74.0060
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing coordinates and address', async () => {
      const response = await request(app)
        .post('/api/location/validate')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Either coordinates (latitude, longitude) or address is required');
    });
  });
}); 