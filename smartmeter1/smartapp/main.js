// main.js
const { app, BrowserWindow, dialog, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
let backendProcess = null;
// remove default app menu completely

//app.setAppUserModelId("SmartApp");  // Windows stability
const { exec } = require('child_process');
Menu.setApplicationMenu(null);

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0); // ✅ add this
}

function killOldBackend() {
  return new Promise((resolve) => {
    exec('taskkill /F /IM SmartAppBackend.exe', (err) => {
      if (err) console.log("No old backend running");
      else console.log("Old backend killed");
      resolve();
    });
  });
}

let mainWindow = null;   // add this





const BACKEND_PORT = process.env.BACKEND_PORT || 8000; // adjust if backend uses different port
const BACKEND_START_TIMEOUT_MS = 300000; // how long to wait for backend to report ready

function getBackendExePath() {
  // When packaged, use resourcesPath; in dev use local backend folder
  if (app.isPackaged) {
    // We assume backend exe is included under resources (see package.json files config)
    return path.join(process.resourcesPath, 'backend', 'SmartAppBackend.exe');
  } else {
    // dev path - relative to main.js
    return path.join(__dirname, 'backend', 'SmartAppBackend.exe');
  }
}

function spawnBackend() {

   if (backendProcess) return; //new added $
  
  const exe = getBackendExePath();
  console.log('Starting backend exe:', exe);

  try {
    // spawn the backend. windowsHide prevents a visible console window on Windows.
    backendProcess = spawn(exe, [], {
      detached: false,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    backendProcess.stdout && backendProcess.stdout.on('data', (d) => {
      console.log('[backend stdout]', d.toString());
    });
    backendProcess.stderr && backendProcess.stderr.on('data', (d) => {
      console.error('[backend stderr]', d.toString());
    });

    backendProcess.on('exit', (code, signal) => {
      console.log(`Backend exited with code ${code} signal ${signal}`);
      backendProcess = null;
    });

  } catch (err) {
    console.error('Failed to spawn backend exe:', err);
    dialog.showErrorBox('Backend start error', `Failed to start backend: ${err.message}`);
    backendProcess = null;
  }
}






function killBackend() {
  if (backendProcess) {
    try {
      backendProcess.kill('SIGTERM');
    } catch (e) {
      console.log("Error killing backend:", e);
    }
  }

  // extra safety → kill ALL
  exec('taskkill /F /IM SmartAppBackend.exe');
}


function waitForBackendReady(host = '127.0.0.1', port = BACKEND_PORT, timeout = BACKEND_START_TIMEOUT_MS) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const req = http.request(
        {
          hostname: host,
          port: port,
          path: '/',
          method: 'GET',
          timeout: 2000,
        },
        (res) => {
          // backend answered — we consider it ready if any response is returned
          resolve();
        }
      );
      req.on('error', (err) => {
        if (Date.now() - start >= timeout) {
          reject(new Error('Timeout waiting for backend to start'));
        } else {
          setTimeout(tryOnce, 300);
        }
      });
      req.on('timeout', () => {
        req.destroy();
        if (Date.now() - start >= timeout) {
          reject(new Error('Timeout waiting for backend to start (timeout)'));
        } else {
          setTimeout(tryOnce, 300);
        }
      });
      req.end();
    };

    tryOnce();
  });
}

function createWindow() {

  if (mainWindow) return;   // prevent double window
 
  mainWindow  = new BrowserWindow({
    width: 1200,
    height: 800,
   
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load URL depending on dev vs packaged
  if (app.isPackaged) {
    const indexPath = path.join(__dirname, 'build', 'index.html'); // packaged build will be here
    mainWindow.loadFile(indexPath).catch((err) => {
      console.error('Failed to load file index:', err);
      dialog.showErrorBox('Load error', `Failed to load UI: ${err.message}`);
    });
  } else {
    // development mode: assumes react dev server running at 3000
    mainWindow.loadURL('http://localhost:3000').catch((err) => {
      console.error('Failed to load URL http://localhost:3000', err);
      dialog.showErrorBox('Load error', `Failed to load dev UI: ${err.message}`);
    });
    mainWindow.webContents.openDevTools();
  }

 mainWindow.on('closed', () => {
    mainWindow = null;
  });

}

 app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });



app.on('ready', async () => {

 

 

  

  await killOldBackend();
  spawnBackend();

  try {
    await waitForBackendReady('127.0.0.1', BACKEND_PORT, BACKEND_START_TIMEOUT_MS);
    createWindow();
  } catch (err) {
    const choice = dialog.showMessageBoxSync({
      type: 'error',
      buttons: ['Quit', 'Continue'],
      message: err.message
    });

    if (choice === 0) app.quit();
    else createWindow();
  }
});

// Quit handling: close backend before exit
app.on('before-quit', () => {
  killBackend();
});

// when all windows closed on Windows quit the app
app.on('window-all-closed', () => {
  // do not quit immediately because before-quit will handle backend termination
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  killBackend();
});

