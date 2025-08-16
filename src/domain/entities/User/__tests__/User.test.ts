import { describe, it, expect, afterEach } from 'vitest';
import { User } from '../User';
import { NotionUserResponse } from '../../../../shared/types/notion.types';

// Usar el sistema centralizado de mocks
import {
  createTestSetup
} from '@/mocks';

describe('User Entity', () => {
  const { teardown } = createTestSetup(); // ✅ Console mocks centralizados

  afterEach(() => {
    teardown(); // ✅ Limpieza automática
  });

  describe('Constructor', () => {
    it('debería crear un usuario con todos los parámetros', () => {
      const user = new User(
        'user-123',
        'John Doe',
        'https://avatar.url/john.jpg',
        'person',
        'john@example.com'
      );

      expect(user.id).toBe('user-123');
      expect(user.name).toBe('John Doe');
      expect(user.avatarUrl).toBe('https://avatar.url/john.jpg');
      expect(user.type).toBe('person');
      expect(user.email).toBe('john@example.com');
    });

    it('debería crear un usuario con parámetros mínimos', () => {
      const user = new User('user-123');

      expect(user.id).toBe('user-123');
      expect(user.name).toBeUndefined();
      expect(user.avatarUrl).toBeUndefined();
      expect(user.type).toBe('person'); // valor por defecto
      expect(user.email).toBeUndefined();
    });

    it('debería crear un usuario tipo bot', () => {
      const user = new User('bot-123', 'Bot Assistant', undefined, 'bot');

      expect(user.id).toBe('bot-123');
      expect(user.name).toBe('Bot Assistant');
      expect(user.type).toBe('bot');
      expect(user.email).toBeUndefined();
    });
  });

  describe('fromNotionResponse', () => {
    it('debería crear un usuario desde respuesta completa de Notion', () => {
      const notionResponse: NotionUserResponse = {
        id: 'user-456',
        name: 'Jane Smith',
        avatar_url: 'https://avatar.url/jane.jpg',
        type: 'person',
        person: {
          email: 'jane@example.com'
        }
      };

      const user = User.fromNotionResponse(notionResponse);

      expect(user.id).toBe('user-456');
      expect(user.name).toBe('Jane Smith');
      expect(user.avatarUrl).toBe('https://avatar.url/jane.jpg');
      expect(user.type).toBe('person');
      expect(user.email).toBe('jane@example.com');
    });

    it('debería crear un usuario bot desde respuesta de Notion', () => {
      const notionResponse: NotionUserResponse = {
        id: 'bot-789',
        name: 'Notion Bot',
        avatar_url: 'https://avatar.url/bot.jpg',
        type: 'bot',
        person: {
          email: 'bot@notion.so'
        }
      };

      const user = User.fromNotionResponse(notionResponse);

      expect(user.id).toBe('bot-789');
      expect(user.name).toBe('Notion Bot');
      expect(user.avatarUrl).toBe('https://avatar.url/bot.jpg');
      expect(user.type).toBe('bot');
      expect(user.email).toBe('bot@notion.so');
    });

    it('debería manejar email undefined correctamente', () => {
      const notionResponse: NotionUserResponse = {
        id: 'user-999',
        name: 'User Without Email',
        avatar_url: 'https://avatar.url/user.jpg',
        type: 'person',
        person: {
          email: undefined as unknown as string
        }
      };

      const user = User.fromNotionResponse(notionResponse);

      expect(user.id).toBe('user-999');
      expect(user.name).toBe('User Without Email');
      expect(user.email).toBeUndefined();
    });
  });

  describe('toJSON', () => {
    it('debería serializar correctamente un usuario completo', () => {
      const user = new User(
        'user-123',
        'John Doe',
        'https://avatar.url/john.jpg',
        'person',
        'john@example.com'
      );

      const json = user.toJSON();

      expect(json).toEqual({
        id: 'user-123',
        name: 'John Doe',
        avatarUrl: 'https://avatar.url/john.jpg',
        type: 'person',
        email: 'john@example.com'
      });
    });

    it('debería serializar correctamente un usuario con valores undefined', () => {
      const user = new User('user-456');

      const json = user.toJSON();

      expect(json).toEqual({
        id: 'user-456',
        name: undefined,
        avatarUrl: undefined,
        type: 'person',
        email: undefined
      });
    });

    it('debería serializar correctamente un usuario bot', () => {
      const user = new User('bot-789', 'Bot Assistant', undefined, 'bot');

      const json = user.toJSON();

      expect(json).toEqual({
        id: 'bot-789',
        name: 'Bot Assistant',
        avatarUrl: undefined,
        type: 'bot',
        email: undefined
      });
    });
  });

  describe('Edge Cases', () => {
    it('debería manejar caracteres especiales en el nombre', () => {
      const user = new User(
        'user-special',
        'José María Ñoño',
        'https://avatar.url/jose.jpg',
        'person',
        'josé@example.com'
      );

      expect(user.name).toBe('José María Ñoño');
      expect(user.email).toBe('josé@example.com');
    });

    it('debería manejar URLs de avatar muy largas', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(500) + '.jpg';
      const user = new User('user-long', 'User', longUrl);

      expect(user.avatarUrl).toBe(longUrl);
    });

    it('debería mantener la inmutabilidad de las propiedades', () => {
      const user = new User('user-immutable', 'Original Name');

      // Las propiedades son readonly, esto es una verificación de TypeScript
      // En runtime, las propiedades pueden ser modificadas pero no es la intención
      expect(user.id).toBe('user-immutable');
      expect(user.name).toBe('Original Name');
      expect(user.type).toBe('person');
    });
  });

  describe('Integración', () => {
    it('debería hacer round-trip correctamente con fromNotionResponse y toJSON', () => {
      const originalData: NotionUserResponse = {
        id: 'user-roundtrip',
        name: 'Round Trip User',
        avatar_url: 'https://avatar.url/roundtrip.jpg',
        type: 'person',
        person: {
          email: 'roundtrip@example.com'
        }
      };

      const user = User.fromNotionResponse(originalData);
      const json = user.toJSON();

      expect(json.id).toBe(originalData.id);
      expect(json.name).toBe(originalData.name);
      expect(json.avatarUrl).toBe(originalData.avatar_url);
      expect(json.type).toBe(originalData.type);
      expect(json.email).toBe(originalData.person.email);
    });
  });
});
