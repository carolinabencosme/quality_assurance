# Observability Live Summary

Generated at: 2026-07-22T06:15:07Z  
Loki stream: `{service_name="backend"}`  
Authenticated user: `admin`  
Endpoint: `POST /api/v1/products`  
Correlation ID: `req-6ebf8cdf0566`  
Trace ID: `f9a7ec7e05e8e82cb1783768b8f24fa1`  
Root log span ID: `c14bcf563da47b1a`  
Tempo spans: 15  
Database spans: 8

## Database span names

- `HikariDataSource.getConnection`
- `INSERT inventory.products`
- `INSERT inventory.products_aud`
- `INSERT inventory.revinfo`
- `INSERT inventory.stock_movements`
- `SELECT inventory.categories`
- `SELECT inventory.products`
- `UPDATE inventory.products`

The verifier creates and deactivates one disposable product. No access token or password is written to this file.
