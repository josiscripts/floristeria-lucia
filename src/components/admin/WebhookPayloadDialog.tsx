import { Eye } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Json } from "@/integrations/supabase/types";

export function WebhookPayloadDialog({ payload }: { payload: Json }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="size-4" />
          Ver payload
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payload del evento</DialogTitle>
        </DialogHeader>
        <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs text-foreground">
          {JSON.stringify(payload, null, 2)}
        </pre>
      </DialogContent>
    </Dialog>
  );
}
