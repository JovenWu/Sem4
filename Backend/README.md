# Semester 4 Project
django api with djangorestframework

## Setup Instructions
becuase we're using mysql. first you need to confirm the version of MariaDb is 1.4. and create a database name `dbinventory`.

1. **Create a virtual environment:**
   ```bash
   python -m venv venv
   ```

2. **Activate the virtual environment:**
   - On Windows:
     ```bash
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

3. **Install all requirements:**
   ```bash
   pip install -r requirements.txt
   ```

4. **(Optional) Create a `manage.bat` file inside `venv\Scripts\` with the following content:**
   ```bat
   @echo off
   if exist manage.py (
       python manage.py %*
   ) else (
       echo "manage.py not found in the current directory."
       exit /b 1
   )
   ```
   > With this, you can use `manage` instead of `python manage.py` for Django commands.

5. **Run Django management commands:**
   ```bash
   manage makemigrations
   manage migrate
   manage runserver
   ```

   Or, if you don't use `manage.bat`:
   ```bash
   py manage.py makemigrations
   py manage.py migrate
   py manage.py runserver
   ```
