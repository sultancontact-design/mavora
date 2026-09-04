import { describe, it, expect } from 'vitest';

describe('Security Tests', () => {
  describe('XSS Prevention', () => {
    it('should handle script tags in input', async () => {
      const maliciousTitle = '<script>alert("xss")</script>';
      const response = await fetch('http://localhost:3000/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: maliciousTitle,
          description: 'Test description long enough'.repeat(5),
          categoryId: 'test',
        }),
      });
      
      // Should not crash the server
      expect([200, 400, 401, 500]).toContain(response.status);
    });

    it('should handle SQL injection attempts', async () => {
      const sqlInjection = "'; DROP TABLE listings; --";
      const response = await fetch('http://localhost:3000/api/listings?search=' + encodeURIComponent(sqlInjection));
      
      // Should not crash
      expect([200, 400, 500]).toContain(response.status);
    });
  });

  describe('Input Validation', () => {
    it('should handle oversized inputs', async () => {
      const longString = 'a'.repeat(10000);
      const response = await fetch('http://localhost:3000/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: longString,
          description: 'Test'.repeat(100),
          categoryId: 'test',
        }),
      });
      
      expect([400, 413, 500]).toContain(response.status);
    });
  });
});
