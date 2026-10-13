import { SpatialPanel } from '@/components/3d/spatial-panel';
import { Badge } from '@/components/ui/badge';

export function PurchasePanel() {
  return (
    <SpatialPanel depth={3} spotlight className="space-y-4 p-5">
      <Badge variant="outline">Catalog preview</Badge>
      <p className="text-sm text-muted-foreground">
        This is a browse-only sample catalog. Cart, account, and checkout features are not available.
      </p>
    </SpatialPanel>
  );
}
