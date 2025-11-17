#!/bin/bash
echo "=== Testing API Endpoints ==="
echo ""
echo "1. Testing /api/health"
curl -s http://localhost:4000/api/health | jq .
echo ""
echo "2. Testing /api/auth/request-code"
curl -s -X POST http://localhost:4000/api/auth/request-code \
  -H "Content-Type: application/json" \
  -d '{"rut":"12345678-9"}' | jq .
echo ""
echo "3. Testing /api/auth/verify-code (will fail without valid code)"
curl -s -X POST http://localhost:4000/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{"rut":"12345678-9","code":"000000"}' | jq .
