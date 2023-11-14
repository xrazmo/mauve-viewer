
import os, argparse
import pandas as pd
import json

def backbone2js(in_tsv,out_dir):
    df = pd.read_csv(in_tsv,header=0,sep='\t')
    block_dict = {"genomes":[],"blocks":[],"annotations":[]}
    block_count= {}
    saved_ids = set([])
    tmp_blocks = []
    for i,row in df.iterrows():
        j = 0    
        while j <len(df.columns):
            c1,c2 = df.columns[j:j+2]
            id = c1.split('_')[0]
            
            if id not in saved_ids:
                block_dict["genomes"].append({"name":None,"id":id})
                saved_ids.add(id)
            if abs(row[c1]-row[c2])>50:
                bn = f"block{i}"
                tmp_blocks.append({"id":id,"l":int(row[c1]),"r":int(row[c2]),"n":bn})
                if bn not in block_count:
                    block_count[bn] = 0
                block_count[bn] += 1

            j+=2

    #remove singletons 
    for bl in tmp_blocks:
        if block_count[bl["n"]]>1:
            block_dict["blocks"].append(bl)
    
    json_str = json.dumps(block_dict)
    with open(os.path.join(out_dir,'backbone.js'),'w') as hdl:
        hdl.write(f"var data = {json_str};")

if __name__ == "__main__":

    parser = argparse.ArgumentParser()
    parser.add_argument("--backbone",required=True,help="*.backbone file from Mauve progressive alignment")
    parser.add_argument("--out_dir",default="",help="Add a prefix to the output csv files")
    options = parser.parse_args()

    backbone2js(options.backbone,options.out_dir)
