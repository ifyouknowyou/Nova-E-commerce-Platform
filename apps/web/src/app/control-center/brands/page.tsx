'use client';

import { BadgeCheck } from 'lucide-react';
import { ModuleScaffold } from '@/components/control-center/module-scaffold';

export default function BrandsPage() {
  return (
    <ModuleScaffold
      title="Brands"
      description="Manage manufacturer and brand records."
      icon={BadgeCheck}
      planned={["Brand directory","Logos","Mapping"]}
    />
  );
}
