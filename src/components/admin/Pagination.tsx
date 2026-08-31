import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function AdminPagination({ page, totalPages, total, onPageChange }: AdminPaginationProps) {
  if (total === 0) return null;

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-border pt-4 sm:flex-row">
      <p className="text-xs text-muted-foreground">
        Página {page} de {Math.max(totalPages, 1)} · {total} producto{total !== 1 ? "s" : ""}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-4" />
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
