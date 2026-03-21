import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnalyticsService } from '../services/AnalyticsService';

describe('AnalyticsService', () => {
  beforeEach(async () => {
    await AnalyticsService.clearEvents();
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  describe('trackEvent', () => {
    it('stores an event', async () => {
      await AnalyticsService.trackEvent('test_event', { key: 'value' });
      const events = await AnalyticsService.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].name).toBe('test_event');
      expect(events[0].properties).toEqual({ key: 'value' });
    });

    it('stores timestamp with each event', async () => {
      await AnalyticsService.trackEvent('timed_event');
      const events = await AnalyticsService.getEvents();
      expect(events[0].timestamp).toBeDefined();
      expect(new Date(events[0].timestamp).getTime()).toBeGreaterThan(0);
    });

    it('caps at 500 events', async () => {
      for (let i = 0; i < 510; i++) {
        await AnalyticsService.trackEvent(`event_${i}`);
      }
      const events = await AnalyticsService.getEvents();
      expect(events.length).toBeLessThanOrEqual(500);
    });

    it('handles events without properties', async () => {
      await AnalyticsService.trackEvent('no_props');
      const events = await AnalyticsService.getEvents();
      expect(events[0].properties).toBeUndefined();
    });

    it('stores multiple properties of different types', async () => {
      await AnalyticsService.trackEvent('multi_prop', {
        name: 'test',
        count: 42,
        active: true,
      });
      const events = await AnalyticsService.getEvents();
      expect(events[0].properties).toEqual({
        name: 'test',
        count: 42,
        active: true,
      });
    });

    it('does not throw on AsyncStorage failure', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Storage full'));
      await expect(
        AnalyticsService.trackEvent('fail_event'),
      ).resolves.toBeUndefined();
      await AnalyticsService.flush();
    });

    it('accumulates multiple sequential events correctly', async () => {
      await AnalyticsService.trackEvent('event_a', { step: 1 });
      await AnalyticsService.trackEvent('event_b', { step: 2 });
      await AnalyticsService.trackEvent('event_c', { step: 3 });

      const events = await AnalyticsService.getEvents();
      expect(events).toHaveLength(3);
      expect(events[0].name).toBe('event_a');
      expect(events[1].name).toBe('event_b');
      expect(events[2].name).toBe('event_c');
      expect(events[0].properties).toEqual({ step: 1 });
      expect(events[1].properties).toEqual({ step: 2 });
      expect(events[2].properties).toEqual({ step: 3 });
    });
  });

  describe('getEventsSummary', () => {
    it('counts events by name', async () => {
      await AnalyticsService.trackEvent('document_added');
      await AnalyticsService.trackEvent('document_added');
      await AnalyticsService.trackEvent('document_deleted');
      const summary = await AnalyticsService.getEventsSummary();
      expect(summary.document_added).toBe(2);
      expect(summary.document_deleted).toBe(1);
    });

    it('returns empty object when no events', async () => {
      const summary = await AnalyticsService.getEventsSummary();
      expect(summary).toEqual({});
    });

    it('handles mixed events correctly', async () => {
      await AnalyticsService.trackEvent('app_opened');
      await AnalyticsService.trackEvent('document_added');
      await AnalyticsService.trackEvent('app_opened');
      await AnalyticsService.trackEvent('kit_created');
      await AnalyticsService.trackEvent('document_added');
      await AnalyticsService.trackEvent('app_opened');

      const summary = await AnalyticsService.getEventsSummary();
      expect(summary).toEqual({
        app_opened: 3,
        document_added: 2,
        kit_created: 1,
      });
    });
  });

  describe('clearEvents', () => {
    it('removes all events', async () => {
      await AnalyticsService.trackEvent('event_1');
      await AnalyticsService.trackEvent('event_2');
      await AnalyticsService.clearEvents();
      const events = await AnalyticsService.getEvents();
      expect(events).toEqual([]);
    });
  });

  describe('getEvents', () => {
    it('returns empty array on corrupted JSON in storage', async () => {
      await AsyncStorage.setItem('afterme_analytics_events', '{corrupted');
      const events = await AnalyticsService.getEvents();
      expect(events).toEqual([]);
    });
  });

  describe('predefined event names', () => {
    it('defines all expected event constants', () => {
      expect(AnalyticsService.Events.APP_OPENED).toBe('app_opened');
      expect(AnalyticsService.Events.DOCUMENT_ADDED).toBe('document_added');
      expect(AnalyticsService.Events.DOCUMENT_DELETED).toBe('document_deleted');
      expect(AnalyticsService.Events.DOCUMENT_SCANNED).toBe('document_scanned');
      expect(AnalyticsService.Events.KIT_CREATED).toBe('kit_created');
      expect(AnalyticsService.Events.KIT_SHARED).toBe('kit_shared');
      expect(AnalyticsService.Events.BACKUP_COMPLETED).toBe('backup_completed');
      expect(AnalyticsService.Events.BACKUP_RESTORED).toBe('backup_restored');
      expect(AnalyticsService.Events.PURCHASE_STARTED).toBe('purchase_started');
      expect(AnalyticsService.Events.PURCHASE_COMPLETED).toBe('purchase_completed');
      expect(AnalyticsService.Events.PAYWALL_SHOWN).toBe('paywall_shown');
      expect(AnalyticsService.Events.ONBOARDING_COMPLETED).toBe('onboarding_completed');
      expect(AnalyticsService.Events.SURVIVOR_FLOW_STARTED).toBe('survivor_flow_started');
      expect(AnalyticsService.Events.INTEGRITY_CHECK_RUN).toBe('integrity_check_run');
    });
  });
});
