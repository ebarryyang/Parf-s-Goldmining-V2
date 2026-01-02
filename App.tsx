
import React, { useState, useEffect } from 'react';
import { Book, UserStats, ModalType, LogEntry, GameProgress, Pet, UserProfile } from './types';
import { Plus, Download, Shovel, Coins, BookOpen, ScrollText, Trophy, Gamepad2, CreditCard, FileSpreadsheet, Lock, Key, ShieldCheck, RefreshCw, LogOut } from 'lucide-react';
import { STORAGE_KEY_BOOKS, STORAGE_KEY_STATS, STORAGE_KEY_LOGS, STORAGE_KEY_PETS, STORAGE_KEY_GAME, STORAGE_KEY_USER, TRIAL_DAYS, STORAGE_KEY_INVITE_CODES } from './constants';
import AddBookModal from './components/AddBookModal';
import ChapterModal from './components/ChapterModal';
import MiningGame from './components/MiningGame';
import LogModal from './components/LogModal';
import PetMuseum from './components/PetMuseum';
import WithdrawModal from './components/WithdrawModal';
import Button from './components/Button';
import AuthScreen from './components/AuthScreen';
import InvitationModal from './components/InvitationModal';

const App: React.FC = () => {
  // User State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Data State
  const [books, setBooks] = useState<Book[]>([]);
  const [stats, setStats] = useState<UserStats>({ shovels: 0, coins: 0 });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [gameProgress, setGameProgress] = useState<GameProgress>({ currentLevelIndex: 0, levelCoinsFound: 0 });
  
  // UI State
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  // Admin State
  const [generatedCodeDisplay, setGeneratedCodeDisplay] = useState<string>('');

  // Refs
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  // Load Data on Mount
  useEffect(() => {
    const loadedUser = localStorage.getItem(STORAGE_KEY_USER);
    const loadedBooks = localStorage.getItem(STORAGE_KEY_BOOKS);
    const loadedStats = localStorage.getItem(STORAGE_KEY_STATS);
    const loadedLogs = localStorage.getItem(STORAGE_KEY_LOGS);
    const loadedPets = localStorage.getItem(STORAGE_KEY_PETS);
    const loadedGame = localStorage.getItem(STORAGE_KEY_GAME);
    
    if (loadedUser) setCurrentUser(JSON.parse(loadedUser));
    if (loadedBooks) setBooks(JSON.parse(loadedBooks));
    if (loadedStats) setStats(JSON.parse(loadedStats));
    if (loadedLogs) setLogs(JSON.parse(loadedLogs));
    if (loadedPets) setPets(JSON.parse(loadedPets));
    if (loadedGame) setGameProgress(JSON.parse(loadedGame));
  }, []);

  // Save User separately when updated
  useEffect(() => {
    if (currentUser) {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
    }
  }, [currentUser]);

  // Save Game Data
  useEffect(() => {
    if (!currentUser) return; // Don't save empty states over existing data if waiting for login
    localStorage.setItem(STORAGE_KEY_BOOKS, JSON.stringify(books));
    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
    localStorage.setItem(STORAGE_KEY_PETS, JSON.stringify(pets));
    localStorage.setItem(STORAGE_KEY_GAME, JSON.stringify(gameProgress));
  }, [books, stats, logs, pets, gameProgress, currentUser]);

  // Helpers
  const calculateAge = (user: UserProfile) => {
      if (!user.birthYear) return '未知';
      const currentYear = new Date().getFullYear();
      let age = currentYear - user.birthYear;
      return age > 0 ? age : 0;
  };

  const isTrialExpired = () => {
      if (!currentUser) return true;
      if (currentUser.isAdmin) return false; // Admin never expires
      if (currentUser.hasValidCode) return false; // Unlocked
      
      const now = Date.now();
      const diff = now - currentUser.createdAt;
      const daysPassed = diff / (1000 * 60 * 60 * 24);
      return daysPassed > TRIAL_DAYS;
  };

  const checkLock = (action: () => void) => {
      if (isTrialExpired()) {
          setActiveModal('INVITATION');
      } else {
          action();
      }
  };

  const handleUnlock = () => {
      if (currentUser) {
          setCurrentUser({ ...currentUser, hasValidCode: true });
          setActiveModal(null);
          alert("恭喜！完整版功能已解锁！");
      }
  };

  const handleLogout = () => {
    // Optionally clear current session storage if you want strict logout
    // localStorage.removeItem(STORAGE_KEY_USER); 
    // keeping it simple for state reset:
    setCurrentUser(null);
  };

  const handleAvatarUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentUser) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAvatar = reader.result as string;
        setCurrentUser({ ...currentUser, avatar: newAvatar });
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = ''; 
  };

  // ADMIN: Generate Invite Code
  const handleGenerateInviteCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 8; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      // Save to storage
      const stored = localStorage.getItem(STORAGE_KEY_INVITE_CODES);
      const codes = stored ? JSON.parse(stored) : [];
      codes.push(result);
      localStorage.setItem(STORAGE_KEY_INVITE_CODES, JSON.stringify(codes));
      
      setGeneratedCodeDisplay(result);
      setActiveModal('ADMIN_GENERATE');
  };

  // Helper to get reading days for export
  const getBookReadingDays = (book: Book) => {
      const isAllCompleted = book.chapters.every(c => c.isCompleted);
      let endDate = Date.now();
      
      if (isAllCompleted) {
          const timestamps = book.chapters.map(c => c.timestamp || 0);
          endDate = Math.max(...timestamps, book.createdAt);
      }
      
      const diffTime = Math.abs(endDate - book.createdAt);
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return days < 1 ? 1 : days;
  };

  // ADMIN: Download User Records
  const handleDownloadUserRecords = () => {
      if (!currentUser) return;

      let csvContent = "\uFEFF"; 
      csvContent += "用户名,手机号,注册时间,书籍名称,章节总数,已完成章节,铲子获得数,开始阅读时间,结束阅读时间,阅读天数,评分\n";

      const regTime = new Date(currentUser.createdAt).toLocaleString('zh-CN', { hour12: false });
      
      books.forEach(book => {
          const completedCount = book.chapters.filter(c => c.isCompleted).length;
          const safeTitle = book.title.replace(/"/g, '""');
          const shovelsEarned = completedCount; // 1 shovel per chapter
          const startTime = new Date(book.createdAt).toLocaleString('zh-CN', { hour12: false });
          
          // Determine end time (latest chapter completion)
          let lastTimestamp = 0;
          book.chapters.forEach(c => {
              if (c.timestamp && c.timestamp > lastTimestamp) {
                  lastTimestamp = c.timestamp;
              }
          });
          const endTime = lastTimestamp > 0 ? new Date(lastTimestamp).toLocaleString('zh-CN', { hour12: false }) : "进行中";
          const days = getBookReadingDays(book);
          const rating = book.rating || 0;

          csvContent += `"${currentUser.username}","${currentUser.phoneNumber || '-'}","${regTime}","${safeTitle}","${book.totalChapters}","${completedCount}","${shovelsEarned}","${startTime}","${endTime}","${days}","${rating}"\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `user_records_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const addLog = (message: string, change: { shovels?: number, coins?: number }, type: LogEntry['type']) => {
    const newLog: LogEntry = {
      id: Date.now().toString() + Math.random(),
      timestamp: Date.now(),
      type,
      message,
      change
    };
    setLogs(prev => [newLog, ...prev]);
  };

  // Actions
  const handleAddBook = (title: string, chapterCount: number) => {
    const newBook: Book = {
      id: Date.now().toString(),
      title,
      totalChapters: chapterCount,
      createdAt: Date.now(),
      chapters: Array.from({ length: chapterCount }, (_, i) => ({
        id: `${Date.now()}-${i}`,
        number: i + 1,
        isCompleted: false,
      })),
      rating: 0
    };
    setBooks(prev => [newBook, ...prev]);
    addLog(`录入新书: ${title}`, {}, 'EARN');
    setActiveModal(null);
  };

  const handleUploadProof = (bookId: string, chapterId: string, image: string) => {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    setBooks(prevBooks => prevBooks.map(b => {
      if (b.id !== bookId) return b;
      return {
        ...b,
        chapters: b.chapters.map(chapter => {
          if (chapter.id !== chapterId) return chapter;
          return { ...chapter, isCompleted: true, proofImage: image, timestamp: Date.now() };
        })
      };
    }));

    setStats(prev => ({ ...prev, shovels: prev.shovels + 1 }));
    addLog(`完成《${book.title}》章节`, { shovels: 1 }, 'EARN');
  };

  const handleRateBook = (bookId: string, rating: number) => {
      setBooks(prevBooks => prevBooks.map(b => {
          if (b.id !== bookId) return b;
          return { ...b, rating };
      }));
  };

  const handleUpdateStats = (newStats: UserStats) => {
      const diffShovels = newStats.shovels - stats.shovels;
      const diffCoins = newStats.coins - stats.coins;
      setStats(newStats);
      if (diffCoins > 0) {
          addLog('冒险挖掘', { shovels: diffShovels, coins: diffCoins }, 'SPEND');
      }
  };

  const handleAddPet = (pet: Pet) => {
      setPets(prev => [pet, ...prev]);
      addLog(`发现收藏品: ${pet.name}`, {}, 'FIND_PET');
  };

  const handleDeleteBook = (bookId: string) => {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    const completedChapters = book.chapters.filter(c => c.isCompleted).length;
    let shovelsToRemove = completedChapters;
    let coinsToRemove = 0;
    const currentShovels = stats.shovels;
    
    if (currentShovels < shovelsToRemove) {
        const shovelsShortage = shovelsToRemove - currentShovels;
        shovelsToRemove = currentShovels;
        coinsToRemove = shovelsShortage * 40; 
    }

    setBooks(prev => prev.filter(b => b.id !== bookId));
    setStats(prev => ({
        shovels: Math.max(0, prev.shovels - shovelsToRemove),
        coins: Math.max(0, prev.coins - coinsToRemove)
    }));
    addLog(`删除书籍《${book.title}》`, { shovels: -shovelsToRemove, coins: -coinsToRemove }, 'DELETE_PENALTY');
    setSelectedBookId(null);
    setActiveModal(null);
  };

  const handleWithdraw = (amount: number) => {
    setStats(prev => ({ ...prev, coins: prev.coins - amount }));
    addLog(`金币提现`, { coins: -amount }, 'WITHDRAW');
    setActiveModal(null);
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ user: currentUser, books, stats, logs, pets, gameProgress }, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "parfai_adventure_save.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleExportHistory = () => {
    let csvContent = "\uFEFF"; 
    csvContent += "录入时间,完成时间,书籍名称,章节,阅读天数,评分\n";

    books.forEach(book => {
        const entryDate = new Date(book.createdAt).toLocaleString('zh-CN', { hour12: false });
        const safeTitle = book.title.replace(/"/g, '""');
        const days = getBookReadingDays(book);
        const rating = book.rating || 0;

        book.chapters.forEach(chapter => {
            const completionDate = chapter.isCompleted && chapter.timestamp 
                ? new Date(chapter.timestamp).toLocaleString('zh-CN', { hour12: false }) 
                : "未完成";
            csvContent += `"${entryDate}","${completionDate}","${safeTitle}","第${chapter.number}章","${days}","${rating}"\n`;
        });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reading_list_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ---------------- Render Logic ----------------

  if (!currentUser) {
      return <AuthScreen onLogin={setCurrentUser} />;
  }

  const selectedBook = books.find(b => b.id === selectedBookId);
  const isLocked = isTrialExpired();

  return (
    <div className="h-screen w-full flex flex-col font-round selection:bg-mario-red selection:text-white relative z-10 overflow-hidden">
      
      {/* 1. Header Area - Fixed Top with Style */}
      <header className="bg-white/80 backdrop-blur-md p-3 md:p-4 shadow-sm z-30 border-b-4 border-mario-blue relative">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
            {/* Title Badge */}
            <div className="bg-gradient-to-r from-mario-red to-orange-500 text-white px-3 py-2 md:px-6 md:py-3 rounded-xl font-pixel text-xs md:text-xl tracking-widest shadow-pixel border-4 border-white flex items-center gap-2 transform rotate-[-1deg]">
            <BookOpen fill="white" size={18} className="md:w-7 md:h-7" />
            <span className="hidden md:inline">Parf's Book Adventure V2.0</span>
            <span className="md:hidden">Parf's Adventure</span>
            </div>

            {/* User Info Badge */}
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm p-1 pr-2 rounded-full border-4 border-black shadow-pixel">
                <div 
                    onClick={() => avatarInputRef.current?.click()}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-gray-300 cursor-pointer relative group"
                    title="点击更换头像"
                >
                    <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus size={16} className="text-white" />
                    </div>
                </div>
                <div className="flex flex-col mr-2">
                    <div className="flex items-center gap-1">
                        <span className="font-bold text-gray-800 text-sm md:text-base leading-tight">
                            {currentUser.childName}
                        </span>
                        {currentUser.isAdmin && <ShieldCheck size={14} className="text-mario-blue" />}
                    </div>
                    <span className="text-[10px] md:text-xs text-gray-500 font-pixel">
                        {calculateAge(currentUser)}岁 · {currentUser.hasValidCode || currentUser.isAdmin ? '正式' : '试用'}
                    </span>
                </div>
                
                <button 
                    onClick={handleLogout}
                    className="bg-gray-200 hover:bg-red-500 hover:text-white text-gray-600 p-2 rounded-full transition-colors"
                    title="退出登录"
                >
                    <LogOut size={16} />
                </button>
            </div>
        </div>
      </header>

      {/* Hidden File Input for Avatar Update */}
      <input 
        type="file" 
        ref={avatarInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={handleAvatarUpdate}
      />

      {/* 2. Main Content Area - Scrollable */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
         <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-4 md:gap-6 min-h-min">
            
            {/* Left: Book List */}
            <section className="flex-1 bg-white/90 rounded-[1.5rem] shadow-pixel-lg p-4 flex flex-col border-4 border-black backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4 border-b-4 border-black/10 pb-2">
                <h2 className="text-lg md:text-2xl font-pixel text-gray-800 flex items-center gap-2">
                <span className="bg-mario-green w-3 h-6 md:w-4 md:h-8 rounded-md block shadow-pixel border-2 border-black"></span>
                任务书架
                </h2>
                <span className="text-xs md:text-sm font-bold text-white bg-black px-2 py-1 rounded-full border-2 border-gray-500">
                x {books.length}
                </span>
            </div>

            <div className="space-y-3 md:space-y-4">
                {books.length === 0 ? (
                <div className="h-40 md:h-64 flex flex-col items-center justify-center text-gray-400 opacity-60">
                    <BookOpen size={48} className="mb-4 text-mario-red" />
                    <p className="font-bold text-lg font-pixel text-mario-blue text-center leading-relaxed">Let's Go!<br/>添加一本书开始吧!</p>
                </div>
                ) : (
                books.map(book => {
                    const completedCount = book.chapters.filter(c => c.isCompleted).length;
                    const progress = Math.round((completedCount / book.totalChapters) * 100);
                    
                    return (
                    <div 
                        key={book.id}
                        onClick={() => { setSelectedBookId(book.id); setActiveModal('CHAPTER_VIEW'); }}
                        className="group bg-[#FFD180] hover:bg-[#FFB74D] rounded-xl p-0 cursor-pointer transition-all duration-200 border-4 border-black shadow-pixel hover:shadow-none hover:translate-y-1 relative overflow-hidden"
                    >
                        <div className="p-3 md:p-4 relative z-10">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-lg border-2 border-black shadow-sm">
                                <BookOpen size={20} className="text-mario-brown" />
                            </div>
                            <div>
                                <h3 className="font-black text-base md:text-lg text-[#3E2723] leading-tight mb-0.5">{book.title}</h3>
                                <div className="inline-block bg-white/50 px-2 py-0.5 rounded text-[10px] md:text-xs font-bold text-[#3E2723] border border-[#3E2723]/20">
                                进度: {completedCount} / {book.totalChapters}
                                </div>
                            </div>
                            </div>
                            <div className="text-right">
                                <span className="block text-lg md:text-xl font-pixel text-[#E65100] drop-shadow-sm">{progress}%</span>
                            </div>
                        </div>
                        </div>
                        <div className="h-2 md:h-3 bg-[#E65100]/20 border-t-2 border-black">
                            <div className="h-full bg-mario-green transition-all duration-500 relative" style={{ width: `${progress}%` }}>
                                <div className="absolute inset-0 w-full h-full" style={{backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem'}}></div>
                            </div>
                        </div>
                    </div>
                    );
                })
                )}
            </div>
            </section>

            {/* Right: Stats & Info */}
            <section className="w-full md:w-1/3 flex flex-col gap-4">
            {/* Stats Card - Modified Layout for Mobile */}
            <div className="bg-[#3E2723] rounded-[1.5rem] p-4 md:p-6 shadow-pixel-lg text-white relative flex flex-col gap-4 border-4 border-[#FFECB3]">
                {/* Decorative Rivets */}
                <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-[#FFECB3] shadow-inner hidden md:block"></div>
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#FFECB3] shadow-inner hidden md:block"></div>

                {/* Shovels and Coins Row */}
                <div className="flex flex-row w-full gap-4">
                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-1 px-1">
                        <span className="text-[#FFECB3] font-pixel text-[10px] md:text-xs tracking-wider">我的铲子</span>
                        </div>
                        <div className="bg-black/30 rounded-xl p-2 md:p-4 flex items-center justify-between gap-2 border-2 border-[#5D4037] shadow-inner h-full">
                        <Shovel className="text-mario-blue w-6 h-6 md:w-8 md:h-8" />
                        <span className="text-2xl md:text-4xl font-pixel text-white drop-shadow-md">x {stats.shovels}</span>
                        </div>
                    </div>

                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-1 px-1">
                        <span className="text-[#FFECB3] font-pixel text-[10px] md:text-xs tracking-wider">金币数量</span>
                        </div>
                        <div className="bg-black/30 rounded-xl p-2 md:p-4 flex flex-col border-2 border-[#5D4037] shadow-inner gap-1 md:gap-3">
                        <div className="flex items-center justify-between">
                            <Coins className="text-mario-yellow animate-pulse w-6 h-6 md:w-8 md:h-8" />
                            <span className="text-2xl md:text-4xl font-pixel text-mario-yellow drop-shadow-md">x {stats.coins}</span>
                        </div>
                        <button 
                            onClick={() => setActiveModal('WITHDRAW')}
                            className="bg-mario-yellow text-mario-brown text-[10px] md:text-xs font-bold py-1 md:py-2 rounded-lg hover:bg-yellow-400 active:translate-y-0.5 border-2 border-black/10 flex items-center justify-center gap-1 transition-all"
                        >
                            <CreditCard size={12} />
                            提取
                        </button>
                        </div>
                    </div>
                </div>
                
                {/* Logs Button Row - Visible on Mobile and Desktop */}
                <button 
                    onClick={() => setActiveModal('LOGS')}
                    className="flex w-full bg-[#5D4037] hover:bg-[#6D4C41] text-[#FFECB3] py-3 rounded-xl font-bold items-center justify-center gap-2 border-2 border-[#8D6E63] shadow-pixel active:shadow-none active:translate-y-1 transition-all"
                >
                    <span className="block md:hidden">查看记录</span>
                    <span className="hidden md:flex items-center gap-2">
                        <ScrollText size={18} /> 查看记录
                    </span>
                </button>
            </div>
            </section>
        </div>
      </main>

      {/* 3. Bottom Control Bar - Fixed Bottom with increased padding for mobile */}
      <footer className="bg-white/80 backdrop-blur-md p-3 pb-8 md:pb-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-30 border-t-4 border-mario-blue overflow-x-auto">
        <div className="max-w-6xl mx-auto flex flex-nowrap md:flex-wrap items-center justify-start md:justify-center gap-3 md:gap-6 min-w-max md:min-w-0 px-2">
          
          <Button 
            onClick={() => checkLock(() => setActiveModal('ADD_BOOK'))}
            label="录入书籍"
            variant="success"
            icon={isLocked ? <Lock size={18} /> : <Plus size={18} />}
            className="flex-1 min-w-[120px]"
          />

          <Button 
             onClick={() => checkLock(() => setActiveModal('MINING'))}
             label="冒险开始"
             variant="warning"
             icon={isLocked ? <Lock size={18} /> : <Gamepad2 size={18} />}
             className="flex-1 min-w-[120px]"
          />

          <Button 
             onClick={() => setActiveModal('MUSEUM')}
             label="博物馆"
             variant="primary"
             icon={<Trophy size={18} />}
             className="flex-1 min-w-[110px]"
          />
          
          {currentUser.isAdmin ? (
             <>
                <Button 
                    onClick={handleGenerateInviteCode}
                    label="生成邀请码"
                    variant="danger"
                    icon={<RefreshCw size={18} />}
                    className="flex-1 min-w-[120px]"
                />
                <Button 
                    onClick={handleDownloadUserRecords}
                    label="下载记录"
                    variant="neutral"
                    icon={<FileSpreadsheet size={18} />}
                    className="flex-1 min-w-[120px]"
                />
             </>
          ) : (
             <Button 
                onClick={() => setActiveModal('INVITATION')}
                label={currentUser.hasValidCode ? "已激活" : "邀请码"}
                variant={currentUser.hasValidCode ? "neutral" : "secondary"}
                icon={<Key size={18} />}
                className="w-auto px-4"
                disabled={currentUser.hasValidCode}
            />
          )}

          {!currentUser.isAdmin && (
            <div className="hidden md:flex gap-3">
                <Button 
                    onClick={handleExport}
                    label="保存"
                    variant="neutral"
                    icon={<Download size={18} />}
                    className="w-auto px-4"
                />
                <Button 
                    onClick={handleExportHistory}
                    label="清单"
                    variant="secondary"
                    icon={<FileSpreadsheet size={18} />}
                    className="w-auto px-4"
                />
            </div>
          )}
        </div>
      </footer>

      {/* Modals */}
      {activeModal === 'ADD_BOOK' && (
        <AddBookModal 
          onClose={() => setActiveModal(null)}
          onAdd={handleAddBook}
        />
      )}

      {activeModal === 'CHAPTER_VIEW' && selectedBook && (
        <ChapterModal 
          book={selectedBook}
          onClose={() => { setActiveModal(null); setSelectedBookId(null); }}
          onUploadProof={handleUploadProof}
          onDeleteBook={handleDeleteBook}
          onRateBook={handleRateBook}
        />
      )}

      {activeModal === 'MINING' && (
        <MiningGame 
          stats={stats}
          progress={gameProgress}
          onClose={() => setActiveModal(null)}
          onUpdateStats={handleUpdateStats}
          onUpdateProgress={setGameProgress}
          onFindPet={handleAddPet}
        />
      )}
      
      {activeModal === 'LOGS' && (
        <LogModal 
          logs={logs}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'MUSEUM' && (
        <PetMuseum 
          pets={pets}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'WITHDRAW' && (
        <WithdrawModal 
            maxCoins={stats.coins}
            onClose={() => setActiveModal(null)}
            onWithdraw={handleWithdraw}
        />
      )}
      
      {activeModal === 'INVITATION' && (
        <InvitationModal 
            onClose={() => setActiveModal(null)}
            onSuccess={handleUnlock}
        />
      )}
      
      {activeModal === 'ADMIN_GENERATE' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4 backdrop-blur-md">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full border-4 border-mario-red shadow-pixel-lg text-center">
                <h3 className="font-pixel text-mario-blue text-lg mb-4">生成成功</h3>
                <p className="mb-2 text-gray-500">邀请码为:</p>
                <div className="bg-gray-100 p-4 rounded-xl text-2xl font-black text-center tracking-widest border-2 border-dashed border-gray-400 mb-6 select-all">
                    {generatedCodeDisplay}
                </div>
                <Button label="关闭" variant="neutral" onClick={() => setActiveModal(null)} fullWidth />
            </div>
        </div>
      )}

    </div>
  );
};

export default App;
