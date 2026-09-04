/**
 * Unit Tests for UUID Utilities
 * @module __tests__/lib/uuid-utils.test
 */

import { describe, it, expect } from 'vitest';
import {
  toTextId,
  idsMatch,
  uuidFilter,
  authUid,
  generateUUID,
  isValidUUID,
} from '@/lib/uuid-utils';

describe('UUID Utilities', () => {
  describe('toTextId', () => {
    it('should convert string ID to string', () => {
      expect(toTextId('abc-123')).toBe('abc-123');
    });

    it('should handle null input', () => {
      expect(toTextId(null)).toBeNull();
    });

    it('should handle undefined input', () => {
      expect(toTextId(undefined)).toBeNull();
    });

    it('should convert number-like string', () => {
      expect(toTextId('12345')).toBe('12345');
    });
  });

  describe('idsMatch', () => {
    it('should match identical IDs', () => {
      expect(idsMatch('abc-123', 'abc-123')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(idsMatch('ABC-123', 'abc-123')).toBe(true);
    });

    it('should not match different IDs', () => {
      expect(idsMatch('abc-123', 'xyz-789')).toBe(false);
    });

    it('should handle null values', () => {
      expect(idsMatch(null, 'abc-123')).toBe(false);
      expect(idsMatch('abc-123', null)).toBe(false);
      expect(idsMatch(null, null)).toBe(false);
    });
  });

  describe('uuidFilter', () => {
    it('should return the ID as string', () => {
      expect(uuidFilter('test-id')).toBe('test-id');
    });

    it('should return null for null input', () => {
      expect(uuidFilter(null)).toBeNull();
    });
  });

  describe('authUid', () => {
    it('should convert to string', () => {
      expect(authUid('user-123')).toBe('user-123');
    });
  });

  describe('generateUUID', () => {
    it('should generate a valid UUID format', () => {
      const uuid = generateUUID();
      expect(isValidUUID(uuid)).toBe(true);
    });

    it('should generate unique UUIDs', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('isValidUUID', () => {
    it('should validate correct UUID v4 format', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('')).toBe(false);
      expect(isValidUUID('abc')).toBe(false);
    });

    it('should accept generated UUIDs', () => {
      const uuid = generateUUID();
      expect(isValidUUID(uuid)).toBe(true);
    });
  });
});
