import React, { useState } from 'react';
import { X, Plus, Music, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Playlist, Track } from '../lib/constants';
import { cn } from '../lib/utils';
import { useLanguage } from '../hooks/useLanguage';

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  playlists: Playlist[];
  onAddToPlaylist: (playlistId: number) => void;
  onCreateAndAdd: (name: string) => void;
  onRenamePlaylist?: (id: number, newName: string) => void;
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  isOpen,
  onClose,
  track,
  playlists,
  onAddToPlaylist,
  onCreateAndAdd,
}) => {
  const { t } = useLanguage();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [addedId, setAddedId] = useState<number | null>(null);

  if (!track) return null;

  const handleAdd = (id: number) => {
    onAddToPlaylist(id);
    setAddedId(id);
    setTimeout(() => {
      setAddedId(null);
      onClose();
    }, 1000);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      onCreateAndAdd(newPlaylistName.trim());
      setNewPlaylistName('');
      setIsCreating(false);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md glass-dark border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">{t.playlist.addTitle}</h2>
                  <p className="text-sm text-slate-400 mt-1 truncate max-w-[300px]">
                    {track.title}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                <div className="flex flex-col gap-2">
                  {playlists.map((playlist) => (
                    <button
                      key={playlist.id}
                      onClick={() => handleAdd(playlist.id)}
                      disabled={addedId !== null}
                      className={cn(
                        "w-full p-4 rounded-2xl flex items-center justify-between transition-all text-left group",
                        addedId === playlist.id 
                          ? "bg-green-500/20 border border-green-500/30 text-green-400"
                          : "hover:bg-white/5 text-slate-300 hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Music size={18} className="text-slate-500 group-hover:text-primary-light" />
                        </div>
                        <span className="font-semibold">{playlist.name}</span>
                      </div>
                      {addedId === playlist.id ? (
                        <Check size={18} className="text-green-400" />
                      ) : (
                        <Plus size={18} className="text-slate-600 group-hover:text-slate-400" />
                      )}
                    </button>
                  ))}

                  {playlists.length === 0 && !isCreating && (
                    <div className="text-center py-8">
                      <Music size={40} className="mx-auto text-slate-700 mb-3 opacity-20" />
                      <p className="text-slate-500 text-sm">{t.playlist.notFound}</p>
                    </div>
                  )}

                  {!isCreating ? (
                    <button
                      onClick={() => setIsCreating(true)}
                      className="w-full p-4 rounded-2xl border-2 border-dashed border-white/5 hover:border-primary/30 hover:bg-primary/5 text-slate-500 hover:text-primary-light transition-all flex items-center justify-center gap-3 mt-2"
                    >
                      <Plus size={18} />
                      <span className="font-bold">{t.playlist.createNew}</span>
                    </button>
                  ) : (
                    <motion.form
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onSubmit={handleCreate}
                      className="mt-2 p-4 glass rounded-2xl border border-primary/20"
                    >
                      <input
                        autoFocus
                        type="text"
                        placeholder={t.playlist.namePlaceholder}
                        value={newPlaylistName}
                        onChange={(e) => setNewPlaylistName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 transition-colors mb-4"
                      />
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setIsCreating(false)}
                          className="flex-1 py-2 rounded-xl bg-white/5 text-slate-400 font-bold hover:bg-white/10 transition-colors"
                        >
                          {t.common.cancel}
                        </button>
                        <button
                          type="submit"
                          disabled={!newPlaylistName.trim()}
                          className="flex-1 py-2 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover transition-colors disabled:opacity-50"
                        >
                          {t.playlist.createAndAdd}
                        </button>
                      </div>
                    </motion.form>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
