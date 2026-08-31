/**
 * FASE 5.4 — Autorización server-side para el panel administrativo.
 *
 * Fuente de verdad del rol: columna `profiles.role` ("customer" | "admin").
 * Ver supabase/migrations/20260831024811_add_admin_role_and_audit_logs.sql.
 *
 * `requireAdmin` valida el Bearer token del usuario (vía Supabase Auth) y
 * comprueba su rol en `profiles` usando `supabaseAdmin` (service_role, sin RLS).
 * Debe ejecutarse ANTES de tocar cualquier dato administrativo.
 */
import { json } from "@tanstack/react-start";
import type { User } from "@supabase/supabase-js";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Json } from "@/integrations/supabase/types";

export class AdminGuardError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export interface AdminContext {
  user: User;
  role: string;
}

function extractBearerToken(request: Request): string {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new AdminGuardError("Unauthorized", 401);
  }
  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    throw new AdminGuardError("Unauthorized", 401);
  }
  return token;
}

/**
 * Valida autenticación + rol admin. Lanza AdminGuardError(401) si no hay
 * sesión válida, o AdminGuardError(403) si el usuario no es admin.
 */
export async function requireAdmin(request: Request): Promise<AdminContext> {
  const token = extractBearerToken(request);

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) {
    throw new AdminGuardError("Unauthorized", 401);
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    throw new AdminGuardError("Forbidden", 403);
  }

  return { user: userData.user, role: profile.role };
}

type AdminRouteHandler = (request: Request, admin: AdminContext) => Promise<Response>;

/**
 * Envuelve un handler GET/POST/PUT/DELETE de una ruta API para exigir rol admin
 * antes de ejecutarlo. Centraliza el 401/403 para no duplicar la comprobación
 * en cada endpoint.
 */
export function withAdminGuard(handler: AdminRouteHandler) {
  return async (request: Request): Promise<Response> => {
    try {
      const admin = await requireAdmin(request);
      return await handler(request, admin);
    } catch (error) {
      if (error instanceof AdminGuardError) {
        return json({ error: error.message }, { status: error.status });
      }
      console.error("[AdminGuard] Unexpected error during authorization:", error);
      return json({ error: "Unauthorized" }, { status: 401 });
    }
  };
}

export interface AuditLogInput {
  userId: string;
  action: string;
  resource: string;
  recordId?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Registra una acción administrativa en `audit_logs`. No lanza: un fallo al
 * auditar no debe romper la operación administrativa que la originó.
 */
export async function logAdminAction(input: AuditLogInput): Promise<void> {
  const { error } = await supabaseAdmin.from("audit_logs").insert({
    user_id: input.userId,
    action: input.action,
    resource: input.resource,
    record_id: input.recordId ?? null,
    metadata: (input.metadata ?? null) as Json | null,
  });

  if (error) {
    console.error("[AuditLog] Failed to record admin action:", error.message);
  }
}
