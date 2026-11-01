(() => {
  "use strict";

  const $ = s => document.querySelector(s);
  const canvas = $("#gameCanvas");
  const ctx = canvas.getContext("2d");

  const ui = {
    hud:$("#hud"), healthFill:$("#healthFill"), healthText:$("#healthText"),
    objective:$("#objectiveText"), clueText:$("#clueText"),
    prompt:$("#interactPrompt"), dialogue:$("#dialogueBox"),
    speaker:$("#speakerName"), dialogueText:$("#dialogueText"),
    start:$("#startScreen"), pause:$("#pauseScreen"), how:$("#howToScreen"),
    death:$("#deathScreen"), ending:$("#endingScreen"), toast:$("#toast"),
    continueBtn:$("#continueBtn"), soundBtn:$("#soundBtn")
  };

  class SoundSystem {
    constructor(){
      this.enabled=false; this.ctx=null;
    }
    setEnabled(v){
      this.enabled=!!v;
      ui.soundBtn.textContent=`Звук: ${this.enabled?"ВКЛ":"ВЫКЛ"}`;
      if(this.enabled && !this.ctx){
        const AC=window.AudioContext||window.webkitAudioContext;
        if(AC)this.ctx=new AC();
      }
      if(this.ctx?.state==="suspended")this.ctx.resume();
    }
    tone(freq=220,dur=.08,type="sine",gain=.025,slide=0){
      if(!this.enabled||!this.ctx)return;
      const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();
      o.type=type;o.frequency.setValueAtTime(freq,t);
      if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,freq+slide),t+dur);
      g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
      o.connect(g);g.connect(this.ctx.destination);o.start(t);o.stop(t+dur);
    }
    sword(){this.tone(170,.08,"sawtooth",.018,180)}
    crossbow(){this.tone(520,.045,"square",.012,-210)}
    hit(){this.tone(82,.13,"sawtooth",.03,-35)}
    enemyHit(){this.tone(140,.065,"square",.012,-60)}
    clue(){this.tone(520,.13,"sine",.026,220);setTimeout(()=>this.tone(760,.16,"sine",.018,100),90)}
    boss(){this.tone(55,.6,"sawtooth",.025,-15)}
  }

  class Game {
    constructor(){
      this.mode="menu";
      this.keys={};
      this.camera={x:0,y:0};
      this.player=new Player(520,1050);
      this.ren=new Companion(450,1090);
      this.enemies=[];
      this.projectiles=[];
      this.particles=[];
      this.fog=[];
      this.questAccepted=false;
      this.clues=new Set();
      this.gateOpened=false;
      this.ruinsSeen=false;
      this.bossStarted=false;
      this.bossDefeated=false;
      this.currentInteractable=null;
      this.dialogue={active:false,lines:[],index:0,onEnd:null};
      this.sound=new SoundSystem();
      this.last=performance.now();
      this.autosave=0;
      this.toastTimer=0;
      this.endingPlayed=false;
      this.setupFog();
      this.bind();
      this.resize();
      this.updateContinueButton();
      requestAnimationFrame(t=>this.loop(t));
    }

    bind(){
      window.addEventListener("resize",()=>this.resize());
      window.addEventListener("keydown",e=>{
        if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code))e.preventDefault();
        if(this.dialogue.active && (e.code==="KeyE"||e.code==="Enter")){
          this.nextDialogue();return;
        }
        if(e.code==="Escape"){
          if(this.mode==="playing")this.pause();
          else if(this.mode==="paused")this.resume();
          return;
        }
        if(e.code==="KeyE" && this.mode==="playing"){this.interact();return}
        if(e.code==="Space" && this.mode==="playing"){this.player.attack(this);return}
        this.keys[e.code]=true;
      });
      window.addEventListener("keyup",e=>this.keys[e.code]=false);
      canvas.addEventListener("mousedown",e=>{
        if(e.button===0 && this.mode==="playing" && !this.dialogue.active)this.player.attack(this);
      });

      $("#newGameBtn").onclick=()=>this.newGame();
      $("#continueBtn").onclick=()=>this.continueGame();
      $("#howToBtn").onclick=()=>this.openHow();
      $("#pauseHowToBtn").onclick=()=>this.openHow(true);
      $("#closeHowToBtn").onclick=()=>this.closeHow();
      $("#pauseBtn").onclick=()=>this.pause();
      $("#resumeBtn").onclick=()=>this.resume();
      $("#menuBtn").onclick=()=>this.toMenu();
      $("#deathMenuBtn").onclick=()=>this.toMenu();
      $("#retryBtn").onclick=()=>this.retry();
      $("#endingMenuBtn").onclick=()=>this.toMenu();
      ui.soundBtn.onclick=()=>{
        this.sound.setEnabled(!this.sound.enabled);
        this.save();
      };
    }

    resize(){
      const dpr=Math.min(2,window.devicePixelRatio||1);
      canvas.width=Math.floor(innerWidth*dpr);canvas.height=Math.floor(innerHeight*dpr);
      canvas.style.width=innerWidth+"px";canvas.style.height=innerHeight+"px";
      ctx.setTransform(dpr,0,0,dpr,0,0);
      this.viewW=innerWidth;this.viewH=innerHeight;
    }

    inputState(){
      return {
        up:this.keys.KeyW||this.keys.ArrowUp,
        down:this.keys.KeyS||this.keys.ArrowDown,
        left:this.keys.KeyA||this.keys.ArrowLeft,
        right:this.keys.KeyD||this.keys.ArrowRight
      };
    }

    initialState(){
      this.player=new Player(520,1050);
      this.ren=new Companion(450,1090);
      this.enemies=[];
      this.projectiles=[];
      this.particles=[];
      this.questAccepted=false;this.clues=new Set();
      this.gateOpened=false;this.ruinsSeen=false;
      this.bossStarted=false;this.bossDefeated=false;this.endingPlayed=false;
      this.spawnEnemies();
    }

    spawnEnemies(){
      const specs=[
        ["wolf",1180,680],["imp",1460,930],["corrupted",1710,420],
        ["wolf",1870,1370],["imp",2240,820],["corrupted",2460,1320],
        ["wolf",2780,1420],["imp",2910,780]
      ];
      this.enemies=specs.map(s=>new Enemy(...s));
    }

    newGame(){
      localStorage.removeItem(CONFIG.storageKey);
      this.initialState();
      this.sound.setEnabled(false);
      this.startPlay();
      this.toast("Поговорите со старостой на площади.");
      this.save();
    }

    continueGame(){
      if(!this.load())return this.newGame();
      this.startPlay();
      this.toast("Путь продолжается.");
    }

    startPlay(){
      this.mode="playing";
      ui.start.classList.add("hidden");ui.pause.classList.add("hidden");
      ui.death.classList.add("hidden");ui.ending.classList.add("hidden");
      ui.hud.classList.remove("hidden");
      this.dialogue.active=false;ui.dialogue.classList.add("hidden");
      this.updateHud();
    }

    retry(){
      ui.death.classList.add("hidden");
      if(!this.load())this.initialState();
      this.player.hp=this.player.maxHp;
      this.ren.x=this.player.x-60;this.ren.y=this.player.y+40;
      this.mode="playing";ui.hud.classList.remove("hidden");
      this.updateHud();
    }

    pause(){
      if(this.mode!=="playing"||this.dialogue.active)return;
      this.mode="paused";ui.pause.classList.remove("hidden");
    }
    resume(){
      if(this.mode!=="paused")return;
      this.mode="playing";ui.pause.classList.add("hidden");
    }
    openHow(fromPause=false){
      this.howReturn=fromPause?"pause":"menu";
      ui.how.classList.remove("hidden");
    }
    closeHow(){
      ui.how.classList.add("hidden");
    }
    toMenu(){
      this.save();
      this.mode="menu";
      ui.start.classList.remove("hidden");
      ui.pause.classList.add("hidden");ui.death.classList.add("hidden");
      ui.ending.classList.add("hidden");ui.how.classList.add("hidden");
      ui.hud.classList.add("hidden");ui.prompt.classList.add("hidden");
      ui.dialogue.classList.add("hidden");
      this.updateContinueButton();
    }

    updateContinueButton(){
      ui.continueBtn.disabled=!localStorage.getItem(CONFIG.storageKey);
    }

    save(){
      if(this.mode==="menu"&&!this.questAccepted&&!this.clues.size&&!this.bossDefeated)return;
      const data={
        x:this.player.x,y:this.player.y,hp:Math.max(1,this.player.hp),
        questAccepted:this.questAccepted,
        clues:[...this.clues],
        gateOpened:this.gateOpened,
        ruinsSeen:this.ruinsSeen,
        bossStarted:this.bossStarted,
        bossDefeated:this.bossDefeated,
        sound:this.sound.enabled
      };
      localStorage.setItem(CONFIG.storageKey,JSON.stringify(data));
      this.updateContinueButton();
    }

    load(){
      const raw=localStorage.getItem(CONFIG.storageKey);
      if(!raw)return false;
      try{
        const d=JSON.parse(raw);
        this.initialState();
        this.player.x=Number(d.x)||520;this.player.y=Number(d.y)||1050;
        this.player.hp=Math.max(1,Number(d.hp)||this.player.maxHp);
        this.ren.x=this.player.x-60;this.ren.y=this.player.y+40;
        this.questAccepted=!!d.questAccepted;
        this.clues=new Set(Array.isArray(d.clues)?d.clues:[]);
        this.gateOpened=!!d.gateOpened || this.clues.size>=CONFIG.cluesRequired;
        this.ruinsSeen=!!d.ruinsSeen;
        this.bossDefeated=!!d.bossDefeated;
        this.bossStarted=!!d.bossStarted && !this.bossDefeated;
        this.sound.setEnabled(!!d.sound);
        if(this.bossStarted&&!this.bossDefeated)this.spawnBoss();
        if(this.bossDefeated)this.enemies=this.enemies.filter(e=>e.type!=="boss");
        return true;
      }catch(err){
        console.error(err);return false;
      }
    }

    objective(){
      if(this.bossDefeated)return "История завершена";
      if(!this.questAccepted)return "Поговорить со старостой";
      if(this.clues.size<CONFIG.cluesRequired)return `Найти улики в старом лесу (${this.clues.size}/${CONFIG.cluesRequired})`;
      if(!this.ruinsSeen)return "Добраться до заброшенных руин";
      if(!this.bossStarted)return "Найти логово за часовней";
      return "Уничтожить Зверя из старого леса";
    }
    updateHud(){
      const p=Math.max(0,this.player.hp/this.player.maxHp*100);
      ui.healthFill.style.width=p+"%";
      ui.healthText.textContent=`${Math.ceil(this.player.hp)} / ${this.player.maxHp}`;
      ui.objective.textContent=this.objective();
      ui.clueText.textContent=`Улики: ${Math.min(this.clues.size,CONFIG.cluesRequired)}/${CONFIG.cluesRequired}`;
    }

    tryMove(actor,nx,ny,ignoreGate=false){
      const r=actor.radius;
      nx=Math.max(r,Math.min(CONFIG.world.width-r,nx));
      ny=Math.max(r,Math.min(CONFIG.world.height-r,ny));
      const collides=(x,y)=>{
        for(const o of WORLD.obstacles){
          if(x+r>o.x && x-r<o.x+o.w && y+r>o.y && y-r<o.y+o.h)return true;
        }
        if(!this.gateOpened && !ignoreGate){
          const g=WORLD.gate;
          if(x+r>g.x && x-r<g.x+g.w && y+r>g.y && y-r<g.y+g.h)return true;
        }
        return false;
      };
      if(!collides(nx,actor.y))actor.x=nx;
      if(!collides(actor.x,ny))actor.y=ny;
    }

    collectClue(id,label){
      if(this.clues.has(id))return;
      this.clues.add(id);this.sound.clue();
      this.toast(`Улика найдена: ${label}`);
      if(this.clues.size>=CONFIG.cluesRequired && !this.gateOpened){
        this.gateOpened=true;
        setTimeout(()=>this.toast("Вы собрали достаточно улик. Путь к руинам открыт."),500);
      }
      this.updateHud();this.save();
    }

    interactionCandidates(){
      const a=[];
      for(const n of WORLD.npcs){
        const d=Math.hypot(this.player.x-n.x,this.player.y-n.y);
        if(d<CONFIG.interactionRange+18)a.push({d,type:"npc",obj:n});
      }
      if(this.questAccepted){
        for(const c of WORLD.clues){
          if(c.source!=="world"||this.clues.has(c.id))continue;
          const d=Math.hypot(this.player.x-c.x,this.player.y-c.y);
          if(d<CONFIG.interactionRange)a.push({d,type:"clue",obj:c});
        }
      }
      const gd=Math.hypot(this.player.x-(WORLD.gate.x+20),this.player.y-(WORLD.gate.y+WORLD.gate.h/2));
      if(gd<160 && !this.gateOpened)a.push({d:gd,type:"gate",obj:WORLD.gate});
      a.sort((x,y)=>x.d-y.d);
      return a[0]||null;
    }

    interact(){
      if(this.dialogue.active)return this.nextDialogue();
      const it=this.currentInteractable;
      if(!it)return;
      if(it.type==="npc")this.interactNpc(it.obj);
      else if(it.type==="clue")this.interactClue(it.obj);
      else if(it.type==="gate")this.startDialogue(DIALOGUES.gateLocked);
    }

    interactNpc(n){
      if(n.id==="elder"){
        if(!this.questAccepted){
          this.startDialogue(DIALOGUES.elderIntro,()=>{
            this.questAccepted=true;this.updateHud();this.save();
            this.toast("Задание получено: найти три улики.");
          });
        }else this.startDialogue(DIALOGUES.elderAfter);
      }else if(n.id==="innkeeper")this.startDialogue(DIALOGUES.innkeeper);
      else if(n.id==="oldWoman")this.startDialogue(DIALOGUES.oldWoman);
      else if(n.id==="farmer")this.startDialogue(DIALOGUES.frightenedFarmer);
      else if(n.id==="forester"){
        if(this.questAccepted&&!this.clues.has("forester")){
          this.startDialogue(DIALOGUES.foresterClue,()=>this.collectClue("forester","рассказ лесника и клочок шерсти"));
        } else this.startDialogue(DIALOGUES.foresterAfter);
      }
    }

    interactClue(c){
      const map={cart:"clueCart",carcass:"clueCarcass",note:"clueNote"};
      this.startDialogue(DIALOGUES[map[c.id]],()=>this.collectClue(c.id,c.label));
    }

    startDialogue(lines,onEnd=null){
      this.dialogue={active:true,lines,index:0,onEnd};
      ui.dialogue.classList.remove("hidden");
      ui.prompt.classList.add("hidden");
      this.showDialogueLine();
    }
    showDialogueLine(){
      const line=this.dialogue.lines[this.dialogue.index];
      if(!line)return this.endDialogue();
      ui.speaker.textContent=line[0];
      ui.dialogueText.textContent=line[1];
    }
    nextDialogue(){
      if(!this.dialogue.active)return;
      this.dialogue.index++;
      if(this.dialogue.index>=this.dialogue.lines.length)this.endDialogue();
      else this.showDialogueLine();
    }
    endDialogue(){
      const cb=this.dialogue.onEnd;
      this.dialogue.active=false;ui.dialogue.classList.add("hidden");
      this.dialogue.onEnd=null;
      if(cb)cb();
    }

    enterRuins(){
      if(this.ruinsSeen)return;
      this.ruinsSeen=true;
      this.startDialogue(DIALOGUES.ruins,()=>{this.updateHud();this.save()});
    }

    startBoss(){
      if(this.bossStarted||this.bossDefeated)return;
      this.bossStarted=true;
      this.sound.boss();
      this.startDialogue(DIALOGUES.bossIntro,()=>{
        this.spawnBoss();this.updateHud();this.save();
      });
    }
    spawnBoss(){
      if(this.enemies.some(e=>e.type==="boss"&&!e.dead))return;
      this.enemies.push(new Enemy("boss",3580,1050));
    }
    onBossDefeated(){
      this.bossDefeated=true;
      this.updateHud();this.save();
      this.startDialogue(DIALOGUES.ending,()=>this.playEnding());
    }

    playEnding(){
      if(this.endingPlayed)return;
      this.endingPlayed=true;this.mode="ending";
      ui.hud.classList.add("hidden");ui.ending.classList.remove("hidden");
      $("#endingLine2").classList.add("hidden");
      $("#endingTitle").classList.add("hidden");
      $("#endingMenuBtn").classList.add("hidden");
      setTimeout(()=>$("#endingLine2").classList.remove("hidden"),1600);
      setTimeout(()=>$("#endingTitle").classList.remove("hidden"),3200);
      setTimeout(()=>$("#endingMenuBtn").classList.remove("hidden"),4200);
    }

    onDeath(){
      this.mode="dead";ui.hud.classList.add("hidden");
      ui.death.classList.remove("hidden");ui.prompt.classList.add("hidden");
    }

    toast(msg){
      ui.toast.textContent=msg;ui.toast.classList.remove("hidden");this.toastTimer=3.4;
    }

    particlesBurst(x,y,count){
      for(let i=0;i<count;i++)this.particles.push({
        x,y,vx:(Math.random()-.5)*170,vy:(Math.random()-.5)*170,
        life:.5+Math.random()*.55,max:.9,size:2+Math.random()*4
      });
    }

    setupFog(){
      this.fog=Array.from({length:48},()=>({
        x:Math.random()*CONFIG.world.width,y:Math.random()*CONFIG.world.height,
        r:70+Math.random()*170,spd:4+Math.random()*10,alpha:.018+Math.random()*.035
      }));
    }

    update(dt){
      if(this.mode!=="playing")return;
      if(this.toastTimer>0){
        this.toastTimer-=dt;
        if(this.toastTimer<=0)ui.toast.classList.add("hidden");
      }
      if(!this.dialogue.active){
        this.player.update(dt,this.inputState(),this);
        this.ren.update(dt,this);
        for(const e of this.enemies)e.update(dt,this);
      }

      for(const p of this.projectiles){
        p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;
        if(p.target&&!p.target.dead && Math.hypot(p.x-p.target.x,p.y-p.target.y)<p.target.radius+7){
          p.target.takeDamage(p.damage,this);p.life=0;
        }
      }
      this.projectiles=this.projectiles.filter(p=>p.life>0);

      for(const p of this.particles){
        p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.96;p.vy*=.96;p.life-=dt;
      }
      this.particles=this.particles.filter(p=>p.life>0);

      for(const f of this.fog){
        f.x+=f.spd*dt;
        if(f.x-f.r>CONFIG.world.width)f.x=-f.r;
      }

      if(this.questAccepted&&this.gateOpened&&this.player.x>2630&&this.player.x<3150&&this.player.y<900)this.enterRuins();
      if(this.gateOpened&&!this.bossDefeated&&this.player.x>3290)this.startBoss();

      this.currentInteractable=this.interactionCandidates();
      if(this.currentInteractable&&!this.dialogue.active){
        const it=this.currentInteractable;
        let label="[E] Осмотреть";
        if(it.type==="npc")label="[E] Поговорить";
        if(it.type==="gate")label="[E] Осмотреть проход";
        ui.prompt.textContent=label;ui.prompt.classList.remove("hidden");
      }else ui.prompt.classList.add("hidden");

      this.autosave+=dt;
      if(this.autosave>=CONFIG.autosaveSeconds){this.autosave=0;this.save()}
      this.updateCamera(dt);
    }

    updateCamera(dt){
      const tx=this.player.x-this.viewW/2,ty=this.player.y-this.viewH/2;
      this.camera.x+=(tx-this.camera.x)*Math.min(1,dt*6);
      this.camera.y+=(ty-this.camera.y)*Math.min(1,dt*6);
      this.camera.x=Math.max(0,Math.min(CONFIG.world.width-this.viewW,this.camera.x));
      this.camera.y=Math.max(0,Math.min(CONFIG.world.height-this.viewH,this.camera.y));
    }

    loop(t){
      const dt=Math.min(.035,(t-this.last)/1000||0);this.last=t;
      this.update(dt);this.draw();
      requestAnimationFrame(n=>this.loop(n));
    }

    draw(){
      ctx.clearRect(0,0,this.viewW,this.viewH);
      const cx=this.camera.x,cy=this.camera.y;
      ctx.save();ctx.translate(-cx,-cy);
      this.drawGround();
      this.drawRoads();
      this.drawDecor();
      this.drawObstacles();
      this.drawClues();
      this.drawNPCs();
      this.drawEnemies();
      this.drawProjectiles();
      this.drawActors();
      this.drawParticles();
      this.drawWorldLabels();
      ctx.restore();
      this.drawFogOverlay();
      this.drawVignette();
    }

    drawGround(){
      const grad=ctx.createLinearGradient(0,0,CONFIG.world.width,0);
      grad.addColorStop(0,"#233127");
      grad.addColorStop(.22,"#1a2a22");
      grad.addColorStop(.5,"#16241f");
      grad.addColorStop(.72,"#18211f");
      grad.addColorStop(1,"#121718");
      ctx.fillStyle=grad;ctx.fillRect(0,0,CONFIG.world.width,CONFIG.world.height);

      ctx.fillStyle="rgba(0,0,0,.09)";
      for(let x=0;x<CONFIG.world.width;x+=80){
        for(let y=0;y<CONFIG.world.height;y+=80){
          if(((x+y)/80)%2===0)ctx.fillRect(x,y,80,80);
        }
      }
    }

    drawRoads(){
      ctx.save();
      ctx.lineCap="round";ctx.lineJoin="round";
      const path=[[520,1050],[760,1080],[980,1050],[1240,1110],[1510,980],[1780,900],[2050,930],[2310,880],[2580,800],[2860,780],[3120,1020],[3490,1050]];
      ctx.strokeStyle="#403d35";ctx.lineWidth=120;
      ctx.beginPath();ctx.moveTo(path[0][0],path[0][1]);
      for(let i=1;i<path.length;i++)ctx.lineTo(path[i][0],path[i][1]);
      ctx.stroke();
      ctx.strokeStyle="rgba(205,187,149,.11)";ctx.lineWidth=4;ctx.setLineDash([18,24]);ctx.stroke();ctx.setLineDash([]);

      // village paths
      ctx.strokeStyle="#4b493d";ctx.lineWidth=62;
      [[520,1050,500,520],[500,520,650,620],[500,520,290,560],[500,520,790,510]].forEach(p=>{
        ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(p[2],p[3]);ctx.stroke();
      });
      ctx.restore();
    }

    drawDecor(){
      for(const [x,y] of WORLD.decorSeed)this.drawTree(x,y,1);
      for(let i=0;i<95;i++){
        const x=900+(i*137)%2140,y=110+(i*263)%1930;
        if(i%4!==0)this.drawTree(x,y,.72+(i%3)*.09);
      }
      for(const l of WORLD.lamps)this.drawLamp(l.x,l.y);
      this.drawWell(520,470);
      this.drawSignpost(885,1050);
      this.drawSignpost(2550,820);
      this.drawBones(3480,1180);
      this.drawBones(3650,890);
    }

    drawTree(x,y,s=1){
      ctx.save();ctx.translate(x,y);
      ctx.fillStyle="#171513";ctx.fillRect(-6*s,0,12*s,52*s);
      ctx.fillStyle="#12201a";
      ctx.beginPath();ctx.moveTo(0,-72*s);ctx.lineTo(-36*s,10*s);ctx.lineTo(36*s,10*s);ctx.closePath();ctx.fill();
      ctx.beginPath();ctx.moveTo(0,-48*s);ctx.lineTo(-45*s,30*s);ctx.lineTo(45*s,30*s);ctx.closePath();ctx.fill();
      ctx.restore();
    }

    drawLamp(x,y){
      const flick=.82+Math.sin(performance.now()/140+x)*.12;
      const rg=ctx.createRadialGradient(x,y,8,x,y,115);
      rg.addColorStop(0,`rgba(255,188,90,${.22*flick})`);rg.addColorStop(1,"rgba(255,170,70,0)");
      ctx.fillStyle=rg;ctx.beginPath();ctx.arc(x,y,115,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#2b251d";ctx.fillRect(x-3,y-45,6,48);
      ctx.fillStyle="#f2b35d";ctx.fillRect(x-5,y-48,10,12);
    }

    drawWell(x,y){
      ctx.fillStyle="#49483f";ctx.beginPath();ctx.ellipse(x,y,58,34,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#171a19";ctx.beginPath();ctx.ellipse(x,y-4,42,22,0,0,Math.PI*2);ctx.fill();
    }

    drawSignpost(x,y){
      ctx.fillStyle="#352d22";ctx.fillRect(x-4,y-35,8,70);
      ctx.fillRect(x-38,y-30,70,15);ctx.fillRect(x-25,y-5,60,15);
    }

    drawBones(x,y){
      ctx.strokeStyle="rgba(207,196,169,.45)";ctx.lineWidth=4;
      for(let i=0;i<4;i++){
        ctx.beginPath();ctx.moveTo(x+i*13,y+i*5);ctx.lineTo(x+24+i*8,y-12+i*2);ctx.stroke();
      }
    }

    drawObstacles(){
      for(const o of WORLD.obstacles){
        if(o.type==="house"||o.type==="tavern"){
          ctx.fillStyle=o.type==="tavern"?"#4b3527":"#38332c";ctx.fillRect(o.x,o.y,o.w,o.h);
          ctx.fillStyle="#27201b";
          ctx.beginPath();ctx.moveTo(o.x-18,o.y+8);ctx.lineTo(o.x+o.w/2,o.y-70);ctx.lineTo(o.x+o.w+18,o.y+8);ctx.closePath();ctx.fill();
          ctx.fillStyle="#d89d52";
          for(let wx=o.x+40;wx<o.x+o.w-20;wx+=80)ctx.fillRect(wx,o.y+55,18,25);
        }else if(o.type==="grove"){
          ctx.fillStyle="#0e1814";ctx.beginPath();ctx.ellipse(o.x+o.w/2,o.y+o.h/2,o.w*.55,o.h*.58,0,0,Math.PI*2);ctx.fill();
          for(let i=0;i<5;i++)this.drawTree(o.x+25+i*(o.w-50)/4,o.y+o.h-25,(.65+i*.03));
        }else if(o.type==="cart"){
          ctx.fillStyle="#4b3321";ctx.fillRect(o.x,o.y+20,o.w,o.h-20);
          ctx.strokeStyle="#1c1713";ctx.lineWidth=8;
          ctx.beginPath();ctx.arc(o.x+38,o.y+o.h,28,0,Math.PI*2);ctx.stroke();
          ctx.beginPath();ctx.arc(o.x+o.w-42,o.y+o.h,28,0,Math.PI*2);ctx.stroke();
        }else if(o.type==="rocks"){
          ctx.fillStyle="#343a39";ctx.beginPath();ctx.ellipse(o.x+o.w/2,o.y+o.h/2,o.w/2,o.h/2,0,0,Math.PI*2);ctx.fill();
        }else{
          ctx.fillStyle=o.type==="chapel"?"#3e403d":"#343936";ctx.fillRect(o.x,o.y,o.w,o.h);
          ctx.strokeStyle="rgba(210,210,200,.08)";ctx.strokeRect(o.x,o.y,o.w,o.h);
        }
      }

      if(!this.gateOpened){
        const g=WORLD.gate;
        const mist=ctx.createLinearGradient(g.x,g.y,g.x+g.w,g.y);
        mist.addColorStop(0,"rgba(75,86,82,.18)");mist.addColorStop(.5,"rgba(145,155,147,.42)");mist.addColorStop(1,"rgba(75,86,82,.18)");
        ctx.fillStyle=mist;ctx.fillRect(g.x,g.y,g.w,g.h);
        ctx.strokeStyle="rgba(179,188,178,.18)";ctx.lineWidth=2;
        for(let y=g.y;y<g.y+g.h;y+=38){ctx.beginPath();ctx.moveTo(g.x,y);ctx.lineTo(g.x+g.w,y+14);ctx.stroke()}
      }
    }

    drawClues(){
      if(!this.questAccepted)return;
      for(const c of WORLD.clues){
        if(c.source!=="world"||this.clues.has(c.id))continue;
        ctx.save();ctx.translate(c.x,c.y);
        const pulse=.75+Math.sin(performance.now()/350+c.x)*.18;
        ctx.fillStyle=`rgba(207,176,112,${.14*pulse})`;ctx.beginPath();ctx.arc(0,0,30,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle="#bca06d";ctx.lineWidth=2;
        if(c.id==="note"){ctx.strokeRect(-12,-9,24,18)}
        else if(c.id==="carcass"){ctx.beginPath();ctx.moveTo(-18,10);ctx.lineTo(0,-12);ctx.lineTo(18,10);ctx.stroke()}
        else {ctx.beginPath();ctx.arc(-8,0,5,0,Math.PI*2);ctx.arc(8,0,5,0,Math.PI*2);ctx.stroke()}
        ctx.restore();
      }
    }

    drawNPCs(){
      for(const n of WORLD.npcs){
        const colors={elder:"#9b8762",innkeeper:"#77513b",oldWoman:"#756d7c",farmer:"#8b765d",forester:"#486354"};
        ctx.save();ctx.translate(n.x,n.y);
        ctx.fillStyle="rgba(0,0,0,.35)";ctx.beginPath();ctx.ellipse(0,18,19,8,0,0,Math.PI*2);ctx.fill();
        ctx.fillStyle=colors[n.kind]||"#777";ctx.beginPath();ctx.arc(0,0,16,0,Math.PI*2);ctx.fill();
        ctx.fillStyle="#d0b28e";ctx.beginPath();ctx.arc(0,-17,9,0,Math.PI*2);ctx.fill();
        ctx.font="12px Arial";ctx.fillStyle="rgba(235,228,211,.7)";ctx.textAlign="center";ctx.fillText(n.name,0,-34);
        ctx.restore();
      }
    }

    drawEnemies(){
      for(const e of this.enemies){
        if(e.dead)continue;
        ctx.save();ctx.translate(e.x,e.y);
        const flash=e.flash>0;
        ctx.fillStyle="rgba(0,0,0,.4)";ctx.beginPath();ctx.ellipse(0,e.radius*.75,e.radius*1.05,e.radius*.45,0,0,Math.PI*2);ctx.fill();

        if(e.type==="wolf"){
          ctx.fillStyle=flash?"#d8d1c5":"#6c716d";ctx.beginPath();ctx.ellipse(0,0,24,15,0,0,Math.PI*2);ctx.fill();
          ctx.beginPath();ctx.arc(18,-5,11,0,Math.PI*2);ctx.fill();
        }else if(e.type==="imp"){
          ctx.fillStyle=flash?"#d8d1c5":"#5a5449";ctx.beginPath();ctx.arc(0,0,16,0,Math.PI*2);ctx.fill();
          ctx.beginPath();ctx.moveTo(-10,-10);ctx.lineTo(-16,-27);ctx.lineTo(-3,-15);ctx.closePath();ctx.fill();
          ctx.beginPath();ctx.moveTo(10,-10);ctx.lineTo(16,-27);ctx.lineTo(3,-15);ctx.closePath();ctx.fill();
        }else if(e.type==="corrupted"){
          ctx.fillStyle=flash?"#d8d1c5":"#42584a";ctx.beginPath();ctx.arc(0,0,23,0,Math.PI*2);ctx.fill();
          ctx.strokeStyle="#263b2d";ctx.lineWidth=6;
          for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo((i-1.5)*15,28);ctx.stroke()}
        }else{
          ctx.fillStyle=flash?"#e1dbd1":"#3b4140";ctx.beginPath();ctx.ellipse(0,0,54,43,0,0,Math.PI*2);ctx.fill();
          ctx.fillStyle="#252a29";ctx.beginPath();ctx.arc(35,-20,34,0,Math.PI*2);ctx.fill();
          ctx.fillStyle="#c97a54";ctx.beginPath();ctx.arc(46,-27,5,0,Math.PI*2);ctx.fill();
          ctx.strokeStyle="#1d2221";ctx.lineWidth=9;
          for(let i=-1;i<=1;i+=2){ctx.beginPath();ctx.moveTo(i*28,28);ctx.lineTo(i*39,66);ctx.stroke()}
        }

        // HP bars when hurt or boss
        if(e.hp<e.maxHp || e.type==="boss"){
          const w=e.type==="boss"?120:48;
          ctx.fillStyle="#191719";ctx.fillRect(-w/2,-e.radius-25,w,6);
          ctx.fillStyle=e.type==="boss"?"#8e3e3a":"#7f5c48";ctx.fillRect(-w/2,-e.radius-25,w*Math.max(0,e.hp/e.maxHp),6);
        }
        ctx.restore();
      }
    }

    drawProjectiles(){
      ctx.fillStyle="#e3c58b";
      for(const p of this.projectiles){
        ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(p.vy,p.vx));
        ctx.fillRect(-7,-1,14,2);ctx.restore();
      }
    }

    drawActors(){
      // Ren
      ctx.save();ctx.translate(this.ren.x,this.ren.y);
      ctx.fillStyle="rgba(0,0,0,.4)";ctx.beginPath();ctx.ellipse(0,18,20,8,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#876f55";ctx.beginPath();ctx.arc(0,0,18,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#29231f";ctx.fillRect(-22,-22,44,6);ctx.beginPath();ctx.ellipse(0,-23,16,8,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle="#b69a6b";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-16,10);ctx.lineTo(17,-6);ctx.stroke();
      ctx.restore();

      // Kai
      ctx.save();ctx.translate(this.player.x,this.player.y);
      ctx.fillStyle="rgba(0,0,0,.45)";ctx.beginPath();ctx.ellipse(0,20,23,9,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=this.player.flash>0?"#d9cbbb":"#2f3539";ctx.beginPath();ctx.arc(0,0,21,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#171a1c";ctx.beginPath();ctx.moveTo(-20,8);ctx.lineTo(0,34);ctx.lineTo(20,8);ctx.closePath();ctx.fill();
      ctx.strokeStyle="#a7a09a";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-14,-15);ctx.lineTo(16,20);ctx.stroke();

      if(this.player.attackVisual>0){
        const ang=Math.atan2(this.player.facingY,this.player.facingX);
        ctx.strokeStyle="rgba(231,218,183,.9)";ctx.lineWidth=5;
        ctx.beginPath();ctx.arc(0,0,CONFIG.player.attackRange,ang-.85,ang+.85);ctx.stroke();
      }
      ctx.restore();
    }

    drawParticles(){
      for(const p of this.particles){
        ctx.globalAlpha=Math.max(0,p.life/p.max);
        ctx.fillStyle="#a88f6d";ctx.fillRect(p.x,p.y,p.size,p.size);
      }
      ctx.globalAlpha=1;
    }

    drawWorldLabels(){
      const labels=[
        [470,1250,"ДЕРЕВНЯ"],[1380,1700,"СТАРЫЙ ЛЕС"],[2140,1660,"СТАРАЯ ДОРОГА"],
        [2780,1520,"ЗАБРОШЕННЫЕ РУИНЫ"],[3460,1770,"ЛОГОВО"]
      ];
      ctx.textAlign="center";ctx.font="700 14px Arial";ctx.letterSpacing="2px";
      for(const [x,y,t] of labels){
        ctx.fillStyle="rgba(230,221,200,.16)";ctx.fillText(t,x,y);
      }
    }

    drawFogOverlay(){
      ctx.save();
      ctx.globalCompositeOperation="screen";
      for(const f of this.fog){
        const x=f.x-this.camera.x,y=f.y-this.camera.y;
        if(x<-f.r||x>this.viewW+f.r||y<-f.r||y>this.viewH+f.r)continue;
        const g=ctx.createRadialGradient(x,y,0,x,y,f.r);
        g.addColorStop(0,`rgba(180,194,196,${f.alpha})`);g.addColorStop(1,"rgba(180,194,196,0)");
        ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,f.r,0,Math.PI*2);ctx.fill();
      }
      ctx.restore();
    }

    drawVignette(){
      const dark=Math.min(.68,.37+Math.max(0,(this.player.x-900)/(CONFIG.world.width-900))*.22);
      const g=ctx.createRadialGradient(this.viewW/2,this.viewH/2,Math.min(this.viewW,this.viewH)*.2,this.viewW/2,this.viewH/2,Math.max(this.viewW,this.viewH)*.72);
      g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,`rgba(0,0,0,${dark})`);
      ctx.fillStyle=g;ctx.fillRect(0,0,this.viewW,this.viewH);
    }
  }

  window.game=new Game();
})();
