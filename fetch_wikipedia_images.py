import pandas as pd
import requests
from PIL import Image 
import PIL
import os

cities = pd.read_json("data/cities.json")
cities["ville"]

url_wiki = "https://en.wikipedia.org/w/api.php?action=query&titles={}&prop=pageimages&format=json&pithumbsize=500&origin=*"

for ville in cities["ville"]:
    req = requests.get(url_wiki.format(ville))
    res = req.json()
    print(res)

def download_image(search):
    req = requests.get(url_wiki.format(search))
    res = req.json()
    print(res)
    page = res['query']['pages']

    
    for e in page:
        # img_name = page[e]['pageimage']
        try:
            url_to_download = page[e]['thumbnail']['source']
            img_format = os.path.splitext(url_to_download)[1]

            img_path_save = f'assets/images/{search}{img_format}'
            print(img_path_save)
            # cities['img_url'] = img_path_save
            
            data = requests.get(url_to_download).content
            f = open(img_path_save,'wb') 
            
            # Storing the image data inside the data variable to the file 
            f.write(data)
            f.close()
        except:
            pass

for i in cities['ville']:
    download_image(i)

len(cities['ville'])
download_image("Sevilla")
download_image("Brussels")
