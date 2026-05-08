import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    """
    Business: CRUD-операции с суточными записями (план/факт по технике и людям, состав смен).
    Args: event - dict с httpMethod, body, queryStringParameters
    Returns: HTTP-ответ со списком записей или статусом операции
    """
    method = event.get('httpMethod', 'GET')
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}

    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    cur = conn.cursor()

    try:
        if method == 'GET':
            cur.execute(
                "SELECT id, to_char(date, 'YYYY-MM-DD'), contractor_id, "
                "machinery_plan, machinery_fact, people_plan, people_fact, "
                "COALESCE(note, ''), COALESCE(day_shift, '[]'), COALESCE(night_shift, '[]'), "
                "to_char(created_at, 'YYYY-MM-DD\"T\"HH24:MI:SS'), "
                "COALESCE(shift_type, 'day'), COALESCE(filled_by, '') "
                "FROM daily_records ORDER BY created_at DESC"
            )
            rows = cur.fetchall()
            items = []
            for r in rows:
                try:
                    day_shift = json.loads(r[8]) if r[8] else []
                except Exception:
                    day_shift = []
                try:
                    night_shift = json.loads(r[9]) if r[9] else []
                except Exception:
                    night_shift = []
                items.append({
                    'id': r[0],
                    'date': r[1],
                    'contractorId': r[2],
                    'machineryPlan': r[3],
                    'machineryFact': r[4],
                    'peoplePlan': r[5],
                    'peopleFact': r[6],
                    'note': r[7],
                    'dayShift': day_shift,
                    'nightShift': night_shift,
                    'createdAt': r[10],
                    'shiftType': r[11],
                    'filledBy': r[12],
                })
            return {
                'statusCode': 200,
                'headers': {**cors_headers, 'Content-Type': 'application/json'},
                'body': json.dumps({'items': items}, ensure_ascii=False),
            }

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            rid = str(body.get('id', '')).replace("'", "''")
            date = str(body.get('date', '')).replace("'", "''")
            cid = str(body.get('contractorId', '')).replace("'", "''")
            mp = int(body.get('machineryPlan', 0) or 0)
            mf = int(body.get('machineryFact', 0) or 0)
            pp = int(body.get('peoplePlan', 0) or 0)
            pf = int(body.get('peopleFact', 0) or 0)
            note = str(body.get('note', '') or '').replace("'", "''")
            day_shift = json.dumps(body.get('dayShift') or [], ensure_ascii=False).replace("'", "''")
            night_shift = json.dumps(body.get('nightShift') or [], ensure_ascii=False).replace("'", "''")
            created_at = str(body.get('createdAt', '')).replace("'", "''")
            shift_type_raw = str(body.get('shiftType', 'day') or 'day')
            shift_type = 'night' if shift_type_raw == 'night' else 'day'
            filled_by = str(body.get('filledBy', '') or '').replace("'", "''")

            if not rid or not date or not cid:
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'id, date, contractorId required'}),
                }

            created_clause = f"'{created_at}'" if created_at else "CURRENT_TIMESTAMP"
            sql = (
                f"INSERT INTO daily_records "
                f"(id, date, contractor_id, machinery_plan, machinery_fact, "
                f"people_plan, people_fact, note, day_shift, night_shift, created_at, "
                f"shift_type, filled_by) "
                f"VALUES ('{rid}', '{date}', '{cid}', {mp}, {mf}, {pp}, {pf}, "
                f"'{note}', '{day_shift}', '{night_shift}', {created_clause}, "
                f"'{shift_type}', '{filled_by}') "
                f"ON CONFLICT (id) DO UPDATE SET "
                f"date = EXCLUDED.date, contractor_id = EXCLUDED.contractor_id, "
                f"machinery_plan = EXCLUDED.machinery_plan, machinery_fact = EXCLUDED.machinery_fact, "
                f"people_plan = EXCLUDED.people_plan, people_fact = EXCLUDED.people_fact, "
                f"note = EXCLUDED.note, day_shift = EXCLUDED.day_shift, night_shift = EXCLUDED.night_shift, "
                f"shift_type = EXCLUDED.shift_type, filled_by = EXCLUDED.filled_by"
            )
            cur.execute(sql)
            return {
                'statusCode': 200,
                'headers': {**cors_headers, 'Content-Type': 'application/json'},
                'body': json.dumps({'ok': True, 'id': rid}),
            }

        if method == 'DELETE':
            params = event.get('queryStringParameters') or {}
            rid = str(params.get('id', '')).replace("'", "''")
            if not rid:
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'id required'}),
                }
            cur.execute(f"DELETE FROM daily_records WHERE id = '{rid}'")
            return {
                'statusCode': 200,
                'headers': {**cors_headers, 'Content-Type': 'application/json'},
                'body': json.dumps({'ok': True}),
            }

        return {
            'statusCode': 405,
            'headers': cors_headers,
            'body': json.dumps({'error': 'method not allowed'}),
        }
    finally:
        cur.close()
        conn.close()