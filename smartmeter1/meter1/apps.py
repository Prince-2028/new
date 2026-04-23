from django.apps import AppConfig
import os


class Meter1Config(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'meter1'

    def ready(self):
        """
        Called when Django starts up.
        Clear the logFile.txt to start fresh.
        """
        # Only run this once (Django calls ready() multiple times in some cases)
        if not hasattr(self, '_startup_done'):
            self._startup_done = True
            
            # Clear the log file on startup
            from django.conf import settings
            log_file_path = os.path.join(settings.BASE_DIR, 'logFile.txt')
            
            try:
                with open(log_file_path, 'w', encoding='utf-8') as f:
                    f.write('')
                print(f" Log file cleared on startup: {log_file_path}")
            except Exception as e:
                print(f" Failed to clear log file on startup: {e}")
