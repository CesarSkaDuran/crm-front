import sqlite3
import os
from pathlib import Path

db = r'C:\Users\boxmedia\AppData\Roaming\devin\cli\sessions.db'
out = Path(r'H:\crm\crm-web\public\assets\_extracted')
out.mkdir(parents=True, exist_ok=True)

conn = sqlite3.connect(db)
cur = conn.cursor()
tables = [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table'")]
print('tables', tables)
for t in tables:
    try:
        cols = [c[1] for c in cur.execute(f'PRAGMA table_info({t})')]
        print(t, cols)
    except Exception as e:
        print('err', t, e)
conn.close()
