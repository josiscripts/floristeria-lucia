-- FASE 5.4 — Roles administrativos + auditoría
--
-- Esta migración:
--   1. Añade la columna `role` a `profiles` (customer | admin), por defecto 'customer'.
--   2. Añade un trigger BEFORE UPDATE que revierte cualquier intento de cambiar `role`
--      salvo que la operación la realice `service_role` (bloquea auto-promoción,
--      sin necesidad de reescribir las policies UPDATE existentes).
--   3. Crea la tabla `audit_logs` para registrar operaciones administrativas sensibles.
--
-- No borra ni modifica datos existentes. No afecta `orders`, `order_items`,
-- `product_metadata`, `webhook_events` ni `auth.users`.
-- Las policies SELECT/INSERT/UPDATE existentes de `profiles` no se tocan.

-- ============================================================
-- 1. Columna role en profiles
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN role TEXT NOT NULL DEFAULT 'customer'
  CHECK (role IN ('customer', 'admin'));

CREATE INDEX idx_profiles_role ON public.profiles (role);

-- ============================================================
-- 2. Trigger: bloquear cambio de role salvo por service_role
--    (defensa en profundidad contra privilege escalation; independiente
--    de las policies RLS, así que sigue protegiendo aunque cambien)
-- ============================================================
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND auth.role() <> 'service_role' THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_role_self_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_role_self_escalation();

-- ============================================================
-- 3. Tabla de auditoría administrativa
-- ============================================================
CREATE TABLE public.audit_logs (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  record_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs (user_id);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs (resource);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden leer el registro de auditoría desde el cliente.
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

-- ============================================================
-- Nota: creación del primer administrador
-- ============================================================
-- Esta migración NO promueve a ningún usuario a admin automáticamente.
-- Ejecutar manualmente, una sola vez, tras confirmar el UUID de la clienta:
--
--   UPDATE public.profiles SET role = 'admin' WHERE id = '<UUID_DE_LUCIA>';
--
-- Ese UPDATE debe ejecutarse con el service_role key (Supabase SQL editor o
-- script server-side con supabaseAdmin), nunca desde el cliente: el trigger
-- anterior revierte silenciosamente cualquier cambio de role que no venga de
-- service_role, así que un intento desde el navegador de la clienta no tendría
-- efecto hasta que se ejecute este paso manual.
