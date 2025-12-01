import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, Coins, PlusCircle, Search, Trash2, ArrowLeft, Save, Edit2, Star, Link as LinkIcon, AlertTriangle, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { CoinData, ViewState } from './types';
import Dashboard from './components/Dashboard';
import CameraCapture from './components/CameraCapture';
import { identifyCoin } from './services/geminiService';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('dashboard');
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [selectedCoin, setSelectedCoin] = useState<CoinData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sorting State
  const [sortBy, setSortBy] = useState<'date' | 'value' | 'name' | 'year'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Add Coin State
  const [capturedImages, setCapturedImages] = useState<{ front: string, back: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [pendingCoin, setPendingCoin] = useState<Partial<CoinData> | null>(null);
  const [showImageSide, setShowImageSide] = useState<'front' | 'back'>('front');

  // Load coins from local storage on mount
  useEffect(() => {
    const savedCoins = localStorage.getItem('myCoinCollection');
    if (savedCoins) {
      try {
        const parsed: any[] = JSON.parse(savedCoins);
        // Migration for legacy data structure (imageUrl -> frontImageUrl)
        const migrated = parsed.map(c => ({
          ...c,
          frontImageUrl: c.frontImageUrl || c.imageUrl,
          backImageUrl: c.backImageUrl || c.frontImageUrl || c.imageUrl, // Fallback
          isRare: c.isRare || false,
          rarityDetails: c.rarityDetails || ''
        }));
        setCoins(migrated);
      } catch (e) {
        console.error("Failed to parse coins from storage");
      }
    }
  }, []);

  // Save coins to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('myCoinCollection', JSON.stringify(coins));
  }, [coins]);

  const handleStartAddCoin = () => {
    setCapturedImages(null);
    setPendingCoin(null);
    setAnalysisError(null);
    setView('add');
  };

  const handleCapture = async (images: { front: string, back: string }) => {
    setCapturedImages(images);
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const result = await identifyCoin(images.front, images.back);
      setPendingCoin({
        id: crypto.randomUUID(),
        frontImageUrl: images.front,
        backImageUrl: images.back,
        dateAdded: new Date().toISOString(),
        currency: 'USD',
        ...result
      });
    } catch (err) {
      console.error(err);
      setAnalysisError("Failed to identify coin. Please try again with a clearer photo.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveCoin = () => {
    if (pendingCoin && pendingCoin.name) {
      setCoins(prev => [pendingCoin as CoinData, ...prev]);
      setView('collection');
      setPendingCoin(null);
      setCapturedImages(null);
    }
  };

  const handleDeleteCoin = (id: string) => {
    if (confirm('Are you sure you want to remove this coin from your collection?')) {
      setCoins(prev => prev.filter(c => c.id !== id));
      if (selectedCoin?.id === id) setSelectedCoin(null);
      if (view === 'details') setView('collection');
    }
  };

  const filteredCoins = useMemo(() => {
    return coins.filter(coin => 
      coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coin.country.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [coins, searchTerm]);

  const sortedCoins = useMemo(() => {
    return [...filteredCoins].sort((a, b) => {
      let diff = 0;
      switch (sortBy) {
        case 'value':
          diff = a.value - b.value;
          break;
        case 'year':
          // Handle null years by treating them as 0 for sorting
          diff = (a.year || 0) - (b.year || 0);
          break;
        case 'name':
          diff = a.name.localeCompare(b.name);
          break;
        case 'date':
        default:
          diff = new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
          break;
      }
      return sortOrder === 'asc' ? diff : -diff;
    });
  }, [filteredCoins, sortBy, sortOrder]);

  // Navigation Bar Component
  const NavBar = () => (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg pb-safe z-50">
      <div className="flex justify-around items-center h-16">
        <button 
          onClick={() => setView('dashboard')}
          className={`flex flex-col items-center p-2 ${view === 'dashboard' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-[10px] font-medium mt-1">Dashboard</span>
        </button>
        
        <button 
          onClick={handleStartAddCoin}
          className="flex flex-col items-center p-2 -mt-6"
        >
          <div className="bg-blue-600 rounded-full p-4 shadow-xl text-white hover:bg-blue-700 transition-colors">
            <PlusCircle className="w-8 h-8" />
          </div>
        </button>

        <button 
          onClick={() => setView('collection')}
          className={`flex flex-col items-center p-2 ${view === 'collection' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Coins className="w-6 h-6" />
          <span className="text-[10px] font-medium mt-1">Collection</span>
        </button>
      </div>
    </nav>
  );

  // Render Views
  if (view === 'add') {
    if (!capturedImages) {
      return (
        <CameraCapture 
          onCapture={handleCapture} 
          onCancel={() => setView('dashboard')} 
        />
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 pb-24">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">New Coin Entry</h2>
            <button onClick={handleStartAddCoin} className="text-sm text-blue-600">Retake</button>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex space-x-2 overflow-x-auto">
             <div className="flex-shrink-0 w-1/2 relative">
               <span className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">Front</span>
               <img src={capturedImages.front} alt="Front" className="w-full h-40 object-contain bg-black rounded-lg" />
             </div>
             <div className="flex-shrink-0 w-1/2 relative">
               <span className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">Back</span>
               <img src={capturedImages.back} alt="Back" className="w-full h-40 object-contain bg-black rounded-lg" />
             </div>
          </div>

          {isAnalyzing ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-r-transparent mb-4"></div>
              <p className="text-slate-600 font-medium">AI is analyzing your coin...</p>
              <p className="text-slate-400 text-sm mt-2">Checking market value & rarity against live data.</p>
            </div>
          ) : analysisError ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center">
              <p>{analysisError}</p>
              <button 
                onClick={handleStartAddCoin}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm"
              >
                Try Again
              </button>
            </div>
          ) : pendingCoin ? (
            <div className="space-y-4 animate-fade-in">
              {pendingCoin.isRare && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start space-x-3">
                  <Star className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5 fill-amber-500" />
                  <div>
                    <h3 className="font-bold text-amber-800">Rare Coin Detected!</h3>
                    <p className="text-sm text-amber-700 mt-1">{pendingCoin.rarityDetails}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Name</label>
                <input 
                  type="text" 
                  value={pendingCoin.name || ''} 
                  onChange={(e) => setPendingCoin({...pendingCoin, name: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Year</label>
                  <input 
                    type="number" 
                    value={pendingCoin.year || ''} 
                    onChange={(e) => setPendingCoin({...pendingCoin, year: parseInt(e.target.value) || null})}
                    className="w-full p-3 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Country</label>
                  <input 
                    type="text" 
                    value={pendingCoin.country || ''} 
                    onChange={(e) => setPendingCoin({...pendingCoin, country: e.target.value})}
                    className="w-full p-3 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Est. Value (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400">$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    value={pendingCoin.value || ''} 
                    onChange={(e) => setPendingCoin({...pendingCoin, value: parseFloat(e.target.value) || 0})}
                    className="w-full p-3 pl-8 border border-slate-200 rounded-lg font-mono font-bold text-green-700 outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Based on recent market data.</p>
              </div>

               <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Condition</label>
                <input 
                  type="text" 
                  value={pendingCoin.condition || ''} 
                  onChange={(e) => setPendingCoin({...pendingCoin, condition: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                <textarea 
                  value={pendingCoin.description || ''} 
                  onChange={(e) => setPendingCoin({...pendingCoin, description: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-lg outline-none h-24 text-sm"
                />
              </div>

               {pendingCoin.sources && pendingCoin.sources.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Sources</label>
                  <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1">
                    {pendingCoin.sources.slice(0, 3).map((source, idx) => (
                      <a key={idx} href={source} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline truncate">
                        <LinkIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                        {source}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <button 
                onClick={handleSaveCoin}
                className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 flex items-center justify-center space-x-2 mt-4"
              >
                <Save className="w-5 h-5" />
                <span>Save to Collection</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (view === 'details' && selectedCoin) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="p-4 flex items-center justify-between bg-white shadow-sm sticky top-0 z-10">
          <button onClick={() => setView('collection')} className="p-2 hover:bg-slate-100 rounded-full">
            <ArrowLeft className="w-6 h-6 text-slate-700" />
          </button>
          <h2 className="font-semibold text-slate-800">Coin Details</h2>
          <button 
            onClick={() => handleDeleteCoin(selectedCoin.id)}
            className="p-2 hover:bg-red-50 text-red-500 rounded-full"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pb-24">
          
          <div className="flex flex-col items-center mb-8">
            <div className="relative shadow-2xl rounded-full border-4 border-white overflow-hidden w-64 h-64 bg-slate-200 cursor-pointer" onClick={() => setShowImageSide(prev => prev === 'front' ? 'back' : 'front')}>
               <img 
                src={showImageSide === 'front' ? selectedCoin.frontImageUrl : selectedCoin.backImageUrl || selectedCoin.frontImageUrl} 
                alt={selectedCoin.name} 
                className="w-full h-full object-cover" 
               />
               <div className="absolute bottom-4 right-1/2 translate-x-1/2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-md pointer-events-none uppercase">
                 {showImageSide}
               </div>
            </div>
            <p className="text-xs text-slate-400 mt-3 flex items-center">
              <Coins className="w-3 h-3 mr-1" /> Tap image to flip
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
            <div className="text-center border-b border-slate-100 pb-6">
              {selectedCoin.isRare && (
                <div className="inline-flex items-center space-x-1 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold mb-3">
                  <Star className="w-3 h-3 fill-amber-700" />
                  <span>RARE FIND</span>
                </div>
              )}
              <h1 className="text-2xl font-bold text-slate-900">{selectedCoin.name}</h1>
              <div className="flex items-center justify-center space-x-2 mt-2 text-slate-500">
                <span>{selectedCoin.year || 'Unknown Year'}</span>
                <span>•</span>
                <span>{selectedCoin.country}</span>
              </div>
              <div className="mt-4 inline-flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-full font-bold text-xl">
                ${selectedCoin.value.toFixed(2)}
              </div>
            </div>

            {selectedCoin.isRare && (
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                 <h4 className="font-bold text-amber-800 text-sm mb-1">Why it's rare</h4>
                 <p className="text-sm text-amber-700">{selectedCoin.rarityDetails}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-slate-500 text-xs uppercase font-bold mb-1">Denomination</p>
                <p className="font-medium text-slate-800">{selectedCoin.denomination}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                 <p className="text-slate-500 text-xs uppercase font-bold mb-1">Composition</p>
                <p className="font-medium text-slate-800">{selectedCoin.composition}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                 <p className="text-slate-500 text-xs uppercase font-bold mb-1">Condition</p>
                <p className="font-medium text-slate-800">{selectedCoin.condition || 'N/A'}</p>
              </div>
               <div className="p-3 bg-slate-50 rounded-lg">
                 <p className="text-slate-500 text-xs uppercase font-bold mb-1">Added On</p>
                <p className="font-medium text-slate-800">{new Date(selectedCoin.dateAdded).toLocaleDateString()}</p>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-800 mb-2">Description</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                {selectedCoin.description}
              </p>
            </div>
            
            {selectedCoin.sources && selectedCoin.sources.length > 0 && (
                <div className="border-t border-slate-100 pt-4">
                  <h3 className="font-bold text-slate-800 mb-2 text-xs uppercase">Market Data Sources</h3>
                  <div className="space-y-2">
                    {selectedCoin.sources.map((source, idx) => (
                      <a key={idx} href={source} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs text-blue-600 hover:underline truncate">
                        <LinkIcon className="w-3 h-3 mr-2 flex-shrink-0" />
                        {source}
                      </a>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 pb-20">
      
      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto min-h-screen bg-white shadow-xl overflow-hidden flex flex-col">
        
        {view === 'dashboard' && (
          <div className="p-6 overflow-y-auto h-full">
            <Dashboard coins={coins} />
          </div>
        )}

        {view === 'collection' && (
          <div className="flex flex-col h-full">
            <div className="p-6 bg-white sticky top-0 z-10 border-b border-slate-100">
              <h1 className="text-3xl font-bold text-slate-800 mb-4">My Collection</h1>
              <div className="relative">
                <Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Search coins..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              {/* Sorting Controls */}
              <div className="flex space-x-2 mt-4">
                <div className="flex-1 relative">
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full appearance-none bg-slate-100 border border-slate-200 text-slate-700 py-2 px-4 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm"
                  >
                    <option value="date">Date Added</option>
                    <option value="value">Value</option>
                    <option value="year">Year</option>
                    <option value="name">Name</option>
                  </select>
                  <ArrowUpDown className="w-4 h-4 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
                </div>
                
                <button 
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
                  title={sortOrder === 'asc' ? "Ascending" : "Descending"}
                >
                  {sortOrder === 'asc' ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {sortedCoins.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <Coins className="w-16 h-16 mb-4 opacity-20" />
                  <p>No coins found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {sortedCoins.map(coin => (
                    <div 
                      key={coin.id}
                      onClick={() => { setSelectedCoin(coin); setView('details'); }}
                      className={`bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group ${coin.isRare ? 'border-amber-300 ring-1 ring-amber-100' : 'border-slate-100'}`}
                    >
                      <div className="aspect-square bg-slate-100 relative overflow-hidden">
                        <img 
                          src={coin.frontImageUrl} 
                          alt={coin.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                         {coin.isRare && (
                          <div className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center shadow-sm">
                            <Star className="w-3 h-3 mr-0.5 fill-white" /> Rare
                          </div>
                        )}
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-md">
                          {coin.year}
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-bold text-slate-800 text-sm truncate">{coin.name}</h3>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-slate-500 truncate max-w-[60%]">{coin.country}</span>
                          <span className="text-sm font-bold text-green-600">${coin.value.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Navigation */}
      <NavBar />
      
    </div>
  );
};

export default App;
