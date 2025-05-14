from db.db_config import engine

def load_to_postgres(df, table_name):
    """
    Load DataFrame to PostgreSQL table
    """
    try:
        # Convert DataFrame to SQL and load to PostgreSQL
        df.to_sql(
            table_name,
            engine,
            if_exists='append',
            index=False,
            method='multi'
        )
    except Exception as e:
        print(f"Error loading data to {table_name}: {str(e)}")
        raise