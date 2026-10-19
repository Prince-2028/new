
const {
  app,
  BrowserWindow,
  dialog,
  Menu
} = require("electron");

const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const http = require("http");

Menu.setApplicationMenu(null);

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  let backendProcess = null;
  let mainWindow = null;
  let isQuitting = false;
  let startupErrorShown = false;
  let shutdownPromise = null;

  const BACKEND_HOST = "127.0.0.1";
  const BACKEND_PORT = Number(process.env.BACKEND_PORT || 8000);
  const BACKEND_START_TIMEOUT_MS = 60000;
  const BACKEND_CHECK_INTERVAL_MS = 500;

  const APP_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}`;

  let logFile = null;

  // --------------------------------------------------
  // 1. Logging
  // --------------------------------------------------

  function writeLog(message) {
    const line =
      `[${new Date().toISOString()}] ${message}\n`;

    console.log(line.trimEnd());

    if (logFile) {
      try {
        fs.appendFileSync(logFile, line, "utf8");
      } catch (error) {
        console.error("Failed to write log:", error.message);
      }
    }
  }

  function initializeLogging() {
    try {
      const userDataPath = app.getPath("userData");

      fs.mkdirSync(userDataPath, {
        recursive: true
      });

      logFile = path.join(
        userDataPath,
        "backend-debug.log"
      );

      writeLog("========================================");
      writeLog("SmartApp starting");
      writeLog(`App version: ${app.getVersion()}`);
      writeLog(`Packaged: ${app.isPackaged}`);
      writeLog(`Platform: ${process.platform}`);
      writeLog(`Architecture: ${process.arch}`);
      writeLog(`Resources path: ${process.resourcesPath}`);
      writeLog(`Application path: ${app.getAppPath()}`);
      writeLog(`User data path: ${userDataPath}`);
      writeLog(`Backend URL: ${APP_URL}`);
    } catch (error) {
      console.error(
        "Logging initialization failed:",
        error
      );
    }
  }

  // --------------------------------------------------
  // 2. Resolve backend EXE path
  // --------------------------------------------------

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

  // --------------------------------------------------
  // 3. Check backend HTTP readiness
  // --------------------------------------------------

  function checkBackendHttp() {
    return new Promise((resolve, reject) => {
      const request = http.get(
        {
          hostname: BACKEND_HOST,
          port: BACKEND_PORT,
          path: "/",
          timeout: 2000
        },
        (response) => {
          response.resume();

          // Any HTTP response confirms that a server
          // is responding on the configured port.
          resolve(response.statusCode);
        }
      );

      request.on("error", reject);

      request.on("timeout", () => {
        request.destroy(
          new Error("Backend HTTP request timed out")
        );
      });
    });
  }

  // --------------------------------------------------
  // 4. Start Django backend
  // --------------------------------------------------

  function spawnBackend() {
    if (backendProcess) {
      throw new Error(
        "Backend process is already assigned."
      );
    }

    const exePath = getBackendExePath();

    writeLog(`Backend EXE path: ${exePath}`);
    writeLog(`Backend EXE exists: ${fs.existsSync(exePath)}`);

    if (!fs.existsSync(exePath)) {
      throw new Error(
        `Backend EXE not found:\n${exePath}\n\n` +
        "Check Electron build.extraResources configuration."
      );
    }

    const args = [
      "runserver",
      `${BACKEND_HOST}:${BACKEND_PORT}`,
      "--noreload"
    ];

    writeLog(`Backend arguments: ${args.join(" ")}`);
    writeLog(`Backend working directory: ${path.dirname(exePath)}`);

    const child = spawn(exePath, args, {
      cwd: path.dirname(exePath),
      windowsHide: true,
      detached: false,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        PYTHONUNBUFFERED: "1"
      }
    });

    backendProcess = child;

    child.stdout.on("data", (data) => {
      writeLog(
        `[Backend stdout] ${data.toString().trimEnd()}`
      );
    });

    child.stderr.on("data", (data) => {
      writeLog(
        `[Backend stderr] ${data.toString().trimEnd()}`
      );
    });

    child.on("error", (error) => {
      writeLog(
        `[Backend spawn error] ${error.stack || error.message}`
      );
    });

    child.on("exit", (code, signal) => {
      writeLog(
        `Backend exited: code=${code}, signal=${signal}`
      );

      if (backendProcess === child) {
        backendProcess = null;
      }
    });

    writeLog(
      `Backend process spawned. PID: ${child.pid || "unknown"}`
    );

    return child;
  }

  // --------------------------------------------------
  // 5. Wait for backend readiness
  // --------------------------------------------------

  function waitForBackendReady(
    timeout = BACKEND_START_TIMEOUT_MS
  ) {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      let finished = false;
      let retryTimer = null;

      function cleanup() {
        if (retryTimer) {
          clearTimeout(retryTimer);
          retryTimer = null;
        }
      }

      function finish(error) {
        if (finished) return;

        finished = true;
        cleanup();

        if (error) {
          reject(error);
        } else {
          resolve();
        }
      }

      async function checkBackend() {
        if (finished) return;

        if (isQuitting) {
          finish(
            new Error("Application is shutting down.")
          );
          return;
        }

        const child = backendProcess;

        if (!child) {
          finish(
            new Error(
              "Backend process is no longer running. " +
              "Check backend-debug.log."
            )
          );
          return;
        }

        if (child.exitCode !== null || child.signalCode !== null) {
          finish(
            new Error(
              `Backend stopped during startup. ` +
              `Exit code: ${child.exitCode}; ` +
              `signal: ${child.signalCode}.`
            )
          );
          return;
        }

        try {
          const statusCode = await checkBackendHttp();

          if (finished) return;

          writeLog(
            `Backend HTTP response received: ${statusCode}`
          );

          finish();
          return;
        } catch (error) {
          // Server may still be starting.
          if (Date.now() - startTime >= timeout) {
            finish(
              new Error(
                `Backend did not become ready within ` +
                `${timeout / 1000} seconds.\n\n` +
                `Expected URL: ${APP_URL}/\n\n` +
                `Last check error: ${error.message}\n\n` +
                `Log file: ${logFile || "Unavailable"}`
              )
            );
            return;
          }

          retryTimer = setTimeout(
            checkBackend,
            BACKEND_CHECK_INTERVAL_MS
          );
        }
      }

      checkBackend();
    });
  }

  // --------------------------------------------------
  // 6. Create Electron window
  // --------------------------------------------------

  async function createWindow() {
    if (mainWindow || isQuitting) return;

    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    mainWindow.once("ready-to-show", () => {
      if (!isQuitting && mainWindow) {
        mainWindow.show();
      }
    });

    mainWindow.on("closed", () => {
      mainWindow = null;
    });

    try {
      if (app.isPackaged) {
        const indexPath = path.join(
          app.getAppPath(),
          "build",
          "index.html"
        );

        writeLog(`Loading frontend file: ${indexPath}`);

        if (!fs.existsSync(indexPath)) {
          throw new Error(
            `Frontend index.html not found:\n${indexPath}`
          );
        }

        await mainWindow.loadFile(indexPath);
      } else {
        const devURL = "http://localhost:3000";

        writeLog(`Loading development frontend: ${devURL}`);

        await mainWindow.loadURL(devURL);
        mainWindow.webContents.openDevTools();
      }

      writeLog("Frontend loaded successfully.");
    } catch (error) {
      writeLog(
        `Frontend load error: ${error.stack || error.message}`
      );

      dialog.showErrorBox(
        "Frontend Load Error",
        `${error.message}\n\nLog file:\n${logFile || "Unavailable"}`
      );

      throw error;
    }
  }

  // --------------------------------------------------
  // 7. Startup error handler
  // --------------------------------------------------

  async function showStartupError(error) {
    writeLog(
      `Application startup error: ${error.stack || error.message}`
    );

    if (isQuitting || startupErrorShown) return;

    startupErrorShown = true;

    const logLocation = logFile || "Log file unavailable";

    try {
      await dialog.showMessageBox({
        type: "error",
        title: "SmartApp Startup Error",
        message: "SmartApp could not start correctly.",
        detail:
          `${error.message}\n\n` +
          `Diagnostic log:\n${logLocation}`,
        buttons: ["Quit"]
      });
    } finally {
      app.quit();
    }
  }

  // --------------------------------------------------
  // 8. Stop backend gracefully
  // --------------------------------------------------

  function stopBackend() {
    if (shutdownPromise) {
      return shutdownPromise;
    }

    const child = backendProcess;

    if (!child) {
      return Promise.resolve();
    }

    backendProcess = null;

    shutdownPromise = new Promise((resolve) => {
      let settled = false;
      let forceKillTimer = null;

      function finish() {
        if (settled) return;

        settled = true;

        if (forceKillTimer) {
          clearTimeout(forceKillTimer);
        }

        resolve();
      }

      child.once("exit", finish);

      try {
        child.kill();
      } catch (error) {
        writeLog(
          `Backend shutdown error: ${error.message}`
        );

        finish();
        return;
      }

      forceKillTimer = setTimeout(() => {
        if (child.exitCode === null && child.signalCode === null) {
          writeLog(
            "Backend did not exit promptly; requesting forceful termination."
          );

          try {
            child.kill("SIGKILL");
          } catch (error) {
            writeLog(
              `Force termination error: ${error.message}`
            );
          }
        }

        finish();
      }, 3000);

      if (typeof forceKillTimer.unref === "function") {
        forceKillTimer.unref();
      }

      if (child.exitCode !== null || child.signalCode !== null) {
        finish();
      }
    });

    return shutdownPromise;
  }

  // --------------------------------------------------
  // 9. Application startup
  // --------------------------------------------------

  app.whenReady().then(async () => {
    initializeLogging();

    try {
      if (isQuitting) return;

      spawnBackend();

      await waitForBackendReady();

      if (isQuitting) return;

      await createWindow();
    } catch (error) {
      await showStartupError(error);
    }
  });

  // --------------------------------------------------
  // 10. Single-instance handling
  // --------------------------------------------------

  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }

      mainWindow.show();
      mainWindow.focus();
    }
  });

  // --------------------------------------------------
  // 11. Application shutdown
  // --------------------------------------------------

  app.on("before-quit", (event) => {
    isQuitting = true;

    if (backendProcess && !shutdownPromise) {
      event.preventDefault();

      stopBackend().finally(() => {
        app.quit();
      });
    }
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}
