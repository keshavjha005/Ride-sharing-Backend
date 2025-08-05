const request = require('supertest');
const app = require('../src/app');

describe('Location API Basic Tests', () => {
  describe('GET /api/location/search', () => {
    it('should return 400 for missing query parameter', async () => {
      const response = await request(app)
        .get('/api/location/search')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation errors');
    });

    it('should return 400 for short query', async () => {
      const response = await request(app)
        .get('/api/location/search')
        .query({ query: 'A' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation errors');
    });

    it('should return 400 for invalid types parameter', async () => {
      const response = await request(app)
        .get('/api/location/search')
        .query({ 
          query: 'New York',
          types: 'invalid_type'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation errors');
    });
  });

  describe('GET /api/location/geocode', () => {
    it('should return 400 for missing address and placeId', async () => {
      const response = await request(app)
        .get('/api/location/geocode')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Either address or placeId is required');
    });

    it('should return 400 for short address', async () => {
      const response = await request(app)
        .get('/api/location/geocode')
        .query({ address: 'NY' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation errors');
    });
  });

  describe('GET /api/location/distance', () => {
    it('should return 400 for missing origin', async () => {
      const response = await request(app)
        .get('/api/location/distance')
        .query({ destination: 'Los Angeles, CA' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation errors');
    });

    it('should return 400 for missing destination', async () => {
      const response = await request(app)
        .get('/api/location/distance')
        .query({ origin: 'New York, NY' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation errors');
    });

    it('should return 400 for invalid mode', async () => {
      const response = await request(app)
        .get('/api/location/distance')
        .query({ 
          origin: 'New York, NY',
          destination: 'Los Angeles, CA',
          mode: 'invalid_mode'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation errors');
    });
  });

  describe('GET /api/location/route', () => {
    it('should return 400 for missing origin', async () => {
      const response = await request(app)
        .get('/api/location/route')
        .query({ destination: 'Boston, MA' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation errors');
    });

    it('should return 400 for missing destination', async () => {
      const response = await request(app)
        .get('/api/location/route')
        .query({ origin: 'New York, NY' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation errors');
    });
  });

  describe('POST /api/location/validate', () => {
    it('should return 400 for missing coordinates and address', async () => {
      const response = await request(app)
        .post('/api/location/validate')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation errors');
    });

    it('should return 400 for invalid latitude', async () => {
      const response = await request(app)
        .post('/api/location/validate')
        .send({
          latitude: 100, // Invalid latitude
          longitude: -74.0060
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation errors');
    });

    it('should return 400 for invalid longitude', async () => {
      const response = await request(app)
        .post('/api/location/validate')
        .send({
          latitude: 40.7128,
          longitude: 200 // Invalid longitude
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation errors');
    });

    it('should return 400 for short address', async () => {
      const response = await request(app)
        .post('/api/location/validate')
        .send({
          address: 'NY'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation errors');
    });
  });

  describe('API Documentation', () => {
    it('should serve Swagger documentation', async () => {
      const response = await request(app)
        .get('/api/docs')
        .expect(200);

      expect(response.text).toContain('swagger-ui');
      expect(response.text).toContain('Mate Backend API Documentation');
    });
  });
}); 