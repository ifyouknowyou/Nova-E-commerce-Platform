'use client';

import { Tags } from 'lucide-react';
import { ModuleScaffold } from '@/components/control-center/module-scaffold';

export default function CategoriesPage() {
  return (
    <ModuleScaffold
      title="Categories"
      description="Organize the catalog into a shared category taxonomy."
      icon={Tags}
      planned={["Category tree","Mapping","SEO slugs"]}
    />
  );
}
