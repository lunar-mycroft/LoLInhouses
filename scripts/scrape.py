import asyncio
from pprint import pprint
import json

from bs4 import BeautifulSoup as Soup
from bs4.element import Tag as HtmlElement, NavigableString
from httpx import AsyncClient as BaseClient
import aiofiles


class Client(BaseClient):

    async def get_cards(self)->list[HtmlElement]:
        res = await self.get("https://na.leagueoflegends.com/en-us/champions/")
        soup: Soup = Soup(res.text,'html.parser')
        return soup.select('.style__Wrapper-sc-12h96bu-0')

    async def download_card(self, card: HtmlElement)->str:
        src = card.img['src'].rsplit("?",1)[0]
        if src.startswith('https://ddragon.leagueoflegends.com/cdn/img/champion'):
            file_name = "aphelios.jpg"
        else:
            file_name = src.rsplit('RiotX_ChampionList_',1)[-1]
        file_name = file_name.replace("-cigar", "")
            
        res = await self.get(card.img['src'])
        async with aiofiles.open(f"public/img/{file_name}", 'wb') as fp:
            await fp.write(res.content)
        return file_name[:-4]


    


async def main():
    async with Client() as client:
        cards = await client.get_cards()
        names = await asyncio.gather(*(client.download_card(c) for c in cards))
        async with aiofiles.open("src/champions.json", 'w') as fp:
            await fp.write(json.dumps(dict(zip(names, (c.text.strip() for c in cards))), indent=4))
    
        




asyncio.run(main())
