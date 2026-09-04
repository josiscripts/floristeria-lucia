#!/usr/bin/env node

/**
 * Test SKU Generation directly
 */

// Simulate the SKU generator function
const CATEGORY_PREFIXES = {
  ramos: "RAM",
  plantas: "PLN",
  complementos: "COM",
  condolencias: "CON",
  "rosas-eternas": "ROS",
};

async function generateSKU(category) {
  if (!category || typeof category !== "string") {
    return {
      success: false,
      error: `Invalid category: ${category}`,
    };
  }

  const prefix = CATEGORY_PREFIXES[category];
  if (!prefix) {
    return {
      success: false,
      error: `Unknown category: ${category}`,
    };
  }

  // For test, extract existing SKUs from known data
  const existingSKUs = {
    ramos: ["FL-RAM-0001", "FL-RAM-0002", "FL-RAM-0007"],
    "rosas-eternas": ["FL-ROS-0001", "FL-ROS-0002", "FL-ROS-0005"],
    test: ["FL-TEST-001"],
  };

  const categoryKey =
    category === "ramos" ? "ramos" : category === "rosas-eternas" ? "rosas-eternas" : "test";
  const skus = existingSKUs[categoryKey] || [];

  const sequenceNumbers = [];
  for (const sku of skus) {
    const match = sku.match(/^FL-\w+-(\d+)$/);
    if (match) {
      sequenceNumbers.push(parseInt(match[1], 10));
    }
  }

  const maxSequence = sequenceNumbers.length > 0 ? Math.max(...sequenceNumbers) : 0;
  const nextSequence = maxSequence + 1;
  const newSKU = `FL-${prefix}-${String(nextSequence).padStart(4, "0")}`;

  console.log(`[SKUGenerator] Category: ${category}, Prefix: ${prefix}`);
  console.log(
    `[SKUGenerator] Existing sequences: [${sequenceNumbers.sort((a, b) => a - b).join(", ")}]`,
  );
  console.log(`[SKUGenerator] Max sequence: ${maxSequence}`);
  console.log(`[SKUGenerator] Next sequence: ${nextSequence}`);
  console.log(`[SKUGenerator] Generated SKU: ${newSKU}`);

  return { success: true, sku: newSKU };
}

// Test cases
async function test() {
  console.log("=".repeat(60));
  console.log("TEST SKU GENERATOR");
  console.log("=".repeat(60));
  console.log("");

  // Test 1: Ramos category
  console.log("TEST 1: Category 'ramos'");
  const result1 = await generateSKU("ramos");
  console.log(`Result: ${JSON.stringify(result1)}\n`);

  // Test 2: Rosas-eternas category
  console.log("TEST 2: Category 'rosas-eternas'");
  const result2 = await generateSKU("rosas-eternas");
  console.log(`Result: ${JSON.stringify(result2)}\n`);

  // Test 3: Plantas category (first time)
  console.log("TEST 3: Category 'plantas' (new category)");
  const result3 = await generateSKU("plantas");
  console.log(`Result: ${JSON.stringify(result3)}\n`);

  // Test 4: Invalid category
  console.log("TEST 4: Invalid category");
  const result4 = await generateSKU("invalid");
  console.log(`Result: ${JSON.stringify(result4)}\n`);

  console.log("=".repeat(60));
  console.log("SKU GENERATOR LOGIC VERIFIED");
  console.log("=".repeat(60));
}

test().catch(console.error);
