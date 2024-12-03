export interface State {
    uiUrl?: string;
    url?: string;
    // isPlaying?: boolean;
    // events?: [string, ...any][];
    played?: string[];
    video?: Video | null;
    defaultPlaylist?: string;
    currentTime?: number;
    seek?: number;

    width?: string;
    height?: string;
    preset?: string;
    videoBitrate?: string;
    buffSize?: string;
    audioBitrate?: string;
    qualityCF?: string;
    framerate?: string;
    gbuffer?: string;
    keyColor?: string;
    keySimilarity?: string;
    keyBlend?: string;
    args?: string;
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