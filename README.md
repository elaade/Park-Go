# Park&Go - Aplicație web pentru gestionarea unei parcări inteligente

## Descriere proiect

Park&Go este o aplicație web pentru gestionarea unei parcări inteligente. Aplicația permite utilizatorilor să realizeze rezervări, să achiziționeze abonamente, iar administratorul poate gestiona utilizatorii, vehiculele, locurile de parcare și istoricul accesului.

Accesul în parcare este verificat pe baza numărului de înmatriculare, folosind un modul Python pentru detecția și recunoașterea numărului auto.

## Structura proiectului

Park&Go
|-- Frontend
|   |-- public
|   |-- src
|   |-- package.json
|   |-- package-lock.json
|
|-- Backend
|   |-- fișiere PHP pentru autentificare, rezervări, abonamente și administrare
|   |-- db_config.example.php
|
|-- Python_Recunoaștere număr de înmatriculare
|   |-- app.py
|   |-- best.pt
|
|-- Baza de date
|   |-- script.sql
|
|-- README.md

## Tehnologii utilizate

- React pentru interfața web;
- PHP pentru backend;
- SQL Server pentru baza de date;
- Python, YOLO și EasyOCR pentru detecția și recunoașterea numerelor de înmatriculare;
- XAMPP pentru rularea locală a backend-ului PHP.

## Pași de instalare

### 1. Instalare frontend

Pentru rularea interfeței este necesar Node.js.

Se intră în folderul frontend și se instalează dependențele:

cd frontend
npm install

### 2. Instalare backend

Pentru backend este necesar XAMPP.

Pași:
1. Se instalează XAMPP.
2. Se pornește Apache din XAMPP Control Panel.
3. Fișierele PHP din folderul backend se copiază în folderul:

C:\xampp\htdocs

sau într-un subfolder din htdocs, în funcție de configurarea locală.

### 3. Configurare conexiune bază de date

Fișierul real db_config.php nu este inclus în repository, deoarece conține date locale de conectare.

Se copiază fișierul:

Backend/db_config.example.php

și se redenumește în:

db_config.php

Apoi se completează datele locale de conectare la SQL Server:

'''<?php
return [
    "serverName" => "localhost",
    "database" => "ParkingAccessDB",
    "username" => "YOUR_USERNAME",
    "password" => "YOUR_PASSWORD"
];'''

### 4. Instalare bază de date

Pentru baza de date este necesar SQL Server.

Pași:
1. Se deschide SQL Server Management Studio.
2. Se rulează scriptul SQL din folderul:

Baza de date/script.sql

3. Scriptul creează baza de date ParkingAccessDB și tabelele necesare aplicației.

### 5. Instalare modul Python

Pentru modulul de detecție și recunoaștere a numerelor de înmatriculare este necesar Python.

Se intră în folderul python:

cd python

Se instalează bibliotecile necesare:

pip install flask flask-cors ultralytics easyocr opencv-python numpy requests imageio-ffmpeg

Fișierul best.pt trebuie să fie în același folder cu app.py, deoarece acesta reprezintă modelul YOLO folosit pentru detecția numerelor de înmatriculare.

## Pași de compilare

### Frontend

Pentru proiectul React, aplicația se poate rula local în modul development cu npm start. În configurația acestui proiect, comanda npm start pornește atât interfața React, cât și modulul Python pentru OCR.

Pentru generarea variantei de producție a interfeței React, se poate rula comanda:

cd frontend
npm run build

Această comandă generează folderul build, care conține varianta optimizată a interfeței. Folderul build nu este inclus în repository, deoarece poate fi generat local.

### Backend

Backend-ul este realizat în PHP și nu necesită compilare. Fișierele PHP sunt interpretate direct de serverul Apache.

### Modul Python

Modulul Python nu necesită compilare. În configurația proiectului, acesta este lansat automat împreună cu frontend-ul prin comanda npm start.

## Pași de lansare a aplicației

### 1. Pornire backend

Se pornește Apache din XAMPP Control Panel.

Dacă fișierele PHP sunt copiate direct în htdocs, backend-ul este disponibil la:

http://localhost/

### 2. Pornire bază de date

Se pornește SQL Server și se verifică existența bazei de date:

ParkingAccessDB

### 3. Pornire aplicație

În folderul frontend, aplicația se lansează cu:

npm start

Această comandă pornește interfața React și modulul Python pentru detecția și recunoașterea numerelor de înmatriculare.

Aplicația React se deschide în browser la adresa:

http://localhost:3000

Modulul Python rulează local pe portul:

http://localhost:5000

## Observații

În fișierul Python_Recunoaștere număr de înmatriculare/app.py, modulul Python trimite numărul de înmatriculare detectat către backend-ul PHP prin URL-uri locale.

Dacă backend-ul este copiat direct în htdocs, URL-urile pot rămâne de forma:

PHP_VERIFY_URL = "http://localhost/verify_plate.php"
PHP_EXIT_URL = "http://localhost/exit_vehicle.php"

Dacă backend-ul este copiat într-un subfolder, de exemplu parkgo-backend, aceste URL-uri trebuie adaptate astfel:

PHP_VERIFY_URL = "http://localhost/parkgo-backend/verify_plate.php"
PHP_EXIT_URL = "http://localhost/parkgo-backend/exit_vehicle.php"

## Fișiere care nu sunt incluse

Repository-ul nu include fișiere generate automat sau fișiere locale, cum ar fi:

node_modules
build
venv
__pycache__
.vs
db_config.php
fișiere .mdf
fișiere .ldf
fișiere .bak

Acestea pot fi regenerate sau configurate local conform pașilor de instalare.