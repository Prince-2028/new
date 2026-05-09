# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_all

datas = [('db.sqlite3', '.'), ('static', 'static'), ('meter1', 'meter1'), ('C:\\Users\\AVC\\Desktop\\DLMS_app\\.venv\\Lib\\site-packages\\gurux_dlms\\OBISCodes.txt', 'gurux_dlms')]
binaries = []
hiddenimports = ['rest_framework.permissions', 'rest_framework.authentication', 'coloredlogs', 'rest_framework.views', 'rest_framework.parsers', 'rest_framework.schemas', 'rest_framework.renderers', 'rest_framework.exceptions', 'rest_framework.negotiation', 'rest_framework.metadata']
tmp_ret = collect_all('django')
datas += tmp_ret[0]; binaries += tmp_ret[1]; hiddenimports += tmp_ret[2]
tmp_ret = collect_all('gurux_dlms')
datas += tmp_ret[0]; binaries += tmp_ret[1]; hiddenimports += tmp_ret[2]


a = Analysis(
    ['start_server.py'],
    pathex=[],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='SmartAppBackend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
