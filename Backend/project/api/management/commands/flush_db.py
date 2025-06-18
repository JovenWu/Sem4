from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = 'Flush all data from the database tables'

    def handle(self, *args, **options):
        self.stdout.write('Flushing database...')
        
        with connection.cursor() as cursor:
            # Disable foreign key constraints
            cursor.execute('PRAGMA foreign_keys = OFF;')
            
            # Get all table names
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'django_%' AND name NOT LIKE 'auth_%' AND name NOT LIKE 'sqlite_%';")
            tables = cursor.fetchall()
            
            # Delete all data from tables
            for table in tables:
                table_name = table[0]
                cursor.execute(f'DELETE FROM {table_name};')
                self.stdout.write(f'Cleared table: {table_name}')
            
            # Re-enable foreign key constraints
            cursor.execute('PRAGMA foreign_keys = ON;')
        
        self.stdout.write(self.style.SUCCESS('Database flushed successfully!'))
