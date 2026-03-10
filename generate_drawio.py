#!/usr/bin/env python3
"""
Parses nestle_ops_erd.sql → uses GraphViz 'dot' for auto-layout →
writes a .drawio file with computed positions. Best of both worlds:
professional layout + fully editable in diagrams.net or Lucidchart.
"""

import re
import subprocess
import json
import xml.etree.ElementTree as ET
from xml.dom import minidom
import html

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
                col_type = col_match.group(2)
                rest = col_match.group(3)

                is_pk = 'PRIMARY KEY' in rest.upper()
                is_nullable = 'NOT NULL' not in rest.upper()
                if is_pk:
                    is_nullable = False

                fk_match = re.search(
                    r'REFERENCES\s+(\w+)\s*\(\s*(\w+)\s*\)',
                    rest, re.IGNORECASE
                )
                fk_table = fk_match.group(1) if fk_match else None
                fk_col = fk_match.group(2) if fk_match else None

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
                    'pk': is_pk,
                    'nullable': is_nullable,
                    'fk_table': fk_table,
                    'fk_col': fk_col,
                })

        if columns:
            tables.append({'name': table_name, 'columns': columns})

    return tables, refs


# ─── Domain classification & colors ─────────────────────────────────────────

DOMAIN_MAP = {
    'Master Data': [
        'region', 'country', 'currency', 'unit_of_measure', 'fiscal_period',
        'brand', 'product_category', 'product', 'product_variant',
        'ingredient', 'product_ingredient', 'packaging_type',
        'regulatory_standard', 'certification_type',
    ],
    'Organization': [
        'business_unit', 'site', 'department', 'role', 'employee',
        'team', 'team_member',
    ],
    'Supplier Mgmt': [
        'supplier_tier', 'supplier', 'supplier_contact', 'supplier_material',
        'supplier_contract', 'contract_line_item', 'supplier_certification',
        'supplier_audit', 'supplier_risk_assessment', 'supplier_performance',
        'approved_supplier_list',
    ],
    'Procurement': [
        'purchase_requisition', 'purchase_requisition_line',
        'purchase_order', 'purchase_order_line',
        'goods_receipt', 'goods_receipt_line',
        'invoice', 'invoice_line', 'payment',
    ],
    'Inventory': [
        'warehouse', 'warehouse_zone', 'storage_location', 'material_master',
        'inventory_lot', 'stock_level', 'safety_stock_config',
        'reorder_point_config', 'inventory_transaction',
        'cycle_count', 'cycle_count_line',
    ],
    'Production': [
        'factory', 'production_line', 'line_product_capability',
        'production_shift', 'production_schedule', 'work_order',
        'work_order_step', 'production_batch', 'batch_ingredient_usage',
        'equipment', 'equipment_maintenance', 'oee_record',
        'downtime_event', 'downtime_reason',
    ],
    'Quality': [
        'quality_parameter', 'product_specification', 'quality_inspection',
        'inspection_result', 'non_conformance', 'corrective_action',
        'lab_test', 'lab_test_result', 'recall_event',
    ],
    'Logistics': [
        'carrier', 'vehicle_type', 'vehicle', 'route', 'route_waypoint',
        'shipment', 'shipment_line', 'delivery', 'delivery_line',
        'loading_dock', 'temperature_reading', 'tracking_event', 'freight_cost',
    ],
    'Alerts': [
        'alert_rule', 'alert', 'alert_acknowledgment', 'alert_escalation',
    ],
    'KPIs & Demand': [
        'kpi_definition', 'kpi_target', 'kpi_measurement', 'dashboard_config',
        'customer', 'sales_order', 'sales_order_line',
        'demand_forecast', 'forecast_line',
    ],
}

DOMAIN_COLORS = {
    'Master Data':   '#E8EAF6',
    'Organization':  '#E3F2FD',
    'Supplier Mgmt': '#FFF3E0',
    'Procurement':   '#FCE4EC',
    'Inventory':     '#E8F5E9',
    'Production':    '#FFF8E1',
    'Quality':       '#F3E5F5',
    'Logistics':     '#E0F7FA',
    'Alerts':        '#FFEBEE',
    'KPIs & Demand': '#F1F8E9',
}

DOMAIN_HEADER_COLORS = {
    'Master Data':   '#3F51B5',
    'Organization':  '#1976D2',
    'Supplier Mgmt': '#E65100',
    'Procurement':   '#C62828',
    'Inventory':     '#2E7D32',
    'Production':    '#F57F17',
    'Quality':       '#7B1FA2',
    'Logistics':     '#00838F',
    'Alerts':        '#D32F2F',
    'KPIs & Demand': '#558B2F',
}

def get_domain(table_name):
    for domain, tbls in DOMAIN_MAP.items():
        if table_name in tbls:
            return domain
    return 'Other'


# ─── Use GraphViz to compute layout ────────────────────────────────────────

def compute_layout(tables, refs):
    """
    Generate a DOT graph, run it through 'dot' with JSON output,
    and parse back the computed (x, y) positions for each table node.
    """
    TABLE_WIDTH = 260
    ROW_HEIGHT = 18
    HEADER_HEIGHT = 30

    table_dims = {}
    for t in tables:
        h = HEADER_HEIGHT + len(t['columns']) * ROW_HEIGHT + 8
        table_dims[t['name']] = (TABLE_WIDTH, h)

    # Build DOT source
    lines = [
        'digraph ERD {',
        '  rankdir=LR;',
        '  ranksep=2.5;',
        '  nodesep=1.0;',
        '  overlap=false;',
        '  splines=ortho;',
        '  pad=1.0;',
        '',
    ]

    # Group by domain using subgraphs (influences layout clustering)
    for domain, tbl_names in DOMAIN_MAP.items():
        safe_name = domain.replace(' ', '_').replace('&', 'and')
        lines.append(f'  subgraph cluster_{safe_name} {{')
        lines.append(f'    label="{domain}";')
        lines.append(f'    style=invis;')  # invisible cluster, just for grouping
        for tn in tbl_names:
            if tn in table_dims:
                w_in = table_dims[tn][0] / 72.0  # pixels to inches
                h_in = table_dims[tn][1] / 72.0
                lines.append(
                    f'    {tn} [shape=box, fixedsize=true, '
                    f'width={w_in:.2f}, height={h_in:.2f}];'
                )
        lines.append('  }')
        lines.append('')

    # Edges
    for ref in refs:
        lines.append(f'  {ref["from_table"]} -> {ref["to_table"]};')

    lines.append('}')
    dot_source = '\n'.join(lines)

    # Run dot with JSON output
    result = subprocess.run(
        ['dot', '-Tjson'],
        input=dot_source,
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        print(f"GraphViz error: {result.stderr}")
        # Fallback: simple grid
        return fallback_layout(tables, table_dims)

    data = json.loads(result.stdout)

    # Parse positions from JSON output
    # GraphViz JSON uses points (1/72 inch), positions are center of node
    positions = {}
    for obj in data.get('objects', []):
        # Objects can be subgraphs or nodes
        if 'name' in obj and obj['name'] in table_dims:
            # pos is "x,y" in points
            pos = obj.get('pos', '0,0')
            cx, cy = [float(v) for v in pos.split(',')]
            w, h = table_dims[obj['name']]
            # Convert from center to top-left, scale from points to pixels
            # GraphViz y is bottom-up, flip it
            positions[obj['name']] = (cx - w / 2, cy - h / 2)
        # Also check inside subgraphs
        if 'objects' in obj:
            for sub in obj['objects']:
                if 'name' in sub and sub['name'] in table_dims:
                    pos = sub.get('pos', '0,0')
                    cx, cy = [float(v) for v in pos.split(',')]
                    w, h = table_dims[sub['name']]
                    positions[sub['name']] = (cx - w / 2, cy - h / 2)

    # If we didn't get positions from nested objects, try flat nodes
    if not positions:
        for obj in data.get('objects', []):
            if 'nodes' in obj:
                for node in obj['nodes']:
                    name = node.get('name', '')
                    if name in table_dims:
                        pos = node.get('pos', '0,0')
                        cx, cy = [float(v) for v in pos.split(',')]
                        w, h = table_dims[name]
                        positions[name] = (cx - w / 2, cy - h / 2)

    # Normalize: shift so minimum x,y is at (80, 80)
    if positions:
        min_x = min(p[0] for p in positions.values())
        min_y = min(p[1] for p in positions.values())
        max_y = max(p[1] + table_dims[n][1] for n, p in positions.items())
        for name in positions:
            x, y = positions[name]
            # Flip Y axis (graphviz Y goes up, drawio Y goes down)
            positions[name] = (
                x - min_x + 80,
                (max_y - y) - min_y + 80
            )

    # Fill in any missing tables with fallback
    for t in tables:
        if t['name'] not in positions:
            positions[t['name']] = fallback_pos(t['name'], tables, positions, table_dims)

    return positions, table_dims


def fallback_layout(tables, table_dims):
    positions = {}
    x, y = 80, 80
    col = 0
    for t in tables:
        w, h = table_dims[t['name']]
        positions[t['name']] = (x + col * 320, y)
        y += h + 50
        if y > 5000:
            y = 80
            col += 1
    return positions, table_dims


def fallback_pos(name, tables, positions, table_dims):
    max_x = max((p[0] for p in positions.values()), default=80)
    max_y = max((p[1] for p in positions.values()), default=80)
    return (max_x + 350, 80)


# ─── Generate .drawio XML ──────────────────────────────────────────────────

def generate_drawio(tables, refs, positions, table_dims):
    TABLE_WIDTH = 260
    ROW_HEIGHT = 18
    HEADER_HEIGHT = 30

    cell_id = 2
    all_cells = []
    table_ids = {}

    for table in tables:
        domain = get_domain(table['name'])
        header_color = DOMAIN_HEADER_COLORS.get(domain, '#666666')
        fill_color = DOMAIN_COLORS.get(domain, '#F5F5F5')

        tx, ty = positions.get(table['name'], (80, 80))
        t_height = HEADER_HEIGHT + len(table['columns']) * ROW_HEIGHT + 8

        t_id = cell_id
        table_ids[table['name']] = t_id
        cell_id += 1

        # Build HTML label
        rows_html = ''
        for col in table['columns']:
            icon = ''
            if col['pk']:
                icon = '🔑 '
            elif col['fk_table']:
                icon = '🔗 '

            col_color = '#333333'
            if col['pk']:
                col_color = '#1a237e'
            elif col['fk_table']:
                col_color = '#b71c1c'

            null_str = '' if not col['nullable'] else '  ∅'
            rows_html += (
                f'<tr>'
                f'<td align="left" style="padding:2px 6px;color:{col_color};font-size:11px;">'
                f'{icon}{html.escape(col["name"])}</td>'
                f'<td align="right" style="padding:2px 6px;color:#666;font-size:10px;">'
                f'{html.escape(col["type"])}{null_str}</td>'
                f'</tr>'
            )

        label = (
            f'<table style="width:100%;border-collapse:collapse;" cellpadding="0" cellspacing="0">'
            f'<tr><td colspan="2" style="padding:6px 8px;background:{header_color};color:white;'
            f'font-weight:bold;font-size:12px;border-radius:4px 4px 0 0;">'
            f'{html.escape(table["name"])}</td></tr>'
            f'{rows_html}'
            f'</table>'
        )

        all_cells.append({
            'id': str(t_id),
            'value': label,
            'style': (
                f'shape=mxgraph.er.entity;whiteSpace=wrap;html=1;overflow=fill;'
                f'fillColor={fill_color};strokeColor={header_color};'
                f'rounded=1;arcSize=4;shadow=1;'
                f'align=left;verticalAlign=top;spacingTop=0;spacingLeft=0;'
            ),
            'vertex': '1',
            'geo': {
                'x': str(int(tx)), 'y': str(int(ty)),
                'width': str(TABLE_WIDTH), 'height': str(t_height),
            },
        })

    # Edges
    edges = []
    for ref in refs:
        from_tbl = ref['from_table']
        to_tbl = ref['to_table']
        if from_tbl not in table_ids or to_tbl not in table_ids:
            continue

        e_id = cell_id
        cell_id += 1

        from_domain = get_domain(from_tbl)
        edge_color = DOMAIN_HEADER_COLORS.get(from_domain, '#999999')

        edges.append({
            'id': str(e_id),
            'source': str(table_ids[from_tbl]),
            'target': str(table_ids[to_tbl]),
            'style': (
                f'edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;'
                f'jettySize=auto;html=1;'
                f'strokeColor={edge_color};strokeWidth=1;opacity=50;'
                f'endArrow=ERone;endFill=0;startArrow=ERmany;startFill=0;'
                f'curved=1;'
            ),
        })

    # ─── Build XML ──────────────────────────────────────────────────────

    root = ET.Element('mxfile', {
        'host': 'app.diagrams.net',
        'type': 'device',
    })
    diagram = ET.SubElement(root, 'diagram', {
        'id': 'nestle-erd',
        'name': 'Nestlé Supply Chain ERD',
    })
    model = ET.SubElement(diagram, 'mxGraphModel', {
        'dx': '1200', 'dy': '800', 'grid': '1', 'gridSize': '10',
        'guides': '1', 'tooltips': '1', 'connect': '1', 'arrows': '1',
        'fold': '1', 'page': '0', 'pageScale': '1',
        'math': '0', 'shadow': '0',
    })
    root_cell = ET.SubElement(model, 'root')

    ET.SubElement(root_cell, 'mxCell', {'id': '0'})
    ET.SubElement(root_cell, 'mxCell', {'id': '1', 'parent': '0'})

    for cell in all_cells:
        attrs = {
            'id': cell['id'],
            'value': cell['value'],
            'style': cell['style'],
            'parent': '1',
        }
        if 'vertex' in cell:
            attrs['vertex'] = cell['vertex']

        el = ET.SubElement(root_cell, 'mxCell', attrs)
        if 'geo' in cell:
            ET.SubElement(el, 'mxGeometry', {
                **cell['geo'],
                'as': 'geometry',
            })

    for edge in edges:
        el = ET.SubElement(root_cell, 'mxCell', {
            'id': edge['id'],
            'value': '',
            'style': edge['style'],
            'parent': '1',
            'source': edge['source'],
            'target': edge['target'],
            'edge': '1',
        })
        ET.SubElement(el, 'mxGeometry', {
            'relative': '1',
            'as': 'geometry',
        })

    xml_str = ET.tostring(root, encoding='unicode')
    dom = minidom.parseString(xml_str)
    pretty = dom.toprettyxml(indent='  ', encoding=None)
    lines = pretty.split('\n')
    if lines[0].startswith('<?xml'):
        lines = lines[1:]
    return '\n'.join(lines)


# ─── Main ───────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    import os
    base = os.path.dirname(os.path.abspath(__file__))
    sql_path = os.path.join(base, 'nestle_ops_erd.sql')
    out_path = os.path.join(base, 'nestle_ops_erd.drawio')

    tables, refs = parse_sql(sql_path)
    print(f"Parsed {len(tables)} tables, {len(refs)} relationships")

    positions, table_dims = compute_layout(tables, refs)
    print(f"Computed positions for {len(positions)} tables via GraphViz")

    xml = generate_drawio(tables, refs, positions, table_dims)

    with open(out_path, 'w') as f:
        f.write(xml)

    print(f"Written to {out_path}")
    print(f"Open in diagrams.net or import into Lucidchart")
