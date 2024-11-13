export interface State {
    isPlaying?: boolean;
    events?: [string, ...any][];
    played?: string[];
    playlist?: string[];
    playlists?: Playlist[];
    current?: string;
    video?: any;
}

export interface Playlist {
    id: string;
    name: string;
    items: PlaylistItem[];
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