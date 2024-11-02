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


## ⚙️ Starting the app (for development)

### 1. Electron

```bash
cd electron_gui

# Install the required packages
npm install

# Launch the Electron app
npm start --enable-logging
```


### 2. Python

#### Option 1 (recommended) - With Anaconda

Download [Anaconda](https://www.anaconda.com/download/success).

For Windows users, if conda is not recognized as a command by the terminal, add `C:\ProgramData\anaconda3\Scripts` to the user's Path environment variables.

```bash
cd python_server

# Create the virtual environment and install the packages with conda
conda env create --file environment.yml --prefix ./ldtvenv

# Activate the virtual environment
conda activate .\ldtvenv
```

#### Option 2 (untested) - With pip

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

# Install PaddleOCR
pip install paddlepaddle-gpu==3.0.0b1 -i https://www.paddlepaddle.org.cn/packages/stable/cu118/

# Install the rest of the packages
pip install -r requirements.txt
```


## 💾 Packaging the application

Start by bundling the Python application and its dependencies into a single executable that can be run by the user without installing Python.
We'll use [PyInstaller](https://pyinstaller.org/en/stable/):
```bash
cd python_server
pyinstaller --onefile server.py
```

**Currently, you need to copy the generated file `python_server\dist\server.exe` into `electron_gui\assets\`.**

Then, we'll create the Electron executable using [electron-forge](https://www.electronforge.io/):
```bash
cd electron_gui
npm run make
```

You'll find the resulting application in a path similar to `electron_gui\out\live_desktop_translator-win32-x64` (the last folder depends on your system's architecture).

## ⚖️ License

ToDo
