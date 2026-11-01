class Actor {
  constructor(x,y,radius){
    this.x=x; this.y=y; this.radius=radius;
    this.vx=0; this.vy=0; this.flash=0;
  }
  distanceTo(other){
    return Math.hypot(this.x-other.x,this.y-other.y);
  }
}

class Player extends Actor {
  constructor(x,y){
    super(x,y,CONFIG.player.radius);
    this.maxHp=CONFIG.player.maxHp;
    this.hp=this.maxHp;
    this.facingX=1; this.facingY=0;
    this.attackTimer=0;
    this.attackVisual=0;
    this.invuln=0;
  }
  update(dt,input,game){
    if(this.attackTimer>0)this.attackTimer-=dt;
    if(this.attackVisual>0)this.attackVisual-=dt;
    if(this.invuln>0)this.invuln-=dt;
    if(this.flash>0)this.flash-=dt;

    let dx=(input.right?1:0)-(input.left?1:0);
    let dy=(input.down?1:0)-(input.up?1:0);
    if(dx||dy){
      const len=Math.hypot(dx,dy); dx/=len; dy/=len;
      this.facingX=dx; this.facingY=dy;
      const nx=this.x+dx*CONFIG.player.speed*dt;
      const ny=this.y+dy*CONFIG.player.speed*dt;
      game.tryMove(this,nx,ny);
    }
  }
  attack(game){
    if(this.attackTimer>0 || game.mode!=="playing" || game.dialogue.active)return;
    this.attackTimer=CONFIG.player.attackCooldown;
    this.attackVisual=.18;
    game.sound.sword();
    const hx=this.x+this.facingX*CONFIG.player.attackRange*.62;
    const hy=this.y+this.facingY*CONFIG.player.attackRange*.62;
    for(const e of game.enemies){
      if(e.dead)continue;
      const dist=Math.hypot(e.x-hx,e.y-hy);
      if(dist < CONFIG.player.attackRange + e.radius){
        e.takeDamage(CONFIG.player.damage, game);
        const knock=24;
        e.x += this.facingX*knock;
        e.y += this.facingY*knock;
      }
    }
  }
  takeDamage(amount,game){
    if(this.invuln>0 || game.bossDefeated)return;
    this.hp=Math.max(0,this.hp-amount);
    this.invuln=.55; this.flash=.18;
    game.sound.hit();
    game.updateHud();
    if(this.hp<=0)game.onDeath();
  }
}

class Companion extends Actor {
  constructor(x,y){
    super(x,y,18);
    this.shotTimer=.5;
    this.facingX=1;this.facingY=0;
  }
  update(dt,game){
    if(this.shotTimer>0)this.shotTimer-=dt;
    const p=game.player;
    const dx=p.x-this.x,dy=p.y-this.y;
    const d=Math.hypot(dx,dy);
    if(d>CONFIG.ren.followDistance){
      const nx=dx/d,ny=dy/d;
      this.facingX=nx;this.facingY=ny;
      const tx=this.x+nx*CONFIG.ren.speed*dt;
      const ty=this.y+ny*CONFIG.ren.speed*dt;
      game.tryMove(this,tx,ty,true);
    }
    if(this.shotTimer<=0){
      let target=null,best=CONFIG.ren.shotRange;
      for(const e of game.enemies){
        if(e.dead)continue;
        const ed=Math.hypot(e.x-this.x,e.y-this.y);
        if(ed<best){best=ed;target=e}
      }
      if(target){
        const vx=target.x-this.x,vy=target.y-this.y,vl=Math.hypot(vx,vy)||1;
        game.projectiles.push({
          x:this.x,y:this.y,
          vx:vx/vl*620,vy:vy/vl*620,
          target,life:1.1,damage:CONFIG.ren.damage
        });
        this.shotTimer=CONFIG.ren.shotCooldown;
        game.sound.crossbow();
      }
    }
  }
}

class Enemy extends Actor {
  constructor(type,x,y){
    const c=CONFIG.enemy[type];
    super(x,y,c.radius);
    this.type=type;this.maxHp=c.hp;this.hp=c.hp;
    this.damage=c.damage;this.speed=c.speed;
    this.attackCooldown=c.attackCooldown;
    this.attackTimer=Math.random()*.4;
    this.dead=false;this.aggro=false;this.wander=Math.random()*6;
    this.homeX=x;this.homeY=y;
  }
  update(dt,game){
    if(this.dead)return;
    if(this.attackTimer>0)this.attackTimer-=dt;
    if(this.flash>0)this.flash-=dt;

    const p=game.player;
    const d=Math.hypot(p.x-this.x,p.y-this.y);
    const range=this.type==="boss"?700:330;
    if(d<range)this.aggro=true;
    if(!this.aggro){
      this.wander-=dt;
      if(this.wander<=0)this.wander=3+Math.random()*5;
      return;
    }
    if(d > this.radius+p.radius+12){
      const dx=(p.x-this.x)/(d||1),dy=(p.y-this.y)/(d||1);
      const nx=this.x+dx*this.speed*dt;
      const ny=this.y+dy*this.speed*dt;
      game.tryMove(this,nx,ny,true);
    } else if(this.attackTimer<=0){
      p.takeDamage(this.damage,game);
      this.attackTimer=this.attackCooldown;
    }
  }
  takeDamage(amount,game){
    if(this.dead)return;
    this.hp-=amount;this.flash=.15;this.aggro=true;
    game.sound.enemyHit();
    if(this.hp<=0){
      this.dead=true;
      game.particlesBurst(this.x,this.y,this.type==="boss"?22:8);
      if(this.type==="boss")game.onBossDefeated();
    }
  }
}
