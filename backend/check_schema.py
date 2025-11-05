import psycopg2
from psycopg2 import Error

try:
    connection = psycopg2.connect(
        user="postgres",
        password="1234",
        host="localhost",
        port="5432",
        database="IMS"
    )
    cursor = connection.cursor()

    # Print PostgreSQL Connection properties
    print(connection.get_dsn_parameters())

    # Query to get schema and table information
    cursor.execute("""
        SELECT table_schema, table_name, column_name
        FROM information_schema.columns
        WHERE table_name ILIKE 'students'
        ORDER BY table_schema, table_name, ordinal_position;
    """)
    records = cursor.fetchall()
    
    print("\nTable information:")
    for row in records:
        print(f"Schema: {row[0]}, Table: {row[1]}, Column: {row[2]}")

except (Exception, Error) as error:
    print("Error while connecting to PostgreSQL", error)
finally:
    if (connection):
        cursor.close()
        connection.close()
        print("PostgreSQL connection is closed")