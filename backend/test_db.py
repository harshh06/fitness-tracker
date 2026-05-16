import asyncio
import asyncpg
from datetime import date
from uuid import UUID

async def main():
    conn = await asyncpg.connect("postgresql://neondb_owner:npg_vYFbcEUZm26p@ep-broad-cell-am9p0l7a.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require")
    try:
        query = """
        UPDATE profiles 
        SET display_name = $1, email = $2, date_of_birth = $3, gender = $4, height_cm = $5, weight_kg = $6, fitness_level = $7, avatar_url = $8
        WHERE user_id = $9
        RETURNING *
        """
        values = ['Harsh', 'string', date(2026, 5, 15), 'string', 0, 71, 'string', 'string', '14e381a0-f77b-4d03-8533-0288d321f499']
        row = await conn.fetchrow(query, *values)
        print("Success:", row)
    except Exception as e:
        print("Error:", type(e).__name__, "-", e)
    finally:
        await conn.close()

asyncio.run(main())
