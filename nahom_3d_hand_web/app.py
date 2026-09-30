from flask import Flask, render_template, jsonify
import time

app = Flask(__name__)

@app.get("/")
def index():
    return render_template("index.html")

@app.get("/api/status")
def status():
    return jsonify({
        "server": "online",
        "python": True,
        "time": time.strftime("%H:%M:%S")
    })

if __name__ == "__main__":
    print("NAHOM 3D HAND WEB")
    print("Open http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=False)
