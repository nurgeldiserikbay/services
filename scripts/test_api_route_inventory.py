import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("inventory", ROOT / "scripts/check_api_route_inventory.py")
inventory = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inventory)

class InventoryTest(unittest.TestCase):
    def setUp(self):
        self.design = (ROOT / "contracts/openapi.yaml").read_text(encoding="utf-8")
        self.report = (ROOT / "docs/api-runtime-route-inventory-2026-11-18.md").read_text(encoding="utf-8")

    def test_baseline(self):
        self.assertEqual(inventory.verify(self.design, self.report), (65, 28, 23, 42, 5))

    def test_undocumented_operation(self):
        changed = self.design.replace("paths:\n", "paths:\n  /new-drift:\n    get:\n", 1)
        with self.assertRaisesRegex(ValueError, "undocumented design gap"):
            inventory.verify(changed, self.report)

    def test_duplicate_operation(self):
        changed = self.design.replace("paths:\n", "paths:\n  /search:\n    get:\n", 1)
        with self.assertRaisesRegex(ValueError, "duplicate design"):
            inventory.verify(changed, self.report)

    def test_parameter_alias(self):
        self.assertEqual(inventory.verify(self.design.replace("/requests/{id}:", "/requests/{requestId}:", 1), self.report), (65, 28, 23, 42, 5))

    def test_incorrect_count(self):
        with self.assertRaisesRegex(ValueError, "incorrect inventory count"):
            inventory.verify(self.design, self.report.replace("Design operations: 65", "Design operations: 64", 1))

    def test_snapshot_baseline(self):
        snapshot = json.loads((ROOT / "contracts/runtime-route-inventory.json").read_text(encoding="utf-8"))
        inventory.verify_snapshot(self.report, snapshot)

    def test_snapshot_drift(self):
        snapshot = json.loads((ROOT / "contracts/runtime-route-inventory.json").read_text(encoding="utf-8"))
        snapshot["routes"].pop()
        with self.assertRaisesRegex(ValueError, "runtime snapshot differs"):
            inventory.verify_snapshot(self.report, snapshot)

    def test_snapshot_duplicate(self):
        snapshot = json.loads((ROOT / "contracts/runtime-route-inventory.json").read_text(encoding="utf-8"))
        snapshot["routes"].append(snapshot["routes"][0])
        with self.assertRaisesRegex(ValueError, "duplicate runtime snapshot"):
            inventory.verify_snapshot(self.report, snapshot)

    def test_unsupported_inline_path(self):
        changed = self.design.replace("paths:\n", "paths:\n  /new-drift: {}\n", 1)
        with self.assertRaisesRegex(ValueError, "unsupported path declaration"):
            inventory.verify(changed, self.report)

if __name__ == "__main__":
    unittest.main()
