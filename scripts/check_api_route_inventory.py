#!/usr/bin/env python3
"""Check documented route gap inventory against a deliberately limited OpenAPI YAML layout.

No network calls or third-party dependencies. This checks design/inventory drift,
not live backend routing, schema parity or authorization.
"""
import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
METHODS = "GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS|TRACE"

def normalize(method, path):
    return method.upper(), re.sub(r"\{[^{}]+\}", "{}", path)

def unique(rows, label):
    result = set()
    for method, path in rows:
        key = normalize(method, path)
        if key in result:
            raise ValueError(f"duplicate {label}: {method} {path}")
        result.add(key)
    return result

def design_rows(text):
    lines = text.splitlines()
    if lines.count("paths:") != 1:
        raise ValueError("expected exactly one block-style paths section")
    path = None
    rows = []
    for line in lines[lines.index("paths:") + 1:]:
        if line and not line[0].isspace() and not line.startswith("#"):
            break
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if re.match(r"^  \S", line):
            match = re.fullmatch(r"  (/\S*):\s*", line)
            if not match:
                raise ValueError(f"unsupported path declaration: {line}")
            path = match[1]
        elif re.match(r"^    \S", line):
            match = re.fullmatch(r"    (get|post|put|patch|delete|head|options|trace):\s*", line)
            if match and path:
                rows.append((match[1], path))
            elif not re.match(r"^    (parameters|summary|description|servers|x-[\w-]+):", line):
                raise ValueError(f"unsupported operation declaration: {line}")
    if not rows:
        raise ValueError("no design operations")
    return rows

def inventory_rows(text, heading, end, controller=False):
    if text.count(heading) != 1 or text.count(end) != 1:
        raise ValueError(f"missing/duplicate inventory heading: {heading}")
    body = text.split(heading, 1)[1].split(end, 1)[0]
    rows = []
    for line in body.splitlines():
        if not re.match(r"^\| [A-Z]", line) or line.startswith("| Method"):
            continue
        match = re.fullmatch(r"\| (" + METHODS + r") \| " + chr(96) + r"([^" + chr(96) + r"]+)" + chr(96) + (r" \| [^|]+ \| (Match only|Missing) \|" if controller else r" \|"), line)
        if not match:
            raise ValueError(f"invalid inventory row: {line}")
        rows.append((match[1], match[2], match[3] if controller else None))
    if not rows:
        raise ValueError(f"empty inventory section: {heading}")
    return rows

def verify(design, inventory):
    declared = unique(design_rows(design), "design")
    controllers = inventory_rows(inventory, "## Controller declarations", "## Design operations without matching declaration", True)
    actual = unique(((m, p) for m, p, _ in controllers), "controller")
    documented = unique(((m, p) for m, p, _ in inventory_rows(inventory, "## Design operations without matching declaration", "## Next verification gates")), "gap")
    failures = []
    for m, p, label in controllers:
        expected = "Match only" if normalize(m, p) in declared else "Missing"
        if label != expected:
            failures.append(f"incorrect controller label: {m} {p}: expected {expected}")
    missing = declared - actual
    for m, p in sorted(missing - documented):
        failures.append(f"undocumented design gap: {m} {p}")
    for m, p in sorted(documented - missing):
        failures.append(f"stale design gap: {m} {p}")
    counts = (len(declared), len(actual), len(declared & actual), len(missing), len(actual - declared))
    labels = ("Design operations", "Controller route declarations", "Method/path shape matches", "Design operations without a matching inspected declaration", "Inspected declarations without a design operation")
    for label, count in zip(labels, counts):
        if not re.search(r"^- " + re.escape(label) + r": " + str(count) + r"$", inventory, re.M):
            failures.append(f"incorrect inventory count: {label}: expected {count}")
    if failures:
        raise ValueError("\n".join(failures))
    return counts

def verify_snapshot(inventory, snapshot):
    if not isinstance(snapshot, dict) or type(snapshot.get("schemaVersion")) is not int or snapshot["schemaVersion"] != 1:
        raise ValueError("unsupported runtime snapshot schema")
    routes = snapshot.get("routes")
    if not isinstance(routes, list) or not routes:
        raise ValueError("missing runtime snapshot routes")
    expected = set()
    for route in routes:
        if not isinstance(route, str) or not re.fullmatch(r"(" + METHODS + r") /\S*", route):
            raise ValueError("invalid runtime snapshot route")
        if route in expected:
            raise ValueError("duplicate runtime snapshot route")
        expected.add(route)
    actual = {m + " " + p for m, p, _ in inventory_rows(inventory, "## Controller declarations", "## Design operations without matching declaration", True)}
    if expected != actual:
        raise ValueError("runtime snapshot differs from documented controller declarations")

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--design", type=Path, default=ROOT / "contracts/openapi.yaml")
    parser.add_argument("--inventory", type=Path, default=ROOT / "docs/api-runtime-route-inventory-2026-11-18.md")
    parser.add_argument("--snapshot", type=Path, default=ROOT / "contracts/runtime-route-inventory.json")
    args = parser.parse_args()
    try:
        report = args.inventory.read_text(encoding="utf-8")
        counts = verify(args.design.read_text(encoding="utf-8"), report)
        verify_snapshot(report, json.loads(args.snapshot.read_text(encoding="utf-8")))
    except (OSError, ValueError) as exc:
        parser.exit(1, f"Route inventory drift: {exc}\n")
    print("Inventory consistent: design=%d controllers=%d matches=%d gaps=%d runtime-only=%d" % counts)

if __name__ == "__main__":
    main()
