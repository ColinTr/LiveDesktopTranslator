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
# Install the required packages
npm install

# Launch the Electron app
npm start
```

If you also want to display chromium's internal logs, launch the Electron app with:

```bash
electron-forge start --enable-logging
```


### 2. Python

Download [Python 3.12.7](https://www.python.org/downloads/release/python-3127/) (don't forget to add it to the PATH during install).

```bash
cd python

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



## ⚖️ License

ToDo
