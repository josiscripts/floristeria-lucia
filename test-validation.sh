#!/bin/bash

# Validación PUNTOS 6-7 usando curl y jq
# Script de prueba contra API Supabase

set -e

SUPABASE_URL="https://leksmflinhohnekbgmgj.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla3NtZmxpbmhvaG5la2JnbWdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzQzNzk0OCwiZXhwIjoyMTAzMDEzOTQ4fQ.YUP3NzyBBuGYFPpQCKHmScOG7H-cInWgU4-8Z0SYFpM"
GHL_TOKEN="pit-0cf65f40-51a4-4e28-9793-9eb8421e2291"
GHL_LOCATION_ID="vOq7yOWR63XGU4qQ7XWd"

echo "========================================"
echo "VALIDACIÓN PUNTOS 6-7: SKU + MULTIPRECIOS"
echo "========================================"
echo ""

echo "PASO 1: Verificar SKUs existentes en Supabase"
echo "---"

# Query para obtener todos los SKUs únicos
curl -s "${SUPABASE_URL}/rest/v1/product_options?select=sku&order=sku" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" | jq '.[] | select(.sku != null) | .sku' | sort | uniq > /tmp/skus.txt

echo "SKUs en la BD:"
cat /tmp/skus.txt | wc -l | xargs echo "Total:"
echo ""

# Mostrar últimos 10 SKUs
echo "Últimos SKUs:"
tail -10 /tmp/skus.txt
echo ""

echo "PASO 2: Verificar opciones de productos TEST"
echo "---"

# Obtener todos los productos TEST
curl -s "${SUPABASE_URL}/rest/v1/products?select=id,name,category&name=like.TEST%" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" | jq '.' > /tmp/test_products.json

PRODUCT_COUNT=$(cat /tmp/test_products.json | jq 'length')
echo "Productos TEST encontrados: $PRODUCT_COUNT"
echo ""

if [ "$PRODUCT_COUNT" -gt 0 ]; then
  echo "Detalles de productos TEST:"
  cat /tmp/test_products.json | jq '.[] | "\(.name) (ID: \(.id), Categoría: \(.category))"'
  echo ""

  # Para cada producto, obtener opciones
  echo "Opciones por producto:"
  for pid in $(cat /tmp/test_products.json | jq -r '.[].id'); do
    echo ""
    echo "  Producto ID: $pid"

    curl -s "${SUPABASE_URL}/rest/v1/product_options?select=name,price_amount,discount_percent,stock_quantity,sku,ghl_price_id&product_id=eq.${pid}" \
      -H "Authorization: Bearer ${SERVICE_KEY}" \
      -H "Content-Type: application/json" | jq '.[] | "    \(.name): \(.price_amount)EUR (-\(.discount_percent)%) | Stock: \(.stock_quantity) | SKU: \(.sku) | GHL: \(.ghl_price_id)"' || echo "    Error al obtener opciones"
  done
fi

echo ""
echo "PASO 3: Verificar Unicidad de SKUs"
echo "---"

# Contar SKUs duplicados
curl -s "${SUPABASE_URL}/rest/v1/product_options?select=sku" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" | jq -r '.[] | select(.sku != null) | .sku' | sort | uniq -d > /tmp/dup_skus.txt || true

DUP_COUNT=$(wc -l < /tmp/dup_skus.txt)
if [ "$DUP_COUNT" -gt 0 ]; then
  echo "⚠ ALERTA: Se encontraron $DUP_COUNT SKUs duplicados:"
  cat /tmp/dup_skus.txt
else
  echo "✓ No hay SKUs duplicados"
fi

echo ""
echo "PASO 4: Verificar unicidad de GHL Price IDs"
echo "---"

curl -s "${SUPABASE_URL}/rest/v1/product_options?select=ghl_price_id&product_id=in.(SELECT id FROM products WHERE name LIKE 'TEST%')" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" | jq -r '.[] | select(.ghl_price_id != null) | .ghl_price_id' | sort | uniq -d > /tmp/dup_ghl.txt || true

DUP_GHL=$(wc -l < /tmp/dup_ghl.txt)
if [ "$DUP_GHL" -gt 0 ]; then
  echo "⚠ ALERTA: Se encontraron $DUP_GHL GHL Price IDs duplicados"
else
  echo "✓ No hay GHL Price IDs duplicados"
fi

echo ""
echo "========================================"
echo "VALIDACIÓN COMPLETADA"
echo "========================================"
