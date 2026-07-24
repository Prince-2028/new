import React, { useState, useEffect } from 'react';
import BASE_URL from '../../apiConfig'; // Adjust path based on your file structure
import './index.css';

const filters = [
    { id: 1, name: 'Standard Event Log Report Filter' },
    { id: 2, name: 'Fraud Event Log Report Filter' },
    { id: 3, name: 'Relay Control Log Report Filter' },
    { id: 4, name: 'Power Quality Log Report Filter' },
    { id: 5, name: 'Communication Log Report Filter' },
    { id: 6, name: 'Self Define Log Report Filter' }
];

const EventReportFilter = () => {
    const [activeFilter, setActiveFilter] = useState(filters[0].id);
    const [filterData, setFilterData] = useState([]);
    const [loading, setLoading] = useState(false);


      const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));

      useEffect(() => {
        const storedId = localStorage.getItem('selectedDeviceId');
        setDeviceId(storedId);
      }, []);


    const handleFilterClick = (id) => {
        setActiveFilter(id);
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Map activeFilter to filter type string
                const filterTypes = {
                    1: 'standard',
                    2: 'fraud',
                    3: 'relay',
                    4: 'power',
                    5: 'communication',
                    6: 'custom'
                };

                const filterType = filterTypes[activeFilter];
                const url = `${BASE_URL}/api/get-event-report-filter/${deviceId}/${filterType}/`;

                const response = await fetch(url);
                const data = await response.json();
                setFilterData(data);
            } catch (error) {
                console.error('Error fetching filter data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activeFilter, deviceId]); // Fetch data when active filter or device ID changes

    const renderTable = () => {
        if (loading) {
            return <p>Loading...</p>;
        }

        return (
            <table className="tableTariff1">
                <thead>
                    <tr>
                        <th>Checked</th>
                        <th>Bit</th>
                        <th>Name</th>
                    </tr>
                </thead>
                <tbody>
                    {filterData.length > 0 ? (
                        filterData.map((item) => (
                            <tr key={item.id}>
                                <td>
                                    <input 
                                        type="checkbox" 
                                        checked={item.checked} 
                                        onChange={() => {}} 
                                    />
                                </td>
                                <td>{item.bit}</td>
                                <td>{item.name}</td>
                            </tr>
                        ))
                    ) : (
                        // If no data is available, show empty rows (just the header)
                        <tr>
                            <td colSpan="3" className="no-data">No data available</td>
                        </tr>
                    )}
                </tbody>
            </table>
        );
    };

    return (
        <div className='relay-container'>
            <div
  className="view-toggle"
  role="tablist"
  aria-label="Filter selection"
>
  {filters.map((filter) => (
    <button
      key={filter.id}
      type="button"
      role="tab"
      aria-pressed={activeFilter === filter.id}
      className={`view-btn ${
        activeFilter === filter.id ? "active" : ""
      }`}
      onClick={() => handleFilterClick(filter.id)}
    >
      {filter.name}
    </button>
  ))}
</div>
            <div className="filter-content">
                <h2>{filters.find(f => f.id === activeFilter).name}</h2>
                {renderTable()}
            </div>
        </div>
    );
};

export default EventReportFilter;

