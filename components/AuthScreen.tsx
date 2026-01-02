
import React, { useState, useRef } from 'react';
import { BookOpen, User, Lock, Upload, Key, Smile, Image as ImageIcon, Phone } from 'lucide-react';
import Button from './Button';
import { UserProfile } from '../types';
import { VALID_INVITE_CODE } from '../constants';

// 8-bit Pixel Art Rabbit Avatar (SVG Base64)
const DEFAULT_AVATAR = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjNkI4Q0ZGIi8+PHJlY3QgeD0iMTYiIHk9IjQiIHdpZHRoPSI4IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRkZGRkZGIi8+PHJlY3QgeD0iMjAiIHk9IjgiIHdpZHRoPSI0IiBoZWlnaHQ9IjE2IiBmaWxsPSIjRkZDMENCIi8+PHJlY3QgeD0iNDAiIHk9IjQiIHdpZHRoPSI4IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRkZGRkZGIi8+PHJlY3QgeD0iNDQiIHk9IjgiIHdpZHRoPSI0IiBoZWlnaHQ9IjE2IiBmaWxsPSIjRkZDMENCIi8+PHJlY3QgeD0iMTIiIHk9IjI0IiB3aWR0aD0iNDAiIGhlaWdodD0iMzYiIGZpbGw9IiNGRkZGRkYiLz48cmVjdCB4PSIyMCIgeT0iMzIiIHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiMwMDAwMDAiLz48cmVjdCB4PSIzNiIgeT0iMzIiIHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiMwMDAwMDAiLz48cmVjdCB4PSIzMCIgeT0iNDQiIHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNGRkMwQ0IiLz48cmVjdCB4PSIyOCIgeT0iNTIiIHdpZHRoPSI4IiBoZWlnaHQ9IjQiIGZpbGw9IiMwMDAwMDAiLz48L3N2Zz4=";

interface AuthScreenProps {
  onLogin: (user: UserProfile) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  
  // Register Fields
  const [childName, setChildName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [gender, setGender] = useState<'BOY' | 'GIRL' | 'SECRET'>('SECRET');
  const [inviteCode, setInviteCode] = useState('');
  const [avatar, setAvatar] = useState<string>(DEFAULT_AVATAR);
  
  // Login Fields
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginCode, setLoginCode] = useState('');

  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!childName.trim() || !username.trim() || !password.trim() || !phoneNumber.trim()) {
        setError("请填写所有必填项 (姓名, 手机号, 用户名, 密码)");
        return;
    }

    const newUser: UserProfile = {
        username: username.trim(),
        childName: childName.trim(),
        phoneNumber: phoneNumber.trim(),
        birthYear: birthYear ? parseInt(birthYear) : undefined,
        birthMonth: birthMonth ? parseInt(birthMonth) : undefined,
        gender,
        avatar,
        createdAt: Date.now(),
        hasValidCode: inviteCode.trim() === VALID_INVITE_CODE,
        isAdmin: false
    };

    // Store credentials for "Login" simulation
    localStorage.setItem(`parfai_auth_${username.trim()}`, password.trim());
    
    onLogin(newUser);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 1. Admin Check
    if (loginUser.trim() === 'ebarryyang' && loginPass.trim() === 'yang128739') {
        const adminUser: UserProfile = {
            username: 'ebarryyang',
            childName: 'Administrator',
            phoneNumber: '00000000000',
            createdAt: Date.now(),
            hasValidCode: true,
            isAdmin: true,
            avatar: DEFAULT_AVATAR
        };
        onLogin(adminUser);
        return;
    }

    // 2. Normal User Check
    const storedPass = localStorage.getItem(`parfai_auth_${loginUser.trim()}`);
    
    if (storedPass === loginPass.trim()) {
        // Retrieve stored user profile if available, otherwise reconstruct for session
        const rawUser = localStorage.getItem('parfai_user_v2');
        if (rawUser) {
            const u = JSON.parse(rawUser);
            if (u.username === loginUser.trim()) {
                 if (loginCode.trim() === VALID_INVITE_CODE && !u.hasValidCode) {
                     u.hasValidCode = true;
                 }
                 onLogin(u);
                 return;
            }
        }
        // Fallback if local storage was cleared but password remains
        setError("未找到该用户的详细档案，请重新注册");
    } else {
        setError("用户名或密码错误");
    }
  };

  return (
    <div className="min-h-screen bg-mario-sky bg-clouds flex items-center justify-center p-4">
       <div className="bg-white w-full max-w-lg rounded-3xl shadow-pixel-lg border-8 border-black overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="bg-mario-red p-8 text-center border-b-8 border-black relative overflow-hidden h-40 flex items-center justify-center">
             {/* Background Decoration */}
             <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/pixel-weave.png')] z-0"></div>
             
             {/* Book Icon Decoration */}
             <div className="absolute left-8 top-1/2 -translate-y-1/2 opacity-30 z-0 pointer-events-none mix-blend-multiply transform rotate-[-15deg]">
                  <BookOpen size={100} className="text-black" />
             </div>

             <div className="relative z-10 transform hover:scale-105 transition-transform duration-300">
                <h1 className="font-pixel text-2xl md:text-3xl text-white drop-shadow-[4px_4px_0_#000] leading-normal">
                   Parf's Book<br/>Goldmining<br/>Adventures
                </h1>
                <div className="mt-2 inline-block bg-mario-yellow text-black font-pixel text-xs px-2 py-1 rounded shadow-pixel border-2 border-black transform rotate-[-3deg]">
                    V 2.0
                </div>
             </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b-4 border-black bg-gray-100">
             <button 
               onClick={() => { setMode('LOGIN'); setError(''); }}
               className={`flex-1 py-4 font-pixel text-sm md:text-base transition-colors ${mode === 'LOGIN' ? 'bg-white text-mario-blue' : 'bg-gray-200 text-gray-500 hover:bg-gray-100'}`}
             >
                登录
             </button>
             <button 
               onClick={() => { setMode('REGISTER'); setError(''); }}
               className={`flex-1 py-4 font-pixel text-sm md:text-base transition-colors border-l-4 border-black ${mode === 'REGISTER' ? 'bg-white text-mario-green' : 'bg-gray-200 text-gray-500 hover:bg-gray-100'}`}
             >
                注册
             </button>
          </div>

          {/* Form Content */}
          <div className="p-6 md:p-8 flex-1 bg-white">
             {error && (
                 <div className="bg-red-100 border-2 border-red-500 text-red-700 p-3 rounded-xl mb-6 text-sm font-bold text-center animate-pulse">
                     {error}
                 </div>
             )}

             {mode === 'LOGIN' ? (
                 <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block font-bold text-gray-700 mb-2 ml-1">用户名</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3.5 text-gray-400" size={20} />
                            <input 
                                type="text"
                                value={loginUser}
                                onChange={e => setLoginUser(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:border-mario-blue focus:ring-0 outline-none font-bold transition-all"
                                placeholder="请输入用户名"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block font-bold text-gray-700 mb-2 ml-1">密码</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3.5 text-gray-400" size={20} />
                            <input 
                                type="password"
                                value={loginPass}
                                onChange={e => setLoginPass(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:border-mario-blue focus:ring-0 outline-none font-bold transition-all"
                                placeholder="******"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block font-bold text-gray-700 mb-2 ml-1">邀请码 (选填)</label>
                        <div className="relative">
                            <Key className="absolute left-3 top-3.5 text-gray-400" size={20} />
                            <input 
                                type="text"
                                value={loginCode}
                                onChange={e => setLoginCode(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:border-mario-blue focus:ring-0 outline-none font-bold transition-all"
                                placeholder="如有邀请码可填写"
                            />
                        </div>
                    </div>
                    <Button label="进入游戏" fullWidth variant="secondary" type="submit" />
                 </form>
             ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                    {/* Avatar Upload */}
                    <div className="flex justify-center mb-4">
                        <div 
                           className="w-24 h-24 rounded-full border-4 border-mario-green overflow-hidden relative cursor-pointer group bg-gray-100 shadow-md"
                           onClick={() => fileInputRef.current?.click()}
                        >
                            <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload className="text-white" />
                            </div>
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleAvatarChange}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block font-bold text-xs text-gray-500 mb-1 ml-1">孩子姓名 *</label>
                            <input 
                                type="text"
                                value={childName}
                                onChange={e => setChildName(e.target.value)}
                                className="w-full p-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:border-mario-green outline-none font-bold text-sm"
                                placeholder="宝宝名字"
                            />
                        </div>
                         <div>
                            <label className="block font-bold text-xs text-gray-500 mb-1 ml-1">性别</label>
                            <select 
                                value={gender}
                                onChange={(e: any) => setGender(e.target.value)}
                                className="w-full p-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:border-mario-green outline-none font-bold text-sm appearance-none"
                            >
                                <option value="BOY">👦 男生</option>
                                <option value="GIRL">👧 女生</option>
                                <option value="SECRET">🤐 保密</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block font-bold text-xs text-gray-500 mb-1 ml-1">手机号码 *</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 text-gray-400" size={16} />
                            <input 
                                type="tel"
                                value={phoneNumber}
                                onChange={e => setPhoneNumber(e.target.value)}
                                className="w-full pl-9 p-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:border-mario-green outline-none font-bold text-sm"
                                placeholder="请输入手机号"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block font-bold text-xs text-gray-500 mb-1 ml-1">出生年</label>
                            <input 
                                type="number"
                                value={birthYear}
                                onChange={e => setBirthYear(e.target.value)}
                                className="w-full p-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:border-mario-green outline-none font-bold text-sm"
                                placeholder="YYYY"
                            />
                        </div>
                        <div>
                            <label className="block font-bold text-xs text-gray-500 mb-1 ml-1">出生月</label>
                            <input 
                                type="number"
                                min="1" max="12"
                                value={birthMonth}
                                onChange={e => setBirthMonth(e.target.value)}
                                className="w-full p-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:border-mario-green outline-none font-bold text-sm"
                                placeholder="MM"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block font-bold text-xs text-gray-500 mb-1 ml-1">用户名 *</label>
                        <input 
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="w-full p-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:border-mario-green outline-none font-bold text-sm"
                            placeholder="用于登录"
                        />
                    </div>
                    <div>
                        <label className="block font-bold text-xs text-gray-500 mb-1 ml-1">密码 *</label>
                        <input 
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full p-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:border-mario-green outline-none font-bold text-sm"
                            placeholder="设置密码"
                        />
                    </div>

                    <div>
                        <label className="block font-bold text-xs text-gray-500 mb-1 ml-1">邀请码 (选填)</label>
                        <input 
                            type="text"
                            value={inviteCode}
                            onChange={e => setInviteCode(e.target.value)}
                            className="w-full p-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:border-mario-green outline-none font-bold text-sm"
                            placeholder="解锁完整版"
                        />
                    </div>

                    <Button label="注册并开始" fullWidth variant="success" type="submit" />
                </form>
             )}
          </div>
       </div>
    </div>
  );
};

export default AuthScreen;
