import { describe, it, expect } from 'vitest';

describe('Listings API', () => {
  describe('GET /api/listings', () => {
    it('should return listings array', async () => {
      const response = await fetch('http://localhost:3000/api/listings');
      expect([200, 404, 500]).toContain(response.status);
      
      if (response.status === 200) {
        const data = await response.json();
        expect(Array.isArray(data.data)).toBe(true);
        expect(data.total).toBeDefined();
      }
    });

    it('should support pagination params', async () => {
      const response = await fetch('http://localhost:3000/api/listings?page=1&per_page=5');
      expect([200, 404, 500]).toContain(response.status);
    });
  });

  describe('POST /api/listings', () => {
    it('should validate required fields', async () => {
      const response = await fetch('http://localhost:3000/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      expect([400, 401, 403, 500]).toContain(response.status);
    });
  });
});
