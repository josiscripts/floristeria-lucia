#!/usr/bin/env node

/**
 * AUDITORÍA READ-ONLY: product_metadata existente
 *
 * Objetivo: Verificar si la tabla existente coincide con la migración propuesta
 * Comparar estructura actual contra: 20260826000001_create_product_metadata.sql
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ID = 'leksmflinhohnekbgmgj';
const SUPABASE_URL = 'https://leksmflinhohnekbgmgj.supabase.co';
const PUBLISHABLE_KEY = 'sb_publishable_X0o9HN0EAjBJpcInCi-iWw_Tle3mcyk';

console.log('🔍 AUDITORÍA READ-ONLY: product_metadata Existente');
console.log(`📍 Proyecto: ${PROJECT_ID}`);
console.log(`🕐 Timestamp: ${new Date().toISOString()}`);
console.log('');

const auditResults = {
  timestamp: new Date().toISOString(),
  projectId: PROJECT_ID,
  tablaExiste: false,
  columnas: [],
  constraints: [],
  indices: [],
  triggers: [],
  policies: [],
  permisos: [],
  registros: 0,
  rls: false,
  fechaCreacion: null,
  diferencias: [],
  conclusiones: []
};

// Queries para auditoría
const auditQueries = [
  {
    name: '1. Verificar tabla existe',
    query: `SELECT table_name, table_schema, table_type
            FROM information_schema.tables
            WHERE table_name = 'product_metadata' AND table_schema = 'public';`,
    description: 'Comprueba existencia y tipo de tabla'
  },
  {
    name: '2. Listar columnas',
    query: `SELECT column_name, data_type, is_nullable, column_default, ordinal_position
            FROM information_schema.columns
            WHERE table_name = 'product_metadata' AND table_schema = 'public'
            ORDER BY ordinal_position;`,
    description: 'Obtener todas las columnas con tipos'
  },
  {
    name: '3. Constraints UNIQUE',
    query: `SELECT constraint_name, constraint_type
            FROM information_schema.table_constraints
            WHERE table_name = 'product_metadata'
            AND constraint_type IN ('PRIMARY KEY', 'UNIQUE', 'CHECK')
            ORDER BY constraint_name;`,
    description: 'Listar todas las constraints'
  },
  {
    name: '4. Detalles de UNIQUE constraints',
    query: `SELECT constraint_name, column_name
            FROM information_schema.key_column_usage
            WHERE table_name = 'product_metadata' AND table_schema = 'public'
            ORDER BY constraint_name, ordinal_position;`,
    description: 'Columnas incluidas en cada constraint'
  },
  {
    name: '5. Índices',
    query: `SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = 'product_metadata' AND schemaname = 'public'
            ORDER BY indexname;`,
    description: 'Listar todos los índices creados'
  },
  {
    name: '6. Triggers',
    query: `SELECT trigger_name, event_object_table, event_manipulation, action_timing, action_statement
            FROM information_schema.triggers
            WHERE trigger_schema = 'public'
            AND event_object_table = 'product_metadata'
            ORDER BY trigger_name;`,
    description: 'Obtener triggers y acciones'
  },
  {
    name: '7. RLS',
    query: `SELECT schemaname, tablename, rowsecurity
            FROM pg_tables
            WHERE tablename = 'product_metadata' AND schemaname = 'public';`,
    description: 'Verificar si RLS está habilitado'
  },
  {
    name: '8. Policies RLS',
    query: `SELECT schemaname, tablename, policyname, permissive, cmd, roles, qual
            FROM pg_policies
            WHERE tablename = 'product_metadata' AND schemaname = 'public'
            ORDER BY policyname;`,
    description: 'Listar todas las policies'
  },
  {
    name: '9. Conteo de registros',
    query: `SELECT COUNT(*) as row_count FROM public.product_metadata;`,
    description: 'Verificar si la tabla está vacía'
  },
  {
    name: '10. Permisos/Grants',
    query: `SELECT grantee, privilege_type
            FROM information_schema.role_table_grants
            WHERE table_name='product_metadata' AND table_schema='public'
            ORDER BY grantee, privilege_type;`,
    description: 'Listar permisos asignados'
  }
];

console.log('━'.repeat(70));
console.log('📋 QUERIES A EJECUTAR MANUALMENTE EN SQL EDITOR');
console.log('━'.repeat(70));
console.log('');

for (const query of auditQueries) {
  console.log(`${query.name}`);
  console.log(`Descripción: ${query.description}`);
  console.log('Query:');
  console.log('```sql');
  console.log(query.query);
  console.log('```');
  console.log('');
}

console.log('━'.repeat(70));
console.log('');
console.log('📝 INSTRUCCIONES:');
console.log('');
console.log('1. Ve a: https://leksmflinhohnekbgmgj.supabase.co');
console.log('2. Abre: SQL Editor');
console.log('3. Ejecuta CADA query arriba UNA POR UNA');
console.log('4. Copia los resultados de cada una');
console.log('5. Reporta los resultados');
console.log('');
console.log('Entonces podré:');
console.log('- Comparar con la migración esperada');
console.log('- Identificar cualquier diferencia');
console.log('- Generar informe de auditoría');
console.log('');
console.log('━'.repeat(70));
console.log('');
console.log('⚠️  IMPORTANTE:');
console.log('');
console.log('NO hagas:');
console.log('- ❌ DROP TABLE');
console.log('- ❌ DELETE');
console.log('- ❌ ALTER TABLE');
console.log('- ❌ CREATE INDEX');
console.log('- ❌ Cambios en .env');
console.log('');
console.log('Solo:');
console.log('- ✅ SELECT queries (READ-ONLY)');
console.log('');
console.log('━'.repeat(70));
