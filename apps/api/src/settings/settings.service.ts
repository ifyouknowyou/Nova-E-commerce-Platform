import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Platform settings are stored as arbitrary JSON values keyed by a stable
 * string, grouped into logical sections (general, store, currency, taxes,
 * shipping, payment, email, seo). Values are validated at write time by the
 * caller; secrets (API keys) are excluded from any public read.
 */
export const SETTINGS_GROUPS = ['general', 'store', 'currency', 'taxes', 'shipping', 'payment', 'email', 'seo'] as const;
export type SettingsGroup = (typeof SETTINGS_GROUPS)[number];

/** Groups safe to expose to unauthenticated visitors. */
const PUBLIC_GROUPS: readonly SettingsGroup[] = ['general', 'store', 'currency', 'taxes', 'shipping', 'seo'];

/** Per-group default values shown when nothing has been persisted yet. */
const DEFAULT_VALUES: Record<SettingsGroup, Record<string, unknown>> = {
  general: { siteName: 'NOVA Commerce', siteTagline: 'Premium multi-vendor marketplace', maintenanceMode: false },
  store: { logo: null, banner: null, contactEmail: '', supportPhone: '', address: '' },
  currency: { code: 'USD', symbol: '$', precision: 2 },
  taxes: { enabled: false, rate: 0, taxIncludedInPrices: false },
  shipping: { freeShippingThreshold: 50, standardRate: 4.99, expressRate: 9.99 },
  payment: { stripeEnabled: false, stripePublishableKey: '', paypalEnabled: false },
  email: { fromName: 'NOVA Commerce', fromAddress: 'no-reply@nova.local' },
  seo: { defaultTitle: 'NOVA Commerce', defaultDescription: 'Premium multi-vendor marketplace', ogImage: null },
};

export interface GroupedSettings {
  [group: string]: Record<string, unknown>;
}

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Admin view — every group including payment configuration. */
  async getAll(): Promise<GroupedSettings> {
    return this.grouped(SETTINGS_GROUPS);
  }

  /** Public view — safe groups only, no secrets. */
  async getPublic(): Promise<GroupedSettings> {
    return this.grouped(PUBLIC_GROUPS);
  }

  /** Upsert every provided key under a group; unknown keys are ignored. */
  async upsertGroup(group: SettingsGroup, data: Record<string, unknown>): Promise<GroupedSettings> {
    if (!SETTINGS_GROUPS.includes(group)) throw new NotFoundException('Unknown settings group');
    const allowed = Object.keys(DEFAULT_VALUES[group]);
    for (const [key, value] of Object.entries(data)) {
      if (!allowed.includes(key)) continue;
      await this.prisma.db.setting.upsert({
        where: { key: `${group}.${key}` },
        create: { key: `${group}.${key}`, group, value: value as never },
        update: { value: value as never },
      });
    }
    return this.getAll();
  }

  private async grouped(groups: readonly SettingsGroup[]): Promise<GroupedSettings> {
    const rows = await this.prisma.db.setting.findMany({ where: { group: { in: [...groups] } } });
    const stored = new Map(rows.map((row) => [row.key, row.value]));
    const result: GroupedSettings = {};
    for (const group of groups) {
      result[group] = { ...DEFAULT_VALUES[group] };
      for (const key of Object.keys(DEFAULT_VALUES[group])) {
        if (stored.has(`${group}.${key}`)) result[group][key] = stored.get(`${group}.${key}`);
      }
    }
    return result;
  }
}
