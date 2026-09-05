import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GHLStatusBadge } from "@/components/admin/GHLStatusBadge";
import { formatPrice } from "@/data/catalog";
import type { AdminProduct } from "@/lib/admin/api";

export function ProductsTable({ products }: { products: AdminProduct[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Producto</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id} className="group">
              <TableCell className="font-medium text-foreground">
                <Link
                  to="/admin/products/$id"
                  params={{ id: product.id }}
                  className="flex items-center gap-3 hover:text-primary hover:underline"
                >
                  {product.image && (
                    <img
                      src={product.image}
                      alt=""
                      className="size-9 shrink-0 rounded-md border border-border object-cover"
                    />
                  )}
                  <span className="truncate">{product.name}</span>
                </Link>
              </TableCell>
              {(() => {
                const opts = product.product_options ?? [];
                const primaryOption = opts.length
                  ? [...opts].sort((a, b) => (a.price_amount ?? 0) - (b.price_amount ?? 0))[0]
                  : null;
                return (
                  <>
                    <TableCell className="text-sm text-muted-foreground">
                      {primaryOption?.sku || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {product.category || "—"}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {typeof primaryOption?.price_amount === "number"
                        ? formatPrice(primaryOption.price_amount)
                        : "—"}
                      {opts.length > 1 ? (
                        <span className="text-xs text-muted-foreground"> ({opts.length} opciones)</span>
                      ) : null}
                    </TableCell>
                  </>
                );
              })()}
              <TableCell>
                <GHLStatusBadge status={product["active"] ? "active" : "inactive"} />
              </TableCell>
              <TableCell>
                <Link
                  to="/admin/products/$id"
                  params={{ id: product.id }}
                  className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Editar producto"
                >
                  <ChevronRight className="size-4" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
