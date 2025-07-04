import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { initializeDatabase } from '../database';
import restroomRoutes from '../routes/restrooms';

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  
  // Routes
  app.use('/api/restrooms', restroomRoutes);
  
  app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Backend is running' });
  });
  
  return app;
};

describe('API Endpoints', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('GET /api/health', () => {
    it('should return health check', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'OK',
        message: 'Backend is running'
      });
    });
  });

  describe('Restroom API', () => {
    describe('GET /api/restrooms', () => {
      it('should return empty array when no restrooms', async () => {
        const response = await request(app)
          .get('/api/restrooms')
          .expect(200);

        expect(response.body).toEqual([]);
      });

      it('should return restrooms with access codes', async () => {
        // First create a restroom
        await request(app)
          .post('/api/restrooms')
          .send({
            name: 'Test Restroom',
            latitude: 40.7128,
            longitude: -74.0060,
            type: 'neutral'
          });

        const response = await request(app)
          .get('/api/restrooms')
          .expect(200);

        expect(response.body).toHaveLength(1);
        expect(response.body[0]).toMatchObject({
          name: 'Test Restroom',
          latitude: 40.7128,
          longitude: -74.0060,
          type: 'neutral',
          access_codes: []
        });
      });
    });

    describe('POST /api/restrooms', () => {
      it('should create a new restroom', async () => {
        const restroomData = {
          name: 'Central Park Restroom',
          latitude: 40.7829,
          longitude: -73.9654,
          type: 'male'
        };

        const response = await request(app)
          .post('/api/restrooms')
          .send(restroomData)
          .expect(200);

        expect(response.body).toMatchObject({
          id: expect.any(Number),
          ...restroomData,
          message: 'Restroom added successfully'
        });
      });

      it('should return error for missing required fields', async () => {
        const response = await request(app)
          .post('/api/restrooms')
          .send({
            name: 'Incomplete Restroom'
          })
          .expect(400);

        expect(response.body).toEqual({
          error: 'Missing required fields'
        });
      });

      it('should accept valid restroom types', async () => {
        const types = ['male', 'female', 'neutral'];
        
        for (const type of types) {
          await request(app)
            .post('/api/restrooms')
            .send({
              name: `${type} Restroom`,
              latitude: 40.7128,
              longitude: -74.0060,
              type: type
            })
            .expect(200);
        }
      });
    });

    describe('POST /api/restrooms/:id/codes', () => {
      let restroomId: number;

      beforeEach(async () => {
        const response = await request(app)
          .post('/api/restrooms')
          .send({
            name: 'Test Restroom',
            latitude: 40.7128,
            longitude: -74.0060,
            type: 'neutral'
          });
        restroomId = response.body.id;
      });

      it('should add access code to restroom', async () => {
        const response = await request(app)
          .post(`/api/restrooms/${restroomId}/codes`)
          .send({ code: '1234' })
          .expect(200);

        expect(response.body).toMatchObject({
          id: expect.any(Number),
          restroom_id: restroomId.toString(),
          code: '1234',
          likes: 0,
          dislikes: 0,
          message: 'Access code added successfully'
        });
      });

      it('should return error for missing code', async () => {
        const response = await request(app)
          .post(`/api/restrooms/${restroomId}/codes`)
          .send({})
          .expect(400);

        expect(response.body).toEqual({
          error: 'Code is required'
        });
      });

      it('should return error for duplicate code', async () => {
        // Add code first time
        await request(app)
          .post(`/api/restrooms/${restroomId}/codes`)
          .send({ code: '1234' })
          .expect(200);

        // Try to add same code again
        const response = await request(app)
          .post(`/api/restrooms/${restroomId}/codes`)
          .send({ code: '1234' })
          .expect(400);

        expect(response.body).toEqual({
          error: 'This code already exists for this restroom'
        });
      });
    });

    describe('POST /api/restrooms/codes/:id/vote', () => {
      let codeId: number;

      beforeEach(async () => {
        // Create restroom
        const restroomResponse = await request(app)
          .post('/api/restrooms')
          .send({
            name: 'Test Restroom',
            latitude: 40.7128,
            longitude: -74.0060,
            type: 'neutral'
          });

        // Add access code
        const codeResponse = await request(app)
          .post(`/api/restrooms/${restroomResponse.body.id}/codes`)
          .send({ code: '1234' });
        
        codeId = codeResponse.body.id;
      });

      it('should record like vote', async () => {
        const response = await request(app)
          .post(`/api/restrooms/codes/${codeId}/vote`)
          .send({ type: 'like' })
          .expect(200);

        expect(response.body).toEqual({
          message: 'like recorded successfully'
        });
      });

      it('should record dislike vote', async () => {
        const response = await request(app)
          .post(`/api/restrooms/codes/${codeId}/vote`)
          .send({ type: 'dislike' })
          .expect(200);

        expect(response.body).toEqual({
          message: 'dislike recorded successfully'
        });
      });

      it('should return error for invalid vote type', async () => {
        const response = await request(app)
          .post(`/api/restrooms/codes/${codeId}/vote`)
          .send({ type: 'invalid' })
          .expect(400);

        expect(response.body).toEqual({
          error: 'Vote type must be "like" or "dislike"'
        });
      });

      it('should return error for non-existent code', async () => {
        const response = await request(app)
          .post('/api/restrooms/codes/999/vote')
          .send({ type: 'like' })
          .expect(404);

        expect(response.body).toEqual({
          error: 'Access code not found'
        });
      });
    });

    describe('Integration Test', () => {
      it('should create restroom with code and vote on it', async () => {
        // Create restroom
        const restroomResponse = await request(app)
          .post('/api/restrooms')
          .send({
            name: 'Full Test Restroom',
            latitude: 40.7128,
            longitude: -74.0060,
            type: 'neutral'
          });

        // Add access code
        const codeResponse = await request(app)
          .post(`/api/restrooms/${restroomResponse.body.id}/codes`)
          .send({ code: '5678' });

        // Vote on the code
        await request(app)
          .post(`/api/restrooms/codes/${codeResponse.body.id}/vote`)
          .send({ type: 'like' });

        // Get all restrooms and verify
        const allRestrooms = await request(app)
          .get('/api/restrooms')
          .expect(200);

        expect(allRestrooms.body).toHaveLength(1);
        expect(allRestrooms.body[0]).toMatchObject({
          name: 'Full Test Restroom',
          access_codes: expect.arrayContaining([
            expect.objectContaining({
              code: '5678',
              likes: 1,
              dislikes: 0
            })
          ])
        });
      });
    });
  });
});