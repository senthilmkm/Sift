module.exports = {
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(true),
  composeAsync: jest.fn().mockResolvedValue({ status: 'sent' }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notif_123'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(true),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  setNotificationHandler: jest.fn(),
  AndroidNotificationPriority: { HIGH: 4, DEFAULT: 3 },
  Share: {
    share: jest.fn().mockResolvedValue({ action: 'sharedAction' }),
  },
  Linking: {
    openURL: jest.fn().mockResolvedValue(true),
  },
  Paths: {
    cache: 'file:///mock_cache',
  },
  File: class {
    constructor(dir, name) {
      this.uri = `${dir}/${name}`;
    }
    create() {}
    write() {}
  },
};