export interface State {
    isPlaying?: boolean;
    events?: [string, ...any][];
    played?: string[];
    playlist?: string[];
    playlists?: any[];
    current?: string;
    video?: any;
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