
import os,sys, argparse
from numpy import int32
import pandas as pd
import json
def backbone2js(in_tsv,out_dir):
    df = pd.read_csv(in_tsv,header=0,sep='\t')
    block_dict = {"genomes":[],"blocks":[],"annotations":[]}
    saved_ids = set([])
    for i,row in df.iterrows():
        j = 0    
        while j <len(df.columns):
            c1,c2 = df.columns[j:j+2]
            id = c1.split('_')[0]
            
            if id not in saved_ids:
                block_dict["genomes"].append({"name":None,"id":id})
                saved_ids.add(id)
            if abs(row[c1]-row[c2])>500:
                block_dict["blocks"].append({"id":id,"l":int(row[c1]),"r":int(row[c2]),"n":f"block{i}"})
            j+=2
    
    json_str = json.dumps(block_dict)
    with open(os.path.join(out_dir,'backbone.js'),'w') as hdl:
        hdl.write(f"var data = {json_str};")

if __name__ == "__main__":

    parser = argparse.ArgumentParser()
    parser.add_argument("--backbone",required=True,help="*.backbone file from Mauve progressive alignment")
    parser.add_argument("--out_dir",default="",help="Add a prefix to the output csv files")
    options = parser.parse_args()

    backbone2js(options.backbone,options.out_dir)
