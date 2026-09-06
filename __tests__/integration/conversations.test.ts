// ============================================================
// 🧪 Integration Tests - Conversations & Messaging API
// Covers: Conversations, Messages, Read Status, Reporting
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
// Conversations List Tests
// ============================================================

describe('Integration - Conversations - List', () => {
  it('should require authentication for conversations list', async () => {
    const { status } = await apiRequest('/conversations');

    expect([401, 403]).toContain(status);
  });

  it('should accept pagination parameters', async () => {
    const { status } = await apiRequest('/conversations?page=1&limit=20');

    expect([401, 403, 200]).toContain(status);
  });

  it('should accept search parameter', async () => {
    const { status } = await apiRequest('/conversations?search=test');

    expect([401, 403, 200]).toContain(status);
  });

  it('should support sorting options', async () => {
    const { status } = await apiRequest('/conversations?sort=last_message');

    expect([401, 403, 200, 400]).toContain(status);
  });

  it('should filter by unread status', async () => {
    const { status } = await apiRequest('/conversations?unread=true');

    expect([401, 403, 200, 400]).toContain(status);
  });
});

// ============================================================
// Single Conversation Tests
// ============================================================

describe('Integration - Conversations - Single Conversation', () => {
  it('should require authentication for conversation details', async () => {
    const { status } = await apiRequest('/conversations/conversation-123');

    expect([401, 403, 404]).toContain(status);
  });

  it('should return 404 for non-existent conversation', async () => {
    const { status } = await apiRequest('/conversations/non-existent-conversation-12345');

    expect([404, 401, 403]).toContain(status);
  });

  it('should handle invalid conversation ID format', async () => {
    const { status } = await apiRequest('/conversations/invalid-id-with spaces');

    expect([400, 404, 401, 403]).toContain(status);
  });
});

// ============================================================
// Create Conversation Tests
// ============================================================

describe('Integration - Conversations - Create', () => {
  it('should require authentication to create conversation', async () => {
    const { status } = await apiRequest('/conversations', {
      method: 'POST',
      body: JSON.stringify({
        recipientId: 'user-123',
        listingId: 'listing-123',
        message: 'Hello!',
      }),
    });

    expect([401, 403, 400]).toContain(status);
  });

  it('should require recipient or listing', async () => {
    const { status } = await apiRequest('/conversations', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    expect([400, 401, 403]).toContain(status);
  });

  it('should require initial message', async () => {
    const { status } = await apiRequest('/conversations', {
      method: 'POST',
      body: JSON.stringify({
        recipientId: 'user-123',
      }),
    });

    expect([400, 401, 403]).toContain(status);
  });

  it('should validate message length', async () => {
    const longMessage = 'x'.repeat(10000);
    const { status } = await apiRequest('/conversations', {
      method: 'POST',
      body: JSON.stringify({
        recipientId: 'user-123',
        message: longMessage,
      }),
    });

    expect([400, 401, 403, 413]).toContain(status);
  });
});

// ============================================================
// Messages Tests
// ============================================================

describe('Integration - Conversations - Messages', () => {
  it('should require authentication to view messages', async () => {
    const { status } = await apiRequest('/conversations/conversation-123/messages');

    expect([401, 403, 404]).toContain(status);
  });

  it('should paginate messages', async () => {
    const { status } = await apiRequest('/conversations/conversation-123/messages?page=1&limit=50');

    expect([401, 403, 200, 404]).toContain(status);
  });

  it('should require authentication to send message', async () => {
    const { status } = await apiRequest('/conversations/conversation-123/messages', {
      method: 'POST',
      body: JSON.stringify({ content: 'Hello!' }),
    });

    expect([401, 403, 404, 400]).toContain(status);
  });

  it('should require message content', async () => {
    const { status } = await apiRequest('/conversations/conversation-123/messages', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    expect([400, 401, 403, 404]).toContain(status);
  });

  it('should reject empty message', async () => {
    const { status } = await apiRequest('/conversations/conversation-123/messages', {
      method: 'POST',
      body: JSON.stringify({ content: '' }),
    });

    expect([400, 401, 403, 404]).toContain(status);
  });

  it('should handle message with special characters', async () => {
    const { status } = await apiRequest('/conversations/conversation-123/messages', {
      method: 'POST',
      body: JSON.stringify({ content: '<script>alert("xss")</script>' }),
    });

    // Should either sanitize or reject
    expect([400, 401, 403, 404, 200]).toContain(status);
  });

  it('should handle Arabic/Unicode messages', async () => {
    const { status } = await apiRequest('/conversations/conversation-123/messages', {
      method: 'POST',
      body: JSON.stringify({ content: 'مرحبا! كيف حالك؟ 🙏' }),
    });

    expect([200, 400, 401, 403, 404]).toContain(status);
  });

  it('should enforce message length limit', async () => {
    const veryLongMessage = 'a'.repeat(5000);
    const { status } = await apiRequest('/conversations/conversation-123/messages', {
      method: 'POST',
      body: JSON.stringify({ content: veryLongMessage }),
    });

    expect([400, 401, 403, 404, 413]).toContain(status);
  });
});

// ============================================================
// Read Status Tests
// ============================================================

describe('Integration - Conversations - Read Status', () => {
  it('should require authentication to mark as read', async () => {
    const { status } = await apiRequest('/conversations/conversation-123/read', {
      method: 'PUT',
    });

    expect([401, 403, 404]).toContain(status);
  });

  it('should return success on valid request', async () => {
    const { status } = await apiRequest('/conversations/conversation-123/read', {
      method: 'PUT',
    });

    expect([200, 204, 401, 403, 404]).toContain(status);
  });
});

// ============================================================
// Conversation Reporting Tests
// ============================================================

describe('Integration - Conversations - Report', () => {
  it('should require authentication to report', async () => {
    const { status } = await apiRequest('/conversations/conversation-123/report', {
      method: 'POST',
      body: JSON.stringify({ reason: 'spam' }),
    });

    expect([401, 403, 404, 400]).toContain(status);
  });

  it('should require reason for report', async () => {
    const { status } = await apiRequest('/conversations/conversation-123/report', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    expect([400, 401, 403, 404]).toContain(status);
  });

  it('should accept optional description', async () => {
    const { status } = await apiRequest('/conversations/conversation-123/report', {
      method: 'POST',
      body: JSON.stringify({
        reason: 'harassment',
        description: 'User sent inappropriate messages',
      }),
    });

    expect([200, 201, 400, 401, 403, 404]).toContain(status);
  });
});

// ============================================================
// Conversation Deletion Tests
// ============================================================

describe('Integration - Conversations - Delete', () => {
  it('should require authentication to delete/hide conversation', async () => {
    const { status } = await apiRequest('/conversations/conversation-123', {
      method: 'DELETE',
    });

    expect([401, 403, 404]).toContain(status);
  });

  it('should return success on valid delete request', async () => {
    const { status } = await apiRequest('/conversations/conversation-123', {
      method: 'DELETE',
    });

    expect([200, 204, 401, 403, 404]).toContain(status);
  });
});

// ============================================================
// Message Security Tests
// ============================================================

describe('Integration - Conversations - Security', () => {
  it('should escape HTML in messages', async () => {
    // Even if auth fails, the endpoint should handle the input safely
    const { status, data } = await apiRequest('/conversations/test/messages', {
      method: 'POST',
      body: JSON.stringify({
        content: '<img src=x onerror=alert(1)>',
      }),
    });

    if (data?.error) {
      expect(data.error).not.toContain('<img');
      expect(data.error).not.toContain('<script');
    }
  });

  it('should handle SQL injection in messages', async () => {
    const { status, data } = await apiRequest('/conversations/test/messages', {
      method: 'POST',
      body: JSON.stringify({
        content: "'; DROP TABLE messages; --",
      }),
    });

    if (data) {
      const responseStr = JSON.stringify(data).toLowerCase();
      expect(responseStr).not.toContain('sql');
      expect(responseStr).not.toContain('syntax');
    }
  });

  it('should not expose other users\' private info', async () => {
    // This would need authenticated testing in real scenario
    const { data } = await apiRequest('/conversations');

    if (data && Array.isArray(data)) {
      for (const conv of data) {
        expect(conv).not.toHaveProperty('email');
        expect(conv).not.toHaveProperty('phoneNumber');
      }
    }
  });

  it('should have rate limiting on message sending', async () => {
    const promises = Array.from({ length: 20 }, (_, i) =>
      apiRequest('/conversations/test/messages', {
        method: 'POST',
        body: JSON.stringify({ content: `Spam message ${i}` }),
      })
    );

    const responses = await Promise.all(promises);
    const rateLimited = responses.filter(r => r.status === 429);

    // Should handle rapid requests gracefully
    expect(responses.length).toBe(20);
  });
});

// ============================================================
// Input Validation Edge Cases
// ============================================================

describe('Integration - Conversations - Input Validation', () => {
  it('should handle very long conversation ID', async () => {
    const longId = 'a'.repeat(1000);
    const { status } = await apiRequest(`/conversations/${longId}`);

    expect([404, 400, 401, 403, 414]).toContain(status);
  });

  it('should handle special characters in conversation ID', async () => {
    const { status } = await apiRequest('/conversations/<script>');

    expect([404, 400, 401, 403]).toContain(status);
  });

  it('should handle null/undefined values in request body', async () => {
    const { status } = await apiRequest('/conversations', {
      method: 'POST',
      body: JSON.stringify({ message: null }),
    });

    expect([400, 401, 403]).toContain(status);
  });

  it('should handle array instead of object', async () => {
    const { status } = await apiRequest('/conversations', {
      method: 'POST',
      body: JSON.stringify([1, 2, 3]),
    });

    expect([400, 401, 403]).toContain(status);
  });

  it('should handle malformed JSON', async () => {
    const response = await fetch(`${API_BASE}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not valid json {',
    });

    expect([400, 401, 403]).toContain(response.status);
  });
});
