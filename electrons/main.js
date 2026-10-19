
const { app, BrowserWindow, dialog, Menu } = require("electron");
const path = require("path");
const { spawn, exec } = require("child_process");
const http = require("http");

Menu.setApplicationMenu(null);

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  let backendProcess = null;
  let mainWindow = null;
  let isQuitting = false;

  const BACKEND_HOST = "127.0.0.1";
  const BACKEND_PORT = Number(process.env.BACKEND_PORT || 8000);
  const BACKEND_START_TIMEOUT_MS = 60000;

  // Get backend EXE path
  function getBackendExePath() {
    if (app.isPackaged) {
      return path.join(
        process.resourcesPath,
        "backend",
        "SmartAppBackend.exe"
      );
    }

    return path.join(
      __dirname,
      "backend",
      "SmartAppBackend.exe"
    );
  }

  // Kill an old backend process before starting a new one
  function killOldBackend() {
    return new Promise((resolve) => {
      exec(
        'taskkill /F /T /IM SmartAppBackend.exe',
        (error) => {
          if (error) {
            console.log("No old backend process found.");
          } else {
            console.log("Old backend process stopped.");
          }

          resolve();
        }
      );
    });
  }

  // Start Django backend EXE
  function spawnBackend() {
    if (backendProcess) {
      return;
    }

    const exePath = getBackendExePath();

    console.log("Backend EXE path:", exePath);

    const args = [
      "runserver",
      `${BACKEND_HOST}:${BACKEND_PORT}`,
      "--noreload"
    ];

    console.log("Backend arguments:", args);

    try {
      backendProcess = spawn(exePath, args, {
        cwd: path.dirname(exePath),
        windowsHide: true,
        detached: false,
        stdio: ["ignore", "pipe", "pipe"]
      });

      backendProcess.stdout.on("data", (data) => {
        console.log("[Backend stdout]", data.toString());
      });

      backendProcess.stderr.on("data", (data) => {
        console.error("[Backend stderr]", data.toString());
      });

      backendProcess.on("error", (error) => {
        console.error("Backend spawn error:", error);

        dialog.showErrorBox(
          "Backend Start Error",
          `Unable to start backend EXE:\n${error.message}`
        );

        backendProcess = null;
      });

      backendProcess.on("exit", (code, signal) => {
        console.log(
          `Backend exited: code=${code}, signal=${signal}`
        );

        backendProcess = null;
      });
    } catch (error) {
      console.error("Backend start exception:", error);

      backendProcess = null;

      dialog.showErrorBox(
        "Backend Error",
        error.message
      );
    }
  }

  // Check whether the backend responds on its port
  function waitForBackendReady(
    timeout = BACKEND_START_TIMEOUT_MS
  ) {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      let completed = false;
      let retryTimer = null;

      function finish(error) {
        if (completed) return;

        completed = true;

        if (retryTimer) {
          clearTimeout(retryTimer);
        }

        if (error) {
          reject(error);
        } else {
          resolve();
        }
      }

      function checkBackend() {
        if (completed) return;

        if (isQuitting) {
          finish(new Error("Application is shutting down."));
          return;
        }

        if (!backendProcess) {
          finish(
            new Error(
              "Backend process is not running. Check backend logs."
            )
          );
          return;
        }

        const req = http.get(
          {
            hostname: BACKEND_HOST,
            port: BACKEND_PORT,
            path: "/",
            timeout: 2000
          },
          (res) => {
            // Any HTTP response means the server is reachable.
            res.resume();
            finish();
          }
        );

        req.on("error", () => {
          retry();
        });

        req.on("timeout", () => {
          req.destroy();
          retry();
        });
      }

      function retry() {
        if (completed) return;

        if (Date.now() - startTime >= timeout) {
          finish(
            new Error(
              `Backend did not start within ${timeout / 1000} seconds.\n\n` +
              `Expected URL: http://${BACKEND_HOST}:${BACKEND_PORT}/\n\n` +
              "Check the backend stdout/stderr logs."
            )
          );
          return;
        }

        retryTimer = setTimeout(checkBackend, 500);
      }

      checkBackend();
    });
  }

  // Create the application window
  function createWindow() {
    if (mainWindow) {
      return;
    }

    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    if (app.isPackaged) {
      const indexPath = path.join(
        app.getAppPath(),
        "build",
        "index.html"
      );

      console.log("Loading frontend:", indexPath);

      mainWindow.loadFile(indexPath).catch((error) => {
        console.error("Frontend load error:", error);

        dialog.showErrorBox(
          "Frontend Load Error",
          `Failed to load React frontend:\n${error.message}`
        );
      });
    } else {
      mainWindow.loadURL("http://localhost:3000").catch((error) => {
        console.error("Development frontend error:", error);

        dialog.showErrorBox(
          "Frontend Error",
          `Could not load http://localhost:3000\n\n${error.message}`
        );
      });

      mainWindow.webContents.openDevTools();
    }

    mainWindow.on("closed", () => {
      mainWindow = null;
    });
  }

  // Application startup
  app.whenReady().then(async () => {
    try {
      await killOldBackend();

      if (isQuitting) return;

      spawnBackend();

      await waitForBackendReady();

      if (!isQuitting) {
        createWindow();
      }
    } catch (error) {
      console.error("Application startup error:", error);

      if (isQuitting) return;

      dialog.showMessageBox({
        type: "error",
        title: "Application Startup Error",
        message: error.message,
        detail:
          "The backend could not be started. Check the backend EXE path and logs.",
        buttons: ["Quit"]
      }).then(() => {
        app.quit();
      });
    }
  });

  // Bring existing window to the front
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }

      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Stop backend before Electron exits
  function stopBackend() {
    if (backendProcess) {
      const processToStop = backendProcess;
      backendProcess = null;

      try {
        processToStop.kill();
      } catch (error) {
        console.error("Error stopping backend:", error);
      }
    }
  }

  app.on("before-quit", () => {
    isQuitting = true;
    stopBackend();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}
