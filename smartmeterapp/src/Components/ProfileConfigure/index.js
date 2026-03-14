import React, { useState,useEffect,useRef,useMemo} from 'react';
import axios from 'axios';
import BASE_URL from '../../apiConfig'; // Adjust path based on your file structure
import './index.css'

const ProfileConfigurator = () => {    
 


const [retrieveResponse, setRetrieveResponse] = useState(null);

console.log("retrieveResponse",retrieveResponse)
  


const InstantaneousCategories = [
  {
    name: 'Instantaneous Values',
    items: [
      { name: 'Instantaneous voltage L1', code: '3,1-0:32.7.0.255' },
      { name: 'Average Instantaneous voltage L1', code: '3,1-0:32.24.0.255' },
      { name: 'Instantaneous current L1', code: '3,1-0:31.7.0.255' },
      { name: 'Instantaneous current L0', code: '3,1-0:91.7.0.255' },
      { name: 'Average current L1', code: '3,1-0:31.24.0.255' },
      { name: 'Sliding average current L1', code: '5,1-0:31.4.0.255' },
      { name: 'Instantaneous import active power (+A)', code: '3,1-0:1.7.0.255' },
      { name: 'Instantaneous export active power (-A)', code: '3,1-0:1.7.0.255' },
      { name: 'Instantaneous active power (|+A| + |-A|)', code: '3,1-0:2.7.0.255' },
      { name: 'Instantaneous import reactive power (+R)', code: '3,1-0:3.7.0.255' },
      { name: 'Instantaneous export reactive power (-R)', code: '3,1-0:4.7.0.255' },
      { name: 'Instantaneous reactive power (|+R| + |-R|)', code: '3,1-0:128.7.0.255' },
      { name: 'Instantaneous import apparent power (+VA)', code: '3,1-0:9.7.0.255' },
      { name: 'Instantaneous export apparent power (-VA)', code: '3,1-0:10.7.0.255' },
      { name: 'Instantaneous apparent power (|+VA| + |-VA|)', code: '3,1-0:10.7.0.255' },
      { name: 'Instantaneous power factor (|+A| / |+VA|)', code: '3,1-0:13.7.0.255' },
      { name: 'Instant supply frequency', code: '3,1-0:14.7.0.255' },
    ],
  },
];



// updated energy register categories (same items you provided, kept structure)
const EnergyRegisterCategories = [
  {
    name: 'Active Energy Register',
    items: [
      { name: 'Active energy import (+A)', code: '3,1-0:1.8.0.255' },
      { name: 'Active energy import (+A) rate 1', code: '3,1-0:1.8.1.255' },
      { name: 'Active energy import (+A) rate 2', code: '3,1-0:1.8.2.255' },
      { name: 'Active energy import (+A) rate 3', code: '3,1-0:1.8.3.255' },
      { name: 'Active energy import (+A) rate 4', code: '3,1-0:1.8.4.255' },

      { name: 'Active energy export (-A)', code: '3,1-0:2.8.0.255' },
      { name: 'Active energy export (-A) rate 1', code: '3,1-0:2.8.1.255' },
      { name: 'Active energy export (-A) rate 2', code: '3,1-0:2.8.2.255' },
      { name: 'Active energy export (-A) rate 3', code: '3,1-0:2.8.3.255' },
      { name: 'Active energy export (-A) rate 4', code: '3,1-0:2.8.4.255' },

      { name: 'Active energy Combined total (|+A| + |-A|)', code: '3,1-0:15.8.0.255' },
      { name: 'Active energy Combined total (|+A| + |-A|) rate 1', code: '3,1-0:15.8.1.255' },
      { name: 'Active energy Combined total (|+A| + |-A|) rate 2', code: '3,1-0:15.8.2.255' },
      { name: 'Active energy Combined total (|+A| + |-A|) rate 3', code: '3,1-0:15.8.3.255' },
      { name: 'Active energy Combined total (|+A| + |-A|) rate 4', code: '3,1-0:15.8.4.255' },

      { name: 'Active energy Combined total (|+A| - |-A|)', code: '3,1-0:16.8.0.255' },
      { name: 'Active energy Combined total (|+A| - |-A|) rate 1', code: '3,1-0:16.8.1.255' },
      { name: 'Active energy Combined total (|+A| - |-A|) rate 2', code: '3,1-0:16.8.2.255' },
      { name: 'Active energy Combined total (|+A| - |-A|) rate 3', code: '3,1-0:16.8.3.255' },
      { name: 'Active energy Combined total (|+A| - |-A|) rate 4', code: '3,1-0:16.8.4.255' },
    ],
  },

  {
    name: 'Reactive Energy Register',
    items: [
      { name: 'Reactive energy import (+R)', code: '3,1-0:3.8.0.255' },
      { name: 'Reactive energy import (+R) rate 1', code: '3,1-0:3.8.1.255' },
      { name: 'Reactive energy import (+R) rate 2', code: '3,1-0:3.8.2.255' },
      { name: 'Reactive energy import (+R) rate 3', code: '3,1-0:3.8.3.255' },
      { name: 'Reactive energy import (+R) rate 4', code: '3,1-0:3.8.4.255' },

      { name: 'Reactive energy export (-R)', code: '3,1-0:4.8.0.255' },
      { name: 'Reactive energy export (-R) rate 1', code: '3,1-0:4.8.1.255' },
      { name: 'Reactive energy export (-R) rate 2', code: '3,1-0:4.8.2.255' },
      { name: 'Reactive energy export (-R) rate 3', code: '3,1-0:4.8.3.255' },
      { name: 'Reactive energy export (-R) rate 4', code: '3,1-0:4.8.4.255' },

      { name: 'Reactive energy QI (+Ri)', code: '3,1-0:5.8.0.255' },
      { name: 'Reactive energy QI (+Ri) rate 1', code: '3,1-0:5.8.1.255' },
      { name: 'Reactive energy QI (+Ri) rate 2', code: '3,1-0:5.8.2.255' },
      { name: 'Reactive energy QI (+Ri) rate 3', code: '3,1-0:5.8.3.255' },
      { name: 'Reactive energy QI (+Ri) rate 4', code: '3,1-0:5.8.4.255' },

      { name: 'Reactive energy QII (+Rc)', code: '3,1-0:6.8.0.255' },
      { name: 'Reactive energy QII (+Rc) rate 1', code: '3,1-0:6.8.1.255' },
      { name: 'Reactive energy QII (+Rc) rate 2', code: '3,1-0:6.8.2.255' },
      { name: 'Reactive energy QII (+Rc) rate 3', code: '3,1-0:6.8.3.255' },
      { name: 'Reactive energy QII (+Rc) rate 4', code: '3,1-0:6.8.4.255' },

      { name: 'Reactive energy QIII (-Ri)', code: '3,1-0:7.8.0.255' },
      { name: 'Reactive energy QIII (-Ri) rate 1', code: '3,1-0:7.8.1.255' },
      { name: 'Reactive energy QIII (-Ri) rate 2', code: '3,1-0:7.8.2.255' },
      { name: 'Reactive energy QIII (-Ri) rate 3', code: '3,1-0:7.8.3.255' },
      { name: 'Reactive energy QIII (-Ri) rate 4', code: '3,1-0:7.8.4.255' },

      { name: 'Reactive energy QIV (-Rc)', code: '3,1-0:8.8.0.255' },
      { name: 'Reactive energy QIV (-Rc) rate 1', code: '3,1-0:8.8.1.255' },
      { name: 'Reactive energy QIV (-Rc) rate 2', code: '3,1-0:8.8.2.255' },
      { name: 'Reactive energy QIV (-Rc) rate 3', code: '3,1-0:8.8.3.255' },
      { name: 'Reactive energy QIV (-Rc) rate 4', code: '3,1-0:8.8.4.255' },
    ],
  },

  {
    name: 'Apparent Energy Register',
    items: [
      { name: 'Apparent energy import (+VA)', code: '3,1-0:9.8.0.255' },
      { name: 'Apparent energy import (+VA) rate 1', code: '3,1-0:9.8.1.255' },
      { name: 'Apparent energy import (+VA) rate 2', code: '3,1-0:9.8.2.255' },
      { name: 'Apparent energy import (+VA) rate 3', code: '3,1-0:9.8.3.255' },
      { name: 'Apparent energy import (+VA) rate 4', code: '3,1-0:9.8.4.255' },

      { name: 'Apparent energy export (-VA)', code: '3,1-0:10.8.0.255' },
      { name: 'Apparent energy export (-VA) rate 1', code: '3,1-0:10.8.1.255' },
      { name: 'Apparent energy export (-VA) rate 2', code: '3,1-0:10.8.2.255' },
      { name: 'Apparent energy export (-VA) rate 3', code: '3,1-0:10.8.3.255' },
      { name: 'Apparent energy export (-VA) rate 4', code: '3,1-0:10.8.4.255' },
    ],
  },
];
// Updated component: uses EnergyRegisterCategories and new endpoints





const Loadprofile1CaptureObjects= () => {
  const [selectedItems, setSelectedItems] = useState([]); // items to POST
  const [addedItems, setAddedItems] = useState([]); // items fetched from backend
  const [deviceId, setDeviceId] = useState(() =>
    localStorage.getItem("selectedDeviceId")
  );
  const [selectedRow, setSelectedRow] = useState(null);
  const rowRefs = useRef([]);

  const [collapsedCategories, setCollapsedCategories] = useState(() => {
    return new Set((EnergyRegisterCategories || []).map((c) => c.name));
  });

  /* -------------------------
     Load device id on mount
  -------------------------- */
  useEffect(() => {
    setDeviceId(localStorage.getItem("selectedDeviceId"));
  }, []);

  /* -------------------------
     GET – fetch energy register (was monthly billing)
     endpoint updated -> /api/energy-registers/{deviceId}/
  -------------------------- */
  const fetchEnergyRegisterData = async () => {
    if (!deviceId) {
      setAddedItems([]);
      return;
    }
    try {
      const res = await axios.get(`${BASE_URL}/api/loadprofile1/${deviceId}/`);
      setAddedItems(res.data || []);
      setSelectedRow(null);
    } catch (err) {
      console.error("Fetch error:", err);
      setAddedItems([]);
    }
  };

  useEffect(() => {
    fetchEnergyRegisterData();
    // eslint-disable-next-line
  }, [deviceId]);

  /* -------------------------
     Helper: set of saved codes for quick checks
  -------------------------- */
  const savedCodes = useMemo(() => {
    return new Set((addedItems || []).map((it) => it.code));
  }, [addedItems]);

  /* -------------------------
     Single checkbox logic
  -------------------------- */
  const handleCheckboxChange = async (category, name, code, checked) => {
    if (checked) {
      if (savedCodes.has(code)) {
        setSelectedItems((prev) => prev.filter((s) => !(s.code === code)));
        return;
      }
      setSelectedItems((prev) => {
        const exists = prev.some((p) => p.code === code);
        if (exists) return prev;
        return [...prev, { category, name, code }];
      });
      return;
    }

    if (selectedItems.some((s) => s.code === code)) {
      setSelectedItems((prev) => prev.filter((s) => s.code !== code));
      return;
    }

    if (savedCodes.has(code)) {
      const saved = addedItems.find((it) => it.code === code);
      if (!saved || !saved.id) {
        setAddedItems((prev) => prev.filter((it) => it.code !== code));
        return;
      }

      const ok = window.confirm(`Remove saved item "${saved.name}"?`);
      if (!ok) return;

      try {
        await axios.delete(`${BASE_URL}/api/loadprofile1/item/${saved.id}/`);
        await fetchEnergyRegisterData();
      } catch (err) {
        console.error("Failed to delete saved item", err);
        alert("Failed to delete saved item. Try again.");
      }
      return;
    }

    setSelectedItems((prev) => prev.filter((s) => s.code !== code));
  };

  /* -------------------------
     Category-level toggle
  -------------------------- */
  const handleCategoryToggle = async (categoryObj, checked) => {
    const categoryName = categoryObj.name;
    const items = categoryObj.items || [];

    if (checked) {
      setSelectedItems((prev) => {
        const prevCodes = new Set(prev.map((p) => p.code));
        const toAdd = items
          .filter((it) => !savedCodes.has(it.code) && !prevCodes.has(it.code))
          .map((it) => ({ category: categoryName, name: it.name, code: it.code }));

        if (!toAdd.length) return prev;
        return [...prev, ...toAdd];
      });
      return;
    }

    // unchecked: remove newly-selected items from this category
    setSelectedItems((prev) => prev.filter((p) => p.category !== categoryName));

    // if there are saved items in this category, confirm and delete them
    const savedInCategory = (addedItems || []).filter((it) => it.category === categoryName);
    if (savedInCategory.length) {
      const ok = window.confirm(
        `This category has ${savedInCategory.length} saved item(s). Unchecking will DELETE them from the server. Proceed?`
      );
      if (!ok) return;

      try {
        await Promise.all(
          savedInCategory.map((it) =>
            axios.delete(`${BASE_URL}/api/loadprofile1/item/${it.id}/`)
          )
        );
        await fetchEnergyRegisterData();
      } catch (err) {
        console.error("Failed to delete saved category items", err);
        alert("Failed to delete some saved items. Refresh and try again.");
        await fetchEnergyRegisterData();
      }
    }
  };

  /* -------------------------
     Collapse / Expand a category
  -------------------------- */
  const toggleCollapseCategory = (categoryName) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryName)) next.delete(categoryName);
      else next.add(categoryName);
      return next;
    });
  };

  /* -------------------------
     View category on right table
  -------------------------- */
  const viewCategoryOnRight = (categoryName) => {
    const idx = (addedItems || []).findIndex((it) => it.category === categoryName);
    if (idx === -1) {
      alert("No saved items for this category to view on the right.");
      return;
    }
    setSelectedRow(idx);
  };

  /* -------------------------
     POST – Add items
     endpoint updated -> /api/energy-registers/
  -------------------------- */
  const handleAdd = async () => {
    if (!deviceId) return alert("Select a device");
    if (!selectedItems.length) return alert("Select at least one item");

    const payload = selectedItems.map((item) => ({
      device_id: deviceId,
      category: item.category,
      name: item.name,
      code: item.code,
      value: 100,
    }));

    try {
      await axios.post(`${BASE_URL}/api/loadprofile1/`, payload);
      setSelectedItems([]);
      await fetchEnergyRegisterData();
    } catch (err) {
      console.error("Add failed:", err);
      alert("Add failed");
    }
  };

  /* -------------------------
     DELETE – single item (by selected row)
     endpoint updated -> /api/energy-registers/item/{id}/
  -------------------------- */
  const handleDelete = async () => {
    if (selectedRow === null) return alert("Select a row");

    const item = addedItems[selectedRow];
    if (!item?.id) return;

    const ok = window.confirm("Delete selected item?");
    if (!ok) return;

    try {
      await axios.delete(`${BASE_URL}/api/loadprofile1/item/${item.id}/`);
      await fetchEnergyRegisterData();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Delete failed");
    }
  };

  /* -------------------------
     DELETE – clean device (all items)
     endpoint updated -> /api/energy-registers/clean/{deviceId}/
  -------------------------- */
  const handleClear = async () => {
    if (!deviceId) return alert("Select a device");
    const ok = window.confirm("Clear all items for this device?");
    if (!ok) return;

    try {
      await axios.delete(`${BASE_URL}/api/loadprofile1/clean/${deviceId}/`);
      setAddedItems([]);
      setSelectedRow(null);
    } catch (err) {
      console.error("Clear failed:", err);
      alert("Clear failed");
    }
  };

  /* -------------------------
     Navigation helpers (reorder local array)
     - moveItem: core operation
     - handleFirst/Previous/Next/Last will move selected row
  -------------------------- */
  const moveItem = (fromIndex, toIndex) => {
    if (fromIndex === null || fromIndex === undefined) return;
    if (toIndex < 0) toIndex = 0;

    setAddedItems((prev) => {
      if (!prev || fromIndex < 0 || fromIndex >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      // if toIndex is greater than new length, push to end
      const insertIndex = toIndex > next.length ? next.length : toIndex;
      next.splice(insertIndex, 0, item);

      // NOTE: if you want to persist ordering on the server, do it here:
      // e.g. send new ordered list of IDs to backend:
      // const newOrderIds = next.map(it => it.id);
      // axios.post(`${BASE_URL}/api/loadprofile1/reorder/${deviceId}/`, { order: newOrderIds })
      //   .catch(err => console.warn("Persist reorder failed", err));

      return next;
    });

    // update selectedRow to the new position
    setSelectedRow(toIndex);
  };

  const handleFirst = () => {
    if (selectedRow === null) return alert("Select a row");
    if (selectedRow === 0) return; // already first
    moveItem(selectedRow, 0);
  };

  const handleLast = () => {
    if (selectedRow === null) return alert("Select a row");
    const lastIndex = (addedItems || []).length - 1;
    if (selectedRow === lastIndex) return; // already last
    moveItem(selectedRow, lastIndex);
  };

  const handlePrevious = () => {
    if (selectedRow === null) return alert("Select a row");
    if (selectedRow <= 0) return; // can't move back
    moveItem(selectedRow, selectedRow - 1);
  };

  const handleNext = () => {
    if (selectedRow === null) return alert("Select a row");
    const lastIndex = (addedItems || []).length - 1;
    if (selectedRow >= lastIndex) return; // can't move further
    moveItem(selectedRow, selectedRow + 1);
  };

  /* -------------------------
     Keep row in view when selection changes
  -------------------------- */
  useEffect(() => {
    if (selectedRow !== null && rowRefs.current[selectedRow]) {
      rowRefs.current[selectedRow].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedRow]);

  /* -------------------------
     UI
  -------------------------- */
  return (
    <div className="display-root" style={{ display: "flex", gap: 12 }}>
      {/* LEFT: categories & checkboxes */}
      <div className="sub_container_display" style={{ flex: 1, overflowY: "auto" }}>
        {(EnergyRegisterCategories || []).map((cat, i) => {
          const codesInCat = (cat.items || []).map((it) => it.code);
          const allChecked =
            codesInCat.length > 0 &&
            codesInCat.every((c) => selectedItems.some((s) => s.code === c) || savedCodes.has(c));
          // const someChecked = codesInCat.some(...); // could be used for indeterminate

          return (
            <div
              key={i}
              className="category-block"
              style={{ marginBottom: 12, border: "1px solid #f0f0f0", padding: 8, borderRadius: 6 }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={(e) => handleCategoryToggle(cat, e.target.checked)}
                  />
                  <strong>{cat.name}</strong>
                </div>

                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => toggleCollapseCategory(cat.name)}
                    title={collapsedCategories.has(cat.name) ? "Expand category" : "Collapse category"}
                    style={{ padding: "4px 6px", cursor: "pointer" }}
                  >
                    {collapsedCategories.has(cat.name) ? "▸" : "◂"}
                  </button>
                </div>
              </div>

              {!collapsedCategories.has(cat.name) && (
                <div style={{ marginTop: 8 }}>
                  {(cat.items || []).map((item, idx) => {
                    const checked =
                      selectedItems.some((s) => s.code === item.code) ||
                      savedCodes.has(item.code);
                    return (
                      <label key={idx} className="item-label" style={{ display: "block", margin: "6px 0" }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            handleCheckboxChange(cat.name, item.name, item.code, e.target.checked)
                          }
                        />
                        <span style={{ marginLeft: 8 }}>{item.name}</span>
                        <span className="code-text" style={{ marginLeft: 8, color: "#666" }}>
                          ({item.code})
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CENTER: toolbar */}
      <div className="vertical-toolbar">
        <button className="tool-btn" onClick={handleAdd} title="Add selected to end">
          <span className="tool-icon">+</span>
          <span className="tool-text">Add1</span>
        </button>

        <button className="tool-btn" onClick={handleAdd} title="Insert after selected row">
          <span className="tool-icon red-dot"></span>
          <span className="tool-text">Insert</span>
        </button>

        <button className="tool-btn" onClick={handleDelete} title="Delete selected row">
          <span className="tool-icon">−</span>
          <span className="tool-text">Delete</span>
        </button>

        <button className="tool-btn" onClick={handleClear} title="Clear all">
          <span className="tool-icon">×</span>
          <span className="tool-text">Clear</span>
        </button>

        <div className="tool-separator" />

        <button className="tool-btn" onClick={handleFirst} title="First">
          <span className="tool-icon">|◀</span>
          <span className="tool-text">First</span>
        </button>

        <button className="tool-btn" onClick={handlePrevious} title="Previous">
          <span className="tool-icon">◀</span>
          <span className="tool-text">Previous</span>
        </button>

        <button className="tool-btn" onClick={handleNext} title="Next">
          <span className="tool-icon">▶</span>
          <span className="tool-text">Next</span>
        </button>

        <button className="tool-btn" onClick={handleLast} title="Last">
          <span className="tool-icon">▶|</span>
          <span className="tool-text">Last</span>
        </button>
      </div>

      {/* RIGHT: saved table */}
      <div className="sub_container_display_2">
        <div className="display_table">
          <table className="tableTariff1">
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
              </tr>
            </thead>
            <tbody>
              {(addedItems || []).length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: 8 }}>No saved items</td>
                </tr>
              ) : (
                (addedItems || []).map((item, idx) => (
                  <tr
                    key={item.id || `${item.code}-${idx}`}
                    ref={(el) => (rowRefs.current[idx] = el)}
                    className={selectedRow === idx ? "selected-row" : ""}
                    onClick={() => setSelectedRow(idx)}
                    style={{
                      background: selectedRow === idx ? "#eef" : "",
                      cursor: "pointer",
                    }}
                  >
                    <td style={{ padding: 0.5, borderBottom: "1px solid #f0f0f0" }}>{item.name}</td>
                    <td style={{ padding: 0.5, borderBottom: "1px solid #f0f0f0" }}>{item.code}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};








// make sure BASE_URL and InstantaneousCategories are available in scope

const Loadprofile2CaptureObjects = () => {
  const [selectedItems, setSelectedItems] = useState([]); // items to POST
  const [addedItems, setAddedItems] = useState([]); // items fetched from backend
  const [deviceId, setDeviceId] = useState(() =>
    localStorage.getItem("selectedDeviceId")
  );
  const [selectedRow, setSelectedRow] = useState(null);
  const rowRefs = useRef([]);

  const [collapsedCategories, setCollapsedCategories] = useState(() => {
    return new Set((InstantaneousCategories || []).map((c) => c.name));
  });

  /* -------------------------
     Load device id on mount
  -------------------------- */
  useEffect(() => {
    setDeviceId(localStorage.getItem("selectedDeviceId"));
  }, []);

  /* -------------------------
     GET – fetch energy register (was monthly billing)
     endpoint updated -> /api/energy-registers/{deviceId}/
  -------------------------- */
  const fetchEnergyRegisterData = async () => {
    if (!deviceId) {
      setAddedItems([]);
      return;
    }
    try {
      const res = await axios.get(`${BASE_URL}/api/loadprofile2/${deviceId}/`);
      setAddedItems(res.data || []);
      setSelectedRow(null);
    } catch (err) {
      console.error("Fetch error:", err);
      setAddedItems([]);
    }
  };

  useEffect(() => {
    fetchEnergyRegisterData();
    // eslint-disable-next-line
  }, [deviceId]);

  /* -------------------------
     Helper: set of saved codes for quick checks
  -------------------------- */
  const savedCodes = useMemo(() => {
    return new Set((addedItems || []).map((it) => it.code));
  }, [addedItems]);

  /* -------------------------
     Single checkbox logic
  -------------------------- */
  const handleCheckboxChange = async (category, name, code, checked) => {
    if (checked) {
      if (savedCodes.has(code)) {
        setSelectedItems((prev) => prev.filter((s) => !(s.code === code)));
        return;
      }
      setSelectedItems((prev) => {
        const exists = prev.some((p) => p.code === code);
        if (exists) return prev;
        return [...prev, { category, name, code }];
      });
      return;
    }

    if (selectedItems.some((s) => s.code === code)) {
      setSelectedItems((prev) => prev.filter((s) => s.code !== code));
      return;
    }

    if (savedCodes.has(code)) {
      const saved = addedItems.find((it) => it.code === code);
      if (!saved || !saved.id) {
        setAddedItems((prev) => prev.filter((it) => it.code !== code));
        return;
      }

      const ok = window.confirm(`Remove saved item "${saved.name}"?`);
      if (!ok) return;

      try {
        await axios.delete(`${BASE_URL}/api/loadprofile2/item/${saved.id}/`);
        await fetchEnergyRegisterData();
      } catch (err) {
        console.error("Failed to delete saved item", err);
        alert("Failed to delete saved item. Try again.");
      }
      return;
    }

    setSelectedItems((prev) => prev.filter((s) => s.code !== code));
  };

  /* -------------------------
     Category-level toggle
  -------------------------- */
  const handleCategoryToggle = async (categoryObj, checked) => {
    const categoryName = categoryObj.name;
    const items = categoryObj.items || [];

    if (checked) {
      setSelectedItems((prev) => {
        const prevCodes = new Set(prev.map((p) => p.code));
        const toAdd = items
          .filter((it) => !savedCodes.has(it.code) && !prevCodes.has(it.code))
          .map((it) => ({ category: categoryName, name: it.name, code: it.code }));

        if (!toAdd.length) return prev;
        return [...prev, ...toAdd];
      });
      return;
    }

    // unchecked: remove newly-selected items from this category
    setSelectedItems((prev) => prev.filter((p) => p.category !== categoryName));

    // if there are saved items in this category, confirm and delete them
    const savedInCategory = (addedItems || []).filter((it) => it.category === categoryName);
    if (savedInCategory.length) {
      const ok = window.confirm(
        `This category has ${savedInCategory.length} saved item(s). Unchecking will DELETE them from the server. Proceed?`
      );
      if (!ok) return;

      try {
        await Promise.all(
          savedInCategory.map((it) =>
            axios.delete(`${BASE_URL}/api/loadprofile2/item/${it.id}/`)
          )
        );
        await fetchEnergyRegisterData();
      } catch (err) {
        console.error("Failed to delete saved category items", err);
        alert("Failed to delete some saved items. Refresh and try again.");
        await fetchEnergyRegisterData();
      }
    }
  };

  /* -------------------------
     Collapse / Expand a category
  -------------------------- */
  const toggleCollapseCategory = (categoryName) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryName)) next.delete(categoryName);
      else next.add(categoryName);
      return next;
    });
  };

  /* -------------------------
     View category on right table
  -------------------------- */
  const viewCategoryOnRight = (categoryName) => {
    const idx = (addedItems || []).findIndex((it) => it.category === categoryName);
    if (idx === -1) {
      alert("No saved items for this category to view on the right.");
      return;
    }
    setSelectedRow(idx);
  };

  /* -------------------------
     POST – Add items
  -------------------------- */
  const handleAdd = async () => {
    if (!deviceId) return alert("Select a device");
    if (!selectedItems.length) return alert("Select at least one item");

    const payload = selectedItems.map((item) => ({
      device_id: deviceId,
      category: item.category,
      name: item.name,
      code: item.code,
      value: 100,
    }));

    try {
      await axios.post(`${BASE_URL}/api/loadprofile2/`, payload);
      setSelectedItems([]);
      await fetchEnergyRegisterData();
    } catch (err) {
      console.error("Add failed:", err);
      alert("Add failed");
    }
  };

  /* -------------------------
     DELETE – single item (by selected row)
  -------------------------- */
  const handleDelete = async () => {
    if (selectedRow === null) return alert("Select a row");

    const item = addedItems[selectedRow];
    if (!item?.id) return;

    const ok = window.confirm("Delete selected item?");
    if (!ok) return;

    try {
      await axios.delete(`${BASE_URL}/api/loadprofile2/item/${item.id}/`);
      await fetchEnergyRegisterData();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Delete failed");
    }
  };

  /* -------------------------
     DELETE – clean device (all items)
  -------------------------- */
  const handleClear = async () => {
    if (!deviceId) return alert("Select a device");
    const ok = window.confirm("Clear all items for this device?");
    if (!ok) return;

    try {
      await axios.delete(`${BASE_URL}/api/loadprofile2/clean/${deviceId}/`);
      setAddedItems([]);
      setSelectedRow(null);
    } catch (err) {
      console.error("Clear failed:", err);
      alert("Clear failed");
    }
  };

  /* -------------------------
     Navigation helpers (reorder local array)
     - moveItem: core operation
     - handleFirst/Previous/Next/Last will move selected row
  -------------------------- */
  const moveItem = (fromIndex, toIndex) => {
    if (fromIndex === null || fromIndex === undefined) return;
    setAddedItems((prev) => {
      if (!prev || fromIndex < 0 || fromIndex >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      const insertIndex = toIndex > next.length ? next.length : Math.max(0, toIndex);
      next.splice(insertIndex, 0, item);

      // Optional: persist the new order to server
      // const newOrderIds = next.map(it => it.id);
      // axios.post(`${BASE_URL}/api/loadprofile2/reorder/${deviceId}/`, { order: newOrderIds })
      //   .catch(err => console.warn("Persist reorder failed", err));

      return next;
    });

    // set selected row to the item new index (clamp)
    const lastIdx = (addedItems || []).length - 1;
    const clamped = Math.max(0, Math.min(toIndex, lastIdx));
    setSelectedRow(clamped);
  };

  const handleFirst = () => {
    if (selectedRow === null) return alert("Select a row");
    if (selectedRow === 0) return;
    moveItem(selectedRow, 0);
  };

  const handleLast = () => {
    if (selectedRow === null) return alert("Select a row");
    const lastIndex = (addedItems || []).length - 1;
    if (selectedRow === lastIndex) return;
    moveItem(selectedRow, lastIndex);
  };

  const handlePrevious = () => {
    if (selectedRow === null) return alert("Select a row");
    if (selectedRow <= 0) return;
    moveItem(selectedRow, selectedRow - 1);
  };

  const handleNext = () => {
    if (selectedRow === null) return alert("Select a row");
    const lastIndex = (addedItems || []).length - 1;
    if (selectedRow >= lastIndex) return;
    moveItem(selectedRow, selectedRow + 1);
  };

  /* -------------------------
     Keep row in view when selection changes
  -------------------------- */
  useEffect(() => {
    if (selectedRow !== null && rowRefs.current[selectedRow]) {
      rowRefs.current[selectedRow].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedRow]);

  /* -------------------------
     UI
  -------------------------- */
  const hasSelected = selectedRow !== null;
  const lastIndex = (addedItems || []).length - 1;
  const atFirst = hasSelected && selectedRow === 0;
  const atLast = hasSelected && selectedRow === lastIndex;

  return (
    <div className="display-root" style={{ display: "flex", gap: 12 }}>
      {/* LEFT: categories & checkboxes */}
      <div className="sub_container_display" style={{ flex: 1, overflowY: "auto" }}>
        {(InstantaneousCategories || []).map((cat, i) => {
          const codesInCat = (cat.items || []).map((it) => it.code);
          const allChecked =
            codesInCat.length > 0 &&
            codesInCat.every((c) => selectedItems.some((s) => s.code === c) || savedCodes.has(c));

          return (
            <div
              key={i}
              className="category-block"
              style={{ marginBottom: 12, border: "1px solid #f0f0f0", padding: 8, borderRadius: 6 }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={(e) => handleCategoryToggle(cat, e.target.checked)}
                  />
                  <strong>{cat.name}</strong>
                </div>

                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => toggleCollapseCategory(cat.name)}
                    title={collapsedCategories.has(cat.name) ? "Expand category" : "Collapse category"}
                    style={{ padding: "4px 6px", cursor: "pointer" }}
                  >
                    {collapsedCategories.has(cat.name) ? "▸" : "◂"}
                  </button>
                </div>
              </div>

              {!collapsedCategories.has(cat.name) && (
                <div style={{ marginTop: 8 }}>
                  {(cat.items || []).map((item, idx) => {
                    const checked =
                      selectedItems.some((s) => s.code === item.code) ||
                      savedCodes.has(item.code);
                    return (
                      <label key={idx} className="item-label" style={{ display: "block", margin: "6px 0" }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            handleCheckboxChange(cat.name, item.name, item.code, e.target.checked)
                          }
                        />
                        <span style={{ marginLeft: 8 }}>{item.name}</span>
                        <span className="code-text" style={{ marginLeft: 8, color: "#666" }}>
                          ({item.code})
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CENTER: toolbar */}
      <div className="vertical-toolbar">
        <button className="tool-btn" onClick={handleAdd} title="Add selected to end">
          <span className="tool-icon">+</span>
          <span className="tool-text">Add1</span>
        </button>

        <button className="tool-btn" onClick={handleAdd} title="Insert after selected row">
          <span className="tool-icon red-dot"></span>
          <span className="tool-text">Insert</span>
        </button>

        <button className="tool-btn" onClick={handleDelete} title="Delete selected row">
          <span className="tool-icon">−</span>
          <span className="tool-text">Delete</span>
        </button>

        <button className="tool-btn" onClick={handleClear} title="Clear all">
          <span className="tool-icon">×</span>
          <span className="tool-text">Clear</span>
        </button>

        <div className="tool-separator" />

        <button className="tool-btn" onClick={handleFirst} title="First" disabled={!hasSelected || atFirst}>
          <span className="tool-icon">|◀</span>
          <span className="tool-text">First</span>
        </button>

        <button className="tool-btn" onClick={handlePrevious} title="Previous" disabled={!hasSelected || atFirst}>
          <span className="tool-icon">◀</span>
          <span className="tool-text">Previous</span>
        </button>

        <button className="tool-btn" onClick={handleNext} title="Next" disabled={!hasSelected || atLast}>
          <span className="tool-icon">▶</span>
          <span className="tool-text">Next</span>
        </button>

        <button className="tool-btn" onClick={handleLast} title="Last" disabled={!hasSelected || atLast}>
          <span className="tool-icon">▶|</span>
          <span className="tool-text">Last</span>
        </button>
      </div>

      {/* RIGHT: saved table */}
      <div className="sub_container_display_2">
        <div className="display_table">
          <table className="tableTariff1">
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Name</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Code</th>
              </tr>
            </thead>
            <tbody>
              {(addedItems || []).length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: 8 }}>No saved items</td>
                </tr>
              ) : (
                (addedItems || []).map((item, idx) => (
                  <tr
                    key={item.id || `${item.code}-${idx}`}
                    ref={(el) => (rowRefs.current[idx] = el)}
                    className={selectedRow === idx ? "selected-row" : ""}
                    onClick={() => setSelectedRow(idx)}
                    style={{
                      background: selectedRow === idx ? "#eef" : "",
                      cursor: "pointer",
                    }}
                  >
                    <td >{item.name}</td>
                    <td >{item.code}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};







// State to store the selected codes
const [selectedCodes, setSelectedCodes] = useState([]);

// Reusable Checkbox Group Component
const CheckboxGroup = ({ title, registers }) => {
  

  const handleCheckboxChange = (code, checked) => {
    setSelectedCodes((prevSelectedCodes) => {
      if (checked) {
        // Add code to the array if checked
        return [...prevSelectedCodes, code];
      } else {
        // Remove code from the array if unchecked
        return prevSelectedCodes.filter((item) => item !== code);
      }
    });
  };

  return (
    <div>
      <h4>{title}</h4>
      {registers.map((register, index) => (
        <label key={index}>
          <input
            type="checkbox"
            checked={selectedCodes.includes(register.code)} // To ensure checkbox reflects state
            onChange={(e) => handleCheckboxChange(register.code, e.target.checked)}
          />{' '}
          {register.label} {' '} {register.code}
          <br />
        </label>
      ))}
      
    </div>
  );
};

const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));
   
    useEffect(() => {
      const storedId = localStorage.getItem('selectedDeviceId');
      setDeviceId(storedId);
    }, []);

  const [selectedProfile, setSelectedProfile] = useState("period1");

  // Handler to change the selected profile
  const handleProfileSelection = (profile) => {
    setSelectedProfile(profile);
  };

  



  const energyRegisters1 = retrieveResponse?.data || []; 

  return (
    
    <div>
      

      {/* Profile Selection Buttons */}
     <div
  className="view-toggle"
  role="tablist"
  aria-label="Load profile selection"
>
  <button
    type="button"
    role="tab"
    aria-pressed={selectedProfile === "period1"}
    className={`view-btn ${
      selectedProfile === "period1" ? "active" : ""
    }`}
    onClick={() => {
      setSelectedProfile("period1");
      handleProfileSelection("period1");
    }}
  >
    Load profile with period 1 configure
  </button>

  <button
    type="button"
    role="tab"
    aria-pressed={selectedProfile === "period2"}
    className={`view-btn ${
      selectedProfile === "period2" ? "active" : ""
    }`}
    onClick={() => {
      setSelectedProfile("period2");
      handleProfileSelection("period2");
    }}
  >
    Load profile with period 2 configure
  </button>
</div>

      {/* Render Selected Profile */}
      {selectedProfile === 'period1' && (
        <div>
        <Loadprofile1CaptureObjects/>
        </div>
      )}

      {selectedProfile === 'period2' && (
          <div>
        <Loadprofile2CaptureObjects/>
        </div>
      )}





        
    </div>
  );
};


export default ProfileConfigurator