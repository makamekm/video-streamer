export interface State {
    isPlaying?: boolean;
    events?: [string, ...any][];
    played?: string[];
    video?: Video | null;
    defaultPlaylist?: string;
    currentTime?: number;
}

export interface PlaylistState {
    playlists?: Playlist[];
}

export interface Playlist {
    id: string;
    name: string;
    items: PlaylistItem[];
}

export interface Video {
    key: string;
    id: string;
    playlistKey?: string | null;
    initialTime?: number;
}

export interface PlaylistItem {
    id: string;
    key: string;
    type: string;
    initialTime?: number;
}

export interface TorrentState {
    test?: boolean;
    torrents?: {
        key: string;
        name: string;
        date: string;
        status: any;
    }[];
}