
import React from 'react';

interface PhotoItem {
  data: string;
  mimeType: string;
  timestamp: number;
}

interface PhotosViewProps {
  photos: PhotoItem[];
}

const PhotosView: React.FC<PhotosViewProps> = ({ photos }) => {
  return (
    <div className="h-full overflow-y-auto p-8 md:p-12 custom-scrollbar bg-[#fcfaf2]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white border border-stone-200 shadow-sm mb-4">
              <i className="fa-solid fa-images text-stone-400 text-[10px]"></i>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Asset Management</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#2d3436]">Visual Repository</h2>
            <p className="text-stone-500 mt-4 max-w-lg font-medium">Archive of all structural visual data and generated entities from your analytical sessions.</p>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-stone-200">
            <div className="px-6 py-3 border-r border-stone-100 text-center">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Total Assets</p>
              <p className="text-xl font-bold text-[#2d3436]">{photos.length}</p>
            </div>
            <div className="px-6 py-3 text-center">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Storage Status</p>
              <p className="text-xl font-bold text-emerald-500">Optimized</p>
            </div>
          </div>
        </div>

        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center opacity-40">
            <div className="w-24 h-24 rounded-3xl bg-stone-200 flex items-center justify-center mb-8">
              <i className="fa-solid fa-camera-retro text-4xl text-stone-400"></i>
            </div>
            <h3 className="text-2xl font-bold text-[#2d3436]">No visual data detected</h3>
            <p className="text-stone-500 mt-2">Shared or generated images will appear here automatically.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {photos.slice().reverse().map((photo, i) => (
              <div key={i} className="group relative aspect-square rounded-[2rem] overflow-hidden bg-white border border-stone-200 shadow-sm hover:shadow-2xl transition-all duration-500">
                <img 
                  src={`data:${photo.mimeType};base64,${photo.data}`} 
                  alt="Session Asset" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-8">
                  <p className="text-white text-[10px] font-black uppercase tracking-widest mb-1">Protocol {new Date(photo.timestamp).getTime().toString().slice(-4)}</p>
                  <p className="text-stone-300 text-[10px] font-bold uppercase">{new Date(photo.timestamp).toLocaleString()}</p>
                  <div className="flex gap-2 mt-4">
                    <button className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">
                      Download
                    </button>
                    <button className="w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white flex items-center justify-center rounded-xl transition-all">
                      <i className="fa-solid fa-expand text-xs"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotosView;
