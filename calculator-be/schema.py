from pydantic import BaseModel
class ImageData(BaseModel):
    img:str  
    dict_of_vars:dict 