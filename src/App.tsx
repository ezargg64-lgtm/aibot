import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Search, Bell, Moon, Globe, Shield, LayoutDashboard, Server, AppWindow,
  Activity, AlertTriangle, Users, FileText, BarChart2, PieChart,
  Network, MessageSquare, HelpCircle, Settings, Plus, RefreshCw,
  MoreVertical, ChevronDown, Clock, Cpu, Radio, Hexagon,
  ArrowUpRight, ArrowDownRight, Upload, Wifi, Terminal, Trash2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const generateData = () => {
  const data = [];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < 4; j++) { 
      data.push({
        name: j === 0 ? days[i] : '',
        sg: 200 + Math.random() * 30 + (i === 3 && j === 2 ? 20 : 0),
        tk: 195 + Math.random() * 15,
        eu: 198 + Math.random() * 10,
        na: 190 + Math.random() * 10,
      });
    }
  }
  return data;
}

const SIDEBAR_SECTIONS = [
  {
    title: 'MAIN NAVIGATION',
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, active: true },
      { name: 'Servers', icon: Server },
      { name: 'Applications', icon: AppWindow },
      { name: 'Uptime Monitor', icon: Activity },
      { name: 'Alerts & Incidents', icon: AlertTriangle },
    ]
  },
  {
    title: 'TEAM & ROLES',
    items: [
      { name: 'Team & Roles', icon: Users },
      { name: 'Logs & Activity', icon: FileText },
    ]
  },
  {
    title: 'MONITORING',
    items: [
      { name: 'Performance', icon: BarChart2 },
      { name: 'Analytics', icon: PieChart },
      { name: 'Integrations', icon: Network },
    ]
  },
  {
    title: 'SUPPORT',
    items: [
      { name: 'Feedback', icon: MessageSquare },
      { name: 'Help & Support', icon: HelpCircle },
      { name: 'Settings', icon: Settings },
    ]
  }
];

export default function App() {
  const [chartData, setChartData] = useState<{name: string, sg: number, tk: number, eu: number, na: number}[]>(generateData());
  const [servers, setServers] = useState([
    { id: 'whatsapp-bot-01', region: 'US', status: 'Healthy', cpu: 12, mem: 45, disk: 30, net: 0.1, up: 99.99, responseTime: 124, errors: 0.02 },
  ]);
  const [activeServerId, setActiveServerId] = useState('whatsapp-bot-01');
  const [botStates, setBotStates] = useState<Record<string, { qr: string | null, code: string | null, status: string }>>({
    'whatsapp-bot-01': { qr: null, code: null, status: 'connecting' }
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [isPairing, setIsPairing] = useState(false);
  const [isUpdatingKey, setIsUpdatingKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [models, setModels] = useState<string[]>(['gemini-3.1-pro-preview']);
  const [selectedModel, setSelectedModel] = useState('gemini-3.1-pro-preview');
  const [isUpdatingModel, setIsUpdatingModel] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const fetchModels = async () => {
    try {
      const res = await fetch('/api/config/gemini/models');
      if (res.ok) {
        const data = await res.json();
        if (data.models && data.models.length > 0) {
          setModels(data.models);
          if (!data.models.includes(selectedModel)) {
            setSelectedModel(data.models[0]);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch models:', err);
    }
  };

  useEffect(() => {
    fetchModels();

    const telemetryInterval = setInterval(() => {
      setServers(prevServers => prevServers.map(server => {
        const cpuJitter = Math.floor(Math.random() * 5) - 2;
        const memJitter = Math.floor(Math.random() * 3) - 1;
        const netJitter = (Math.random() * 0.04) - 0.02;
        const rtJitter = Math.floor(Math.random() * 11) - 5;
        
        const newCpu = Math.max(1, Math.min(100, server.cpu + cpuJitter));
        const newMem = Math.max(10, Math.min(100, server.mem + memJitter));
        const newNet = Math.max(0.01, server.net + netJitter);
        const newRt = Math.max(20, server.responseTime + rtJitter);
        
        let newStatus = server.status;
        let newErrors = server.errors;

        if (Math.random() < 0.005) {
          newStatus = 'Critical';
          newErrors += Math.random() * 0.5;
        } else if (Math.random() < 0.02) {
          newStatus = 'Warning';
        } else if (Math.random() < 0.2 && server.status !== 'Healthy') {
          newStatus = 'Healthy';
          newErrors = Math.max(0, newErrors - 0.1);
        } else {
          newErrors = Math.max(0, newErrors - 0.01);
        }

        const newUp = newStatus === 'Critical' ? Math.max(0, server.up - 0.01) : Math.min(100, server.up + 0.001);

        return {
          ...server,
          cpu: newCpu,
          mem: newMem,
          net: newNet,
          responseTime: newRt,
          status: newStatus,
          errors: newErrors,
          up: newUp
        };
      }));

      setChartData(prevData => {
        const newData = [...prevData.slice(1)];
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        newData.push({
          name: time,
          sg: 200 + Math.random() * 30,
          tk: 195 + Math.random() * 15,
          eu: 198 + Math.random() * 10,
          na: 190 + Math.random() * 10,
        });
        return newData;
      });

    }, 2000);

    const socket: Socket = io();

    socket.on('status', (data: { serverId: string, status: string }) => {
      setBotStates(prev => ({
        ...prev,
        [data.serverId]: {
          ...prev[data.serverId],
          status: data.status,
          ...(data.status === 'connected' ? { qr: null, code: null } : {})
        }
      }));
    });

    socket.on('qr', (data: { serverId: string, qr: string | null }) => {
      setBotStates(prev => ({
        ...prev,
        [data.serverId]: {
          ...prev[data.serverId],
          qr: data.qr,
          code: null
        }
      }));
    });

    socket.on('pairingCode', (data: { serverId: string, code: string | null }) => {
      setBotStates(prev => ({
        ...prev,
        [data.serverId]: {
          ...prev[data.serverId],
          code: data.code
        }
      }));
    });

    socket.on('log', (data: { serverId: string, message: string }) => {
      setLogs(prev => {
        const newLogs = [...prev, `[${new Date().toLocaleTimeString()}] [${data.serverId}] ${data.message}`];
        return newLogs.slice(-100);
      });
    });

    return () => {
      clearInterval(telemetryInterval);
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const simulateServerLogs = (serverId: string) => {
    const events = [
      `Initializing resources for ${serverId}...`,
      `[${serverId}] Booting OS container environment`,
      `[${serverId}] Network interface eth0 up`,
      `[${serverId}] Connectivity established with routing layer`,
      `[${serverId}] System checks passing, status: Healthy`
    ];

    events.forEach((event, index) => {
      setTimeout(() => {
        setLogs(prev => {
          const newLogs = [...prev, `[${new Date().toLocaleTimeString()}] ${event}`];
          return newLogs.slice(-100);
        });
      }, (index + 1) * 1200 + Math.random() * 800);
    });
  };

  const handleAddServer = async () => {
    const newId = `whatsapp-bot-${String(servers.length + 1).padStart(2, '0')}`;
    const newServer = {
      id: newId,
      region: ['US', 'SG', 'EU', 'JP'][Math.floor(Math.random() * 4)],
      status: 'Healthy',
      cpu: Math.floor(Math.random() * 40) + 10,
      mem: Math.floor(Math.random() * 50) + 20,
      disk: Math.floor(Math.random() * 50) + 20,
      net: 0.1,
      up: 100,
      responseTime: Math.floor(Math.random() * 100) + 50,
      errors: 0
    };
    
    setServers(prev => [...prev, newServer]);
    setBotStates(prev => ({ ...prev, [newId]: { qr: null, code: null, status: 'connecting' } }));
    setLogs(prev => {
      const newLogs = [...prev, `[${new Date().toLocaleTimeString()}] Requested provisioning for ${newId}`];
      return newLogs.slice(-100);
    });
    simulateServerLogs(newId);

    try {
      await fetch(`/api/bot/${newId}/create`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to create server bot on backend:', err);
    }
  };

  const handleReset = async () => {
    if (!confirm(`Are you sure you want to reset the bot session for ${activeServerId}?`)) return;
    
    setIsResetting(true);
    try {
      const response = await fetch(`/api/bot/${activeServerId}/reset`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to reset bot');
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Bot session reset requested for ${activeServerId}`]);
    } catch (err) {
      console.error(err);
      alert('Failed to reset bot');
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteServer = async (serverId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete server ${serverId}?`)) return;

    try {
      const response = await fetch(`/api/bot/${serverId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete server');
      
      setServers(prev => prev.filter(s => s.id !== serverId));
      setBotStates(prev => {
        const next = { ...prev };
        delete next[serverId];
        return next;
      });
      setLogs(prev => {
        const newLogs = [...prev, `[${new Date().toLocaleTimeString()}] Deleted server ${serverId}`];
        return newLogs.slice(-100);
      });
      
      if (activeServerId === serverId) {
        const remaining = servers.filter(s => s.id !== serverId);
        if (remaining.length > 0) {
          setActiveServerId(remaining[0].id);
        }
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete server');
    }
  };

  const requestPairingCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    
    setIsPairing(true);
    try {
      const response = await fetch(`/api/bot/${activeServerId}/pair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      });
      if (!response.ok) throw new Error('Failed to request pairing code');
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Requested pairing code for ${phoneNumber} on ${activeServerId}`]);
    } catch (err) {
      console.error(err);
      alert('Failed to request pairing code');
    } finally {
      setIsPairing(false);
    }
  };

  const updateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput) return;
    
    setIsUpdatingKey(true);
    try {
      const response = await fetch('/api/config/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKeyInput })
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update API key');
      }
      setApiKeyInput('');
      alert('API key updated successfully');
      fetchModels();
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsUpdatingKey(false);
    }
  };

  const updateModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModel) return;
    setIsUpdatingModel(true);
    try {
      const response = await fetch('/api/config/gemini/model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: selectedModel })
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || err.error || 'Failed to update model');
      }
      alert('Model updated successfully');
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsUpdatingModel(false);
    }
  };

  const avgCpu = servers.length ? Math.round(servers.reduce((acc, s) => acc + s.cpu, 0) / servers.length) : 0;
  const avgMem = servers.length ? Math.round(servers.reduce((acc, s) => acc + s.mem, 0) / servers.length) : 0;
  const totalNet = servers.reduce((acc, s) => acc + s.net, 0).toFixed(2);
  const avgUptime = servers.length ? (servers.reduce((acc, s) => acc + s.up, 0) / servers.length).toFixed(2) : '0.00';
  const avgRt = servers.length ? Math.round(servers.reduce((acc, s) => acc + s.responseTime, 0) / servers.length) : 0;
  const totalErrors = servers.reduce((acc, s) => acc + s.errors, 0).toFixed(2);

  return (
    <div className="flex h-screen bg-[#0D1117] text-[#C9D1D9] font-sans overflow-hidden selection:bg-[#FF6B35]/30">
      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-[#30363D] bg-[#0D1117] z-10 shrink-0">
          <div className="relative group flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-[#8B949E]" />
            <input 
              type="text" 
              placeholder="Search anything" 
              className="bg-[#161B22] border border-[#30363D] text-sm rounded-lg pl-10 pr-12 py-1.5 text-white focus:outline-none focus:border-[#FF6B35] transition-colors w-72 placeholder-[#8B949E]"
            />
            <div className="absolute right-2 flex items-center gap-1">
              <kbd className="text-[10px] font-mono text-[#8B949E] bg-[#0D1117] border border-[#30363D] px-1.5 py-0.5 rounded">⌘K</kbd>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={handleAddServer}
              className="flex items-center gap-2 text-sm font-medium text-[#FF6B35] hover:opacity-80 transition-opacity"
            >
              <Plus className="w-4 h-4" /> Add Server
            </button>
            <button className="flex items-center gap-2 text-sm font-medium text-[#C9D1D9] hover:text-white transition-colors bg-[#161B22] border border-[#30363D] px-3 py-1.5 rounded-lg">
              <AlertTriangle className="w-4 h-4" /> View Alerts
            </button>
            <button className="p-1.5 text-[#8B949E] hover:text-white bg-[#161B22] border border-[#30363D] rounded-lg transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-[#8B949E] hover:text-white bg-[#161B22] border border-[#30363D] rounded-lg transition-colors">
              <Hexagon className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-[#30363D] mx-1"></div>
            <button className="text-[#8B949E] hover:text-white transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#F85149] rounded-full"></span>
            </button>
            <button className="text-[#8B949E] hover:text-white transition-colors">
              <Moon className="w-4 h-4" />
            </button>
            <button className="flex items-center gap-1 text-[#8B949E] hover:text-white transition-colors text-sm">
              <Globe className="w-4 h-4" />
              Eng
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {/* Title */}
          <div className="mb-6 flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-semibold text-white mb-1">
                Welcome back, <span className="text-[#FF6B35]">User</span>
              </h1>
              <p className="text-sm text-[#8B949E]">
                Global uptime at <span className="text-[#3FB950]">{avgUptime}%</span> in the last 24h.
              </p>
            </div>
            <div className="text-sm text-[#8B949E] flex items-center gap-2">
              Bot Status ({activeServerId}): <span className={`font-medium ${botStates[activeServerId]?.status === 'connected' ? 'text-[#3FB950]' : 'text-[#FF6B35]'}`}>{botStates[activeServerId]?.status || 'unknown'}</span>
            </div>
          </div>

          {/* 6 KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
            {/* Card 1 */}
            <div className="bg-[#161B22] border border-[#30363D] p-4 rounded-xl flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 text-[#8B949E]">
                  <Server className="w-4 h-4" />
                  <span className="text-xs font-medium">Active Servers</span>
                </div>
                <MoreVertical className="w-4 h-4 text-[#8B949E] cursor-pointer hover:text-white" />
              </div>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-3xl font-semibold text-white leading-none">{servers.length}</span>
                <span className="text-xs text-[#8B949E] mb-0.5">Server{servers.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between items-center mt-auto">
                <span className="text-xs text-[#8B949E]">Stable Trend</span>
                <span className="text-xs font-medium text-[#3FB950] bg-[#3FB950]/10 px-1.5 py-0.5 rounded border border-[#3FB950]/20 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" /> 1
                </span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-[#161B22] border border-[#30363D] p-4 rounded-xl flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 text-[#8B949E]">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-medium">Avg CPU Load</span>
                </div>
                <MoreVertical className="w-4 h-4 text-[#8B949E] cursor-pointer hover:text-white" />
              </div>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-3xl font-semibold text-white leading-none">{avgCpu}%</span>
              </div>
              <div className="flex justify-between items-center mt-auto">
                <span className="text-xs text-[#8B949E]">Last 24h usage</span>
                <span className="text-xs font-medium text-[#F85149] bg-[#F85149]/10 px-1.5 py-0.5 rounded border border-[#F85149]/20 flex items-center gap-1">
                  <ArrowDownRight className="w-3 h-3" /> 3%
                </span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-[#161B22] border border-[#30363D] p-4 rounded-xl flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 text-[#8B949E]">
                  <Cpu className="w-4 h-4" />
                  <span className="text-xs font-medium">Memory Usage</span>
                </div>
                <MoreVertical className="w-4 h-4 text-[#8B949E] cursor-pointer hover:text-white" />
              </div>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-3xl font-semibold text-white leading-none">{avgMem}%</span>
              </div>
              <div className="flex justify-between items-center mt-auto">
                <span className="text-xs text-[#8B949E]">Rising trend</span>
                <span className="text-xs font-medium text-[#3FB950] bg-[#3FB950]/10 px-1.5 py-0.5 rounded border border-[#3FB950]/20 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" /> 2%
                </span>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-[#161B22] border border-[#30363D] p-4 rounded-xl flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 text-[#8B949E]">
                  <Radio className="w-4 h-4" />
                  <span className="text-xs font-medium">Network</span>
                </div>
                <MoreVertical className="w-4 h-4 text-[#8B949E] cursor-pointer hover:text-white" />
              </div>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-3xl font-semibold text-white leading-none">{totalNet}</span>
                <span className="text-xs text-[#8B949E] mb-0.5">Gbps</span>
              </div>
              <div className="flex justify-between items-center mt-auto">
                <span className="text-xs text-[#8B949E]">Global bandwidth</span>
                <span className="text-xs font-medium text-[#3FB950] bg-[#3FB950]/10 px-1.5 py-0.5 rounded border border-[#3FB950]/20 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" /> 0.3
                </span>
              </div>
            </div>

            {/* Card 5 */}
            <div className="bg-[#161B22] border border-[#30363D] p-4 rounded-xl flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 text-[#8B949E]">
                  <Activity className="w-4 h-4" />
                  <span className="text-xs font-medium">Avg Response</span>
                </div>
                <MoreVertical className="w-4 h-4 text-[#8B949E] cursor-pointer hover:text-white" />
              </div>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-3xl font-semibold text-white leading-none">{avgRt}</span>
                <span className="text-xs text-[#8B949E] mb-0.5">ms</span>
              </div>
              <div className="flex justify-between items-center mt-auto">
                <span className="text-xs text-[#8B949E]">Overall latency</span>
                <span className="text-xs font-medium text-[#3FB950] bg-[#3FB950]/10 px-1.5 py-0.5 rounded border border-[#3FB950]/20 flex items-center gap-1">
                  <ArrowDownRight className="w-3 h-3" /> 12ms
                </span>
              </div>
            </div>

            {/* Card 6 */}
            <div className="bg-[#161B22] border border-[#30363D] p-4 rounded-xl flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 text-[#8B949E]">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs font-medium">Errors</span>
                </div>
                <MoreVertical className="w-4 h-4 text-[#8B949E] cursor-pointer hover:text-white" />
              </div>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-3xl font-semibold text-white leading-none">{totalErrors}</span>
                <span className="text-xs text-[#8B949E] mb-0.5">%</span>
              </div>
              <div className="flex justify-between items-center mt-auto">
                <span className="text-xs text-[#8B949E]">Current volume</span>
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded border flex items-center gap-1 ${Number(totalErrors) > 1 ? 'text-[#F85149] bg-[#F85149]/10 border-[#F85149]/20' : 'text-[#3FB950] bg-[#3FB950]/10 border-[#3FB950]/20'}`}>
                  {Number(totalErrors) > 1 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Number(totalErrors) > 1 ? 'High' : 'Low'}
                </span>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Main Chart */}
            <div className="lg:col-span-2 bg-[#161B22] border border-[#30363D] p-5 rounded-xl">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 text-white font-medium text-sm">
                  <Clock className="w-4 h-4 text-[#8B949E]" /> Response Time
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex gap-4 text-xs">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#FF6B35]"></span> Singapore</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#00B8D9]"></span> Tokyo</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#6554C0]"></span> Europe</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#3FB950]"></span> North America</span>
                  </div>
                  <button className="px-3 py-1.5 text-xs bg-[#0D1117] border border-[#30363D] rounded flex items-center gap-2 hover:bg-[#30363D] transition-colors text-white">
                    Week <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 0, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#30363D" vertical={false} />
                    <XAxis dataKey="name" stroke="#8B949E" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#8B949E" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}ms`} domain={[180, 240]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#161B22', borderColor: '#30363D', color: '#C9D1D9', borderRadius: '8px' }}
                      itemStyle={{ fontSize: '12px' }}
                      labelStyle={{ fontSize: '12px', color: '#8B949E', marginBottom: '8px' }}
                    />
                    <Line type="monotone" dataKey="sg" stroke="#FF6B35" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="tk" stroke="#00B8D9" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="eu" stroke="#6554C0" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="na" stroke="#3FB950" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right side config panel (WhatsApp Bot configs mapped into CloudGuard Resource style) */}
            <div className="bg-[#161B22] border border-[#30363D] p-5 rounded-xl flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 text-white font-medium text-sm">
                  <Settings className="w-4 h-4 text-[#8B949E]" /> Configuration
                </div>
                <MoreVertical className="w-4 h-4 text-[#8B949E] cursor-pointer hover:text-white" />
              </div>

              {/* Status & Connection */}
              <div className="bg-[#0D1117] border border-[#30363D] p-4 rounded-lg flex flex-col items-center justify-center min-h-[140px] mb-4 relative">
                <div className="absolute top-2 left-2 text-[10px] text-[#8B949E] uppercase font-bold tracking-widest">{activeServerId}</div>
                {botStates[activeServerId]?.code ? (
                  <div className="flex flex-col items-center gap-3 mt-4">
                    <div className="p-3 bg-[#161B22] border border-[#30363D] rounded-lg w-full text-center">
                      <p className="text-xl font-mono tracking-widest font-bold text-[#FF6B35]">{botStates[activeServerId].code}</p>
                    </div>
                    <p className="text-[10px] text-[#8B949E] text-center">Open WhatsApp &gt; Linked Devices</p>
                  </div>
                ) : botStates[activeServerId]?.qr ? (
                  <div className="flex flex-col items-center gap-3 w-full mt-4">
                    <div className="p-2 bg-white rounded-lg">
                      <img src={botStates[activeServerId].qr!} alt="QR" className="w-20 h-20" />
                    </div>
                    
                    <form onSubmit={requestPairingCode} className="w-full mt-2">
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Phone number" 
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="flex-1 bg-[#161B22] border border-[#30363D] rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF6B35]"
                        />
                        <button 
                          type="submit" 
                          disabled={isPairing || !phoneNumber}
                          className="bg-[#FF6B35] hover:bg-[#FF6B35]/80 text-white px-2 py-1.5 rounded text-xs font-medium disabled:opacity-50"
                        >
                          Pair
                        </button>
                      </div>
                    </form>
                  </div>
                ) : botStates[activeServerId]?.status === 'connected' ? (
                  <div className="flex flex-col items-center gap-2 text-[#3FB950] mt-4">
                    <Wifi className="w-8 h-8 opacity-80" />
                    <p className="text-xs font-medium">Session Active</p>
                    <button
                      onClick={handleReset}
                      disabled={isResetting}
                      className="mt-1 text-xs text-[#8B949E] hover:text-[#F85149] underline decoration-[#30363D] underline-offset-2 transition-colors"
                    >
                      {isResetting ? 'Resetting...' : 'Disconnect Session'}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-[#8B949E] mt-4">
                    <div className="w-8 h-8 border-2 border-[#30363D] border-t-[#8B949E] rounded-full animate-spin"></div>
                    <p className="text-xs">Connecting to bot...</p>
                  </div>
                )}
              </div>

              {/* API config */}
              <div className="flex flex-col gap-4">
                <form onSubmit={updateModel} className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-[#8B949E] uppercase font-semibold tracking-wider">Active Model</label>
                  <div className="flex gap-2">
                    <select 
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="flex-1 bg-[#0D1117] border border-[#30363D] rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF6B35]"
                    >
                      {models.map(model => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                    <button 
                      type="submit" 
                      disabled={isUpdatingModel}
                      className="bg-[#161B22] border border-[#30363D] hover:bg-[#30363D] text-white px-3 py-1.5 rounded text-xs transition-colors disabled:opacity-50"
                    >
                      Set
                    </button>
                  </div>
                </form>

                <form onSubmit={updateApiKey} className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-[#8B949E] uppercase font-semibold tracking-wider">Update API Key</label>
                  <div className="flex gap-2">
                    <input 
                      type="password" 
                      placeholder="AIza..." 
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      className="flex-1 bg-[#0D1117] border border-[#30363D] rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF6B35]"
                    />
                    <button 
                      type="submit" 
                      disabled={isUpdatingKey || !apiKeyInput}
                      className="bg-[#161B22] border border-[#30363D] hover:bg-[#30363D] text-white px-3 py-1.5 rounded text-xs transition-colors disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Server Summary Table */}
            <div className="lg:col-span-2 bg-[#161B22] border border-[#30363D] rounded-xl overflow-hidden">
              <div className="p-4 border-b border-[#30363D] flex flex-wrap justify-between items-center bg-[#161B22] gap-4">
                <div className="flex items-center gap-2 text-white font-medium text-sm">
                  <Server className="w-4 h-4 text-[#8B949E]" /> Server Summary
                </div>
                <div className="flex items-center gap-3">
                  <button className="text-xs text-[#8B949E] flex items-center gap-1 bg-[#0D1117] border border-[#30363D] px-2 py-1 rounded hover:bg-[#30363D] transition-colors">
                    Region <ChevronDown className="w-3 h-3" />
                  </button>
                  <button className="text-xs text-[#8B949E] flex items-center gap-1 bg-[#0D1117] border border-[#30363D] px-2 py-1 rounded hover:bg-[#30363D] transition-colors">
                    Status <ChevronDown className="w-3 h-3" />
                  </button>
                  <button className="text-xs text-[#8B949E] flex items-center gap-1 bg-[#0D1117] border border-[#30363D] px-2 py-1 rounded hover:bg-[#30363D] transition-colors">
                    Sort <ChevronDown className="w-3 h-3" />
                  </button>
                  <button className="p-1 text-[#8B949E] bg-[#0D1117] border border-[#30363D] rounded hover:text-white transition-colors">
                    <RefreshCw className="w-3 h-3" />
                  </button>
                  <button className="p-1 text-[#8B949E] bg-[#0D1117] border border-[#30363D] rounded hover:text-white transition-colors">
                    <Upload className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-[#30363D] text-[11px] uppercase tracking-wider text-[#8B949E] bg-[#0D1117]/50">
                      <th className="p-4 font-medium">Server ID</th>
                      <th className="p-4 font-medium">Region</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">CPU</th>
                      <th className="p-4 font-medium">Memory</th>
                      <th className="p-4 font-medium">Disk</th>
                      <th className="p-4 font-medium">Network</th>
                      <th className="p-4 font-medium">Uptime</th>
                      <th className="p-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-[#30363D]">
                    {servers.map((row, i) => (
                      <tr 
                        key={i} 
                        onClick={() => setActiveServerId(row.id)}
                        className={`hover:bg-[#0D1117]/50 transition-colors group cursor-pointer ${activeServerId === row.id ? 'bg-[#30363D]/30' : ''}`}
                      >
                        <td className="p-4 text-[#C9D1D9] font-mono text-xs flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#30363D] group-hover:bg-[#FF6B35] transition-colors"></span>
                          {row.id}
                        </td>
                        <td className="p-4 text-[#C9D1D9] text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-lg leading-none">
                              {row.region === 'SG' ? '🇸🇬' : row.region === 'US' ? '🇺🇸' : row.region === 'EU' ? '🇪🇺' : '🇯🇵'}
                            </span>
                            {row.region}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${
                            row.status === 'Healthy' ? 'text-[#3FB950] bg-[#3FB950]/10 border-[#3FB950]/20' :
                            row.status === 'Critical' ? 'text-[#F85149] bg-[#F85149]/10 border-[#F85149]/20' :
                            'text-[#D29922] bg-[#D29922]/10 border-[#D29922]/20'
                          }`}>{row.status}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-xs">
                            <span className={`${row.cpu > 80 ? 'text-[#F85149]' : row.cpu > 50 ? 'text-[#D29922]' : 'text-[#FF6B35]'}`}>
                              <BarChart2 className="w-3 h-3" />
                            </span>
                            <span className="text-[#C9D1D9] font-medium">{row.cpu}%</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-xs">
                            <span className={`${row.mem > 80 ? 'text-[#F85149]' : row.mem > 50 ? 'text-[#D29922]' : 'text-[#FF6B35]'}`}>
                              <BarChart2 className="w-3 h-3" />
                            </span>
                            <span className="text-[#C9D1D9] font-medium">{row.mem}%</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-xs">
                            <span className={`${row.disk > 80 ? 'text-[#F85149]' : row.disk > 50 ? 'text-[#D29922]' : 'text-[#FF6B35]'}`}>
                              <BarChart2 className="w-3 h-3" />
                            </span>
                            <span className="text-[#C9D1D9] font-medium">{row.disk}%</span>
                          </div>
                        </td>
                        <td className="p-4 text-[#C9D1D9] text-xs font-medium">{row.net.toFixed(2)} Gbps</td>
                        <td className="p-4 text-[#C9D1D9] text-xs font-medium">{row.up.toFixed(2)}%</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={(e) => handleDeleteServer(row.id, e)}
                            className="p-1.5 text-[#8B949E] hover:text-[#F85149] hover:bg-[#F85149]/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete Server"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Logs Area (Adapted to fit as 3rd column below) */}
            <div className="lg:col-span-1 bg-[#161B22] border border-[#30363D] rounded-xl shadow-sm flex flex-col h-[380px]">
              <div className="p-4 border-b border-[#30363D] flex justify-between items-center">
                <div className="flex items-center gap-2 text-white font-medium text-sm">
                  <Terminal className="w-4 h-4 text-[#8B949E]" /> System Logs
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] space-y-2 custom-scrollbar">
                {logs.length === 0 ? (
                  <div className="text-[#8B949E] italic text-center py-8">Waiting for events...</div>
                ) : (
                  logs.map((log, index) => {
                    const isError = log.toLowerCase().includes('error');
                    const time = log.match(/\[(.*?)\]/)?.[1] || '';
                    const message = log.replace(/\[.*?\]\s*/, '');
                    return (
                      <div key={index} className={`flex items-start gap-2 ${isError ? 'text-[#F85149]' : 'text-[#8B949E]'}`}>
                        <span className="text-[#30363D] shrink-0">{time}</span>
                        <span>{message}</span>
                      </div>
                    );
                  })
                )}
                <div ref={logsEndRef} />
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Global CSS for scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #30363D;
          border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: #484f58;
        }
      `}} />
    </div>
  );
}
