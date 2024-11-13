export interface State {
    isPlaying?: boolean;
    events?: [string, ...any][];
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