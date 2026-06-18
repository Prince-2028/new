
import React, { useEffect, useMemo, useRef, useState } from "react";
import './index.css'
import axios from "axios";
import BASE_URL from '../../apiConfig'; // Adjust path based on your file structure




const categories = [
  {
    name: "Time of Use",
    items: [
      { label: "Local Date", code: "1,1-0:0.9.2.255" },
      { label: "Local Timer", code: "1,1-0:0.9.1.255" },
    ],
  },
  {
    name: "Energy Register",
    items: [
      { label: "Active energy import (+A)", code: "3,1-0:1.8.0.255" },
      { label: "Active energy export (-A)", code: "3,1-0:2.8.0.255" },
      { label: "Reactive energy import (+R)", code: "3,1-0:3.8.0.255" },
      { label: "Reactive energy export (-R)", code: "3,1-0:4.8.0.255" },
      { label: "Apparent energy import (+VA)", code: "3,1-0:9.8.0.255" },
      { label: "Apparent energy export (-VA)", code: "3,1-0:10.8.0.255" },
      { label: "Active energy (|+A|+|-A|)", code: "3,1-0:15.8.0.255" },
    ],
  },
  {
    name: "Demand Register",
    items: [
      { label: "Maximum Demand Register - Active (|+A| + |+A|)", code: "4,1-0:15.6.0.255" },
      { label: "Capture time - Maximum Demand Register - Active (|+A| + |+A|)", code: "4,1-0:15.6.0.255" },
      { label: "Maximum Demand Register - Active import (+A)", code: "4,1-0:1.6.0.255" },
      { label: "Capture time - Maximum Demand Register - Active import (+A)", code: "4,1-0:1.6.0.255" },
      { label: "Maximum Demand Register - Active export (-A)", code: "4,1-0:2.6.0.255" },
      { label: "Capture time - Maximum Demand Register - Active export (-A)", code: "4,1-0:2.6.0.255" },
      { label: "Current average value - Demand Register 2 - Active energy export (-A)", code: "5,1-0:2.4.0.255" },
      { label: "Last average value - Demand Register 2 - Active energy export (-A)", code: "5,1-0:2.4.0.255" },
      { label: "Current average value - Demand Register - Active energy export (+A)", code: "5,1-0:1.4.0.255" },
      { label: "Last average value - Demand Register - Active energy export (+A)", code: "5,1-0:1.4.0.255" },
    ],
  },
  
    {
      name: "Payment",
      items: [
        { label: "Cumulative purchase Credit", code: "3,1-65:1.140.2.255" },
        { label: "Residual Credit", code: "3,0-0:19.130.0.255" },
        { label: "Residual Credit Use Day's", code: "1,0-0:19.130.3.255" },
        { label: "Monthly Rent Credit", code: "30-0:19.10.2.255" },
        { label: "Currently Active Price", code: "3,0-0:96.14.1.255" },
        { label: "Currently Active Step", code: "1,0-1:96.14.1.255" },
        { label: "Currently Active Energy Tariff", code: "1,0-0:96.14.0.255" },
        { label: "Currently Monthly Consumption Credit Increment", code: "3,0-0:19.133.0.255" },
        { label: "Consumption Credit Increment of Last 1st Day", code: "3,0-0:19.133.0.255" },
        { label: "Consumption Active Energy Increment of Last 1st Day (+A | + | -A|)", code: "3,1-0:15.9.0.101" },
        { label: "Consumption Credit Increment of Last 1st Month", code: "3,0-0:19.133.0.101" },
        { label: "Consumption Credit Increment of Last 2nd Month", code: "3,0-0:19.133.0.102" },
        { label: "Consumption Credit Increment of Last 3rd Month", code: "3,0-0:19.133.0.103" },
        { label: "Consumption Credit Increment of Last 4th Month", code: "3,0-0:19.133.0.104" },
        { label: "Consumption Credit Increment of Last 5th Month", code: "3,0-0:19.133.0.105" },
        { label: "Consumption Credit Increment of Last 6th Month", code: "3,0-0:19.133.0.106" },
        { label: "Consumption Credit Increment of Last 7th Month", code: "3,0-0:19.133.0.107" },
        { label: "Consumption Credit Increment of Last 8th Month", code: "3,0-0:19.133.0.108" },
        { label: "Consumption Credit Increment of Last 9th Month", code: "3,0-0:19.133.0.109" },
        { label: "Consumption Credit Increment of Last 10th Month", code: "3,0-0:19.133.0.100" },
        { label: "Consumption Credit Increment of Last 11th Month", code: "3,0-0:19.133.0.111" },
        { label: "Consumption Credit Increment of Last 12th Month", code: "3,0-0:19.133.0.112" },
        { label: "Total Active Energy Increment of 1st Month", code: "3,1-0:15.9.0.0.101" },
        { label: "Total Active Energy Increment of 2nd Month", code: "3,1-0:15.9.0.0.102" },
        { label: "Total Active Energy Increment of 3rd Month", code: "3,1-0:15.9.0.0.103" },
        { label: "Total Active Energy Increment of 4th Month", code: "3,1-0:15.9.0.0.104" },
        { label: "Total Active Energy Increment of 5th Month", code: "3,1-0:15.9.0.0.105" },
        { label: "Total Active Energy Increment of 6th Month", code: "3,1-0:15.9.0.0.106" },
        { label: "Total Active Energy Increment of 7th Month", code: "3,1-0:15.9.0.0.107" },
        { label: "Total Active Energy Increment of 8th Month", code: "3,1-0:15.9.0.0.108" },
        { label: "Total Active Energy Increment of 9th Month", code: "3,1-0:15.9.0.0.109" },
        { label: "Total Active Energy Increment of 10th Month", code: "3,1-0:15.9.0.0.110" },
        { label: "Total Active Energy Increment of 11th Month", code: "3,1-0:15.9.0.0.111" },
        { label: "Total Active Energy Increment of 12th Month", code: "3,1-0:15.9.0.0.112" },
        { label: "Last 1st Purchase Token", code: "1,0-68:128.1.1.255" },
        { label: "Last 2nd Purchase Token", code: "1,0-68:128.1.1.101" },
        { label: "Last 3rd Purchase Token", code: "1,0-68:128.1.1.102" },
        { label: "Last 4th Purchase Token", code: "1,0-68:128.1.1.103" },
        { label: "Last 5th Purchase Token", code: "1,0-68:128.1.1.104" },
      ],
    },
  
  {
    name: "Basic Information",
    items: [
      { label: " Device id #1 Meter Serial Number", code: "3,0-0:96.1.0.255" },
      { label: "Device id #2 Manufacturer ID", code: "3,0-0:96.1.1.255" },
      
    ],
  },
  {
    name: "Instantaneous",
    items: [
      { label: "Instantaneous Voltage L1", code: "3,1-0:32.70.255" },
      { label: "Instantaneous Current L1", code: "3,1-0:31.7.0.255" },
      { label: "Instantaneous Current L0", code: "3,1-0:91.7.0.255" },
      { label: "Instant Supply Frequency", code: "3,1-0:14.7.0.255" },
      { label: "Instantaneous Import Active Power (+A)", code: "3,1-0:1.7.0.255" },
      { label: "Instantaneous Export Active Power (-A)", code: "3,1-0:.7.0.255" },
      { label: "Instantaneous Import Reactive Power (+R)", code: "3,1-0:3.7.0.255" },
      { label: "Instantaneous Export Reactive Power (-R)", code: "3,1-0:4.7.0.255" },
      { label: "Instantaneous Import Apparent Power (+VA)", code: "3,1-0:9.7.0.255" },
      { label: "Instantaneous Export Apparent Power (-VA)", code: "3,1-0:10.7.0.255" },
      { label: "Instantaneous Active Power (|+A| + |-A|)", code: "3,1-0:15.7.0.255" },
      { label: "Instantaneous Power Factor (|+A/ + VA|)", code: "3,1-0:13.7.0.255" },
    ],
  },
  
];



const manualCategories = [
    

    {
        name: "Basic Information",
        items: [
          { 
            label: "Customer Meter Equipment Identifier", 
            code: "1,0-0:96.1.1.225" 
          }
        ]
      },
      {
        name: "Time of Use",
        items: [
          { 
            label: "Local Date", 
            code: "1,1-0:0.9.2.255" 
          },
          { 
            label: "Local Time", 
            code: "1,1-0:0.9.1.255" 
          }
        ]
      },

      {
        name: "Energy Register",
        items: [
          { label: "Total Active Energy (|+A| + |+A|)", code: "3,1-0:15.8.0.255" },
          { label: "Total Active Energy (|+A| + |+A|) - Rate 1", code: "3,1-0:15.8.1.255" },
          { label: "Total Active Energy (|+A| + |+A|) - Rate 2", code: "3,1-0:15.8.2.255" },
          { label: "Total Active Energy (|+A| + |+A|) - Rate 3", code: "3,1-0:15.8.3.255" },
          { label: "Total Active Energy (|+A| + |+A|) - Rate 4", code: "3,1-0:15.8.4.255" },
          { label: "Active Energy Import (+A)", code: "3,1-0:1.8.0.255" },
          { label: "Active Energy Import (+A) - Rate 1", code: "3,1-0:1.8.1.255" },
          { label: "Active Energy Import (+A) - Rate 2", code: "3,1-0:1.8.2.255" },
          { label: "Active Energy Import (+A) - Rate 3", code: "3,1-0:1.8.3.255" },
          { label: "Active Energy Import (+A) - Rate 4", code: "3,1-0:1.8.4.255" },
          { label: "Active Energy Export (-A)", code: "3,1-0:2.8.0.255" },
          { label: "Active Energy Export (-A) - Rate 1", code: "3,1-0:2.8.1.255" },
          { label: "Active Energy Export (-A) - Rate 2", code: "3,1-0:2.8.2.255" },
          { label: "Active Energy Export (-A) - Rate 3", code: "3,1-0:2.8.3.255" },
          { label: "Active Energy Export (-A) - Rate 4", code: "3,1-0:2.8.4.255" },
          { label: "Reactive Energy Import (+R)", code: "3,1-0:3.8.0.255" },
          { label: "Reactive Energy Import (+R) - Rate 1", code: "3,1-0:3.8.1.255" },
          { label: "Reactive Energy Import (+R) - Rate 2", code: "3,1-0:3.8.2.255" },
          { label: "Reactive Energy Import (+R) - Rate 3", code: "3,1-0:3.8.4.255" },
          { label: "Reactive Energy Import (+R) - Rate 4", code: "3,1-0:3.8.5.255" },
          { label: "Reactive Energy Export (-R)", code: "3,1-0:4.8.0.255" },
          { label: "Reactive Energy Export (-R) - Rate 1", code: "3,1-0:4.8.1.255" },
          { label: "Reactive Energy Export (-R) - Rate 2", code: "3,1-0:4.8.2.255" },
          { label: "Reactive Energy Export (-R) - Rate 3", code: "3,1-0:4.8.3.255" },
          { label: "Reactive Energy Export (-R) - Rate 4", code: "3,1-0:4.8.4.255" },
          { label: "Apparent Energy Import (+VA)", code: "3,1-0:9.8.0.255" },
          { label: "Apparent Energy Import (+VA)", code: "3,1-0:10.8.0.255" }
        ]
      },

      {
        "name": "Demand Register",
        "items": [
          { "label": "Cumulative Maximum Active Demand (|+A| + |-A|)", "code": "4,1-0:15.2.0.255" },
          { "label": "Maximum Demand Register - Active (|+A| + |-A|)", "code": "4,1-0:15.6.0.255" },
          { "label": "Capture Time - Maximum Demand Register - Active (|+A| + |-A|)", "code": "4,1-0:15.6.0.255" },
          { "label": "Maximum Demand Register - Active (|+A| + |-A|) - Rate 1", "code": "4,1-0:15.6.1.255" },
          { "label": "Capture Time - Maximum Demand Register - Active (|+A| + |-A|) - Rate 1", "code": "4,1-0:15.6.1.255" },
          { "label": "Maximum Demand Register - Active (|+A| + |-A|) - Rate 2", "code": "4,1-0:15.6.2.255" },
          { "label": "Capture Time - Maximum Demand Register - Active (|+A| + |-A|) - Rate 2", "code": "4,1-0:15.6.2.255" },
          { "label": "Maximum Demand Register - Active Import (+A)", "code": "4,1-0:2.6.0.255" },
          { "label": "Capture Time - Maximum Demand Register - Active Import (+A)", "code": "4,1-0:1.6.0.255" },
          { "label": "Maximum Demand Register - Active Export (-A)", "code": "4,1-0:2.6.0.255" },
          { "label": "Capture Time - Maximum Demand Register - Active Export (-A)", "code": "4,1-0:2.6.0.255" },
          { "label": "Current Average Value - Demand Register 1 - Active Energy Import (+A)", "code": "5,1-0:1.4.0.255" },
          { "label": "Last Average Value - Demand Register 1 - Active Energy Import (+A)", "code": "5,1-0:1.4.0.255" },
          { "label": "Current Average Value - Demand Register 2 - Active Energy Import (+A)", "code": "5,1-0:2.4.0.255" },
          { "label": "Last Average Value - Demand Register 2 - Active Energy Import (+A)", "code": "5,1-0:2.4.0.255" },
          { "label": "Current Average Value - Active Increase Demand (|+A| + |-A|)", "code": "5,1-0:15.4.0.255" }
        ]
      },


      {
        "name": "Instantaneous",
        "items": [
          { "label": "Instantaneous Voltage L1", "code": "3,1-0:32.7.0.255" },
          { "label": "Instantaneous Current L1", "code": "3,1-0:31.7.0.255" },
          { "label": "Instantaneous Current L0", "code": "3,1-0:91.7.0.255" },
          { "label": "Instantaneous Active Power (|+A| |-A|)", "code": "3,1-0:15.7.0.255" },
          { "label": "Instantaneous Power Factor (|+A| |-A|)", "code": "3,1-0:13.7.0.255" },
          { "label": "Instantaneous Supply Frequency", "code": "3,1-0:14.7.0.255" }
        ]
      },

      {
        "name": "Others",
        "items": [
          { "label": "Number of Meter Readings", "code": "1,0-0:96.2.128.255" },
          { "label": "Cumulative Power On Duration", "code": "3,0-0:96.91.14.255" },
          { "label": "Cumulative Billing Times", "code": "1,0-0:0.1.1.255" },
          { "label": "Cumulative Tamper Per Hour", "code": "1,0-0:19.135.0.255" },
          { "label": "Cumulative Tamper Count", "code": "1,0-0:96.91.0.255" },
          { "label": "Last Open Face Cover Date and Time", "code": "1,0-0:96.20.1.255" },
          { "label": "Last Open Terminal Cover Date and Time", "code": "1,0-0:96.20.6.255" },
          { "label": "Last Magnetic Field Interference Date and Time", "code": "1,0-0:96.20.6.255" },
          { "label": "Currently Active Energy Tariff", "code": "1,0-0:96.14.0.255" }
        ]
      },

      {
        "name": "Display",
        "items": [
          { "label": "LCD Display ALL", "code": "1,0-0:96.13.128.255" }
        ]
      }
      
    
]







// Ensure BASE_URL and manualCategories are available in scope




// Ensure BASE_URL and manualCategories are available in scope

const ManualDisplayCaptureObjects = () => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [addedItems, setAddedItems] = useState([]);
  const [deviceId, setDeviceId] = useState(() => localStorage.getItem("selectedDeviceId"));
  const [selectedRow, setSelectedRow] = useState(null); // index of selected row in addedItems
  const rowRefs = useRef([]);

  // collapsedCategories behaves like Loadprofile: names present => collapsed
  const [collapsedCategories, setCollapsedCategories] = useState(() => {
    return new Set((manualCategories || []).map((c) => c.name));
  });

  useEffect(() => {
    const storedId = localStorage.getItem("selectedDeviceId");
    setDeviceId(storedId);
  }, []);

  /* -------------------------
     Helper: set of saved codes for quick checks
  -------------------------- */
  const savedCodes = useMemo(() => {
    return new Set((addedItems || []).map((it) => it.code));
  }, [addedItems]);

  /* -------------------------
     Single checkbox logic (mirrors Loadprofile behavior)
  -------------------------- */
  const handleCheckboxChange = async (category, label, code, checked) => {
    // If checking a box
    if (checked) {
      // If item is already saved on server, ensure it's NOT re-added to selectedItems
      if (savedCodes.has(code)) {
        setSelectedItems((prev) => prev.filter((s) => !(s.code === code)));
        return;
      }
      // Otherwise add to selectedItems (avoid duplicates)
      setSelectedItems((prev) => {
        const exists = prev.some((p) => p.code === code);
        if (exists) return prev;
        return [...prev, { category, label, code }];
      });
      return;
    }

    // If unchecking:
    // 1) If it's present in selectedItems (not saved yet) -> remove locally
    if (selectedItems.some((s) => s.code === code)) {
      setSelectedItems((prev) => prev.filter((s) => s.code !== code));
      return;
    }

    // 2) If item exists on server (savedCodes), confirm deletion and delete from server
    if (savedCodes.has(code)) {
      const saved = addedItems.find((it) => it.code === code);
      if (!saved || !saved.id) {
        // no server id => remove locally from addedItems
        setAddedItems((prev) => prev.filter((it) => it.code !== code));
        return;
      }

      const ok = window.confirm(`Remove saved item "${saved.name}"?`);
      if (!ok) return;

      try {
        await axios.delete(`${BASE_URL}/api/manual-display/${deviceId}/${saved.id}/`);
        await fetchManualDisplayData();
      } catch (err) {
        console.error("Failed to delete saved item", err);
        alert("Failed to delete saved item. Try again.");
      }
      return;
    }

    // fallback: remove from selectedItems
    setSelectedItems((prev) => prev.filter((s) => s.code !== code));
  };

  /* -------------------------
     Category-level toggle (select / deselect entire category)
     - when checked: select all items in category (but skip saved items)
     - when unchecked: remove newly-selected items from selectedItems, and if there are saved items in that category, confirm and delete them on server
  -------------------------- */
  const handleCategoryToggle = async (categoryObj, checked) => {
    const categoryName = categoryObj.name;
    const items = categoryObj.items || [];

    if (checked) {
      setSelectedItems((prev) => {
        const prevCodes = new Set(prev.map((p) => p.code));
        const toAdd = items
          .filter((it) => !savedCodes.has(it.code) && !prevCodes.has(it.code))
          .map((it) => ({ category: categoryName, label: it.label ?? it.name ?? it.code, code: it.code }));

        if (!toAdd.length) return prev;
        return [...prev, ...toAdd];
      });
      return;
    }

    // unchecked: remove newly-selected (not-saved) items from this category
    setSelectedItems((prev) => prev.filter((p) => p.category !== categoryName));

    // if there are saved items in this category, confirm and delete them on server
    const savedInCategory = (addedItems || []).filter((it) => it.category === categoryName);
    if (savedInCategory.length) {
      const ok = window.confirm(
        `This category has ${savedInCategory.length} saved item(s). Unchecking will DELETE them from the server. Proceed?`
      );
      if (!ok) return;

      try {
        await Promise.all(
          savedInCategory.map((it) =>
            axios.delete(`${BASE_URL}/api/manual-display/${deviceId}/${it.id}/`)
          )
        );
        await fetchManualDisplayData();
      } catch (err) {
        console.error("Failed to delete saved category items", err);
        alert("Failed to delete some saved items. Refresh and try again.");
        await fetchManualDisplayData();
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
     Fetch manual display data
  -------------------------- */
  const fetchManualDisplayData = async () => {
    if (!deviceId) return;
    try {
      const response = await axios.get(`${BASE_URL}/api/manual-display/${deviceId}/`);
      const list = response.data || [];
      setAddedItems(list);
      const preSelectedItems = list.map((item) => ({
        category: item.category,
        label: item.name,
        code: item.code,
        value: item.value || 100,
      }));
      setSelectedItems(preSelectedItems);
      setSelectedRow(null);
    } catch (error) {
      console.error("Error fetching manual display data:", error);
      setAddedItems([]);
      setSelectedItems([]);
      setSelectedRow(null);
    }
  };

  useEffect(() => {
    fetchManualDisplayData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  /* -------------------------
     Add / Insert / Delete / Clear (unchanged but kept)
  -------------------------- */
  const handleAdd = async () => {
    if (!deviceId) {
      alert("Select a device first.");
      return;
    }
    if (!selectedItems.length) {
      alert("Select at least one item to add.");
      return;
    }

    const itemsWithDeviceId = selectedItems.map((item) => ({
      category: item.category,
      name: item.label,
      code: item.code,
      device_id: deviceId,
      value: item.value || 100,
    }));

    try {
      await axios.post(`${BASE_URL}/api/manual-display/`, itemsWithDeviceId);
      await fetchManualDisplayData();
      setSelectedItems([]);
    } catch (error) {
      console.error("Error sending data:", error);
      alert("Failed to add items. See console.");
    }
  };

  const handleInsert = async () => {
    if (!deviceId) {
      alert("Select a device first.");
      return;
    }
    if (!selectedItems.length) {
      alert("Select at least one item to insert.");
      return;
    }

    const insertIndex = selectedRow === null ? addedItems.length : selectedRow + 1;

    const itemsToSend = selectedItems.map((item) => ({
      category: item.category,
      name: item.label,
      code: item.code,
      device_id: deviceId,
      value: item.value || 100,
    }));

    try {
      await axios.post(`${BASE_URL}/api/manual-display/`, itemsToSend);

      // Insert locally for instant feedback
      const newList = [...addedItems];
      const insertedObjs = itemsToSend.map((it) => ({
        name: it.name,
        code: it.code,
        category: it.category,
        value: it.value,
      }));
      newList.splice(insertIndex, 0, ...insertedObjs);
      setAddedItems(newList);
      setSelectedRow(insertIndex);
      await fetchManualDisplayData();
      setSelectedItems([]);
    } catch (error) {
      console.error("Error inserting items:", error);
      alert("Failed to insert items. See console.");
    }
  };

  const handleDelete = async () => {
    if (selectedRow === null) {
      alert("Please select a row to delete.");
      return;
    }

    const item = addedItems[selectedRow];
    if (!item) return;

    const ok = window.confirm("Are you sure you want to delete the selected item?");
    if (!ok) return;

    try {
      if (item.id) {
        await axios.delete(`${BASE_URL}/api/manual-display/${deviceId}/${item.id}/`);
        await fetchManualDisplayData();
      } else {
        const newList = addedItems.filter((_, i) => i !== selectedRow);
        setAddedItems(newList);
        setSelectedRow(null);
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete. See console.");
    }
  };

  const handleClear = async () => {
    const ok = window.confirm("Are you sure you want to clear all display items?");
    if (!ok) return;

    try {
      await axios.delete(`${BASE_URL}/api/manual-display/${deviceId}/clear/`);
      setAddedItems([]);
      setSelectedRow(null);
    } catch (error) {
      console.warn("Backend clear failed or endpoint not available, clearing locally.", error);
      setAddedItems([]);
      setSelectedRow(null);
    }
  };

  /* -------------------------
     moveItem: reorder local array and update selectedRow
     (mirrors Loadprofile behavior)
  -------------------------- */
  const moveItem = (fromIndex, toIndex) => {
    if (fromIndex == null || fromIndex === undefined) return;

    setAddedItems((prev) => {
      if (!Array.isArray(prev) || fromIndex < 0 || fromIndex >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      const insertIndex = Math.max(0, Math.min(toIndex, next.length));
      next.splice(insertIndex, 0, item);

      // update selectedRow to the new position
      setSelectedRow(insertIndex);
      return next;
    });
  };

  // Navigation handlers that REORDER rows
  const handleFirst = () => {
    if (selectedRow === null) {
      alert("Select a row");
      return;
    }
    if (selectedRow === 0) return;
    moveItem(selectedRow, 0);
  };

  const handlePrevious = () => {
    if (selectedRow === null) {
      alert("Select a row");
      return;
    }
    if (selectedRow <= 0) return;
    moveItem(selectedRow, selectedRow - 1);
  };

  const handleNext = () => {
    if (selectedRow === null) {
      alert("Select a row");
      return;
    }
    const lastIndex = addedItems.length - 1;
    if (selectedRow >= lastIndex) return;
    moveItem(selectedRow, selectedRow + 1);
  };

  const handleLast = () => {
    if (selectedRow === null) {
      alert("Select a row");
      return;
    }
    const lastIndex = addedItems.length - 1;
    if (selectedRow === lastIndex) return;
    moveItem(selectedRow, lastIndex);
  };

  // scroll into view when selection changes
  useEffect(() => {
    if (selectedRow !== null && rowRefs.current[selectedRow]) {
      rowRefs.current[selectedRow].scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedRow]);

  // button state helpers
  const hasSelected = selectedRow !== null;
  const atFirst = hasSelected && selectedRow === 0;
  const atLast = hasSelected && selectedRow === addedItems.length - 1;

  /* -------------------------
     UI
  -------------------------- */
  return (
    <div className="display-root" style={{ display: "flex", gap: 12 }}>
      {/* Left: categories (flex:1) */}
      <div className="sub_container_display" style={{ flex: 1, overflowY: "auto" }}>
        {manualCategories.map((category, index) => {
          const codesInCat = (category.items || []).map((it) => it.code);
          const allChecked =
            codesInCat.length > 0 &&
            codesInCat.every((c) => selectedItems.some((s) => s.code === c) || savedCodes.has(c));

          return (
            <div
              key={index}
              className="category-block"
              style={{ marginBottom: 12, border: "1px solid #f0f0f0", padding: 8, borderRadius: 6 }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={(e) => handleCategoryToggle(category, e.target.checked)}
                  />
                  <strong>{category.name}</strong>
                </div>

                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => toggleCollapseCategory(category.name)}
                    title={collapsedCategories.has(category.name) ? "Expand category" : "Collapse category"}
                    style={{ padding: "4px 6px", cursor: "pointer" }}
                  >
                    {collapsedCategories.has(category.name) ? "▸" : "◂"}
                  </button>
                </div>
              </div>

              {!collapsedCategories.has(category.name) && (
                <div style={{ marginTop: 8 }}>
                  {(category.items || []).map((item, idx) => {
                    // item.label or item.name depending on shape
                    const label = item.label ?? item.name ?? item.code;
                    const checked = selectedItems.some((s) => s.code === item.code) || savedCodes.has(item.code);

                    return (
                      <label key={idx} className="item-label" style={{ display: "block", margin: "6px 0" }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => handleCheckboxChange(category.name, label, item.code, e.target.checked)}
                        />
                        <span style={{ marginLeft: 8 }}>{label}</span>
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

      {/* Center: toolbar */}
      <div className="vertical-toolbar" >
        <button className="tool-btn" onClick={handleAdd} title="Add selected to end">
          <span className="tool-icon">+</span>
          <span className="tool-text">Add</span>
        </button>

        <button className="tool-btn" onClick={handleInsert} title="Insert after selected row">
          <span className="tool-icon red-dot"></span>
          <span className="tool-text">Insert</span>
        </button>

        <button className="tool-btn" onClick={handleDelete} title="Delete selected row" disabled={!hasSelected}>
          <span className="tool-icon">−</span>
          <span className="tool-text">Delete</span>
        </button>

        <button className="tool-btn" onClick={handleClear} title="Clear all" disabled={!addedItems.length}>
          <span className="tool-icon">×</span>
          <span className="tool-text">Clear</span>
        </button>

        <div className="tool-separator" style={{ height: 1, background: "#eee", margin: "8px 0" }} />

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

      {/* Right: table */}
      <div className="sub_container_display_2" style={{ flex: 1, overflowY: "auto" }}>
        <div className="display_table">
          <table className="tableTariff1" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #ddd", padding: 2, textAlign: "left" }}>Name</th>
                <th style={{ border: "1px solid #ddd", padding: 2, textAlign: "left" }}>Code</th>
              </tr>
            </thead>
            <tbody>
              {addedItems.length === 0 ? (
                <tr>
                  <td colSpan={2} style={{ padding: 8 }}>No items</td>
                </tr>
              ) : (
                addedItems.map((item, index) => (
                  <tr
                    key={item.id ?? index}
                    ref={(el) => (rowRefs.current[index] = el)}
                    className={selectedRow === index ? "selected-row" : ""}
                    onClick={() => setSelectedRow(index)}
                    style={{
                      background: selectedRow === index ? "#eef" : "",
                      cursor: "pointer",
                    }}
                  >
                    <td style={{ padding: 1, borderBottom: "1px solid #f0f0f0" }}>{item.name}</td>
                    <td style={{ padding: 1, borderBottom: "1px solid #f0f0f0" }}>{item.code}</td>
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




const ScrollableCaptureObjects1 = () => {
  const [selectedItems, setSelectedItems] = useState([]);
 
  

  const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));
 
  useEffect(() => {
    const storedId = localStorage.getItem('selectedDeviceId');
    setDeviceId(storedId);
  }, []);
  
  
  const [addedItems, setAddedItems] = useState([]);

  const handleCheckboxChange = (categoryName, label, code, checked) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, { category: categoryName, label, code }]);
    } else {
      setSelectedItems((prev) => prev.filter((item) => !(item.label === label && item.code === code)));
    }
  };


  const fetchScrollData = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/scroll-display/${deviceId}/`);
      setAddedItems(response.data);
       // Pre-select items that are already in the backend
  const preSelectedItems = response.data.map((item) => ({
    category: item.category,
    label: item.name,
    code: item.code,
    value: item.value || 100
  }));

  setSelectedItems(preSelectedItems);
    } catch (error) {
      console.error("Error fetching scroll display data:", error);
    }
  };

  


  useEffect(() => {
    fetchScrollData()
  }, []);


  const handleAdd = async () => { 
    const itemsWithDeviceId = selectedItems.map(item => ({
      category:item.category, 
      name:item.label,
      code:item.code,
      device_id: deviceId, // Replace with the actual device ID
      value: item.value || 100 // Include value, default to empty string if not provided
    })); 
    try {
      const response = await axios.post(`${BASE_URL}/api/scroll-display/`, itemsWithDeviceId);
      console.log("Data sent successfully:", response.data);
      fetchScrollData()
      
      setSelectedItems([]); // Clear selected items after adding
    } catch (error) {
      console.error("Error sending data:", error);
    }
  };

  const handleSave = () => {
    console.log("Selected Items:", addedItems);
    // You can further process or save `addedItems` as needed
  };

  return (
    <>
    <div className="display-root"> 
    <div className="sub_container_display">
      {categories.map((category, index) => (
        <div key={index}>
          <label>
            <input type="checkbox" /> {category.name}
          </label>
          <div style={{ textAlign: "start", border: "1px solid black", padding: "10px", marginBottom: "10px" }}>
            {category.items.map((item, idx) => (
              <label key={idx} style={{ display: "block" }}>
                <input
                  type="checkbox"
                  checked={selectedItems.some(selected => selected.label === item.label && selected.code === item.code)}
                  onChange={(e) => handleCheckboxChange(category.name, item.label, item.code, e.target.checked)}
                />{" "}
                {item.label} ({item.code})
              </label>
            ))}
          </div>
        </div>
      ))}
     
     </div>

      <div className="vertical-toolbar">
        {/* Action buttons */}
        <button className="tool-btn" onClick={handleAdd} title="Add selected to end">
          <span className="tool-icon">+</span>
          <span className="tool-text">Add</span>
        </button>

        <button className="tool-btn"  title="Insert after selected row">
          <span className="tool-icon red-dot"></span>
          <span className="tool-text">Insert</span>
        </button>

        <button className="tool-btn"  title="Delete selected row">
          <span className="tool-icon">−</span>
          <span className="tool-text">Delete</span>
        </button>

        <button className="tool-btn"  title="Clear all">
          <span className="tool-icon">×</span>
          <span className="tool-text">Clear</span>
        </button>

        <div className="tool-separator" />

        {/* Navigation buttons */}
        <button className="tool-btn"  title="First">
          <span className="tool-icon">|◀</span>
          <span className="tool-text">First</span>
        </button>

        <button className="tool-btn"  title="Previous">
          <span className="tool-icon">◀</span>
          <span className="tool-text">Previous</span>
        </button>

        <button className="tool-btn"  title="Next">
          <span className="tool-icon">▶</span>
          <span className="tool-text">Next</span>
        </button>

        <button className="tool-btn"  title="Last">
          <span className="tool-icon">▶|</span>
          <span className="tool-text">Last</span>
        </button>
      </div>

 <div className="sub_container_display_2"> 
     


      <div className="display_table">
 
  <table>
    <thead>
      <tr>
        
        <th style={{ border: "1px solid #ddd",padding:'10px'}}>name</th>
        <th style={{ border: "1px solid #ddd",padding:'10px'}}>Code</th>
      </tr>
    </thead>
    <tbody>
      {addedItems.map((item, index) => (
        <tr key={index}>
         
          <td >{item.name}</td>
          <td >{item.code}</td>
        </tr>
      ))}
    </tbody>
  </table>
  </div>
  </div>
  </div>


  </>  
    
  );
};




// Make sure BASE_URL and categories are available in the file's scope

const ScrollableCaptureObjects = () => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [deviceId, setDeviceId] = useState(() => localStorage.getItem("selectedDeviceId"));
  const [addedItems, setAddedItems] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null); // index of selected row
  const rowRefs = useRef([]);

  useEffect(() => {
    const storedId = localStorage.getItem("selectedDeviceId");
    setDeviceId(storedId);
  }, []);

  const handleCheckboxChange = (categoryName, label, code, checked) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, { category: categoryName, label, code }]);
    } else {
      setSelectedItems((prev) => prev.filter((item) => !(item.label === label && item.code === code)));
    }
  };

  const fetchScrollData = async () => {
    if (!deviceId) return;
    try {
      const response = await axios.get(`${BASE_URL}/api/scroll-display/${deviceId}/`);
      const list = response.data || [];
      setAddedItems(list);

      // Pre-select items that are already in the backend
      const preSelectedItems = list.map((item) => ({
        category: item.category,
        label: item.name,
        code: item.code,
        value: item.value || 100,
      }));
      setSelectedItems(preSelectedItems);
      setSelectedRow(null);
    } catch (error) {
      console.error("Error fetching scroll display data:", error);
      setAddedItems([]);
      setSelectedItems([]);
      setSelectedRow(null);
    }
  };

  useEffect(() => {
    fetchScrollData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  const handleAdd = async () => {
    if (!deviceId) {
      alert("Select a device first.");
      return;
    }
    if (!selectedItems.length) {
      alert("Select at least one item to add.");
      return;
    }

    const itemsWithDeviceId = selectedItems.map((item) => ({
      category: item.category,
      name: item.label,
      code: item.code,
      device_id: deviceId,
      value: item.value || 100,
    }));

    try {
      await axios.post(`${BASE_URL}/api/scroll-display/`, itemsWithDeviceId);
      await fetchScrollData();
      setSelectedItems([]); // Clear selected items after adding
    } catch (error) {
      console.error("Error sending data:", error);
      alert("Failed to add items. See console.");
    }
  };

  // Optional insert (append after selectedRow). If no selectedRow, append.
  const handleInsert = async () => {
    if (!deviceId) {
      alert("Select a device first.");
      return;
    }
    if (!selectedItems.length) {
      alert("Select at least one item to insert.");
      return;
    }

    const insertIndex = selectedRow === null ? addedItems.length : selectedRow + 1;
    const itemsToSend = selectedItems.map((item) => ({
      category: item.category,
      name: item.label,
      code: item.code,
      device_id: deviceId,
      value: item.value || 100,
    }));

    try {
      await axios.post(`${BASE_URL}/api/scroll-display/`, itemsToSend);

      // Local optimistic insert for immediate feedback (we re-fetch afterwards)
      const newList = [...addedItems];
      const insertedObjs = itemsToSend.map((it) => ({ name: it.name, code: it.code, category: it.category, value: it.value }));
      newList.splice(insertIndex, 0, ...insertedObjs);
      setAddedItems(newList);
      setSelectedRow(insertIndex);
      await fetchScrollData();
      setSelectedItems([]);
    } catch (err) {
      console.error("Error inserting items:", err);
      alert("Failed to insert items. See console.");
    }
  };

  const handleDelete = async () => {
    if (selectedRow === null) {
      alert("Please select a row to delete.");
      return;
    }

    const item = addedItems[selectedRow];
    if (!item) return;

    const ok = window.confirm("Are you sure you want to delete the selected item?");
    if (!ok) return;

    try {
      if (item.id) {
        await axios.delete(`${BASE_URL}/api/scroll-display/${deviceId}/${item.id}/`);
        await fetchScrollData();
      } else {
        // remove locally if no server id
        const newList = addedItems.filter((_, i) => i !== selectedRow);
        setAddedItems(newList);
        setSelectedRow(null);
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete. See console.");
    }
  };

  const handleClear = async () => {
    const ok = window.confirm("Are you sure you want to clear all scroll display items?");
    if (!ok) return;

    try {
      await axios.delete(`${BASE_URL}/api/scroll-display/${deviceId}/clear/`);
      setAddedItems([]);
      setSelectedRow(null);
    } catch (error) {
      console.warn("Backend clear failed or endpoint not available, clearing locally.", error);
      setAddedItems([]);
      setSelectedRow(null);
    }
  };

  /* -------------------------
     moveItem: reorder local array and update selectedRow
     (same behavior as ManualDisplay / LoadProfile)
  -------------------------- */
  const moveItem = (fromIndex, toIndex) => {
    if (fromIndex == null || fromIndex === undefined) return;
    setAddedItems((prev) => {
      if (!Array.isArray(prev) || fromIndex < 0 || fromIndex >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      const insertIndex = Math.max(0, Math.min(toIndex, next.length));
      next.splice(insertIndex, 0, item);
      // update selected row inside updater so it stays consistent with new array
      // (this is ok — React will batch)
      setSelectedRow(insertIndex);
      return next;
    });
  };

  const handleFirst = () => {
    if (selectedRow === null) {
      alert("Select a row");
      return;
    }
    if (selectedRow === 0) return;
    moveItem(selectedRow, 0);
  };

  const handlePrevious = () => {
    if (selectedRow === null) {
      alert("Select a row");
      return;
    }
    if (selectedRow <= 0) return;
    moveItem(selectedRow, selectedRow - 1);
  };

  const handleNext = () => {
    if (selectedRow === null) {
      alert("Select a row");
      return;
    }
    const lastIndex = (addedItems || []).length - 1;
    if (selectedRow >= lastIndex) return;
    moveItem(selectedRow, selectedRow + 1);
  };

  const handleLast = () => {
    if (selectedRow === null) {
      alert("Select a row");
      return;
    }
    const lastIndex = (addedItems || []).length - 1;
    if (selectedRow === lastIndex) return;
    moveItem(selectedRow, lastIndex);
  };

  // auto-scroll selected row into view
  useEffect(() => {
    if (selectedRow !== null && rowRefs.current[selectedRow]) {
      rowRefs.current[selectedRow].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedRow]);

  const hasSelected = selectedRow !== null;
  const atFirst = hasSelected && selectedRow === 0;
  const atLast = hasSelected && selectedRow === (addedItems || []).length - 1;

  return (
    <>
      <div className="display-root" style={{ display: "flex", gap: 12 }}>
        <div className="sub_container_display" style={{ flex: 1, overflowY: "auto" }}>
          {categories.map((category, index) => (
            <div key={index} style={{ marginBottom: 12, border: "1px solid #f0f0f0", padding: 8, borderRadius: 6 }}>
              <label style={{ display: "block", marginBottom: 6 }}>
                <input type="checkbox" /> <strong>{category.name}</strong>
              </label>

              <div style={{ textAlign: "start", border: "1px solid #ddd", padding: 10, marginBottom: 10 }}>
                {category.items.map((item, idx) => (
                  <label key={idx} style={{ display: "block", margin: "6px 0" }}>
                    <input
                      type="checkbox"
                      checked={selectedItems.some((selected) => selected.label === item.label && selected.code === item.code)}
                      onChange={(e) => handleCheckboxChange(category.name, item.label, item.code, e.target.checked)}
                    />{" "}
                    {item.label} ({item.code})
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="vertical-toolbar" >
          <button className="tool-btn" onClick={handleAdd} title="Add selected to end">
            <span className="tool-icon">+</span>
            <span className="tool-text">Add</span>
          </button>

          <button className="tool-btn" onClick={handleInsert} title="Insert after selected row">
            <span className="tool-icon red-dot"></span>
            <span className="tool-text">Insert</span>
          </button>

          <button className="tool-btn" onClick={handleDelete} title="Delete selected row" disabled={!hasSelected}>
            <span className="tool-icon">−</span>
            <span className="tool-text">Delete</span>
          </button>

          <button className="tool-btn" onClick={handleClear} title="Clear all" disabled={!addedItems.length}>
            <span className="tool-icon">×</span>
            <span className="tool-text">Clear</span>
          </button>

          <div className="tool-separator" style={{ height: 1, background: "#eee", margin: "8px 0" }} />

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

        <div className="sub_container_display_2" style={{ flex: 1, overflowY: "auto" }}>
          <div className="display_table">
            <table className="tableTariff1">
              <thead>
                <tr>
                  <th style={{ border: "1px solid #ddd", padding: 2 }}>name</th>
                  <th style={{ border: "1px solid #ddd", padding: 2 }}>Code</th>
                </tr>
              </thead>
              <tbody>
                {(addedItems || []).length === 0 ? (
                  <tr>
                    <td colSpan={2} style={{ padding: 8 }}>No items</td>
                  </tr>
                ) : (
                  addedItems.map((item, index) => (
                    <tr
                      key={item.id ?? index}
                      ref={(el) => (rowRefs.current[index] = el)}
                      className={selectedRow === index ? "selected-row" : ""}
                      onClick={() => setSelectedRow(index)}
                      style={{
                        background: selectedRow === index ? "#eef" : "",
                        cursor: "pointer",
                      }}
                    >
                      <td style={{ padding: 1, borderBottom: "1px solid #f0f0f0" }}>{item.name}</td>
                      <td style={{ padding: 1, borderBottom: "1px solid #f0f0f0" }}>{item.code}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};




const LcdDisplayFormat = () => {
  const [lcdData, setLcdData] = useState([
    { name: "Energy Leading Zero", value: "Disable", type: "select", options: ["Enable", "Disable"] },
    { name: "Energy Decimal", value: 2, type: "number" },
    { name: "Power Decimal", value: 3, type: "number" },
    { name: "Current Decimal", value: 3, type: "number" },
    { name: "Voltage Decimal", value: 1, type: "number" },
    { name: "Date Format", value: "DD-MM-YY", type: "select", options: ["DD-MM-YY", "MM-DD-YY", "YY-MM-DD"] },
    { name: "Time Format", value: "HH-MM-SS", type: "select", options: ["HH:MM:SS", "HH-MM-SS", "MM-HH-SS"] }
  ]);
  
  
  const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));
 
  useEffect(() => {
    const storedId = localStorage.getItem('selectedDeviceId');
    setDeviceId(storedId);
  }, []);
  



  // Function to fetch LCD data
  const fetchLcdData1 = (deviceId) => {

    axios
    .get(`${BASE_URL}/api/lcd-display-format/${deviceId}/`)
    .then((response) => {
      const data = response.data;
      console.log("fetch_data",data)
      if (data && Array.isArray(data)) {
        const updatedLcdData = lcdData.map((item) => {
          const match = data.find((d) => d.device_id === item.device_id);
          if (match) {
            return { ...item, value: match[item.name.toLowerCase().replace(/ /g, "_")] || item.value };
          }
          return item;
        });
        console.log(updatedLcdData)
        setLcdData(updatedLcdData);
      }
    })
    .catch((error) => {
      console.error("Error fetching LCD data:", error);
    })
   
    }


    const fetchLcdData = (deviceId) => {
      axios
        .get(`${BASE_URL}/api/lcd-display-format/${deviceId}/`)
        .then((response) => {
          const data = response.data;
          console.log("fetch_data", data);
    
          // Ensure data is in the correct format and array
          if (data && Array.isArray(data) && data.length > 0) {
            const deviceData = data[0]; // Get the first entry since the array has one object
    
            const updatedLcdData = lcdData.map((item) => {
              // Match the LCD data with backend data by the name, converted to lowercase and underscores
              const key = item.name.toLowerCase().replace(/ /g, "_");
              
              // If there's a match in the fetched data, update it
              if (deviceData[key] !== undefined) {
                return { ...item, value: deviceData[key] };
              }
    
              return item; // If no match, keep the current item
            });
    
            console.log("Updated LCD data", updatedLcdData);
            setLcdData(updatedLcdData); // Update state with fetched data
          } else {
            console.error("No valid data found in the response");
          }
        })
        .catch((error) => {
          console.error("Error fetching LCD data:", error);
        });
    };
    
  // Trigger the fetchLcdData function when component mounts or deviceId changes


  useEffect(() => {
    if (deviceId) {
      fetchLcdData(deviceId);
    }
  }, [deviceId]);





  const handleChange = (index, newValue) => {
    setLcdData((prevData) =>
      prevData.map((item, i) => (i === index ? { ...item, value: newValue } : item))
    );
  };

  const handleSave = () => {
    const updatedData = [{
      device_id: deviceId, // Include the device ID
      energy_leading_zero: lcdData.find(item => item.name === 'Energy Leading Zero')?.value,
      energy_decimal: parseInt(lcdData.find(item => item.name === 'Energy Decimal')?.value, 10), // Convert to integer
      power_decimal: parseInt(lcdData.find(item => item.name === 'Power Decimal')?.value, 10), // Convert to integer
      current_decimal: parseInt(lcdData.find(item => item.name === 'Current Decimal')?.value, 10), // Convert to integer
      voltage_decimal: parseInt(lcdData.find(item => item.name === 'Voltage Decimal')?.value, 10), // Convert to integer
      date_format: lcdData.find(item => item.name === 'Date Format')?.value,
      time_format: lcdData.find(item => item.name === 'Time Format')?.value,
    }];
  
    // POST request to send updated data
    axios
      .post(`${BASE_URL}/api/lcd-display-format/`, updatedData)
      .then((response) => {
        console.log("Data saved successfully:", response.data);
        fetchLcdData()
        alert("LCD Display Format saved successfully!");
      })
      .catch((error) => {
        console.error("Error saving data:", error);
        alert("Failed to save LCD Display Format.");
      });
  };
  
  
  return (
    <div className="display-root-lcd" >
     
      <table
      className="tableTariff2"
      >
        <thead>
          <tr>
            <th >Name</th>
            <th >Value</th>
          </tr>
        </thead>
        <tbody>
          {lcdData.map((item, index) => (
            <tr key={index}>
              <td>{item.name}</td>
              <td>
                {item.type === "select" ? (
                  <select
                    value={item.value}
                    onChange={(e) => handleChange(index, e.target.value)}
                    style={{ padding: "1%" ,width: "100%"}}
                  >
                    {item.options.map((option, idx) => (
                      <option key={idx} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    value={item.value}
                    onChange={(e) => handleChange(index, e.target.value)}
                    style={{ padding: "1%", width: "100%" }}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="lcd-save-button-container"> 
      <button style={{marginLeft:"40%"}} className="scheduler-add-button" onClick={handleSave} >
        Save
      </button>
      </div>
    </div>
  );
};



  





const DisplayParameters1 = () => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [parameters, setParameters] = useState(

    [
      { no: 1, name: "Auto display scroll interval", code: "(3,1-0:35.5.0.255)", unit: "s" },
      { no: 2, name: "Manual display interval", code: "(3,1-0:35.5.0.256)", unit: "s" },
    


  ]);
  

  
  const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));
 
  useEffect(() => {
    const storedId = localStorage.getItem('selectedDeviceId');
    setDeviceId(storedId);
  }, []);
  



  // Handle checkbox selection
  const handleCheckboxChange = (no, checked) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, no]);
    } else {
      setSelectedItems((prev) => prev.filter((item) => item !== no));
    }
  };

 

  // Fetch display parameters based on device ID
  const fetchDisplayParameters = async () => {
    if (!deviceId) return;

    try {
      const response = await axios.get(`${BASE_URL}/api/display-parameters/${deviceId}/`);
      setParameters(response.data);
    } catch (error) {
      console.error("Error fetching display parameters:", error);
    }
  };

  return (
    <div   className="display-root-lcd">
    

     

      <table style={{marginTop:"5%"}} className="tableTariff1"  >
        <thead>
          <tr>
            <th>Checked</th>
            <th>No</th>
            <th>Name</th>
            <th>Code</th>
            <th>Value</th>
            <th>Unit</th>
          </tr>
        </thead>
        <tbody>
          {parameters.map((param, index) => (
            <tr key={index}>
              <td>
                <input
                  type="checkbox"
                  onChange={(e) => handleCheckboxChange(index + 1, e.target.checked)}
                />
              </td>
              <td>{index + 1}</td>
              <td>{param.name}</td>
              <td>{param.code}</td>
              <td>{param.value}</td>
              <td>{param.unit}</td>
            </tr>
          ))}
        </tbody>
      </table>
       <div className="lcd-save-button-container">
       
        <button style={{marginLeft:"40%"}} className="scheduler-add-button" onClick={fetchDisplayParameters}>Get Values</button>
      </div>
    </div>
  );
};





const DisplayParameters = () => {
  const [apiData, setApiData] = useState([]);

  const [deviceId, setDeviceId] = useState(() =>
    localStorage.getItem("selectedDeviceId")
  );

  const [rows, setRows] = useState([
    {
      checked: false,
      no: 1,
      name: "Auto display scroll interval",
      code: "(3,1-0:35.5.0.255)",
      value: "",
      unit: "s",
    },
    {
      checked: false,
      no: 2,
      name: "Manual display interval",
      code: "(3,1-0:35.5.0.256)",
      value: "",
      unit: "s",
    },
  ]);

  useEffect(() => {
    const storedId = localStorage.getItem("selectedDeviceId");
    setDeviceId(storedId);
  }, []);

  const handleCheckboxChange = (index) => {
    setRows((prevRows) =>
      prevRows.map((row, i) =>
        i === index ? { ...row, checked: !row.checked } : row
      )
    );
  };

  const handleSelectAll = (e) => {
    const isChecked = e.target.checked;

    setRows((prevRows) =>
      prevRows.map((row) => ({
        ...row,
        checked: isChecked,
      }))
    );
  };

  const fetchDisplayParameters = async () => {
    if (!deviceId) {
      alert("Device ID not found");
      return;
    }

    const selectedItems = rows.filter((row) => row.checked);

    if (selectedItems.length === 0) {
      alert("Please select at least one item");
      return;
    }

    try {
      const payload = {
        device_id: deviceId,
        action: "read_obis",
        serial_number: localStorage.getItem("serial_number") || "",
        parameters: selectedItems.map((item) => ({
          name: item.name,
          code: item.code,
          value: item.value || "",
          unit: item.unit || "",
        })),
      };

      console.log("Display Payload:", payload);

      const response = await axios.post(
        `${BASE_URL}/api/display-parameters/`,
        payload
      );

      console.log("Display Response:", response.data);

      setApiData(response.data.data || []);
    } catch (error) {
      console.error("Error fetching display parameters:", error);
      if (error.response) {
        console.log("Backend Error:", error.response.data);
      }
    }
  };

  const getValueByCode = (code) => {
    const found = apiData.find((item) => item.code === code);
    return found ? found.value : "";
  };

  return (
    <div className="display-root-lcd">
       <div className="lcd-save-button-container">
        <button
          style={{ marginLeft: "60%" }}
          className="scheduler-add-button"
          onClick={fetchDisplayParameters}
        >
          Read
        </button>
      </div>
      <table style={{ marginTop: "5%" }} className="tableTariff1">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={rows.length > 0 && rows.every((row) => row.checked)}
                onChange={handleSelectAll}
              />
            </th>
            <th>No</th>
            <th>Name</th>
            <th>Code</th>
            <th>Value</th>
            <th>Unit</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((param, index) => (
            <tr key={param.no}>
              <td>
                <input
                  type="checkbox"
                  checked={param.checked}
                  onChange={() => handleCheckboxChange(index)}
                />
              </td>
              <td>{param.no}</td>
              <td>{param.name}</td>
              <td>{param.code}</td>
              <td>{getValueByCode(param.code) || param.value}</td>
              <td>{param.unit}</td>
            </tr>
          ))}
        </tbody>
      </table>

     
    </div>
  );
};




const Display = () => {
  const [view, setView] = useState("manual"); // Default to Manual Display

  return (
    <div className="Display_Container">
      <div
  className="view-toggle"
  role="tablist"
  aria-label="Display view selection"
>
  <button
    type="button"
    role="tab"
    aria-pressed={view === "manual"}
    className={`view-btn ${view === "manual" ? "active" : ""}`}
    onClick={() => setView("manual")}
  >
    Manual Display
  </button>

  <button
    type="button"
    role="tab"
    aria-pressed={view === "scrollable"}
    className={`view-btn ${view === "scrollable" ? "active" : ""}`}
    onClick={() => setView("scrollable")}
  >
    Scrollable Display
  </button>

  <button
    type="button"
    role="tab"
    aria-pressed={view === "lcd"}
    className={`view-btn ${view === "lcd" ? "active" : ""}`}
    onClick={() => setView("lcd")}
  >
    LCD Display Format
  </button>

  <button
    type="button"
    role="tab"
    aria-pressed={view === "parameters"}
    className={`view-btn ${view === "parameters" ? "active" : ""}`}
    onClick={() => setView("parameters")}
  >
    Display Parameters
  </button>
</div>

      <div> 
        {view === "manual" && <ManualDisplayCaptureObjects />}
        {view === "scrollable" && <ScrollableCaptureObjects />}
        {view === "lcd" && <LcdDisplayFormat />}
        {view === "parameters" && <DisplayParameters />}
      </div>
    </div>
  );
};

export default Display;






