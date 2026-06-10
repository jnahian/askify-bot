/**
 * Tests for templateService
 * Comprehensive coverage of template CRUD operations
 */

import { mockPrismaClient, resetPrismaMocks } from '../mocks/prisma';
import {
  saveTemplate,
  getTemplates,
  getTemplate,
  deleteTemplate,
  type TemplateConfig,
} from '../../src/services/templateService';
import { createTestTemplate } from '../fixtures/testData';

// The shared mock doesn't define findFirst on pollTemplate; add it here.
mockPrismaClient.pollTemplate.findFirst = jest.fn();

describe('templateService', () => {
  beforeEach(() => {
    resetPrismaMocks();
  });

  describe('saveTemplate', () => {
    it('should create a new template with config', async () => {
      const config: TemplateConfig = {
        pollType: 'single_choice',
        options: ['Option A', 'Option B', 'Option C'],
        description: 'My custom poll template',
        settings: {
          anonymous: false,
          allowVoteChange: true,
          liveResults: true,
        },
        closeMethod: 'duration',
        durationHours: 24,
      };

      const mockTemplate = createTestTemplate({
        userId: 'U123',
        name: 'Team Standup Poll',
        config: config as any,
      });

      mockPrismaClient.pollTemplate.create.mockResolvedValue(mockTemplate as any);

      const result = await saveTemplate('U123', 'Team Standup Poll', config);

      expect(mockPrismaClient.pollTemplate.create).toHaveBeenCalledWith({
        data: {
          userId: 'U123',
          name: 'Team Standup Poll',
          config: expect.any(Object),
        },
      });
      expect(result).toEqual(mockTemplate);
      expect(result.name).toBe('Team Standup Poll');
      expect(result.userId).toBe('U123');
    });

    it('should save yes/no template', async () => {
      const config: TemplateConfig = {
        pollType: 'yes_no',
        options: ['Yes', 'No', 'Maybe'],
        settings: {
          anonymous: false,
          allowVoteChange: true,
          liveResults: true,
        },
        closeMethod: 'manual',
      };

      const mockTemplate = createTestTemplate({
        userId: 'U456',
        name: 'Quick Decision',
        config: config as any,
      });

      mockPrismaClient.pollTemplate.create.mockResolvedValue(mockTemplate as any);

      const result = await saveTemplate('U456', 'Quick Decision', config);

      expect(result.config.pollType).toBe('yes_no');
      expect(result.config.options).toEqual(['Yes', 'No', 'Maybe']);
    });

    it('should save rating template with rating scale', async () => {
      const config: TemplateConfig = {
        pollType: 'rating',
        options: ['1', '2', '3', '4', '5'],
        settings: {
          anonymous: true,
          allowVoteChange: false,
          liveResults: false,
          ratingScale: 5,
        },
        closeMethod: 'duration',
        durationHours: 168, // 1 week
      };

      const mockTemplate = createTestTemplate({
        userId: 'U789',
        name: 'Satisfaction Survey',
        config: config as any,
      });

      mockPrismaClient.pollTemplate.create.mockResolvedValue(mockTemplate as any);

      const result = await saveTemplate('U789', 'Satisfaction Survey', config);

      expect(result.config.pollType).toBe('rating');
      expect(result.config.settings.ratingScale).toBe(5);
      expect(result.config.settings.anonymous).toBe(true);
    });

    it('should save multi-select template', async () => {
      const config: TemplateConfig = {
        pollType: 'multi_select',
        options: ['Pizza', 'Burgers', 'Salad', 'Sushi'],
        description: 'Team lunch options',
        settings: {
          anonymous: false,
          allowVoteChange: true,
          liveResults: true,
        },
        closeMethod: 'duration',
        durationHours: 4,
      };

      const mockTemplate = createTestTemplate({
        userId: 'U999',
        name: 'Lunch Poll',
        config: config as any,
      });

      mockPrismaClient.pollTemplate.create.mockResolvedValue(mockTemplate as any);

      const result = await saveTemplate('U999', 'Lunch Poll', config);

      expect(result.config.pollType).toBe('multi_select');
      expect(result.config.options).toHaveLength(4);
    });
  });

  describe('getTemplates', () => {
    it('should fetch all templates for a user ordered by creation date', async () => {
      const mockTemplates = [
        createTestTemplate({
          userId: 'U123',
          name: 'Template 1',
          createdAt: new Date('2026-02-15T12:00:00Z'),
        }),
        createTestTemplate({
          userId: 'U123',
          name: 'Template 2',
          createdAt: new Date('2026-02-14T12:00:00Z'),
        }),
        createTestTemplate({
          userId: 'U123',
          name: 'Template 3',
          createdAt: new Date('2026-02-13T12:00:00Z'),
        }),
      ];

      mockPrismaClient.pollTemplate.findMany.mockResolvedValue(mockTemplates as any);

      const result = await getTemplates('U123');

      expect(mockPrismaClient.pollTemplate.findMany).toHaveBeenCalledWith({
        where: { userId: 'U123' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Template 1');
      expect(result[1].name).toBe('Template 2');
      expect(result[2].name).toBe('Template 3');
    });

    it('should return empty array when user has no templates', async () => {
      mockPrismaClient.pollTemplate.findMany.mockResolvedValue([]);

      const result = await getTemplates('U456');

      expect(result).toEqual([]);
      expect(mockPrismaClient.pollTemplate.findMany).toHaveBeenCalledWith({
        where: { userId: 'U456' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should only return templates for specified user', async () => {
      const user1Templates = [
        createTestTemplate({ userId: 'U111', name: 'User 1 Template' }),
      ];

      mockPrismaClient.pollTemplate.findMany.mockResolvedValue(user1Templates as any);

      const result = await getTemplates('U111');

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('U111');
    });
  });

  describe('getTemplate', () => {
    it('should fetch a single template by ID scoped to the user', async () => {
      const mockTemplate = createTestTemplate({
        id: 'template-123',
        userId: 'U123',
        name: 'My Template',
      });

      mockPrismaClient.pollTemplate.findFirst.mockResolvedValue(mockTemplate as any);

      const result = await getTemplate('template-123', 'U123');

      expect(mockPrismaClient.pollTemplate.findFirst).toHaveBeenCalledWith({
        where: { id: 'template-123', userId: 'U123' },
      });
      expect(result).toEqual(mockTemplate);
      expect(result?.id).toBe('template-123');
    });

    it('should return null when template not found', async () => {
      mockPrismaClient.pollTemplate.findFirst.mockResolvedValue(null);

      const result = await getTemplate('nonexistent-id', 'U123');

      expect(result).toBeNull();
      expect(mockPrismaClient.pollTemplate.findFirst).toHaveBeenCalledWith({
        where: { id: 'nonexistent-id', userId: 'U123' },
      });
    });

    it('should fetch template with all config properties', async () => {
      const mockTemplate = createTestTemplate({
        id: 'template-456',
        config: {
          pollType: 'rating',
          options: ['1', '2', '3', '4', '5'],
          description: 'Rate our service',
          settings: {
            anonymous: true,
            allowVoteChange: false,
            liveResults: false,
            ratingScale: 5,
          },
          closeMethod: 'duration',
          durationHours: 72,
        },
      });

      mockPrismaClient.pollTemplate.findFirst.mockResolvedValue(mockTemplate as any);

      const result = await getTemplate('template-456', 'U123456');

      expect(result?.config.pollType).toBe('rating');
      expect(result?.config.options).toHaveLength(5);
      expect(result?.config.settings.ratingScale).toBe(5);
      expect(result?.config.durationHours).toBe(72);
    });
  });

  describe('deleteTemplate', () => {
    it('should delete template when user is owner', async () => {
      const mockTemplate = createTestTemplate({
        id: 'template-123',
        userId: 'U123',
        name: 'My Template',
      });

      mockPrismaClient.pollTemplate.findUnique.mockResolvedValue(mockTemplate as any);
      mockPrismaClient.pollTemplate.delete.mockResolvedValue(mockTemplate as any);

      const result = await deleteTemplate('template-123', 'U123');

      expect(mockPrismaClient.pollTemplate.findUnique).toHaveBeenCalledWith({
        where: { id: 'template-123' },
      });
      expect(mockPrismaClient.pollTemplate.delete).toHaveBeenCalledWith({
        where: { id: 'template-123' },
      });
      expect(result).toBe(true);
    });

    it('should return false when user is not owner', async () => {
      const mockTemplate = createTestTemplate({
        id: 'template-123',
        userId: 'U123',
        name: 'My Template',
      });

      mockPrismaClient.pollTemplate.findUnique.mockResolvedValue(mockTemplate as any);

      const result = await deleteTemplate('template-123', 'U456');

      expect(mockPrismaClient.pollTemplate.findUnique).toHaveBeenCalledWith({
        where: { id: 'template-123' },
      });
      expect(mockPrismaClient.pollTemplate.delete).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should return false when template does not exist', async () => {
      mockPrismaClient.pollTemplate.findUnique.mockResolvedValue(null);

      const result = await deleteTemplate('nonexistent-id', 'U123');

      expect(mockPrismaClient.pollTemplate.findUnique).toHaveBeenCalledWith({
        where: { id: 'nonexistent-id' },
      });
      expect(mockPrismaClient.pollTemplate.delete).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should verify ownership before deletion', async () => {
      const mockTemplate = createTestTemplate({
        id: 'template-789',
        userId: 'U789',
        name: 'Protected Template',
      });

      mockPrismaClient.pollTemplate.findUnique.mockResolvedValue(mockTemplate as any);

      // Try to delete with wrong user
      const result1 = await deleteTemplate('template-789', 'U999');
      expect(result1).toBe(false);

      // Try to delete with correct user
      const result2 = await deleteTemplate('template-789', 'U789');
      expect(result2).toBe(true);
      expect(mockPrismaClient.pollTemplate.delete).toHaveBeenCalledTimes(1);
    });
  });
});
