import React, { useMemo } from 'react';
import { CoinData } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Coins, TrendingUp, Globe, DollarSign, Star, AlertCircle } from 'lucide-react';

interface DashboardProps {
  coins: CoinData[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Dashboard: React.FC<DashboardProps> = ({ coins }) => {
  const totalValue = coins.reduce((acc, coin) => acc + coin.value, 0);
  const totalCoins = coins.length;
  
  const mostValuableCoin = useMemo(() => {
    if (coins.length === 0) return null;
    return coins.reduce((prev, current) => (prev.value > current.value) ? prev : current);
  }, [coins]);

  const rareCoins = useMemo(() => {
    return coins.filter(c => c.isRare);
  }, [coins]);

  const compositionData = useMemo(() => {
    const counts: Record<string, number> = {};
    coins.forEach(coin => {
      // Simplify composition for chart
      const comp = coin.composition.split(',')[0].trim(); 
      counts[comp] = (counts[comp] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [coins]);

  const countryData = useMemo(() => {
     const counts: Record<string, number> = {};
     coins.forEach(coin => {
       counts[coin.country] = (counts[coin.country] || 0) + 1;
     });
     return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5
  }, [coins]);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Collector Dashboard</h1>
        <p className="text-slate-500">Overview of your numismatic portfolio</p>
      </header>

      {/* Rare Coins Alert Section */}
      {rareCoins.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 rounded-xl shadow-sm mb-6">
          <div className="flex items-center space-x-2 text-amber-800 mb-3">
            <Star className="w-5 h-5 fill-amber-500 text-amber-600" />
            <h3 className="font-bold text-lg">Rare Finds Detected ({rareCoins.length})</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rareCoins.slice(0, 4).map(coin => (
               <div key={coin.id} className="flex items-center space-x-3 bg-white/80 p-2 rounded-lg">
                  <img src={coin.frontImageUrl} alt={coin.name} className="w-10 h-10 rounded-full object-cover border border-amber-100" />
                  <div className="overflow-hidden">
                    <p className="font-bold text-sm truncate text-slate-800">{coin.name}</p>
                    <p className="text-xs text-amber-600 font-medium">${coin.value.toFixed(2)}</p>
                  </div>
               </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <Coins className="w-5 h-5" />
            </div>
            <span className="text-sm text-slate-500 font-medium">Total Coins</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{totalCoins}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg text-green-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-sm text-slate-500 font-medium">Total Value</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">${totalValue.toFixed(2)}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-sm text-slate-500 font-medium">Top Coin</span>
          </div>
          <p className="text-lg font-bold text-slate-800 truncate">
            {mostValuableCoin ? `$${mostValuableCoin.value}` : '-'}
          </p>
          <p className="text-xs text-slate-400 truncate">{mostValuableCoin?.name || 'No data'}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
              <Globe className="w-5 h-5" />
            </div>
            <span className="text-sm text-slate-500 font-medium">Countries</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{countryData.length}</p>
        </div>
      </div>

      {/* Charts Section */}
      {coins.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Composition Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Composition Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={compositionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {compositionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Country Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Top Countries</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={countryData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={100} tick={{fontSize: 12}} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-12 text-center">
          <p className="text-slate-500">Add coins to your collection to see analytics.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
