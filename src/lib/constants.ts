export const SMART_PLAYLISTS: Record<string, { label: string; query: string }> = {
  'morning-coffee':  { label: 'Morning Coffee',  query: 'morning acoustic chill cafe vpop' },
  'energetic':       { label: 'Energetic',       query: 'high energy workout gym edm vpop' },
  'deep-focus':      { label: 'Deep Focus',      query: 'deep focus study music lofi piano' },
  'chill-vibes':     { label: 'Chill Vibes',     query: 'chill vibes relaxing r&b vpop' },
  'sunset-drive':    { label: 'Sunset Drive',    query: 'sunset drive synthwave road trip lofi' },
  'evening-relax':   { label: 'Evening Relax',   query: 'evening relax acoustic r&b sweet' },
  'late-night':      { label: 'Late Night Lofi', query: 'late night chill lo-fi beats' },
  'sleepy-time':     { label: 'Sleepy Time',     query: 'sleepy time ambient sleep music rain' },
};

export interface EditorialPlaylist {
  id: string;
  label: string;
  description: string;
  query: string;
  image: string;
  color: string;
  tag?: 'HOT' | 'NEW' | 'TRENDING' | 'EXCLUSIVE';
}

export const EDITORIAL_PLAYLISTS: EditorialPlaylist[] = [
  {
    id: 'vpop-rising',
    label: 'V-Pop Rising',
    description: 'The definitive sound of current Vietnamese pop.',
    query: 'nhạc trẻ vpop mới nhất thịnh hành 2025 hot',
    image: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=800&auto=format&fit=crop',
    color: 'from-pink-500/20 to-rose-500/20',
    tag: 'HOT'
  },
  {
    id: 'genz-vibes',
    label: 'Tâm Trạng Gen Z',
    description: 'Bedroom pop, indie, and chill vibes for the soul.',
    query: 'nhạc chill gen z tâm trạng indie việt 2024 2025',
    image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=800&auto=format&fit=crop',
    color: 'from-blue-400/20 to-purple-500/20',
    tag: 'TRENDING'
  },
  {
    id: 'bolero-classics',
    label: 'Bolero Vĩnh Cửu',
    description: 'Timeless Vietnamese classics and sentimental golden hits.',
    query: 'nhạc bolero trữ tình hay nhất mọi thời đại 4k',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop',
    color: 'from-amber-600/20 to-orange-700/20',
    tag: 'EXCLUSIVE'
  },
  {
    id: 'global-essentials',
    label: 'Global Essentials',
    description: 'Bigger than life. Billboard Hot 100 & beyond.',
    query: 'top billboard hot 100 current hits 2024 2025 official',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop',
    color: 'from-blue-500/20 to-indigo-500/20',
    tag: 'HOT'
  },
  {
    id: 'indie-sanctuary',
    label: 'Indie Sanctuary',
    description: 'Hidden gems from the Vietnamese underground scene.',
    query: 'nhạc indie việt hay nhất underground 2024 2025',
    image: 'https://images.unsplash.com/photo-1458560871784-56d23406c091?q=80&w=800&auto=format&fit=crop',
    color: 'from-emerald-500/20 to-teal-600/20',
    tag: 'NEW'
  },
  {
    id: 'rap-viet-mastery',
    label: 'Rap Việt Mastery',
    description: 'The sharpest bars and hottest beats from Vietnam.',
    query: 'nhạc rap việt mới nhất cực chất 2025 hiphop',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
    color: 'from-red-600/20 to-orange-600/20',
    tag: 'HOT'
  },
  {
    id: 'kpop-energy',
    label: 'K-Pop Energy',
    description: 'High octane idols and global charting anthems.',
    query: 'top kpop hits 2024 2025 new release trending',
    image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=800&auto=format&fit=crop',
    color: 'from-fuchsia-500/20 to-pink-600/20',
    tag: 'TRENDING'
  },
  {
    id: 'lofi-sanctuary',
    label: 'Lofi Sanctuary',
    description: 'Deep study, soft rain, and aesthetic clouds.',
    query: 'lofi hip hop radio beats to study/relax to 2024',
    image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=800&auto=format&fit=crop',
    color: 'from-amber-500/20 to-orange-500/20'
  },
  {
    id: 'phonk-drift',
    label: 'Phonk & Drift',
    description: 'Aggressive energy for high-speed focus.',
    query: 'phonk drift cowbell street aggressive bass 2025',
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=800&auto=format&fit=crop',
    color: 'from-purple-500/20 to-violet-500/20'
  }
];

export const EQ_PRESETS: Record<string, number[]> = {
  flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  pop: [-1, 1, 3, 4, 3, -1, -2, -2, -1, 0],
  rock: [4, 3, -1, -3, -4, -2, 1, 3, 4, 4],
  jazz: [3, 2, 1, 2, -1, -2, 0, 1, 2, 3],
  electronic: [4, 4, 1, 0, -2, -2, 1, 1, 3, 4],
  acoustic: [2, 1, -1, 0, 1, 2, 3, 2, 1, 0],
  vocal: [-2, -1, 0, 2, 4, 4, 2, 0, -1, -2]
};

export const EQ_FREQS = ['32', '64', '125', '250', '500', '1k', '2k', '4k', '8k', '16k'];


export interface Track {
  id: string;
  title: string;
  views: number;
  duration: string;
  thumbnail: string;
  channel: string;
  channelThumbnail?: string | null;
}

export interface Playlist {
  id: number;
  name: string;
  createdAt: string;
}

export type Tab = 'home' | 'library' | 'podcast' | 'playlist' | 'search';
