# NAHOM 3D HAND WEB

A full web 3D hand-controller project using:

- HTML
- CSS
- JavaScript
- Three.js
- MediaPipe Hand Landmarker
- Python Flask

## 1. Install Python

Use Python 3.12+ if possible.

## 2. Install Flask

Open Command Prompt in this folder:

    py -m pip install -r requirements.txt

## 3. Start the website

    py app.py

## 4. Open it

Open:

    http://127.0.0.1:5000

## Controls

OPEN HAND:
- Move hand left/right -> rotate 3D object
- Move hand up/down -> rotate and move object

PINCH:
- Zoom

FIST:
- Pause hand movement

MOUSE:
- Drag -> rotate
- Wheel -> zoom

## Camera

Click ENABLE CAMERA and allow camera permission in Edge/Chrome.

The bottom/right camera panel draws the MediaPipe 21-point hand skeleton.

The page also works as a normal Three.js 3D viewer if camera permission is unavailable.

## Important

The browser must have internet access the first time because Three.js and the MediaPipe model are loaded from CDN/Google storage.
