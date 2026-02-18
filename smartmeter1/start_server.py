import sys
import os

# Ensure stdout/stderr are valid
if sys.stdout is None:
    sys.stdout = open(os.devnull, "w")
if sys.stderr is None:
    sys.stderr = open(os.devnull, "w")


from django.core.management import execute_from_command_line

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "smartmeter1.settings")

    sys.argv = ["manage.py", "runserver", "0.0.0.0:8000", "--noreload", "--nothreading"]
    execute_from_command_line(sys.argv)

