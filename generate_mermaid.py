#!/usr/bin/env python3
"""
Parses nestle_ops_erd.sql → generates Mermaid ERD files:
  1. One overview .mmd showing all tables (compact, no columns) with relationships
  2. Per-domain .mmd files with full column detail
Then renders each to SVG via mmdc.
"""

import re
import subprocess
import os

# ─── Parse SQL DDL ──────────────────────────────────────────────────────────

def parse_sql(filepath):
    with open(filepath, 'r') as f:
        sql = f.read()

    tables = []
    refs = []

    pattern = re.compile(
        r'CREATE\s+TABLE\s+(\w+)\s*\((.*?)\);',
        re.DOTALL | re.IGNORECASE
    )

    for match in pattern.finditer(sql):
        table_name = match.group(1)
        body = match.group(2)

        columns = []
        for line in body.split('\n'):
            line = line.strip().rstrip(',')
            if not line or line.startswith('--'):
                continue

            col_match = re.match(
                r'^(\w+)\s+([\w()]+(?:\([\d,\s]+\))?)\s*(.*)',
                line, re.IGNORECASE
            )
            if col_match:
                col_name_upper = col_match.group(1).upper()
                if col_name_upper in ('PRIMARY', 'FOREIGN', 'UNIQUE', 'INDEX',
                                      'CONSTRAINT', 'CHECK', 'KEY'):
                    continue

                col_name = col_match.group(1)
                col_type = col_match.group(2).split('(')[0].upper()
                rest = col_match.group(3)

                is_pk = 'PRIMARY KEY' in rest.upper()

                fk_match = re.search(
                    r'REFERENCES\s+(\w+)\s*\(\s*(\w+)\s*\)',
                    rest, re.IGNORECASE
                )
                fk_table = fk_match.group(1) if fk_match else None
                fk_col = fk_match.group(2) if fk_match else None

                key_type = ''
                if is_pk:
                    key_type = 'PK'
                elif fk_table:
                    key_type = 'FK'

                if fk_match:
                    refs.append({
                        'from_table': table_name,
                        'from_col': col_name,
                        'to_table': fk_table,
                        'to_col': fk_col,
                    })

                columns.append({
                    'name': col_name,
                    'type': col_type,
                    'key_type': key_type,
                    'fk_table': fk_table,
                })

        if columns:
            tables.append({'name': table_name, 'columns': columns})

    return tables, refs


# ─── Domain map ─────────────────────────────────────────────────────────────

DOMAIN_MAP = {
    'master_data': [
        'region', 'country', 'currency', 'unit_of_measure', 'fiscal_period',
        'brand', 'product_category', 'product', 'product_variant',
        'ingredient', 'product_ingredient', 'packaging_type',
        'regulatory_standard', 'certification_type',
    ],
    'organization': [
        'business_unit', 'site', 'department', 'role', 'employee',
        'team', 'team_member',
    ],
    'supplier_mgmt': [
        'supplier_tier', 'supplier', 'supplier_contact', 'supplier_material',
        'supplier_contract', 'contract_line_item', 'supplier_certification',
        'supplier_audit', 'supplier_risk_assessment', 'supplier_performance',
        'approved_supplier_list',
    ],
    'procurement': [
        'purchase_requisition', 'purchase_requisition_line',
        'purchase_order', 'purchase_order_line',
        'goods_receipt', 'goods_receipt_line',
        'invoice', 'invoice_line', 'payment',
    ],
    'inventory': [
        'warehouse', 'warehouse_zone', 'storage_location', 'material_master',
        'inventory_lot', 'stock_level', 'safety_stock_config',
        'reorder_point_config', 'inventory_transaction',
        'cycle_count', 'cycle_count_line',
    ],
    'production': [
        'factory', 'production_line', 'line_product_capability',
        'production_shift', 'production_schedule', 'work_order',
        'work_order_step', 'production_batch', 'batch_ingredient_usage',
        'equipment', 'equipment_maintenance', 'oee_record',
        'downtime_event', 'downtime_reason',
    ],
    'quality': [
        'quality_parameter', 'product_specification', 'quality_inspection',
        'inspection_result', 'non_conformance', 'corrective_action',
        'lab_test', 'lab_test_result', 'recall_event',
    ],
    'logistics': [
        'carrier', 'vehicle_type', 'vehicle', 'route', 'route_waypoint',
        'shipment', 'shipment_line', 'delivery', 'delivery_line',
        'loading_dock', 'temperature_reading', 'tracking_event', 'freight_cost',
    ],
    'alerts': [
        'alert_rule', 'alert', 'alert_acknowledgment', 'alert_escalation',
    ],
    'kpis_demand': [
        'kpi_definition', 'kpi_target', 'kpi_measurement', 'dashboard_config',
        'customer', 'sales_order', 'sales_order_line',
        'demand_forecast', 'forecast_line',
    ],
}

DOMAIN_LABELS = {
    'master_data': 'Master Data & Reference',
    'organization': 'Organization & Personnel',
    'supplier_mgmt': 'Supplier Management',
    'procurement': 'Procurement',
    'inventory': 'Inventory Management',
    'production': 'Production & Manufacturing',
    'quality': 'Quality Control',
    'logistics': 'Logistics & Cold Chain',
    'alerts': 'Alerts & Monitoring',
    'kpis_demand': 'KPIs, Analytics & Demand',
}

def get_domain(table_name):
    for domain, tbls in DOMAIN_MAP.items():
        if table_name in tbls:
            return domain
    return 'other'


# ─── Generate Mermaid ───────────────────────────────────────────────────────

def mermaid_relationship(ref):
    """Convert a FK reference to a Mermaid ER relationship line."""
    # from_table has FK pointing to to_table
    # Mermaid: parent ||--o{ child : "has"
    # to_table is the parent (PK side), from_table is the child (FK side)
    return f'    {ref["to_table"]} ||--o{{ {ref["from_table"]} : "{ref["from_col"]}"'


def generate_overview(tables, refs, out_dir):
    """Generate a high-level overview with just table names and relationships."""
    table_lookup = {t['name'] for t in tables}

    lines = ['erDiagram']

    # Group tables by domain for visual organization
    for domain_key, domain_tables in DOMAIN_MAP.items():
        label = DOMAIN_LABELS.get(domain_key, domain_key)
        lines.append(f'    %% ─── {label} ───')
        for tn in domain_tables:
            if tn in table_lookup:
                lines.append(f'    {tn} {{')
                lines.append(f'    }}')
        lines.append('')

    # Relationships
    lines.append('    %% ─── Relationships ───')
    seen = set()
    for ref in refs:
        key = (ref['to_table'], ref['from_table'])
        if key not in seen and ref['to_table'] in table_lookup and ref['from_table'] in table_lookup:
            seen.add(key)
            lines.append(mermaid_relationship(ref))

    mmd = '\n'.join(lines)
    path = os.path.join(out_dir, 'erd_overview.mmd')
    with open(path, 'w') as f:
        f.write(mmd)
    print(f"  Overview: {len(table_lookup)} tables, {len(seen)} relationships → {path}")
    return path


def generate_domain(domain_key, tables, refs, out_dir):
    """Generate a detailed domain ERD with full columns."""
    domain_tables = set(DOMAIN_MAP.get(domain_key, []))
    table_objs = [t for t in tables if t['name'] in domain_tables]

    if not table_objs:
        return None

    lines = ['erDiagram']

    for table in table_objs:
        lines.append(f'    {table["name"]} {{')
        for col in table['columns']:
            comment = ''
            if col['key_type']:
                comment = f' "{col["key_type"]}"'
            lines.append(f'        {col["type"]} {col["name"]}{comment}')
        lines.append(f'    }}')
        lines.append('')

    # Relationships within this domain + cross-domain refs
    # Include all refs where at least one side is in this domain
    lines.append('    %% Relationships')
    seen = set()
    for ref in refs:
        if ref['from_table'] in domain_tables or ref['to_table'] in domain_tables:
            key = (ref['to_table'], ref['from_table'])
            if key not in seen:
                seen.add(key)
                # If one side is outside domain, we still need to declare it
                for tn in [ref['from_table'], ref['to_table']]:
                    if tn not in domain_tables:
                        # Add a stub for the external table
                        ext_line = f'    {tn} {{}}'
                        if ext_line not in lines:
                            lines.insert(1, ext_line)

                lines.append(mermaid_relationship(ref))

    mmd = '\n'.join(lines)
    path = os.path.join(out_dir, f'erd_{domain_key}.mmd')
    with open(path, 'w') as f:
        f.write(mmd)
    print(f"  {DOMAIN_LABELS.get(domain_key, domain_key)}: {len(table_objs)} tables → {path}")
    return path


def render_svg(mmd_path, out_dir):
    """Render a .mmd file to SVG using mmdc."""
    svg_path = mmd_path.replace('.mmd', '.svg')
    result = subprocess.run(
        ['mmdc', '-i', mmd_path, '-o', svg_path,
         '-t', 'dark', '-b', 'transparent',
         '--scale', '2',
         '-c', os.path.join(out_dir, 'mermaid-config.json')],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        print(f"    ⚠ mmdc error for {mmd_path}: {result.stderr[:200]}")
        # Try without config
        result = subprocess.run(
            ['mmdc', '-i', mmd_path, '-o', svg_path,
             '-t', 'dark', '-b', 'transparent', '--scale', '2'],
            capture_output=True, text=True,
        )
        if result.returncode != 0:
            print(f"    ✗ Failed: {result.stderr[:200]}")
            return None

    print(f"    ✓ SVG: {svg_path}")
    return svg_path


# ─── Main ───────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    base = os.path.dirname(os.path.abspath(__file__))
    sql_path = os.path.join(base, 'nestle_ops_erd.sql')
    out_dir = os.path.join(base, 'erd_output')
    os.makedirs(out_dir, exist_ok=True)

    # Mermaid config for nicer rendering
    config = {
        "er": {
            "layoutDirection": "LR",
            "entityPadding": 15,
            "fontSize": 12,
            "useMaxWidth": False
        },
        "theme": "dark",
        "themeVariables": {
            "primaryColor": "#3B9EFF",
            "primaryTextColor": "#E2EAF4",
            "primaryBorderColor": "#2A3347",
            "lineColor": "#5A7A9A",
            "secondaryColor": "#1C2333",
            "tertiaryColor": "#161B26",
            "background": "#0E1117",
            "mainBkg": "#161B26",
            "nodeBorder": "#3B9EFF",
            "clusterBkg": "#1C2333",
            "titleColor": "#E2EAF4",
            "edgeLabelBackground": "#161B26"
        }
    }
    config_path = os.path.join(out_dir, 'mermaid-config.json')
    import json
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)

    tables, refs = parse_sql(sql_path)
    print(f"Parsed {len(tables)} tables, {len(refs)} relationships\n")

    # Generate .mmd files
    print("Generating Mermaid files:")
    mmd_files = []

    # Overview
    p = generate_overview(tables, refs, out_dir)
    mmd_files.append(p)

    # Per-domain
    for domain_key in DOMAIN_MAP:
        p = generate_domain(domain_key, tables, refs, out_dir)
        if p:
            mmd_files.append(p)

    # Render to SVG
    print("\nRendering SVGs:")
    for mmd_path in mmd_files:
        render_svg(mmd_path, out_dir)

    print(f"\nDone! Files in {out_dir}/")
    print("Import the SVGs into Figma — every box, line, and label is individually editable.")
