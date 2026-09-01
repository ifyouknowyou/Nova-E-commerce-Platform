'use client';

import { Store } from 'lucide-react';
import { ModuleScaffold } from '@/components/control-center/module-scaffold';

export default function StorefrontPage() {
  return (
    <ModuleScaffold
      title="Storefront"
      description="Branding, bio, contact and store settings for your organization storefront."
      icon={Store}
      planned={["Profile & logo","Store policies","SEO & social","Localization"]}
    />
  );
}
