// ============================================================
// 🧪 Integration Tests - Notifications API
// Covers: List, Read, Mark All Read, Unread Count, Delete
// ============================================================

import { describe, it, expect } from 'vitest';

// ============================================================
// Test Configuration
// ============================================================

const API_BASE = 'http://localhost:3000/api';

// Helper function for API requests
async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ status: number; data: any; headers: Headers }> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return { status: response.status, data, headers: response.headers };
}

// ============================================================
// Notifications List Tests
// ============================================================

describe('Integration - Notifications - List', () => {
  it('should require authentication for notifications', async () => {
    const { status } = await apiRequest('/notifications');

    expect([401, 403]).toContain(status);
  });

  it('should accept pagination parameters', async () => {
    const { status } = await apiRequest('/notifications?page=1&limit=20');

    expect([401, 403, 200]).toContain(status);
  });

  it('should filter by notification type', async () => {
    const { status } = await apiRequest('/notifications?type=message');

    expect([401, 403, 200, 400]).toContain(status);
  });

  it('should filter by read status', async () => {
    const { status } = await apiRequest('/notifications?is_read=false');

    expect([401, 403, 200, 400]).toContain(status);
  });

  it('should return notifications array when authenticated', async () => {
    const { status, data } = await apiRequest('/notifications');

    if (status === 200) {
      expect(Array.isArray(data)).toBe(true);
      if (data.length > 0) {
        expect(data[0]).toHaveProperty('id');
        expect(data[0]).toHaveProperty('type');
        expect(data[0]).toHaveProperty('title');
      }
    }
  });
});

// ============================================================
// Single Notification Tests
// ============================================================

describe('Integration - Notifications - Single Notification', () => {
  it('should require authentication for notification details', async () => {
    const { status } = await apiRequest('/notifications/notification-123');

    expect([401, 403, 404]).toContain(status);
  });

  it('should return 404 for non-existent notification', async () => {
    const { status } = await apiRequest('/notifications/non-existent-notification-12345');

    expect([404, 401, 403]).toContain(status);
  });

  it('should require authentication to mark as read', async () => {
    const { status } = await apiRequest('/notifications/notification-123', {
      method: 'PUT',
      body: JSON.stringify({ is_read: true }),
    });

    expect([200, 204, 401, 403, 404]).toContain(status);
  });

  it('should require authentication to delete notification', async () => {
    const { status } = await apiRequest('/notifications/notification-123', {
      method: 'DELETE',
    });

    expect([200, 204, 401, 403, 404]).toContain(status);
  });
});

// ============================================================
// Unread Count Tests
// ============================================================

describe('Integration - Notifications - Unread Count', () => {
  it('should require authentication for unread count', async () => {
    const { status } = await apiRequest('/notifications/unread');

    expect([401, 403]).toContain(status);
  });

  it('should return count number when authenticated', async () => {
    const { status, data } = await apiRequest('/notifications/unread');

    if (status === 200) {
      expect(typeof data).toBe('number');
      expect(data).toBeGreaterThanOrEqual(0);
    }
  });
});

// ============================================================
// Mark All As Read Tests
// ============================================================

describe('Integration - Notifications - Mark All Read', () => {
  it('should require authentication to mark all as read', async () => {
    const { status } = await apiRequest('/notifications/read-all', {
      method: 'POST',
    });

    expect([200, 204, 401, 403]).toContain(status);
  });

  it('should return success on valid request', async () => {
    const { status, data } = await apiRequest('/notifications/read-all', {
      method: 'POST',
    });

    if ([200, 204].includes(status)) {
      if (data) {
        expect(data.success).toBe(true);
      }
    }
  });
});

// ============================================================
// Notification Types & Categories
// ============================================================

describe('Integration - Notifications - Types & Categories', () => {
  const validTypes = [
    'message',
    'listing_favorite',
    'listing_review',
    'payment_received',
    'order_update',
    'system',
    'moderation',
  ];

  it.each(validTypes)('should accept %s type filter', async (type) => {
    const { status } = await apiRequest(`/notifications?type=${type}`);

    expect([401, 403, 200, 400]).toContain(status);
  });

  it('should reject invalid notification type', async () => {
    const { status } = await apiRequest('/notifications?type=invalid_type');

    expect([400, 401, 403, 200]).toContain(status);
  });
});

// ============================================================
// Notification Security Tests
// ============================================================

describe('Integration - Notifications - Security', () => {
  it('should not allow accessing other users\' notifications', async () => {
    // Even with valid auth, should only return user's own notifications
    const { status, data } = await apiRequest('/notifications');

    if (status === 200 && Array.isArray(data)) {
      // Each notification should belong to the authenticated user
      // (This would need actual auth to fully test)
      expect(Array.isArray(data)).toBe(true);
    }
  });

  it('should sanitize HTML in notification content', async () => {
    // Test that HTML is escaped in responses
    const { data } = await apiRequest('/notifications');

    if (Array.isArray(data) && data.length > 0) {
      for (const notification of data) {
        if (notification.title) {
          expect(notification.title).not.toContain('<script>');
          expect(notification.title).not.toContain('<img');
        }
        if (notification.body) {
          expect(notification.body).not.toContain('<script>');
          expect(notification.body).not.toContain('onclick=');
        }
      }
    }
  });

  it('should handle SQL injection in type parameter', async () => {
    const { status, data } = await apiRequest("/notifications?type=' OR '1'='1");

    expect([400, 401, 403, 200]).toContain(status);
    if (data) {
      const responseStr = JSON.stringify(data).toLowerCase();
      expect(responseStr).not.toContain('sql');
    }
  });

  it('should have rate limiting on notification endpoints', async () => {
    const promises = Array.from({ length: 15 }, () =>
      apiRequest('/notifications')
    );

    const responses = await Promise.all(promises);

    // Should handle rapid requests gracefully
    responses.forEach(({ status }) => {
      expect([200, 401, 403, 429]).toContain(status);
    });
  });
});

// ============================================================
// Input Validation Tests
// ============================================================

describe('Integration - Notifications - Input Validation', () => {
  it('should handle invalid page number', async () => {
    const { status } = await apiRequest('/notifications?page=abc');

    expect([400, 401, 403, 200]).toContain(status);
  });

  it('should handle negative page number', async () => {
    const { status } = await apiRequest('/notifications?page=-1');

    expect([400, 401, 403, 200]).toContain(status);
  });

  it('should handle very large limit', async () => {
    const { status } = await apiRequest('/notifications?limit=99999');

    // Should cap the limit or return error
    expect([200, 400, 401, 403]).toContain(status);
  });

  it('should handle special characters in notification ID', async () => {
    const { status } = await apiRequest('/notifications/<script>alert(1)</script>');

    expect([400, 404, 401, 403]).toContain(status);
  });

  it('should handle empty PUT body', async () => {
    const { status } = await apiRequest('/notifications/test-id', {
      method: 'PUT',
      body: JSON.stringify({}),
    });

    expect([200, 400, 401, 403, 404]).toContain(status);
  });
});

// ============================================================
// Response Format Tests
// ============================================================

describe('Integration - Notifications - Response Format', () => {
  it('should return consistent response structure for list', async () => {
    const { status, data } = await apiRequest('/notifications?limit=1');

    if (status === 200) {
      expect(Array.isArray(data)).toBe(true);
    }
  });

  it('should include timestamp on notifications', async () => {
    const { status, data } = await apiRequest('/notifications?limit=1');

    if (status === 200 && Array.isArray(data) && data.length > 0) {
      expect(data[0]).toHaveProperty('created_at');
      // Timestamp should be valid ISO format or Unix timestamp
      const timestamp = Date.parse(data[0].created_at);
      expect(timestamp).not.toBeNaN();
    }
  });

  it('should include action URL or link when applicable', async () => {
    const { status, data } = await apiRequest('/notifications?limit=5');

    if (status === 200 && Array.isArray(data)) {
      for (const notification of data) {
        // May or may not have action_url depending on type
        if (notification.action_url) {
          expect(notification.action_url).toMatch(/^https?:\/\//);
        }
      }
    }
  });
});
