/**
 * JsonLd — server-safe structured-data injector.
 *
 * Emits a `<script type="application/ld+json">` with a JSON-LD object so
 * search engines can render rich results (Product price/rating, Breadcrumbs,
 * Organization knowledge panel). Rendering happens on the server, so this is
 * safe to drop into RSC pages.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  // serialize-json-ld safe: escape '<', '>', and '&' to prevent breaking out
  // of the script tag or HTML injection.
  const json = JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
