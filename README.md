<h1 align="center">
  Live Desktop Translator
</h1>


<p align="center">
  ToDo short description
</p>

<div align="center">
    
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
</div>


## 🔍 Overview

ToDo


## ⚙️ Installation

### 1. Electron

```bash
cd electron_gui

# Install the required packages
npm install

# Launch the Electron app
npm start
```

If you also want to display chromium's internal logs, launch the Electron app with:

```bash
cd electron_gui
electron-forge start --enable-logging
```


### 2. Python

Download [Python 3.12.7](https://www.python.org/downloads/release/python-3127/) (don't forget to add it to the PATH during install).

```bash
cd python_server

# Create the empty virtual environment
py -3.12 -m venv ldtvenv

# Activate the virtual environment
# On windows:
  .\ldtvenv\Scripts\activate
# On linux:
  source ldtvenv/bin/activate

# Install pytorch
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118

# Install the rest of the packages
pip install -r requirements.txt
```

To bundle the Python application and its dependencies into a single executable that can be run by the user without installing Python, we use [PyInstaller](https://pyinstaller.org/en/stable/).

```bash
cd python_server
pyinstaller --onefile server.py
```


## ⚖️ License

ToDo
