import React, { useState, useEffect, useCallback } from "react";
import "./Manufacturer.css";
import BASE_URL from "../../apiConfig";

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */
const GENERATE_SERIAL_URL = `${BASE_URL}/api/step2-generate-serial/`;

// Default password for the manufacturer. Changed after first login.
const DEFAULT_PASSWORD = "Manufacturer@123";
const PWD_KEY = "mfr_pwd_hash"; // localStorage -> hashed current password
const AUTH_KEY = "mfr_auth"; //     sessionStorage -> logged-in flag

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
async function sha256(text) {
  try {
    const buf = await window.crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(text)
    );
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch (e) {
    // crypto.subtle is only available on https / localhost
    return btoa(unescape(encodeURIComponent(text)));
  }
}

// Backend response shape is not fixed, so read the common keys.
function extractSerial(data) {
  if (!data) return "";
  if (typeof data === "string") return data;
  return (
    data.serial_number ||
    data.serial ||
    data.serialNumber ||
    (data.data && (data.data.serial_number || data.data.serial)) ||
    ""
  );
}

function extractError(data, fallback) {
  if (!data) return fallback;
  if (typeof data === "string") return data;
  return data.error || data.detail || data.message || fallback;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
export default function Manufacturer() {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem(AUTH_KEY) === "1"
  );
  const [tab, setTab] = useState("serial"); // "serial" | "password"
  const [isDefault, setIsDefault] = useState(false);

  /* login */
  const [loginPwd, setLoginPwd] = useState("");
  const [loginErr, setLoginErr] = useState("");

  /* generate serial */
  const [userCode, setUserCode] = useState("");
  const [serial, setSerial] = useState("");
  const [serialErr, setSerialErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);

  /* change password */
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdMsg, setPwdMsg] = useState({ type: "", text: "" });

  const [menuOpen, setMenuOpen] = useState(false);

  /* Seed the default password on first run and detect if still default */
  const refreshDefaultFlag = useCallback(async () => {
    const stored = localStorage.getItem(PWD_KEY);
    const defHash = await sha256(DEFAULT_PASSWORD);
    if (!stored) localStorage.setItem(PWD_KEY, defHash);
    setIsDefault(!stored || stored === defHash);
  }, []);

  useEffect(() => {
    refreshDefaultFlag();
  }, [refreshDefaultFlag]);

  /* ---------------------------- Login ---------------------------- */
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginErr("");
    const stored = localStorage.getItem(PWD_KEY) || (await sha256(DEFAULT_PASSWORD));
    if ((await sha256(loginPwd)) === stored) {
      sessionStorage.setItem(AUTH_KEY, "1");
      setAuthed(true);
      setLoginPwd("");
      await refreshDefaultFlag();
    } else {
      setLoginErr("Incorrect password. Try again.");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(AUTH_KEY);
    setAuthed(false);
    setSerial("");
    setUserCode("");
    setTab("serial");
    setMenuOpen(false);
  };

  /* ------------------------ Generate serial ---------------------- */
  const handleGenerate = async (e) => {
    e.preventDefault();
    const code = userCode.trim();
    if (!code) {
      setSerialErr("Enter the user code given by the client.");
      return;
    }
    setLoading(true);
    setSerialErr("");
    setSerial("");
    setCopied(false);
    try {
      const res = await fetch(GENERATE_SERIAL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ "user_code": code }),
      });
      let data = null;
      try {
        data = await res.json();
      } catch (_) {
        /* non-JSON body */
      }
      if (!res.ok) throw new Error(extractError(data, `Request failed (${res.status}).`));
      const sn = extractSerial(data);
      if (!sn) throw new Error("Server did not return a serial number.");
      setSerial(sn);
      setHistory((h) => [{ code, serial: sn }, ...h].slice(0, 10));
    } catch (err) {
      setSerialErr(err.message || "Could not generate the serial number.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(serial);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (_) {
      setSerialErr("Copy failed. Select the serial number and copy it manually.");
    }
  };

  /* ----------------------- Change password ----------------------- */
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMsg({ type: "", text: "" });

    const stored = localStorage.getItem(PWD_KEY);
    if ((await sha256(oldPwd)) !== stored)
      return setPwdMsg({ type: "error", text: "Current password is incorrect." });
    if (newPwd.length < 8)
      return setPwdMsg({ type: "error", text: "New password must be at least 8 characters." });
    if (newPwd === DEFAULT_PASSWORD)
      return setPwdMsg({ type: "error", text: "Choose a password different from the default." });
    if (newPwd !== confirmPwd)
      return setPwdMsg({ type: "error", text: "New password and confirmation do not match." });

    localStorage.setItem(PWD_KEY, await sha256(newPwd));
    setOldPwd("");
    setNewPwd("");
    setConfirmPwd("");
    setIsDefault(false);
    setPwdMsg({ type: "success", text: "Password changed." });
  };

  const selectTab = (t) => {
    setTab(t);
    setMenuOpen(false);
  };

  /* ============================ Render ============================ */

  /* ---- Login screen (manufacturer only) ---- */
  if (!authed) {
    return (
      <div className="mfr-root">
        <header className="mfr-topbar">
          <div className="mfr-brand">avicon</div>
        </header>
        <main className="mfr-login-wrap">
          <form className="mfr-card mfr-login" onSubmit={handleLogin} noValidate>
            <h1 className="mfr-title">Manufacturer login</h1>
            <p className="mfr-muted">Only the manufacturer can generate serial numbers.</p>

            <label className="mfr-label" htmlFor="mfr-login-pwd">Password</label>
            <input
              id="mfr-login-pwd"
              className="mfr-input"
              type="password"
              autoComplete="current-password"
              value={loginPwd}
              onChange={(e) => setLoginPwd(e.target.value)}
              autoFocus
            />
            {loginErr && <div className="mfr-alert mfr-alert-error" role="alert">{loginErr}</div>}

            <button className="mfr-btn mfr-btn-primary" type="submit" disabled={!loginPwd}>
              Log in
            </button>
          </form>
        </main>
      </div>
    );
  }

  /* ---- Authorised screen ---- */
  return (
    <div className="mfr-root">
      <header className="mfr-topbar">
        <div className="mfr-brand">avicon</div>

        <button
          className="mfr-burger"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span /><span /><span />
        </button>

        <nav className={`mfr-nav ${menuOpen ? "is-open" : ""}`}>
          <button
            className={`mfr-nav-item ${tab === "serial" ? "is-active" : ""}`}
            onClick={() => selectTab("serial")}
          >
            Generate serial
          </button>
          <button
            className={`mfr-nav-item ${tab === "password" ? "is-active" : ""}`}
            onClick={() => selectTab("password")}
          >
            Change password
          </button>
          <button className="mfr-nav-item" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </header>

      <div className="mfr-layout">
        {/* Left menu, same pattern as the meter UI */}
        <aside className="mfr-side">
          <button
            className={`mfr-side-item ${tab === "serial" ? "is-active" : ""}`}
            onClick={() => selectTab("serial")}
          >
            <input type="checkbox" readOnly checked={tab === "serial"} tabIndex={-1} />
            Generate serial
          </button>
          <button
            className={`mfr-side-item ${tab === "password" ? "is-active" : ""}`}
            onClick={() => selectTab("password")}
          >
            <input type="checkbox" readOnly checked={tab === "password"} tabIndex={-1} />
            Change password
          </button>
        </aside>

        <main className="mfr-main">
          {isDefault && (
            <div className="mfr-alert mfr-alert-warn" role="status">
              You are using the default password. Change it before you continue.
              <button className="mfr-link" onClick={() => selectTab("password")}>
                Change password
              </button>
            </div>
          )}

          {/* ------------------- Generate serial ------------------- */}
          {tab === "serial" && (
            <section className="mfr-card">
              <h1 className="mfr-title">Generate serial number</h1>
              <p className="mfr-muted">
                Enter the user code received from the client. The serial number
                returned here goes back to the client.
              </p>

              <form className="mfr-row" onSubmit={handleGenerate} noValidate>
                <div className="mfr-field">
                  <label className="mfr-label" htmlFor="mfr-user-code">User code</label>
                  <input
                    id="mfr-user-code"
                    className="mfr-input"
                    type="text"
                    value={userCode}
                    onChange={(e) => setUserCode(e.target.value)}
                    autoComplete="off"
                    spellCheck="false"
                  />
                </div>
                <button
                  className="mfr-btn mfr-btn-primary"
                  type="submit"
                  disabled={loading || !userCode.trim()}
                >
                  {loading ? "Generating…" : "Generate serial"}
                </button>
              </form>

              {serialErr && <div className="mfr-alert mfr-alert-error" role="alert">{serialErr}</div>}

              {serial && (
                <div className="mfr-result" aria-live="polite">
                  <span className="mfr-label">Serial number</span>
                  <div className="mfr-result-box">
                    <code>{serial}</code>
                    <button className="mfr-btn mfr-btn-small" onClick={handleCopy}>
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              )}

              {history.length > 0 && (
                <div className="mfr-table-wrap">
                  <table className="mfr-table">
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>User code</th>
                        <th>Serial number</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((h, i) => (
                        <tr key={`${h.code}-${i}`}>
                          <td>{i + 1}</td>
                          <td>{h.code}</td>
                          <td>{h.serial}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* ------------------- Change password ------------------- */}
          {tab === "password" && (
            <section className="mfr-card">
              <h1 className="mfr-title">Change password</h1>
              <p className="mfr-muted">Use at least 8 characters.</p>

              <form className="mfr-form" onSubmit={handleChangePassword} noValidate>
                <label className="mfr-label" htmlFor="mfr-old">Current password</label>
                <input
                  id="mfr-old"
                  className="mfr-input"
                  type="password"
                  autoComplete="current-password"
                  value={oldPwd}
                  onChange={(e) => setOldPwd(e.target.value)}
                />

                <label className="mfr-label" htmlFor="mfr-new">New password</label>
                <input
                  id="mfr-new"
                  className="mfr-input"
                  type="password"
                  autoComplete="new-password"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                />

                <label className="mfr-label" htmlFor="mfr-confirm">Confirm new password</label>
                <input
                  id="mfr-confirm"
                  className="mfr-input"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                />

                {pwdMsg.text && (
                  <div
                    className={`mfr-alert ${pwdMsg.type === "error" ? "mfr-alert-error" : "mfr-alert-ok"}`}
                    role={pwdMsg.type === "error" ? "alert" : "status"}
                  >
                    {pwdMsg.text}
                  </div>
                )}

                <button
                  className="mfr-btn mfr-btn-primary"
                  type="submit"
                  disabled={!oldPwd || !newPwd || !confirmPwd}
                >
                  Save password
                </button>
              </form>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}