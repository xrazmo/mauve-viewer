import os, argparse
from traceback import print_tb
import pandas as pd
import json
import sqlite3 as lit
from Bio import SeqIO
from glob import glob
from Bio.SeqRecord import SeqRecord

def fetch_genetic_contexts(ref_db,fasta_dir,out_dir):
    genomes_order= {
     "CP006057.1": "seq0" ,
     "s082Km": "seq1" ,
     "p165E": "seq2" ,
     "p004KP": "seq3" ,
     "m481ECL": "seq4",
     "s304ECL": "seq5",
     "s257ECL": "seq6",
     "s202ECL": "seq7",
     "s164ECL": "seq8",
    }
    conn = lit.connect(ref_db)
    cur = conn.cursor()
    cmd = "Select orfs.sample,orfs.accession,orfs.start_index,orfs.end_index" \
          " from orfs inner join annotations as ann on orfs.accession = ann.orfs_accession and ann.sample == orfs.sample" \
          " where ref_db='card' and pident >90 and scov>50 and stitle like '%%mcr-9%%'"
    thr = 5000
    seqRecords = []
    segments_idx = {}
    for sm,acc, sidx, eidx in cur.execute(cmd):

        cnr = '_'.join(acc.split('_')[0:-1])
        ff = glob(os.path.join(fasta_dir, f"{sm}*.fasta"))
        seqDic = SeqIO.index(ff[0], 'fasta')
        contigSeq = seqDic[cnr].seq
        idx0, idx1 = max(0, sidx - thr), min(len(contigSeq), eidx + thr)
        print(sm, cnr, idx0, idx1)
        segment = contigSeq[idx0:idx1]
        seqRecords.append(SeqRecord(segment, id=f"{sm}_{cnr}_{idx0}:{idx1}", name="", description=""))
        key = f"{sm}"
        segments_idx[key] = {"sidx": idx0, "eidx": idx1, "contig":cnr}

        with open(os.path.join(out_dir, f"{sm}.fasta"), 'w') as hdl:
            SeqIO.write(seqRecords, hdl, 'fasta')
        seqRecords = []
    print(segments_idx)
    annotations = {}
    # fetching ORFs
    cmd = "select accession,sample,start_index,end_index,strand from orfs"
    
    for ac,sm,sx,ex,snd in cur.execute(cmd):
        cnr = '_'.join(ac.split('_')[0:-1])
        if sm not in segments_idx:
            print(f'could not find {sm}')
            continue
        
        sidx = segments_idx[sm]["sidx"]
        eidx = segments_idx[sm]["eidx"]
        contig = segments_idx[sm]["contig"]

        if sx<sidx or sx>eidx or (contig != cnr):
            continue

        key =f"{sm}-{ac}"
       
        annotations[key] = {"id":genomes_order[sm],"sample":sm,"accession":ac,"sidx":sx-sidx,"eidx":ex-sidx,"strand":snd,
                           "refid":None,"idty":None,"cov":None,"refdb":None,'stitle':None}    

    db_conf = [["card",90,80,'args'],["bacmet",90,80,'bacmet'],["vfdb",90,80,'vfs'],["nr",80,80,'nr']]
    for db,i,c,lbl in db_conf:
        print(db)
        annotations = __fetch_annotation(cur,annotations,db,i,c,lbl)
    
    json_str = json.dumps(list(annotations.values()))
    with open(os.path.join(out_dir,'annotations.js'),'w') as hdl:
        hdl.write(f"var annotations = {json_str};")


def __fetch_annotation(cur,annot_dic,refdb,idty,cov,lbl):
    
    cmd = f"Select ann.sample,ann.orfs_accession,ann.sseqid,ann.pident,ann.scov,ann.stitle" \
           " from orfs inner join annotations as ann on orfs.accession = ann.orfs_accession and ann.sample == orfs.sample" \
          f" where ann.pident> {idty} and ann.scov>{cov} and ann.ref_db = '{refdb}' " \
           " order by ann.sample,orfs_accession, pident, scov"

    for sm,ac,ref,ity,scv,dcr in cur.execute(cmd):
        key = f"{sm}-{ac}"
        
        if key not in annot_dic:
            continue
        if (sm != annot_dic[key]["sample"]) or (annot_dic[key]["refdb"] is not None):
            continue
        
        annot_dic[key]["refid"] = ref
        annot_dic[key]["idty"] = ity
        annot_dic[key]["cov"] = scv
        annot_dic[key]["stitle"] = dcr.replace(ref,"").split("[")[0].strip()
        annot_dic[key]["refdb"] = lbl
        print(annot_dic[key]["stitle"])

    return annot_dic

if __name__ == "__main__":

    parser = argparse.ArgumentParser()
    parser.add_argument("--ref_db",required=True,help="SQLite database containing predicted ORFs and annotations")
    parser.add_argument("--fa_dir",required=True,help="fasta directory")
    parser.add_argument("--out_dir",default="",help="Add a prefix to the output csv files")
    options = parser.parse_args()

    fetch_genetic_contexts(options.ref_db,options.fa_dir,options.out_dir)

    # fetch_genetic_contexts("C:/Users/Mohammad/archive/KI/mcr9.1/refDB.db","C:/Users/Mohammad/archive/KI/mcr9.1/contigs","")