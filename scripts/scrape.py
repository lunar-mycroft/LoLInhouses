import asyncio
from io import BytesIO
import json

from bs4 import BeautifulSoup as Soup
from bs4.element import Tag as HtmlElement, NavigableString
from httpx import AsyncClient as BaseClient
from PIL import Image
import aiofiles

log = []

class Client(BaseClient):

    async def get_soup(self, url: str)->Soup:
        res = await self.get("https://na.leagueoflegends.com/en-us/champions/")
        res.raise_for_status()
        return Soup(res.text,'html.parser')

    async def get_cards(self)->list[HtmlElement]:
        soup: Soup = await self.get_soup("https://na.leagueoflegends.com/en-us/champions/")
        return soup.select('.style__Wrapper-sc-12h96bu-0')

    def _get_splash_url(self, name: str)->str:
        if name=="Wukong":
            return "MonkeyKing"
        chars = set(name)
        if '&' in chars:
            return name.split(' &',1)[0]
        if '.' in chars:
            return name.replace('. ', '')
        if name.split("'",1)[-1] in {'Gath', 'Sa', 'Zix', 'Koz'}:
            pre, post = name.split("'",1)
            return pre+post.lower()
        return name.replace(' ','').replace("'",'').replace('LeBlanc', 'Leblanc')
        
            

    async def download_card(self, card: HtmlElement)->str:
        name = card.text.strip()
        
        u = self._get_splash_url(name)
        cid = u.lower()
        res = await self.get(f"https://ddragon.leagueoflegends.com/cdn/img/champion/splash/{u}_0.jpg")
        if res.status_code!=200:
            print(name, u)
            return
        with BytesIO(res.content) as io:
            io.seek(0)
            img = Image.open(io)
            img.load()
        
        resized = img.resize((256,256))
        
        with BytesIO() as io:
            resized.save(io, 'JPEG', quality=70)
            io.seek(0)
            data = io.read()

        async with aiofiles.open(f'public/img/{cid}.jpg','wb') as fp:
            await fp.write(data)
        return cid


    


async def main():
    async with Client() as client:
        cards = await client.get_cards()


        file_names = await asyncio.gather(*(client.download_card(c) for c in cards))

        data = [{
            "name":n,
            "id": f
        } for (f, n) in zip(file_names, (c.text.strip() for c in cards))]
        async with aiofiles.open("src/champions.json", 'w') as fp:
            await fp.write(json.dumps(data, indent=2))
    
        




asyncio.run(main())
