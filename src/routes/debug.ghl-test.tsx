import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useGHLConnectionTest, useGHLProducts } from "@/hooks/useGHLProducts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/debug/ghl-test")({
  component: GHLDebugPage,
});

function GHLDebugPage() {
  const [testEnabled, setTestEnabled] = useState(false);
  const [productsEnabled, setProductsEnabled] = useState(false);

  const connectionTest = useGHLConnectionTest({ enabled: testEnabled });
  const ghlProducts = useGHLProducts({
    enabled: productsEnabled,
    limit: 10,
  });

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">GoHighLevel Integration Test</h1>
          <p className="text-muted-foreground">Debug page for testing GHL API connectivity</p>
        </div>

        {/* Connection Test */}
        <Card>
          <CardHeader>
            <CardTitle>Connection Test</CardTitle>
            <CardDescription>Test if GHL token is valid and API is accessible</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => setTestEnabled(!testEnabled)}
              variant={testEnabled ? "destructive" : "default"}
            >
              {testEnabled ? "Stop Test" : "Start Connection Test"}
            </Button>

            {connectionTest.isLoading && <p className="text-sm text-muted-foreground">Testing connection...</p>}
            {connectionTest.error && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4 rounded">
                <p className="text-red-800 dark:text-red-200 font-mono text-sm">
                  Error: {connectionTest.error.message}
                </p>
              </div>
            )}
            {connectionTest.data && (
              <div className={`border p-4 rounded ${connectionTest.data.connected ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"}`}>
                <p className={`font-semibold ${connectionTest.data.connected ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"}`}>
                  Status: {connectionTest.data.connected ? "✅ Connected" : "❌ Disconnected"}
                </p>
                <p className={connectionTest.data.connected ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}>
                  {connectionTest.data.message}
                </p>
                {connectionTest.data.error && (
                  <p className="text-sm mt-2 text-red-600 dark:text-red-400">
                    Error details: {connectionTest.data.error}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Products Fetch */}
        <Card>
          <CardHeader>
            <CardTitle>Fetch Products</CardTitle>
            <CardDescription>Retrieve products from GHL (limited to 10 for testing)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => setProductsEnabled(!productsEnabled)}
              variant={productsEnabled ? "destructive" : "default"}
            >
              {productsEnabled ? "Stop Fetching" : "Fetch Products from GHL"}
            </Button>

            {ghlProducts.isLoading && <p className="text-sm text-muted-foreground">Loading products...</p>}
            {ghlProducts.error && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4 rounded">
                <p className="text-red-800 dark:text-red-200 font-mono text-sm">
                  Error: {ghlProducts.error.message}
                </p>
              </div>
            )}
            {ghlProducts.data && "products" in ghlProducts.data && (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded">
                  <p className="text-blue-800 dark:text-blue-200 font-semibold">
                    Found {ghlProducts.data.products.length} products
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    Total: {ghlProducts.data.total} | Page: {ghlProducts.data.currentPage} | Size: {ghlProducts.data.pageSize}
                  </p>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto border rounded p-4 bg-muted">
                  {ghlProducts.data.products.length > 0 ? (
                    ghlProducts.data.products.map((product) => (
                      <div key={product.id} className="border-l-2 border-primary pl-3 py-2">
                        <p className="font-semibold text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">ID: {product.id}</p>
                        {product.price && (
                          <p className="text-xs text-muted-foreground">Price: ${product.price}</p>
                        )}
                        {product.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No products found</p>
                  )}
                </div>
              </div>
            )}
            {ghlProducts.data && "code" in ghlProducts.data && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4 rounded">
                <p className="text-red-800 dark:text-red-200 font-semibold">Error:</p>
                <p className="text-red-700 dark:text-red-300 text-sm">{ghlProducts.data.message}</p>
                <p className="text-red-600 dark:text-red-400 text-xs mt-2">Code: {ghlProducts.data.code}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Section */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-semibold">API Endpoint:</span> <code className="bg-muted px-2 py-1 rounded">/api/ghl/products</code>
            </p>
            <p>
              <span className="font-semibold">Token Status:</span> Check server logs for token validation
            </p>
            <p>
              <span className="font-semibold">Note:</span> This page is for debugging only. It will be removed before production.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
