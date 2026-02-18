import React, { useState } from 'react';
import './Table.css';
import { IoIosCloseCircle } from "react-icons/io";
import { TbPlayerTrackNextFilled } from "react-icons/tb";
import { TbPlayerTrackPrevFilled } from "react-icons/tb";
import { FaSearchengin } from "react-icons/fa";
import BASE_URL from '../../apiConfig'; // Adjust path based on your file structure

const Logs = ({ closeLogPopup }) => {
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [selectedField, setSelectedField] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDetailsPopupOpen, setIsDetailsPopupOpen] = useState(false);
  const rowsPerPage = 10;

  const data = Array.from({ length: 100 }, (_, index) => ({
    id: index + 1,
    name: `user${index + 1}`,
    age: 20 + (index % 30),
    date: `2023-06-${String(index + 1).padStart(2, '0')}`,
    configuration: ['Meter Identifier', 'Meter Version', 'Meterological Parameter'][index % 3],
    status: ['Success', 'Failure'][index % 2],
    type: ['getRequest', 'setRequest'][index % 2],
    meterVersion: 'Value',
    midFirmware1: `010${index % 10}`,
    midFirmware2: `0000DC${(index % 1000).toString(16).toUpperCase()}`,
    appFirmware1: `010${index % 10}`,
    appFirmware2: `103D${(index % 10000).toString(16).toUpperCase()}`,
  }));


 

  const handleRowClick = (rowId) => {
    setSelectedRowId(rowId);
    setIsDetailsPopupOpen(true)
    
  };

  const handleFieldChange = (event) => {
    setSelectedField(event.target.value);
    
    setSearchTerm(''); // Clear search term when field changes
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
   
  };

  const handleNextPage = () => {
    if (currentPage < Math.ceil(filteredData.length / rowsPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const options = [
    { value: 'name', label: 'Username' },
    { value: 'age', label: 'Serial Number' },
    { value: 'configuration', label: 'Configuration' },
    { value: 'status', label: 'Status' },
  ];

  const filteredData = data.filter((row) => {
    if (!selectedField || !searchTerm.trim()) return true; // No filtering if no field is selected or search term is empty
    return row[selectedField]
      .toString()
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
      
  });

  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const closePopupOutside = (e) => {
    if (e.target.classList.contains('logpopup')) {
      closeLogPopup();
    }
  };

  const closePopupDeatils = (e) => {
    if (e.target.className==="pop_up_Details") {
      setIsDetailsPopupOpen(false);
    }
  };



  return (
    <div className="logpopup" onClick={closePopupOutside}>
      <div className="logpopup-container">
      <div className='port-header'>
          <h1 style={{ fontSize: '18px', marginLeft: '5px' }}>Settings</h1>
          <IoIosCloseCircle onClick={() =>  closeLogPopup()} style={{ fontSize: '30px' }} />
        </div>
        <div className="LogscontrolsContainer">           
          <div>
            <div className="selectContainer">
              <select className='select_field'  value={selectedField} onChange={handleFieldChange}>
                <option value="">Select Field</option>
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              <div className="searchContainer">
  <input
    type="text"
    className="searchInput"
    placeholder="Search.."
    value={searchTerm}
    onChange={handleSearchChange}
  />
  <FaSearchengin className="searchIcon" />
</div>


              
              
              
             
            </div>
           
          </div>
          <div className="controlsGroup">
            <button style={{marginRight:'2%'}} className="Logs_button" onClick={handlePrevPage}>
            <TbPlayerTrackPrevFilled/>  Previous Page 
            </button>
            <button className="Logs_button" onClick={handleNextPage}>
              Next Page  <TbPlayerTrackNextFilled/>
            </button>
          </div>
        </div>
        <div className="contentContainer">
          <div className="tableContainer">
            <table className="table">
              <thead>
                <tr className="tr">
                  <th className="th">Number</th>
                  <th className="th">Username</th>
                  <th className="th">Serial Number</th>
                  <th className="th">Date</th>
                  <th className="th">Configuration</th>
                  <th className="th">Status</th>
                  <th className="th">Type</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() =>   handleRowClick(row.id)}
                    className={`tr ${selectedRowId === row.id ? 'highlight' : ''}`}
                  >
                    <td className="td">{row.id}</td>
                    <td className="td">{row.name}</td>
                    <td className="td">{row.age}</td>
                    <td className="td">{row.date}</td>
                    <td className="td">{row.configuration}</td>
                    <td className="td">{row.status}</td>
                    <td className="td">{row.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="infoContainer">

          {isDetailsPopupOpen && ( <> 
            {data.find((row) => row.id === selectedRowId) && (
              <>
              <div className='pop_up_Details' onClick={closePopupDeatils}>  
                <div className='Details_Container'>
                <div className="infoItem">
                  <span className="infoLabel">Meter Version</span>
                  <span className="infoValue">
                   : {data.find((row) => row.id === selectedRowId).meterVersion}
                  </span>
                </div>
                <div className="infoItem">
                  <span className="infoLabel">MID Firmware 1</span>
                  <span className="infoValue">
                  : {data.find((row) => row.id === selectedRowId).midFirmware1}
                  </span>
                </div>
                <div className="infoItem">
                  <span className="infoLabel">MID Firmware 2</span>
                  <span className="infoValue">
                  :  {data.find((row) => row.id === selectedRowId).midFirmware2}
                  </span>
                </div>
                <div className="infoItem">
                  <span className="infoLabel">APP Firmware 1</span>
                  <span className="infoValue">
                  :  {data.find((row) => row.id === selectedRowId).appFirmware1}
                  </span>
                </div>
                <div className="infoItem">
                  <span className="infoLabel">APP Firmware 2</span>
                  <span className="infoValue">
                  :  {data.find((row) => row.id === selectedRowId).appFirmware2}
                  </span>
                </div>
                </div>
                </div>
              </>
            )}
          </>)}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Logs;
