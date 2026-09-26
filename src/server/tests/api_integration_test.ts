import assert from 'node:assert/strict';
import { getDatabase, resetDatabase } from '../db/database';
import { seedDatabase } from '../db/seed';
import { createApp } from '../app';

async function runApiIntegrationTests() {
  console.log('Testing REST APIs over HTTP...');
  const db = resetDatabase(':memory:');
  seedDatabase(db);
  const app = createApp(db);

  const server = app.listen(0);
  const address = server.address() as any;
  const baseUrl = `http://localhost:${address.port}/api`;

  try {
    // 1. GET /api/products
    const prodRes = await fetch(`${baseUrl}/products`);
    const prodJson = await prodRes.json();
    assert.equal(prodRes.status, 200);
    assert.equal(prodJson.success, true);
    assert.ok(prodJson.data.length >= 6);

    // 2. POST /api/products
    const newProdRes = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sku: 'SKU-99999',
        name: 'Integration Test Item',
        category: 'Electronics',
        unitOfMeasure: 'pcs',
        lowStockThreshold: 5,
      }),
    });
    const newProdJson = await newProdRes.json();
    assert.equal(newProdRes.status, 201);
    assert.equal(newProdJson.data.sku, 'SKU-99999');

    // 3. GET /api/dashboard
    const dashRes = await fetch(`${baseUrl}/dashboard`);
    const dashJson = await dashRes.json();
    assert.equal(dashRes.status, 200);
    assert.ok(dashJson.data.kpis.totalProducts >= 7);
    assert.ok(dashJson.data.kpis.totalStockUnits > 0);

    // 4. POST /api/receipts
    const rcpRes = await fetch(`${baseUrl}/receipts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supplier: 'Test Logistics',
        warehouseId: 1,
        items: [{ productId: newProdJson.data.id, quantity: 50 }],
      }),
    });
    const rcpJson = await rcpRes.json();
    assert.equal(rcpRes.status, 201);
    assert.equal(rcpJson.data.status, 'PENDING');

    // 5. POST /api/receipts/:id/validate
    const valRcpRes = await fetch(`${baseUrl}/receipts/${rcpJson.data.id}/validate`, {
      method: 'POST',
    });
    const valRcpJson = await valRcpRes.json();
    assert.equal(valRcpRes.status, 200);
    assert.equal(valRcpJson.data.status, 'COMPLETED');

    // 6. Check stock updated
    const stockRes = await fetch(`${baseUrl}/stock/${newProdJson.data.id}/1`);
    const stockJson = await stockRes.json();
    assert.equal(stockJson.data.quantity, 50);

    // 7. Check ledger entry created
    const ledgerRes = await fetch(`${baseUrl}/ledger?productId=${newProdJson.data.id}`);
    const ledgerJson = await ledgerRes.json();
    assert.equal(ledgerJson.data[0].transactionType, 'RECEIPT');
    assert.equal(ledgerJson.data[0].quantityChange, 50);

    // 8. Test insufficient delivery rejection
    const dlvRes = await fetch(`${baseUrl}/deliveries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: 'Overbuyer Corp',
        warehouseId: 1,
        items: [{ productId: newProdJson.data.id, quantity: 100 }],
      }),
    });
    const dlvJson = await dlvRes.json();
    assert.equal(dlvRes.status, 201);

    const valDlvRes = await fetch(`${baseUrl}/deliveries/${dlvJson.data.id}/validate`, {
      method: 'POST',
    });
    const valDlvJson = await valDlvRes.json();
    assert.equal(valDlvRes.status, 400);
    assert.equal(valDlvJson.error.code, 'INSUFFICIENT_STOCK');

    // 9. Test Auth login
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@stocksense.io',
        password: 'password123',
      }),
    });
    const loginJson = await loginRes.json();
    assert.equal(loginRes.status, 200);
    assert.equal(loginJson.data.user.email, 'admin@stocksense.io');

    console.log('✓ All HTTP REST API Integration tests passed successfully!');
  } finally {
    server.close();
  }
}

runApiIntegrationTests();
