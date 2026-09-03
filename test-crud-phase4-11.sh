#!/bin/bash

# FASES 4-11 CRUD Testing Script - FASE 4 (Edit)
# This script tests the CRUD operations in sequence

set -e

# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

API_BASE="${API_BASE:-http://localhost:5173}"
DB_URL="${DATABASE_URL:-${SUPABASE_URL}}"

echo "======================================================"
echo "FASES 4-11 CRUD TESTING"
echo "======================================================"
echo "API Base: $API_BASE"
echo "Location ID: $GHL_LOCATION_ID"
echo ""

# Test API connectivity
echo "Verificando conectividad con API..."
for i in {1..30}; do
  if curl -s "$API_BASE/health" > /dev/null 2>&1 || curl -s "$API_BASE/catalogo" > /dev/null 2>&1; then
    echo "✓ API disponible"
    break
  fi

  if [ $i -eq 30 ]; then
    echo "✗ API no disponible después de 30 intentos"
    exit 1
  fi

  echo "Intento $i/30..."
  sleep 2
done

echo ""
echo "======================================================"
echo "FASE 4: EDITAR PRODUCTO DESDE PANEL"
echo "======================================================"

# Query for existing test product or use SUPABASE_URL to find one
echo "Buscando producto TEST BLOQUE 4..."

# For now, we'll try to find a product and edit it
# This requires the API to be working

# Create test product if needed
echo "Creando producto de prueba..."

TEST_PRODUCT_RESPONSE=$(curl -s -X POST \
  "$API_BASE/api/products" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TEST BLOQUE 4 CRUD REAL",
    "description": "Producto temporal para prueba",
    "price": 25,
    "category": "ramos",
    "active": true
  }')

echo "Response: $TEST_PRODUCT_RESPONSE"

# Extract product ID (may vary depending on response structure)
PRODUCT_ID=$(echo "$TEST_PRODUCT_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$PRODUCT_ID" ]; then
  echo "✗ No se pudo crear producto de prueba"
  exit 1
fi

echo "✓ Producto creado: $PRODUCT_ID"

# Edit the product
echo ""
echo "Editando producto..."

EDIT_RESPONSE=$(curl -s -X PUT \
  "$API_BASE/api/products/$PRODUCT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TEST BLOQUE 4 EDITADO",
    "price": 30
  }')

echo "Response: $EDIT_RESPONSE"

# Verify the edit
echo ""
echo "Verificando cambios..."

GET_RESPONSE=$(curl -s -X GET \
  "$API_BASE/api/products/$PRODUCT_ID")

echo "Response: $GET_RESPONSE"

echo ""
echo "======================================================"
echo "Pruebas completadas. Ver respuestas arriba."
echo "======================================================"
