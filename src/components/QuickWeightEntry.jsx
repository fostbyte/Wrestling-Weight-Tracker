import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useNotify } from '../context/NotifyContext';
import { apiFetch } from '../utils/api';

const QuickWeightEntry = () => {
  const { schoolName } = useParams();
  const { notify } = useNotify();
  const [wrestlers, setWrestlers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWrestler, setSelectedWrestler] = useState(null);
  const [weight, setWeight] = useState('');
  const [isBefore, setIsBefore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [school, setSchool] = useState(null);
  const weightInputRef = useRef(null);
  const searchInputRef = useRef(null);

  // Load school and wrestlers
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('Loading school data for:', schoolName);
        
        // Load school by name
        const schools = await apiFetch('list-schools');
        console.log('Schools loaded:', schools);
        
        const schoolData = schools.find(s => 
          (s.name?.toLowerCase() === schoolName.toLowerCase()) || 
          (s.code?.toLowerCase() === schoolName.toLowerCase())
        );
        
        console.log('Found school data:', schoolData);
        
        if (!schoolData) {
          console.error('School not found:', schoolName);
          if (isMounted) {
            notify('School not found. Please check the URL and try again.', 'error');
            setSchool(null);
          }
          return;
        }
        
        if (isMounted) {
          setSchool(schoolData);
          console.log('Loading wrestlers for school ID:', schoolData.id);
          
          // Try with the correct endpoint format
          let wrestlersData = [];
          try {
            // First try the direct endpoint
            wrestlersData = await apiFetch(`get-wrestlers?school_id=${schoolData.id}`);
            console.log('Wrestlers loaded (direct endpoint):', wrestlersData);
          } catch (e) {
            console.log('Direct endpoint failed, trying alternative...');
            // Fallback to list-wrestlers if get-wrestlers fails
            const response = await apiFetch('list-wrestlers');
            wrestlersData = Array.isArray(response) ? 
              response.filter(w => w.school_id === schoolData.id) : [];
            console.log('Wrestlers loaded (list-wrestlers endpoint):', wrestlersData);
          }
          
          if (isMounted) {
            if (!wrestlersData || !Array.isArray(wrestlersData)) {
              console.error('Invalid wrestlers data received:', wrestlersData);
              throw new Error('Invalid data format received from server');
            }
            setWrestlers(wrestlersData);
            console.log('Wrestlers set in state:', wrestlersData.length);
          }
        }
      } catch (error) {
        console.error('Error in loadData:', error);
        if (isMounted) {
          notify(`Error: ${error.message}`, 'error');
          setWrestlers([]);
          setSchool(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [schoolName, notify]);

  // Filter wrestlers based on search term
  const filteredWrestlers = wrestlers.filter(wrestler => {
    const fullName = `${wrestler.firstName || ''} ${wrestler.lastName || ''}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase().trim());
  });

  // Handle wrestler selection
  const handleWrestlerSelect = (wrestler) => {
    setSelectedWrestler(wrestler);
    setSearchTerm(`${wrestler.firstName} ${wrestler.lastName}`);
    weightInputRef.current?.focus();
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedWrestler || !weight) {
      notify('Please select a wrestler and enter weight', 'warning');
      return;
    }

    setLoading(true);
    
    try {
      await apiFetch('add-weight-record', {
        method: 'POST',
        body: {
          firstName: selectedWrestler.firstName,
          lastName: selectedWrestler.lastName,
          weight: parseFloat(weight),
          type: isBefore ? 'before' : 'after'
        }
      });
      
      notify('Weight recorded successfully!', 'success');
      setWeight('');
      setSearchTerm('');
      setSelectedWrestler(null);
      searchInputRef.current?.focus();
    } catch (error) {
      console.error('Error recording weight:', error);
      notify(error.message || 'Failed to record weight', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle key down for weight input (submit on Enter)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && weight) {
      handleSubmit(e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md text-center">
          <h2 className="text-xl font-semibold mb-4">Loading...</h2>
          <p className="text-gray-600">Please wait while we load the data.</p>
        </div>
      </div>
    );
  }
  
  if (!school) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md text-center">
          <h2 className="text-xl font-semibold mb-4">School Not Found</h2>
          <p className="text-gray-600">The requested school could not be found. Please check the URL and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden">
        <div 
          className="p-6 text-white text-center"
          style={{ backgroundColor: school.primary_color || '#4f46e5' }}
        >
          <h1 className="text-2xl font-bold">{school.name || school.code}</h1>
          <p className="opacity-90">Weight Entry</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Wrestler Search */}
          <div className="space-y-2">
            <label htmlFor="wrestler" className="block text-sm font-medium text-gray-700">
              Wrestler
            </label>
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                id="wrestler"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search wrestler..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoComplete="off"
                autoFocus
              />
              {searchTerm && !selectedWrestler && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredWrestlers.length > 0 ? (
                    filteredWrestlers.map((wrestler) => (
                      <div
                        key={wrestler.id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleWrestlerSelect(wrestler)}
                      >
                        {wrestler.firstName} {wrestler.lastName}
                        {wrestler.weightClass && ` (${wrestler.weightClass})`}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-gray-500">No wrestlers found</div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Weight Input */}
          <div className="space-y-2">
            <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
              Weight (lbs)
            </label>
            <input
              ref={weightInputRef}
              type="number"
              id="weight"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter weight"
              step="0.1"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={!selectedWrestler}
            />
          </div>
          
          {/* Before/After Toggle */}
          <div className="flex items-center justify-center space-x-4">
            <button
              type="button"
              className={`px-4 py-2 rounded-md ${isBefore ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => setIsBefore(true)}
            >
              Before
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded-md ${!isBefore ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => setIsBefore(false)}
            >
              After
            </button>
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={!selectedWrestler || !weight || loading}
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${(!selectedWrestler || !weight) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loading ? 'Saving...' : 'Save Weight'}
          </button>
          
          {selectedWrestler && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md text-center">
              <p className="text-sm text-gray-600">
                Recording {isBefore ? 'before' : 'after'} weight for{' '}
                <span className="font-medium">
                  {selectedWrestler.firstName} {selectedWrestler.lastName}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Press Enter after typing weight to save
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default QuickWeightEntry;
