export interface Champion{
    id: string,
    name: string;
}

export interface ChampionPool{
    name: string,
    champions: Champion[]
}

export interface LobbyData{
    owner: string,
    banned: string[],
    players: string[],
}