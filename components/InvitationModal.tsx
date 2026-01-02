
import React, { useState } from 'react';
import { X, Key, Lock } from 'lucide-react';
import Button from './Button';
import { VALID_INVITE_CODE, STORAGE_KEY_INVITE_CODES } from '../constants';

interface InvitationModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const InvitationModal: React.FC<InvitationModalProps> = ({ onClose, onSuccess }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim();
    
    // Check static code
    let isValid = cleanCode === VALID_INVITE_CODE;
    
    // Check generated codes
    if (!isValid) {
        const storedCodes = localStorage.getItem(STORAGE_KEY_INVITE_CODES);
        if (storedCodes) {
            const codes = JSON.parse(storedCodes) as string[];
            if (codes.includes(cleanCode)) {
                isValid = true;
            }
        }
    }

    if (isValid) {
      onSuccess();
    } else {
      setError('验证码错误，请重新输入');
      setCode('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-md animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-pixel-lg relative border-4 border-mario-blue text-center">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 bg-gray-200 p-2 rounded-full hover:bg-gray-300"
        >
          <X size={20} />
        </button>

        <div className="flex justify-center mb-4">
            <div className="bg-mario-yellow p-4 rounded-full border-4 border-black shadow-pixel animate-bounce">
                <Lock size={48} className="text-black" />
            </div>
        </div>

        <h2 className="text-xl font-pixel text-mario-blue mb-2">解锁完整版</h2>
        <p className="text-gray-600 mb-6 font-round font-bold">
            请输入您的专属邀请码<br/>以解锁所有功能
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(''); }}
              placeholder="输入邀请码"
              className="w-full bg-gray-100 border-2 border-gray-300 rounded-xl p-3 text-center text-lg font-bold tracking-widest outline-none focus:border-mario-blue focus:ring-2 focus:ring-mario-blue/20 uppercase placeholder:normal-case placeholder:tracking-normal"
            />
            {error && <p className="text-mario-red text-xs font-bold mt-2">{error}</p>}
          </div>
          
          <Button 
            type="submit"
            label="验证并解锁"
            variant="success"
            fullWidth
            icon={<Key size={18} />}
          />
        </form>
      </div>
    </div>
  );
};

export default InvitationModal;
