export const testData = {
  users: {
    testUser: {
      id: 'test-user-1',
      name: 'Usuario de Prueba',
      email: 'test@example.com'
    }
  },

  chat: {
    testMessages: [
      'Hola, ¿cómo estás?',
      '¿Puedes ayudarme con algo?',
      'Gracias por tu ayuda'
    ]
  },

  navigation: {
    routes: {
      home: '/',
      chat: '/chat',
      settings: '/settings',
      settingsGeneral: '/settings/general',
      settingsSync: '/settings/sync',
      visualizer: '/visualizer'
    }
  },

  selectors: {
    chat: {
      container: '[data-testid="chat-container"]',
      messageInput: 'textarea',
      submitButton: 'button[type="submit"]'
    },

    settings: {
      container: '[data-testid="settings-container"]'
    }
  }
};
