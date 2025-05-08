from db.db_config import engine

def load_to_postgres(df, table_name):
    df.to_sql(table_name, engine, if_exists="append", index=False)