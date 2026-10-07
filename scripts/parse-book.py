import re, json
src=open('scripts/Pages_pt-BR.md',encoding='utf-8').read()
parts=re.split(r'^## (\d+)\s*$',src,flags=re.M)
SPELLS=set(re.findall(r'code: "([A-Z]{3})"',open('src/game/adventure.ts').read()))
LINK=re.compile(r'\b(?:v[áa]|volte|retorne|siga|continue|indo|passe)\b[^.\d]{0,40}?(?:para|à|a)\s+(?:a\s+|o\s+)?(?:referência\s+|parágrafo\s+)?(\d{1,3})\b',re.I)
STAT=re.compile(r'(perca|perder|perde|deduza|deve deduzir|reduza|subtraia|acrescente|acrescentar|adicione|ganhe|recupere|aumente)\s+(\d+)\s+pontos?\s+(?:de\s+)?(ENERGIA|HABILIDADE|SORTE)(?:\s+e\s+(\d+)\s+pontos?\s+(?:de\s+)?(ENERGIA|HABILIDADE|SORTE))?',re.I)
MON=re.compile(r'^\**\s*([A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-ZÁÉÍÓÚÂÊÔÃÕÇ\- ]+?)\s*[—:\-–]\s*HABILIDADE:?\s+(\d+),?\s*ENERGIA:?\s+(\d+)',re.M)
COND=re.compile(r'\b(se|caso|pode|poderá|poderia|cada|quiser|quando)\b|\?',re.I)
def sentences(t): return [x.strip() for x in re.split(r'(?<=[.!?])\s+|\n+',t) if x.strip()]
book={};monsters={}
for i in range(1,len(parts),2):
    pid=int(parts[i]); body=parts[i+1].split('_________________________________')[0].strip()
    body=re.sub(r'(?<![\n ])[ \t]*\n(?=[a-zà-úA-ZÀ-Ú(])(?!\*\*)','  \n' if False else ' ',body) if False else re.sub(r'([^\n.:!?*\s])[ \t]*\n(?=[^\n*])',r'\1 ',body)
    body=re.sub(r' {2,}\n','\n',body)
    p={'id':pid,'text':body,'choices':[],'effects':[]}
    # monsters
    mons=[{'name':m.group(1).strip().title(),'skill':int(m.group(2)),'stamina':int(m.group(3))} for m in MON.finditer(body)]
    for m in mons: monsters.setdefault(m['name'],{**m,'paragraphs':[]})['paragraphs'].append(pid)
    used=set()
    # luck
    lk=re.search(r'Se tiver SORTE(?:(?!Se tiver)[^\d])*?(?:v[áa]|volte|indo|siga)\D{0,25}?(\d{1,3})\b',body,re.I); az=re.search(r'Se tiver Azar(?:(?!Se tiver)[^\d])*?(?:v[áa]|volte|indo|siga)\D{0,25}?(\d{1,3})\b',body,re.I)
    if lk and az: p['luckTest']={'lucky':int(lk.group(1)),'unlucky':int(az.group(1))}; used|={lk.group(1),az.group(1)}
    if mons:
        after=body[MON.search(body).end():]
        w=re.search(r'venc\w*[^.]*?(\d{1,3})\b',after,re.I) or LINK.search(after)
        if w: p['combat']={'enemies':mons,'win':int(w.group(1))}; used.add(w.group(1))
    seen=set()
    SP=re.compile(r'(?:\*\*)?\b([A-Z]{3})\b(?:\*\*)?\s*[—–-]\s*v[áa] para (\d+)')
    for sm in SP.finditer(body):
        p['choices'].append({'to':int(sm.group(2)),'label':'Lançar '+sm.group(1),'spell':sm.group(1),'known':sm.group(1) in SPELLS}); seen.add(sm.group(2))
    scan=SP.sub('',body)
    for line in scan.split('\n'):
        sm=re.match(r'\s*\*\*([A-Z]{3})\*\*\s*[—\-–]\s*v[áa] para (\d+)',line)
        if sm:
            p['choices'].append({'to':int(sm.group(2)),'label':'Lançar '+sm.group(1),'spell':sm.group(1),'known':sm.group(1) in SPELLS}); seen.add(sm.group(2)); continue
        for s in sentences(line):
            prev=0
            for m in LINK.finditer(s):
                n=m.group(1); seg=s[prev:m.start()]; prev=m.end()
                seg=re.sub(r'^[\s),.;:?]*(ou|e)?\s+','',seg).strip(' ,;(—-')
                seg=re.sub(r'\s*\($','',seg)
                if n in used or n in seen or not (1<=int(n)<=456): continue
                seen.add(n)
                lab=(seg if len(seg)>3 else re.sub(r'\s*\((?:[^()]*?)\d{1,3}\)','',s)).strip(' .?(') or s
                lab=re.sub(r'\*\*','',lab)
                c={'to':int(n),'label':lab}
                if 'Libra' in s: c['libra']=True
                p['choices'].append(c)
            for m in STAT.finditer(s):
                sign=-1 if m.group(1).lower() in('perca','perder','perde','deduza','deve deduzir','reduza','subtraia') else 1
                auto=not COND.search(s)
                for a,st in ((m.group(2),m.group(3)),(m.group(4),m.group(5))):
                    if a: p['effects'].append({'stat':{'ENERGIA':'stamina','HABILIDADE':'skill','SORTE':'luck'}[st.upper()],'amount':sign*int(a),'auto':auto,'text':s[:160]})
    if 'luckTest' not in p and re.search(r'Test\w* (a |sua )?SORTE',body,re.I): p['luckFree']=True
    if re.search(r'referência original|referência anterior|de onde veio|retorne à referência',body,re.I) or (re.search(r'volte (para|à)',body,re.I) and not p['choices']): p['back']=True
    sents=sentences(body)
    for c in p['choices']:
        for j,x in enumerate(sents):
            if re.search(r'\b%d\b'%c['to'],x) and ('Libra' in x or (j and 'Libra' in sents[j-1])): c['libra']=True
    if pid==456: p['end']='win'
    elif not p['choices'] and not p.get('back') and 'luckTest' not in p and 'combat' not in p: p['end']='death'
    book[pid]=p
json.dump({'paragraphs':book,'monsters':sorted(monsters.values(),key=lambda m:m['name'])},open('src/game/book.json','w'),ensure_ascii=False)
ends=[k for k,v in book.items() if v.get('end')]
print(len(book),'ends',ends); print('monsters',len(monsters)); print([(m['name'],m['skill'],m['stamina']) for m in monsters.values()])
print('luck',sum('luckTest' in v for v in book.values()),'combat',sum('combat' in v for v in book.values()),'libra',[k for k,v in book.items() if any(c.get('libra') for c in v['choices'])])
for k in (2,4,7,170,273,25): print(k,json.dumps({x:book[k][x] for x in book[k] if x!='text'},ensure_ascii=False)[:500])
