export interface State {
    isPlaying?: boolean;
    events?: [string, ...any][];
    played?: string[];
    video?: Video;
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
    currentTime: number;
    key: string;
    playlistKey?: string | null;
}

export interface PlaylistItem {
    id: string;
    key: string;
    type: string;
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