
import React, { useRef } from 'react';
import { X, Camera, CheckCircle, Lock, Trash2, Image as ImageIcon, Calendar, Star, BookOpen } from 'lucide-react';
import { Book, Chapter } from '../types';
import Button from './Button';
import StarRating from './StarRating';

interface ChapterModalProps {
  book: Book;
  onClose: () => void;
  onUploadProof: (bookId: string, chapterId: string, image: string) => void;
  onDeleteBook: (bookId: string) => void;
  onRateBook: (bookId: string, rating: number) => void;
}

// 8-bit Red Flower SVG Base64
const FLOWER_SVG = `
<svg width="100%" height="100%" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
  <!-- Stem -->
  <rect x="11" y="14" width="2" height="10" fill="#2E8B57" />
  <rect x="9" y="16" width="2" height="2" fill="#32CD32" />
  <rect x="13" y="18" width="2" height="2" fill="#32CD32" />
  
  <!-- Center -->
  <rect x="10" y="9" width="4" height="4" fill="#FFD700" />
  
  <!-- Petals -->
  <rect x="10" y="5" width="4" height="4" fill="#E60012" /> <!-- Top -->
  <rect x="10" y="13" width="4" height="4" fill="#E60012" /> <!-- Bottom -->
  <rect x="6" y="9" width="4" height="4" fill="#E60012" /> <!-- Left -->
  <rect x="14" y="9" width="4" height="4" fill="#E60012" /> <!-- Right -->
  
  <!-- Corners -->
  <rect x="7" y="6" width="2" height="2" fill="#FF6B6B" />
  <rect x="15" y="6" width="2" height="2" fill="#FF6B6B" />
  <rect x="7" y="14" width="2" height="2" fill="#FF6B6B" />
  <rect x="15" y="14" width="2" height="2" fill="#FF6B6B" />
</svg>
`;
const FLOWER_IMAGE = `data:image/svg+xml;base64,${btoa(FLOWER_SVG)}`;

const ChapterModal: React.FC<ChapterModalProps> = ({ book, onClose, onUploadProof, onDeleteBook, onRateBook }) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [selectedChapterId, setSelectedChapterId] = React.useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Disabled functionality, but keeping code to avoid breaking references if needed later
    const file = e.target.files?.[0];
    if (file && selectedChapterId) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUploadProof(book.id, selectedChapterId, reader.result as string);
        setSelectedChapterId(null); 
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleMarkAsRead = (chapterId: string) => {
      onUploadProof(book.id, chapterId, FLOWER_IMAGE);
  };

  const handleDelete = () => {
    onDeleteBook(book.id);
    onClose();
  };

  // Calculate Reading Days
  const calculateDays = () => {
      const isAllCompleted = book.chapters.every(c => c.isCompleted);
      let endDate = Date.now();
      
      if (isAllCompleted) {
          // Find the latest timestamp among chapters
          const timestamps = book.chapters.map(c => c.timestamp || 0);
          endDate = Math.max(...timestamps, book.createdAt);
      }
      
      const diffTime = Math.abs(endDate - book.createdAt);
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return days < 1 ? 1 : days;
  };

  if (showDeleteConfirm) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-md">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full border-4 border-mario-red shadow-pixel-lg text-center">
            <h3 className="font-pixel text-mario-red text-lg mb-4">危险操作!</h3>
            <p className="mb-6 font-bold text-gray-600">
                删除这本书会扣除你因此获得的所有铲子和金币！
                <br/><br/>
                确定要删除吗？
            </p>
            <div className="flex gap-4">
                <Button label="取消" variant="neutral" onClick={() => setShowDeleteConfirm(false)} fullWidth />
                <Button label="确认删除" variant="danger" onClick={handleDelete} fullWidth />
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-md">
       <div className="bg-white w-full max-w-5xl h-[90vh] rounded-[2rem] p-6 md:p-8 shadow-pixel-lg relative flex flex-col border-8 border-mario-blue">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6 border-b-4 border-gray-100 pb-4 border-dashed gap-4">
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-pixel text-gray-800 leading-relaxed drop-shadow-sm">{book.title}</h2>
            
            <div className="flex flex-wrap items-center gap-3 mt-3">
                {/* Progress Badge */}
                <div className="bg-mario-yellow text-mario-brown px-3 py-1 rounded-lg font-black text-sm border-2 border-mario-brown shadow-pixel">
                    进度: {book.chapters.filter(c => c.isCompleted).length} / {book.totalChapters}
                </div>

                {/* Reading Days Badge (8-bit style) */}
                <div className="bg-mario-sky text-white px-3 py-1 rounded-lg font-pixel text-xs md:text-sm border-2 border-blue-700 shadow-pixel flex items-center gap-2">
                    <Calendar size={14} />
                    <span>已读 {calculateDays()} 天</span>
                </div>

                {/* Star Rating - Increased padding and min-width to fit score */}
                <div className="bg-gray-100 px-4 py-2 rounded-lg border-2 border-gray-300 shadow-pixel flex items-center min-w-[220px] justify-center">
                    <StarRating 
                        rating={book.rating || 0} 
                        onRate={(r) => onRateBook(book.id, r)} 
                    />
                </div>
            </div>
          </div>

          <div className="flex gap-2 self-end md:self-start">
            <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-red-100 p-3 rounded-xl border-2 border-red-200 hover:bg-red-500 hover:text-white hover:border-black transition-all shadow-sm"
                title="删除书籍"
            >
                <Trash2 size={24} />
            </button>
            <button 
                onClick={onClose}
                className="bg-gray-200 p-3 rounded-xl border-2 border-gray-300 hover:bg-gray-300 transition-colors shadow-sm"
            >
                <X size={24} className="text-gray-700" />
            </button>
          </div>
        </div>

        {/* Scrollable Chapter List */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-2">
          {book.chapters.map((chapter) => (
            <div 
              key={chapter.id}
              className={`relative rounded-2xl p-4 border-4 transition-all duration-300 flex flex-col gap-3 shadow-pixel
                ${chapter.isCompleted 
                  ? 'bg-green-50 border-mario-green' 
                  : 'bg-gray-50 border-gray-300'}`}
            >
              <div className="flex justify-between items-start">
                <span className={`font-pixel text-lg ${chapter.isCompleted ? 'text-mario-green' : 'text-gray-400'}`}>
                  Level {chapter.number}
                </span>
                {chapter.isCompleted ? (
                   <div className="bg-mario-green text-white px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 border border-green-700 shadow-sm">
                     <CheckCircle size={12} /> CLEAR!
                   </div>
                ) : (
                  <div className="bg-gray-200 text-gray-500 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                    LOCKED
                  </div>
                )}
              </div>

              {chapter.isCompleted && chapter.proofImage ? (
                <div className="w-full h-40 rounded-xl overflow-hidden border-4 border-white shadow-md bg-white p-4">
                  <img src={chapter.proofImage} alt="Proof" className="w-full h-full object-contain pixel-art-scaling" />
                </div>
              ) : (
                <div className="w-full h-40 rounded-xl border-4 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 bg-white/50">
                  <Lock size={32} className="mb-2 opacity-30" />
                  <span className="text-xs font-bold">待解锁</span>
                </div>
              )}

              {!chapter.isCompleted && (
                <div className="mt-auto w-full flex flex-col gap-3">
                    {/* Read Button */}
                    <button
                      onClick={() => handleMarkAsRead(chapter.id)}
                      className="w-full bg-mario-blue text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-pixel border-2 border-black/10 font-round"
                    >
                      <BookOpen size={20} />
                      <span>已阅读</span>
                    </button>

                    {/* Disabled Camera/Gallery Buttons */}
                    <div className="flex gap-3 opacity-40 grayscale pointer-events-none select-none">
                        <button
                          className="flex-1 bg-gray-300 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-none border-2 border-gray-400 font-round"
                        >
                          <Camera size={20} />
                          <span>拍照</span>
                        </button>
                        <button
                          className="flex-1 bg-gray-300 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-none border-2 border-gray-400 font-round"
                        >
                          <ImageIcon size={20} />
                          <span>相册</span>
                        </button>
                    </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Hidden Inputs (Kept for compatibility, though unused now) */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={cameraInputRef}
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          type="file"
          accept="image/*"
          ref={galleryInputRef}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

export default ChapterModal;
