
#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""

import os
import sys
import logging

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)


def main():
    """Run administrative tasks."""

    os.environ.setdefault(
        "DJANGO_SETTINGS_MODULE",
        "smartmeter1.settings"
    )

    # Fix Django autoreloader issue inside PyInstaller EXE.
    # Frozen EXE cannot restart runserver like a normal Python script.
    if getattr(sys, "frozen", False) and len(sys.argv) > 1:
        if sys.argv[1] == "runserver":
            if "--noreload" not in sys.argv:
                sys.argv.append("--noreload")

    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed "
            "and available on your PYTHONPATH environment variable? "
            "Did you forget to activate a virtual environment?"
        ) from exc

    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
