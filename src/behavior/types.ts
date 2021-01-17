export interface Champion{
    id: string,
    name: string;
}

export interface ChampionPool{
    name: string,
    ban: Champion | null;
    champions: Champion[]
}



export interface LobbyData{
    owner: string,
    banned: string[],
    players: string[],
    spectator: number,
    red: string[],
    blue: string[]
}

