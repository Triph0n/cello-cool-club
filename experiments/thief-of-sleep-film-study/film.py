"""Reproducible film study. Existing artwork is read-only; motion is composited light.

python film.py prepare | render | verify
"""
from pathlib import Path
import json, math, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.ndimage import gaussian_filter

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
PANELS = ROOT / 'experiments/komiks-live-055-pages/panels'
OLD = ROOT / 'experiments/komiks-video-055'
AUDIO = ROOT / 'celloclublive/055-le-voleur-de-sommeil/The Thief of Sleep — 1920.mp3'
W, H, FPS = 1280, 720, 24
DURATION = 86.840167
BG = (13, 17, 23)
OUT = HERE / 'The-Thief-of-Sleep-film-study.mp4'
# Cuts follow phrases, not every lyric. The daughter is not shown asleep before 57.42.
SHOTS = [
    dict(t=0, panel='01-night-street', title='Noční obchůzka', note='Celek. Muž je zatím cizinec. Obraz zůstává nehybný.'),
    dict(t=4.24, panel='04-taking-the-sleep', source='artwork/04-taking-the-sleep-v2.png', title='Spánek jako kořist', effect='steal', note='Oběť je starší muž s kulatou tváří a šedým knírem, jasně odlišný od zloděje. Světlo po stuze stoupá od čela do ruky.'),
    dict(t=17, panel='05-the-dormitory', title='Cena krádeže', effect='gather', note='Několik slabých světelných průchodů se sbíhá ke středu noclehárny.'),
    dict(t=19.94, panel='06-the-sack-on-the-stairs', title='Tíha pytle', effect='sack', note='Krátký tlumený záblesk uvnitř pytle. Tělo se nehýbe.'),
    dict(t=24.6, panel='07-weary-morning', title='Ráno bez odpočinku', note='Tvrdý střih. Žena u stolu a dlouhá nepříjemná nehybnost.'),
    dict(t=31.66, panel='10-the-yawning-street', title='Unavené město', note='Široký celek vydrží i hudební mezihru. Zloděj zde chybí.'),
    dict(t=40.94, panel='11-going-home', title='Cesta domů', note='Pytel poprvé čteme také jako břemeno.'),
    dict(t=43.64, panel='15-ribbons-settle', title='Stejné světlo, jiné gesto', effect='give', note='Stuha vede od pytle k bdící dceři. Stejný motiv získává opačný význam.'),
    dict(t=51.54, panel='14-hand-on-the-blanket', title='Bolest', effect='hand', note='Zaťatá ruka. Slabé světlo se přiblíží, ale výdrž nechá bolest doznít.'),
    dict(t=57.42, panel='16-the-smile', title='Úleva', transition=1.0, effect='rest', note='Jediný delší prolínací přechod. Světlo zpomalí a ustálí se.'),
    dict(t=65.46, panel='17-criminal-and-savior', title='Otec zůstává vzhůru', note='Znovu tvrdý střih. Úleva dítěte nepřejde na otce.'),
    dict(t=72.48, panel='18-dawn-window', title='Prázdné místo mezi nimi', note='Poslední široký obraz drží celou pointu i dozvuk. Bez dalšího efektu.'),
]

def smooth(a):
    a = np.clip(a, 0, 1)
    return a*a*(3-2*a)

def load_shot(s):
    source = HERE/s['source'] if s.get('source') else PANELS/(s['panel']+'.png')
    im = Image.open(source).convert('RGB')
    im.thumbnail((1216, 640), Image.Resampling.LANCZOS)
    iw, ih = im.size
    x0, y0 = (W-iw)//2, (H-ih)//2
    canvas = np.full((H,W,3), BG, dtype=np.uint8)
    canvas[y0:y0+ih,x0:x0+iw] = np.asarray(im)
    base = np.asarray(im, dtype=np.float32)
    yy, xx = np.mgrid[:ih,:iw].astype(np.float32)
    xx /= iw; yy /= ih
    r,g,b = [base[:,:,i] for i in range(3)]
    gold = smooth((r-b-20)/35)*smooth((g-b-9)/30)*smooth((r-75)/75)
    gate = np.zeros((ih,iw), dtype=np.float32)
    effect = s.get('effect')
    if effect == 'steal':
        # Hand-traced ribbon corridor; excludes the face and cuff.
        mask = Image.new('L',(iw,ih))
        d = ImageDraw.Draw(mask)
        pts=[(.52,.51),(.517,.478),(.49,.447),(.478,.420),(.504,.392),(.551,.364),(.578,.332),(.564,.299),(.529,.267),(.527,.241),(.55,.217),(.592,.231),(.617,.213),(.624,.181),(.65,.162),(.67,.192),(.694,.186)]
        d.line([(int(x*iw),int(y*ih)) for x,y in pts], fill=255, width=max(8,int(iw*.027)))
        gate = np.asarray(mask,dtype=np.float32)/255
        coord = (.54-yy)/.41
    elif effect == 'gather':
        gate = ((yy>.04)&(yy<.58)).astype(np.float32)
        coord = 1-np.abs(xx-.5)*2
    elif effect == 'sack':
        gate = (((xx-.65)/.28)**2+((yy-.30)/.19)**2<1).astype(np.float32)
        coord = yy
    elif effect == 'give':
        gate = ((xx>.36)&(xx<.93)&(yy<.65)).astype(np.float32)
        # Exclude faces, hands and bed; keep the ochre ribbon against the blue wall.
        gate *= (b<115)
        coord = np.clip((xx-.37)/.55,0,1)
    elif effect == 'hand':
        gate = ((xx>.41)&(xx<.61)&(yy<.34)).astype(np.float32)
        coord = yy/.34
    elif effect == 'rest':
        # A narrow diagonal corridor above the brow, excluding the face.
        gate = ((yy < .49-.48*xx+.10)&(yy > .49-.48*xx-.07)).astype(np.float32)
        coord = xx
    else:
        coord = xx
    mask = gaussian_filter(gate*gold, .75).astype(np.float32)
    mask[mask<.015] = 0
    return dict(canvas=canvas,base=base,mask=mask,coord=coord,box=(x0,y0,iw,ih))

DATA = [load_shot(s) for s in SHOTS]

def shot_frame(index,t):
    s, d = SHOTS[index], DATA[index]
    if not s.get('effect'):
        return d['canvas']
    local=t-s['t']
    end = SHOTS[index+1]['t'] if index+1<len(SHOTS) else DURATION
    length=end-s['t']
    if s['effect']=='sack':
        strength=.15*math.sin(math.pi*min(1,local/length))**2
        intensity=d['mask']*strength
    else:
        speed = {'steal':5.8,'gather':3.0,'give':7.6,'hand':5.8,'rest':8.1}[s['effect']]
        p=(local/speed)
        if s['effect']=='steal':
            p=p % 1.3
        moving=np.exp(-((d['coord']-(p*1.35-.15))/.17)**2)
        envelope=float(smooth(local/.7)*smooth((length-local)/.7))
        strength=.23 if s['effect'] not in ('hand','rest') else .13
        intensity=d['mask']*moving*(strength*envelope)
    # Multiplicative ink illumination preserves the fine, already-painted texture.
    lit=np.clip(d['base']*(1+intensity[:,:,None]*np.array([1,.78,.35],dtype=np.float32)),0,255).astype(np.uint8)
    out=d['canvas'].copy()
    x,y,iw,ih=d['box']; out[y:y+ih,x:x+iw]=lit
    return out

def frame_at(t):
    i=max(n for n,s in enumerate(SHOTS) if t>=s['t'])
    out=shot_frame(i,t)
    transition=SHOTS[i].get('transition',0)
    if i and t<SHOTS[i]['t']+transition:
        a=float(smooth((t-SHOTS[i]['t'])/transition))
        prev=shot_frame(i-1,SHOTS[i]['t']-1/FPS)
        out=(prev.astype(np.float32)*(1-a)+out.astype(np.float32)*a).astype(np.uint8)
    if t>DURATION-3.0:
        a=float(smooth((t-(DURATION-3.0))/2.85))
        out=(out.astype(np.float32)*(1-a)+np.array(BG)*a).astype(np.uint8)
    return out

def stamp(t):
    ms=round(t*1000); sec,ms=divmod(ms,1000); minute,sec=divmod(sec,60); hour,minute=divmod(minute,60)
    return f'{hour:02}:{minute:02}:{sec:02}.{ms:03}'

def prepare():
    (HERE/'qc').mkdir(exist_ok=True)
    timing=json.loads((OLD/'timing.json').read_text(encoding='utf-8'))
    words=json.loads((OLD/'words.json').read_text(encoding='utf-8'))
    cues=[]
    for i,v in enumerate(timing['verses']):
        limit=timing['verses'][i+1]['t'] if i+1<len(timing['verses']) else DURATION
        ends=[w['end'] for w in words if v['t']<=w['t']<limit]
        end=min(limit-.05,max(ends)+.18) if ends else limit-.05
        cues.append(f"{stamp(v['t'])} --> {stamp(end)}\n{v['text']}")
    (HERE/'lyrics.vtt').write_text('WEBVTT\n\n'+'\n\n'.join(cues)+'\n',encoding='utf-8')
    (HERE/'manifest.json').write_text(json.dumps(dict(title='The Thief of Sleep — filmová studie',size=[W,H],fps=FPS,duration=DURATION,audio=str(AUDIO),source_panels=str(PANELS),shots=SHOTS),ensure_ascii=False,indent=2),encoding='utf-8')
    font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',17)
    sheet=Image.new('RGB',(1200,4*262),(30,33,38))
    draw=ImageDraw.Draw(sheet)
    for i,s in enumerate(SHOTS):
        x=(i%3)*400; y=(i//3)*262
        im=Image.fromarray(frame_at(s['t']+min(2, ((SHOTS[i+1]['t'] if i+1<len(SHOTS) else DURATION)-s['t'])/2)))
        im.thumbnail((392,220));sheet.paste(im,(x+4,y+3))
        draw.text((x+10,y+229),f"{s['t']:05.2f}   {s['title']}",font=font,fill=(221,207,179))
    sheet.save(HERE/'storyboard.jpg',quality=94)
    Image.fromarray(frame_at(74)).save(HERE/'cover.jpg',quality=94)
    for sec in [7,8,44.5,47,58,61,73,80]:
        Image.fromarray(frame_at(sec)).save(HERE/'qc'/f'frame-{sec}.png')
    report={}
    for i,s in enumerate(SHOTS):
        if s.get('effect'):
            a=shot_frame(i,s['t']+1.0);b=shot_frame(i,s['t']+2.1)
            d=DATA[i]; x,y,iw,ih=d['box']
            allowed=np.zeros((H,W),dtype=bool);allowed[y:y+ih,x:x+iw]=d['mask']>0
            report[s['panel']]={'moving_pixels':int(np.any(a!=b,axis=2).sum()),'changed_pixels_outside_light_mask':int(np.any(a!=b,axis=2)[~allowed].sum())}
            assert report[s['panel']]['changed_pixels_outside_light_mask']==0
            assert report[s['panel']]['moving_pixels']>0
    report['final_hold_identical']=bool(np.array_equal(frame_at(76),frame_at(81)))
    assert report['final_hold_identical']
    (HERE/'qc/compositing-check.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print('Prepared storyboard, captions and compositing checks.',flush=True)

def render():
    count=math.ceil(DURATION*FPS)
    cmd=['ffmpeg','-hide_banner','-loglevel','warning','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-i',str(AUDIO),'-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-t',str(DURATION),'-movflags','+faststart',str(OUT)]
    with (HERE/'render.log').open('w',encoding='utf-8') as log:
        p=subprocess.Popen(cmd,stdin=subprocess.PIPE,stdout=subprocess.DEVNULL,stderr=log)
        try:
            for f in range(count):
                p.stdin.write(frame_at(f/FPS).tobytes())
                if f%(FPS*5)==0: print(f'Rendering {f/FPS:.0f}/{DURATION:.1f} s',flush=True)
        finally:
            p.stdin.close()
        if p.wait()!=0: raise RuntimeError((HERE/'render.log').read_text(encoding='utf-8'))
    # A continuous minute from the cost of the theft through the final moral turn.
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','warning','-y','-i',str(OUT),'-ss','26.840167','-t','60','-c:v','libx264','-preset','fast','-crf','19','-c:a','aac','-b:a','192k','-af','afade=t=in:d=0.2','-movflags','+faststart',str(HERE/'The-Thief-of-Sleep-60s.mp4')],check=True)
    print('Rendered full film and 60-second excerpt.',flush=True)

def verify():
    reports={}
    for path in [OUT,HERE/'The-Thief-of-Sleep-60s.mp4']:
        raw=subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration:stream=index,codec_name,codec_type,width,height,r_frame_rate,duration','-of','json',str(path)])
        info=json.loads(raw);reports[path.name]=info
        assert abs(float(info['format']['duration'])-(60 if '60s' in path.name else DURATION))<.15
        assert any(s['codec_type']=='audio' for s in info['streams'])
        subprocess.run(['ffmpeg','-v','error','-i',str(path),'-f','null','-'],check=True)
    # Inspect actual encoded frames as well as the uncompressed compositing checks.
    frames=[]
    for t in [0,7,18,22,27,36,42,46,54,61,69,78,86.7]:
        dst=HERE/'qc'/f'encoded-{t}.png'
        subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(OUT),'-ss',str(t),'-frames:v','1',str(dst)],check=True)
        if not dst.exists(): raise RuntimeError(f'Missing decoded QC frame at {t}')
        frames.append((t,dst))
    sheet=Image.new('RGB',(1280,math.ceil(len(frames)/4)*204),(30,33,38))
    d=ImageDraw.Draw(sheet);font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',16)
    for i,(t,path) in enumerate(frames):
        im=Image.open(path);im.thumbnail((320,180));x=i%4*320;y=i//4*204
        sheet.paste(im,(x,y));d.text((x+8,y+182),f'{t:.2f} s',font=font,fill='white')
    sheet.save(HERE/'qc/encoded-contact.jpg',quality=95)
    (HERE/'qc/media-check.json').write_text(json.dumps(reports,indent=2),encoding='utf-8')
    print('Duration, audio stream, complete decode and encoded QC frames verified.',flush=True)

if __name__=='__main__':
    {'prepare':prepare,'render':render,'verify':verify}[sys.argv[1]]()
