import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    """
    Business: CRUD-операции со списком подрядных организаций (общий список для всех пользователей).
    Args: event - dict с httpMethod, body; context - объект с request_id
    Returns: HTTP-ответ со списком подрядчиков или статусом операции
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
            cur.execute("SELECT id, name FROM contractors ORDER BY name")
            rows = cur.fetchall()
            items = [{'id': r[0], 'name': r[1]} for r in rows]
            return {
                'statusCode': 200,
                'headers': {**cors_headers, 'Content-Type': 'application/json'},
                'body': json.dumps({'items': items}, ensure_ascii=False),
            }

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            cid = str(body.get('id', '')).replace("'", "''")
            name = str(body.get('name', '')).replace("'", "''")
            if not cid or not name:
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'id and name required'}),
                }
            cur.execute(
                f"INSERT INTO contractors (id, name) VALUES ('{cid}', '{name}') "
                f"ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name"
            )
            return {
                'statusCode': 200,
                'headers': {**cors_headers, 'Content-Type': 'application/json'},
                'body': json.dumps({'ok': True, 'id': cid}),
            }

        if method == 'DELETE':
            params = event.get('queryStringParameters') or {}
            cid = str(params.get('id', '')).replace("'", "''")
            if not cid:
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'id required'}),
                }
            cur.execute(f"DELETE FROM contractors WHERE id = '{cid}'")
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
