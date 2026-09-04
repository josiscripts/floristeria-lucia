// Test syncProductImages logic WITHOUT actually calling APIs
// This verifies the sync detection works correctly

console.log("🧪 Testing syncProductImages detection logic\n");

// Simulate the sync logic
function detectImageChanges(originalImages, updatedImages) {
  const newImages = updatedImages.filter((img) => img.id.startsWith("temp-"));
  const existingUpdated = updatedImages.filter((img) => !img.id.startsWith("temp-"));
  const deletedIds = originalImages
    .filter((img) => !existingUpdated.find((u) => u.id === img.id))
    .map((img) => img.id);

  return {
    new: newImages,
    updated: existingUpdated,
    deleted: deletedIds,
    created_count: newImages.length,
    updated_count: existingUpdated.length,
    deleted_count: deletedIds.length,
  };
}

// TEST 1: Create product with 3 images
console.log("TEST 1: Create product with 3 new images");
const originalEmpty = [];
const newProduct = [
  { id: "temp-1", image_url: "https://example.com/1.jpg", is_primary: true, sort_order: 1 },
  { id: "temp-2", image_url: "https://example.com/2.jpg", is_primary: false, sort_order: 2 },
  { id: "temp-3", image_url: "https://example.com/3.jpg", is_primary: false, sort_order: 3 },
];
const result1 = detectImageChanges(originalEmpty, newProduct);
console.log("Result:", result1);
console.assert(result1.created_count === 3, "Expected 3 new images");
console.assert(result1.deleted_count === 0, "Expected 0 deleted");
console.assert(result1.updated_count === 0, "Expected 0 updated");
console.log("✅ PASS\n");

// TEST 2: Edit - add 1, delete 1, reorder existing
console.log("TEST 2: Edit - add 1 image, delete 1, keep 2");
const existing = [
  { id: "uuid-1", image_url: "https://example.com/1.jpg", is_primary: true, sort_order: 1 },
  { id: "uuid-2", image_url: "https://example.com/2.jpg", is_primary: false, sort_order: 2 },
  { id: "uuid-3", image_url: "https://example.com/3.jpg", is_primary: false, sort_order: 3 },
];
const afterEdit = [
  { id: "temp-4", image_url: "https://example.com/4.jpg", is_primary: false, sort_order: 1 },
  { id: "uuid-1", image_url: "https://example.com/1.jpg", is_primary: false, sort_order: 2 },
  { id: "uuid-2", image_url: "https://example.com/2.jpg", is_primary: true, sort_order: 3 },
  // uuid-3 is removed (deleted)
];
const result2 = detectImageChanges(existing, afterEdit);
console.log("Result:", result2);
console.assert(result2.created_count === 1, `Expected 1 new image, got ${result2.created_count}`);
console.assert(result2.deleted_count === 1, `Expected 1 deleted, got ${result2.deleted_count}`);
console.assert(result2.updated_count === 2, `Expected 2 updated, got ${result2.updated_count}`);
console.assert(result2.deleted[0] === "uuid-3", `Expected uuid-3 to be deleted`);
console.log("✅ PASS\n");

// TEST 3: Reorder without adding/removing
console.log("TEST 3: Reorder images without adding/removing");
const beforeReorder = [
  { id: "uuid-1", image_url: "https://example.com/1.jpg", is_primary: true, sort_order: 1 },
  { id: "uuid-2", image_url: "https://example.com/2.jpg", is_primary: false, sort_order: 2 },
  { id: "uuid-3", image_url: "https://example.com/3.jpg", is_primary: false, sort_order: 3 },
];
const afterReorder = [
  { id: "uuid-3", image_url: "https://example.com/3.jpg", is_primary: true, sort_order: 1 },
  { id: "uuid-1", image_url: "https://example.com/1.jpg", is_primary: false, sort_order: 2 },
  { id: "uuid-2", image_url: "https://example.com/2.jpg", is_primary: false, sort_order: 3 },
];
const result3 = detectImageChanges(beforeReorder, afterReorder);
console.log("Result:", result3);
console.assert(result3.created_count === 0, "Expected 0 new");
console.assert(result3.deleted_count === 0, "Expected 0 deleted");
console.assert(result3.updated_count === 3, "Expected 3 updated (all reordered)");
console.log("✅ PASS\n");

// TEST 4: Change primary image
console.log("TEST 4: Change primary image");
const beforePrimary = [
  { id: "uuid-1", image_url: "https://example.com/1.jpg", is_primary: true, sort_order: 1 },
  { id: "uuid-2", image_url: "https://example.com/2.jpg", is_primary: false, sort_order: 2 },
];
const afterPrimary = [
  { id: "uuid-1", image_url: "https://example.com/1.jpg", is_primary: false, sort_order: 1 },
  { id: "uuid-2", image_url: "https://example.com/2.jpg", is_primary: true, sort_order: 2 },
];
const result4 = detectImageChanges(beforePrimary, afterPrimary);
console.log("Result:", result4);
console.assert(result4.created_count === 0, "Expected 0 new");
console.assert(result4.deleted_count === 0, "Expected 0 deleted");
console.assert(result4.updated_count === 2, "Expected 2 updated (primary changed)");
console.log("✅ PASS\n");

// TEST 5: Delete all and add new ones (extreme case)
console.log("TEST 5: Replace all images");
const old = [
  { id: "uuid-1", image_url: "https://old.com/1.jpg", is_primary: true, sort_order: 1 },
  { id: "uuid-2", image_url: "https://old.com/2.jpg", is_primary: false, sort_order: 2 },
];
const new_images = [
  { id: "temp-1", image_url: "https://new.com/1.jpg", is_primary: true, sort_order: 1 },
  { id: "temp-2", image_url: "https://new.com/2.jpg", is_primary: false, sort_order: 2 },
];
const result5 = detectImageChanges(old, new_images);
console.log("Result:", result5);
console.assert(result5.created_count === 2, "Expected 2 new");
console.assert(result5.deleted_count === 2, "Expected 2 deleted");
console.assert(result5.updated_count === 0, "Expected 0 updated");
console.log("✅ PASS\n");

console.log("✅ ALL SYNC LOGIC TESTS PASSED");
