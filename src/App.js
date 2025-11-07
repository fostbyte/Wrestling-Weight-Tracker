import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Search, Plus, Upload, Home, Edit } from 'lucide-react';

const LennardWrestlingApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [currentPage, setCurrentPage] = useState('home');
  const [wrestlers, setWrestlers] = useState([]);
  const [weightData, setWeightData] = useState([]);
  const [showGraph, setShowGraph] = useState(false);
  const [singleLineMode, setSingleLineMode] = useState(false);

  // Home page state
  const [selectedWrestler, setSelectedWrestler] = useState('');
  const [weight, setWeight] = useState('');
  const [weightType, setWeightType] = useState('before');
  const [customDate, setCustomDate] = useState('');
  const [filteredWrestlers, setFilteredWrestlers] = useState([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  // New wrestler state
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newWeight, setNewWeight] = useState('');
  const [newSex, setNewSex] = useState('Male');

  // Search/Edit state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  // const [editingEntry, setEditingEntry] = useState(null);

  // Date range for graph
  const [startDate, setStartDate] = useState('2024-11-10');
  const [endDate, setEndDate] = useState('2025-11-30');

  // Loading animation and notification
  const [isAddingWrestler, setIsAddingWrestler] = useState(false);
  const [notification, setNotification] = useState(null); // For on-site messages
  const [isGraphLoading, setIsGraphLoading] = useState(false);


  // load graph
  const [lastGraphLoad, setLastGraphLoad] = useState(Date.now());

  


  // Apps Script configuration
  const APPS_SCRIPT_URL = process.env.REACT_APP_APPS_SCRIPT_URL;

  useEffect(() => {
    if (isAuthenticated) {
      loadWrestlers();
      loadWeightData();
    }
  }, [isAuthenticated, loadWrestlers, loadWeightData]);

  useEffect(() => {
    if (selectedWrestler && showGraph) {
      loadWeightData();
      const graphData = getGraphData();


      console.log('Graph Data:', graphData);

    }
  }, [selectedWrestler, showGraph]);

  const loadWrestlers = async () => {
    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?action=getWrestlers`);
      const data = await response.json();
      if (data.wrestlers) {
        setWrestlers(data.wrestlers);
      }
    } catch (error) {
      console.error('Error loading wrestlers:', error);
      setNotification({ type: 'error', message: 'Error connecting to Google Sheets. Please check your Apps Script URL.' });
    }
  };

  const loadWeightData = async () => {
    setIsGraphLoading(true);
    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?action=getWeights&wrestler=${encodeURIComponent(selectedWrestler || '')}`);
      const data = await response.json();
      console.log('Weight Data:', data);
      if (data.weights) {
        setWeightData(data.weights);
        setLastGraphLoad(Date.now());
      }
    } catch (error) {
      console.error('Error loading weight data:', error);
    }finally {
    setIsGraphLoading(false);}
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'Lennard') {
      setIsAuthenticated(true);
    } else {
      setNotification({ type: 'error', message: 'Incorrect password' });
    }
  };

  const handleWrestlerInput = (value) => {
    setSelectedWrestler(value);
    if (value.length > 0) {
      const filtered = wrestlers.filter(w =>
        w.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredWrestlers(filtered);
      setShowAutocomplete(true);
    } else {
      setShowAutocomplete(false);
    }
  };

  const selectWrestler = (name) => {
    setSelectedWrestler(name);
    setShowAutocomplete(false);
  };

  const submitWeight = async () => {
    if (!selectedWrestler || !weight) {
      setNotification({ type: 'success', message: 'Please enter wrestler name and weight' });
      return;
    }

    // Format date as MM/DD/YYYY
    let formattedDate;
    if (customDate) {
      formattedDate = customDate;
    } else {
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      const year = today.getFullYear();
      formattedDate = `${month}/${day}/${year}`;
    }

    // Find the wrestler to get their details
    const wrestler = wrestlers.find(w => w.name === selectedWrestler);
    if (!wrestler) {
      setNotification({ type: 'success', message: 'Wrestler not found. Please select from the list.' });
      return;
    }

    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'addWeight',
          date: formattedDate,
          weightClass: wrestler.weightClass,
          firstName: wrestler.firstName,
          lastName: wrestler.lastName,
          weight: weight,
          type: weightType,
          sex: wrestler.sex
        })
      });

      const result = await response.json();

      if (result.success) {
        setNotification({ type: 'success', message: 'Weight recorded successfully!' });
        setSelectedWrestler('');  // Clear wrestler name input
        setWeight('');            // Clear weight input
        setWeightType('before');  // Reset weight type to default
        setCustomDate('');        // Clear custom date input
        loadWeightData();
      }
      else {
        setNotification({ type: 'error', message: 'Error: ' + (result.error || 'Unknown error') });
      }
    } catch (error) {
      console.error('Error submitting weight:', error);
      setNotification({ type: 'error', message: 'Error saving weight: ' + error.message });
    }
  };

  const addNewWrestler = async () => {
    if (!newFirstName || !newLastName || !newWeight) {
      setNotification({ type: 'error', message: 'Please fill in all fields' });
      return;
    }

    setIsAddingWrestler(true);
    setNotification(null);

    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'addWrestler',
          firstName: newFirstName,
          lastName: newLastName,
          weightClass: newWeight,
          sex: newSex
        })
      });

      const result = await response.json();

      if (result.success) {
        setNotification({ type: 'success', message: 'Wrestler added successfully!' });
        setNewFirstName('');
        setNewLastName('');
        setNewWeight('');
        setNewSex('Male');
        loadWrestlers();
      } else {
        setNotification({ type: 'error', message: `Error: ${result.error || 'Unknown error'}` });
      }

    } catch (error) {
      setNotification({ type: 'error', message: 'Error adding wrestler: ' + error.message });
    } finally {
      setIsAddingWrestler(false);
    }
  };


  const searchWeights = () => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }

    const results = weightData.filter(w =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults(results);
  };

  const getGraphData = () => {
    const filtered = weightData.filter(w => {
      const entryDate = new Date(w.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return entryDate >= start && entryDate <= end;
    });

    const grouped = {};
    filtered.forEach(w => {
      const dateKey = w.date.slice(0, 10); // YYYY-MM-DD format
      if (!grouped[dateKey]) {
        grouped[dateKey] = { date: dateKey, before: null, after: null };
      }
      if (w.type === 'before') {
        grouped[dateKey].before = w.weight;
      }
      if (w.type === 'after') {
        grouped[dateKey].after = w.weight;
      }
    });

    const combined = Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));

    if (singleLineMode) {
      // For each date, create two data points: before and after with slight offset on after's date
      const result = [];
      combined.forEach(entry => {
        const baseDate = new Date(entry.date);
        result.push({
          date: baseDate.toISOString(),
          weight: entry.before
        });
        if (entry.after !== null) {
          // Offset by 1 millisecond to appear slightly right
          const offsetDate = new Date(baseDate.getTime() + 1);
          result.push({
            date: offsetDate.toISOString(),
            weight: entry.after
          });
        }
      });
      return result;
    }

    return combined;
  };


  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
          <h1 className="text-3xl font-bold text-purple-400 mb-6 text-center">Lennard Wrestling</h1>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin(e)}
              placeholder="Enter password"
              className="w-full p-3 bg-gray-700 text-white rounded mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleLogin}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white p-3 rounded font-semibold transition"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="bg-purple-600 p-4 shadow-lg">
        <h1 className="text-2xl font-bold text-center">Lennard Wrestling</h1>
      </div>

      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setCurrentPage('home')}
          className={`flex items-center gap-2 px-6 py-3 ${currentPage === 'home' ? 'bg-gray-800 border-b-2 border-purple-500' : 'bg-gray-900 hover:bg-gray-800'}`}
        >
          <Home size={18} />
          Weight Entry
        </button>
        <button
          onClick={() => setCurrentPage('import')}
          className={`flex items-center gap-2 px-6 py-3 ${currentPage === 'import' ? 'bg-gray-800 border-b-2 border-purple-500' : 'bg-gray-900 hover:bg-gray-800'}`}
        >
          <Upload size={18} />
          Wrestlers
        </button>
        <button
          onClick={() => setCurrentPage('new')}
          className={`flex items-center gap-2 px-6 py-3 ${currentPage === 'new' ? 'bg-gray-800 border-b-2 border-purple-500' : 'bg-gray-900 hover:bg-gray-800'}`}
        >
          <Plus size={18} />
          Add Wrestler
        </button>
        <button
          onClick={() => setCurrentPage('search')}
          className={`flex items-center gap-2 px-6 py-3 ${currentPage === 'search' ? 'bg-gray-800 border-b-2 border-purple-500' : 'bg-gray-900 hover:bg-gray-800'}`}
        >
          <Search size={18} />
          Search & Edit
        </button>
      </div>

      <div className="p-6 max-w-6xl mx-auto">
        {currentPage === 'home' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Record Weight</h2>

            <div className="bg-gray-800 p-6 rounded-lg mb-6">
              <div className="mb-4 relative">
                <label className="block mb-2 font-semibold">Wrestler Name</label>
                <input
                  type="text"
                  value={selectedWrestler}
                  onChange={(e) => handleWrestlerInput(e.target.value)}
                  onFocus={() => selectedWrestler && setShowAutocomplete(true)}
                  className="w-full p-3 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Start typing name..."
                />
                {showAutocomplete && filteredWrestlers.length > 0 && (
                  <div className="absolute z-10 w-full bg-gray-700 mt-1 rounded shadow-lg max-h-60 overflow-y-auto">
                    {filteredWrestlers.map((w, i) => (
                      <div
                        key={i}
                        onClick={() => selectWrestler(w.name)}
                        className="p-3 hover:bg-gray-600 cursor-pointer"
                      >
                        {w.name} ({w.weightClass})
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="block mb-2 font-semibold">Weight (lbs)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full p-3 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter weight"
                />

              </div>

              <div className="mb-4">
                <label className="block mb-2 font-semibold">Weight Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="before"
                      checked={weightType === 'before'}
                      onChange={(e) => setWeightType(e.target.value)}
                      className="mr-2"
                    />
                    Before Practice
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="after"
                      checked={weightType === 'after'}
                      onChange={(e) => setWeightType(e.target.value)}
                      className="mr-2"
                    />
                    After Practice
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <label className="block mb-2 font-semibold">Date (optional)</label>
                <input
                  type="text"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  placeholder="MM/DD/YYYY or leave blank for today"
                  className="w-full p-3 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-sm text-gray-400 mt-1">Leave blank to use today's date</p>
              </div>

              <button
                onClick={submitWeight}
                className="w-full bg-purple-600 hover:bg-purple-700 p-3 rounded font-semibold transition"
              >
                Submit Weight
              </button>
            </div>

            <button
              onClick={() => setShowGraph(!showGraph)}
              className="mb-4 bg-gray-800 hover:bg-gray-700 px-6 py-2 rounded"
            >
              {showGraph ? 'Hide Graph' : 'Show Graph'}
            </button>

            {showGraph && selectedWrestler && (
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4">Weight Tracking - {selectedWrestler}</h3>

                <div className="mb-4 flex gap-4 items-center flex-wrap">
                  <div>
                    <label className="block mb-1 text-sm">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="p-2 bg-gray-700 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="p-2 bg-gray-700 rounded text-sm"
                    />
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={singleLineMode}
                      onChange={(e) => setSingleLineMode(e.target.checked)}
                      className="mr-2"
                    />
                    Single Line View
                  </label>
                </div>

                <button
                  onClick={loadWeightData}
                  className="mb-4 bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded font-semibold transition"
                >
                  Load Graph
                </button>
{isGraphLoading ? (
      <div className="flex justify-center items-center h-96">
        <svg className="animate-spin h-10 w-10 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
      </div>
    ) : (
                <ResponsiveContainer key={lastGraphLoad} width="100%" height={400}>
                  <LineChart data={getGraphData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="date" stroke="#999" />
                    <YAxis stroke="#999" />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                    <Legend />
                    {singleLineMode ? (
                      <Line type="monotone" dataKey="weight" stroke="#a855f7" strokeWidth={2} name="Weight" />
                    ) : (
                      <>
                        <Line type="monotone" dataKey="before" stroke="#a855f7" strokeWidth={2} name="Before Practice" />
                        <Line type="monotone" dataKey="after" stroke="#fbbf24" strokeWidth={2} name="After Practice" />
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer> )}
              </div>
            )}
          </div>
        )}


        {
          notification && (
            <div
              className={`fixed top-4 right-4 px-4 py-2 rounded shadow-lg font-semibold ${notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                }`}
            >
              {notification.message}
              <button
                onClick={() => setNotification(null)}
                className="ml-2 font-normal hover:underline"
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            </div>
          )
        }
        {currentPage === 'import' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Wrestler Roster</h2>
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="p-3 text-left">First Name</th>
                    <th className="p-3 text-left">Last Name</th>
                    <th className="p-3 text-left">Sex</th>
                    <th className="p-3 text-left">Weight Class</th>
                  </tr>
                </thead>
                <tbody>
                  {wrestlers.map((w, i) => (
                    <tr key={i} className="border-t border-gray-700 hover:bg-gray-750">
                      <td className="p-3">{w.firstName}</td>
                      <td className="p-3">{w.lastName}</td>
                      <td className="p-3">{w.sex}</td>
                      <td className="p-3">{w.weightClass}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {currentPage === 'new' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Add New Wrestler</h2>
            <div className="bg-gray-800 p-6 rounded-lg max-w-md">
              <div className="mb-4">
                <label className="block mb-2 font-semibold">First Name</label>
                <input
                  type="text"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  className="w-full p-3 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Last Name</label>
                <input
                  type="text"
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  className="w-full p-3 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Weight Class</label>
                <input
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  className="w-full p-3 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter weight class"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Sex</label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="Male"
                      checked={newSex === 'Male'}
                      onChange={(e) => setNewSex(e.target.value)}
                      className="mr-2"
                    />
                    Male
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="Female"
                      checked={newSex === 'Female'}
                      onChange={(e) => setNewSex(e.target.value)}
                      className="mr-2"
                    />
                    Female
                  </label>
                </div>
              </div>
              <button
                onClick={addNewWrestler}
                className="w-full bg-purple-600 hover:bg-purple-700 p-3 rounded font-semibold transition flex justify-center items-center"
                disabled={isAddingWrestler}
              >
                {isAddingWrestler ? (
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                ) : 'Add Wrestler'}
              </button>
            </div>
          </div>
        )}

        {currentPage === 'search' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Search & Edit Weights</h2>
            <div className="bg-gray-800 p-6 rounded-lg mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search wrestler name..."
                  className="flex-1 p-3 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={searchWeights}
                  className="bg-purple-600 hover:bg-purple-700 px-6 rounded font-semibold transition"
                >
                  Search
                </button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="p-3 text-left">Name</th>
                      <th className="p-3 text-left">Weight</th>
                      <th className="p-3 text-left">Type</th>
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((entry, i) => (
                      <tr key={i} className="border-t border-gray-700">
                        <td className="p-3">{entry.name}</td>
                        <td className="p-3">{entry.weight} lbs</td>
                        <td className="p-3">{entry.type === 'before' ? 'Before' : 'After'}</td>
                        <td className="p-3">{entry.date}</td>
                        <td className="p-3">
                          <button className="text-purple-400 hover:text-purple-300">
                            <Edit size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>

  );

};



export default LennardWrestlingApp;