/**
 * Kit versioning, history tracking, freshness scoring, and stale-kit warnings.
 * Uses AsyncStorage to persist kit generation history and vault change events.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DocumentCategory } from '../models/DocumentCategory';

const KEYS = {
  KIT_HISTORY: 'familyKit:history',
  KIT_VERSION_COUNTER: 'familyKit:versionCounter',
  VAULT_LAST_CHANGED: 'familyKit:vaultLastChanged',
  DISTRIBUTION_HISTORY: 'familyKit:distributions',
} as const;

export interface KitHistoryEntry {
  version: number;
  createdAt: string;
  documentCount: number;
  categories: DocumentCategory[];
}

export interface KitDistributionEntry {
  id: string;
  kitVersion: number;
  recipientLabel: string;
  method: 'print' | 'digital' | 'airdrop' | 'other';
  distributedAt: string;
  notes?: string;
}

export type FreshnessLevel = 'fresh' | 'aging' | 'stale' | 'critical';

const FRESHNESS_THRESHOLDS = {
  fresh: 30,
  aging: 90,
  stale: 180,
};

export class KitHistoryService {
  static async getNextKitVersion(): Promise<number> {
    const raw = await AsyncStorage.getItem(KEYS.KIT_VERSION_COUNTER);
    const next = (parseInt(raw ?? '0', 10) || 0) + 1;
    await AsyncStorage.setItem(KEYS.KIT_VERSION_COUNTER, String(next));
    return next;
  }

  static async recordKitGeneration(
    version: number,
    documentCount: number,
    categories: DocumentCategory[],
  ): Promise<void> {
    const MAX_HISTORY_ENTRIES = 100;
    const history = await this.getHistory();
    history.push({
      version,
      createdAt: new Date().toISOString(),
      documentCount,
      categories,
    });
    if (history.length > MAX_HISTORY_ENTRIES) {
      history.splice(0, history.length - MAX_HISTORY_ENTRIES);
    }
    await AsyncStorage.setItem(KEYS.KIT_HISTORY, JSON.stringify(history));
  }

  static async getHistory(): Promise<KitHistoryEntry[]> {
    const raw = await AsyncStorage.getItem(KEYS.KIT_HISTORY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  static async getLatestKit(): Promise<KitHistoryEntry | null> {
    const history = await this.getHistory();
    return history.length > 0 ? history[history.length - 1] : null;
  }

  static async recordVaultChange(): Promise<void> {
    await AsyncStorage.setItem(KEYS.VAULT_LAST_CHANGED, new Date().toISOString());
  }

  static async getVaultLastChanged(): Promise<Date | null> {
    const raw = await AsyncStorage.getItem(KEYS.VAULT_LAST_CHANGED);
    return raw ? new Date(raw) : null;
  }

  /**
   * Calculates how stale the latest kit is relative to vault changes and age.
   * Returns a freshness level and days since last kit.
   */
  static async getFreshnessScore(): Promise<{
    level: FreshnessLevel;
    daysSinceKit: number;
    vaultChangedSinceKit: boolean;
    kitVersion: number | null;
  }> {
    const latestKit = await this.getLatestKit();
    if (!latestKit) {
      return { level: 'critical', daysSinceKit: -1, vaultChangedSinceKit: true, kitVersion: null };
    }

    const kitDate = new Date(latestKit.createdAt);
    const now = new Date();
    const daysSinceKit = Math.floor((now.getTime() - kitDate.getTime()) / (1000 * 60 * 60 * 24));

    const vaultChanged = await this.getVaultLastChanged();
    const vaultChangedSinceKit = vaultChanged ? vaultChanged > kitDate : false;

    let level: FreshnessLevel;
    if (vaultChangedSinceKit) {
      level = daysSinceKit > FRESHNESS_THRESHOLDS.aging ? 'critical' : 'stale';
    } else if (daysSinceKit > FRESHNESS_THRESHOLDS.stale) {
      level = 'critical';
    } else if (daysSinceKit > FRESHNESS_THRESHOLDS.aging) {
      level = 'stale';
    } else if (daysSinceKit > FRESHNESS_THRESHOLDS.fresh) {
      level = 'aging';
    } else {
      level = 'fresh';
    }

    return { level, daysSinceKit, vaultChangedSinceKit, kitVersion: latestKit.version };
  }

  /**
   * Get human-readable stale kit message.
   */
  static async getStaleKitWarning(): Promise<string | null> {
    const { level, daysSinceKit, vaultChangedSinceKit, kitVersion } = await this.getFreshnessScore();

    if (level === 'fresh') return null;

    if (level === 'critical' && kitVersion === null) {
      return 'You haven\'t created a Family Kit yet. Your loved ones won\'t be able to access your vault without one.';
    }

    if (vaultChangedSinceKit) {
      return `Your Family Kit (v${kitVersion}) is outdated — your vault has changed since it was created${daysSinceKit > 0 ? ` ${daysSinceKit} days ago` : ''}. Generate a new kit to keep your loved ones up to date.`;
    }

    if (level === 'critical') {
      return `Your Family Kit (v${kitVersion}) is ${daysSinceKit} days old. Consider refreshing it to ensure your documents are current.`;
    }

    if (level === 'stale') {
      return `Your Family Kit (v${kitVersion}) was created ${daysSinceKit} days ago. It may be time for a refresh.`;
    }

    return `Your Family Kit (v${kitVersion}) was created ${daysSinceKit} days ago.`;
  }

  // --- Distribution tracking ---

  static async recordDistribution(entry: Omit<KitDistributionEntry, 'id' | 'distributedAt'>): Promise<void> {
    const { CryptoService } = await import('../core/crypto/CryptoService');
    const MAX_DISTRIBUTION_ENTRIES = 200;
    const distributions = await this.getDistributions();
    distributions.push({
      ...entry,
      id: CryptoService.generateSecureId('dist'),
      distributedAt: new Date().toISOString(),
    });
    if (distributions.length > MAX_DISTRIBUTION_ENTRIES) {
      distributions.splice(0, distributions.length - MAX_DISTRIBUTION_ENTRIES);
    }
    await AsyncStorage.setItem(KEYS.DISTRIBUTION_HISTORY, JSON.stringify(distributions));
  }

  static async getDistributions(): Promise<KitDistributionEntry[]> {
    const raw = await AsyncStorage.getItem(KEYS.DISTRIBUTION_HISTORY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  static async getDistributionsForVersion(version: number): Promise<KitDistributionEntry[]> {
    const all = await this.getDistributions();
    return all.filter((d) => d.kitVersion === version);
  }

  static async clearHistory(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(KEYS.KIT_HISTORY),
      AsyncStorage.removeItem(KEYS.KIT_VERSION_COUNTER),
      AsyncStorage.removeItem(KEYS.VAULT_LAST_CHANGED),
      AsyncStorage.removeItem(KEYS.DISTRIBUTION_HISTORY),
    ]);
  }
}
