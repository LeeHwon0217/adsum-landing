(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=`<div id="character-layer">
        <!-- 차원문. 캐릭터 뒤에 깔린다 (등장 중에만 보임) -->
        <div id="rift">
          <svg viewBox="0 0 64 64" preserveAspectRatio="none" shape-rendering="crispEdges" aria-hidden="true">
            <path
              d="M24 4 h16 v4 h8 v8 h4 v32 h-4 v8 h-8 v4 h-16 v-4 h-8 v-8 h-4 v-32 h4 v-8 h8 z"
              fill="#4a148c"
            />
            <path d="M28 12 h8 v4 h8 v32 h-8 v4 h-8 v-4 h-8 v-32 h8 z" fill="#3f51b5" />
            <path d="M30 20 h4 v4 h4 v16 h-4 v4 h-4 v-4 h-4 v-16 h4 z" fill="#00bcd4" />
          </svg>
        </div>
        <div id="particles"></div>
        <div id="glow"></div>
        <div id="laptop-glow"></div>

        <div id="character-wrapper">
        <svg id="robot" viewBox="0 0 32 32" shape-rendering="crispEdges" aria-label="Adsum">
          <rect x="15" y="2" width="2" height="4" fill="#191c1e" />
          <rect x="14" y="1" width="4" height="2" fill="#7c90db" />
          <path d="M10 6 h12 v2 h2 v2 h2 v10 h-2 v4 h-4 v2 h-8 v-2 h-4 v-4 h-2 v-10 h2 v-2 h2 z" fill="#191c1e" />
          <path d="M10 8 h12 v2 h2 v10 h-2 v2 h-4 v2 h-8 v-2 h-4 v-2 h-2 v-10 h2 z" fill="#ffffff" />
          <path d="M10 24 h12 v2 h-12 z" fill="#e1e2e4" />
          <path d="M8 12 h16 v8 h-16 z" fill="#e1e2e4" />
          <path d="M10 12 h12 v8 h-12 z" fill="#f8f9fb" />
          <rect class="base-eye" x="11" y="14" width="3" height="4" fill="#191c1e" />
          <rect class="pupil" x="12" y="15" width="1" height="1" fill="#ffffff" />
          <rect class="base-eye" x="18" y="14" width="3" height="4" fill="#191c1e" />
          <rect class="pupil" x="19" y="15" width="1" height="1" fill="#ffffff" />

          <!-- 반응할 때 바뀌는 눈 (ADR-112). 원래 눈(.base-eye·.pupil)은 그동안 숨는다 -->
          <g id="bot-eyes-squint" aria-hidden="true">
            <rect x="11" y="14" width="1" height="1" fill="#191c1e" />
            <rect x="12" y="15" width="1" height="1" fill="#191c1e" />
            <rect x="13" y="16" width="1" height="1" fill="#191c1e" />
            <rect x="12" y="17" width="1" height="1" fill="#191c1e" />
            <rect x="11" y="18" width="1" height="1" fill="#191c1e" />
            <rect x="20" y="14" width="1" height="1" fill="#191c1e" />
            <rect x="19" y="15" width="1" height="1" fill="#191c1e" />
            <rect x="18" y="16" width="1" height="1" fill="#191c1e" />
            <rect x="19" y="17" width="1" height="1" fill="#191c1e" />
            <rect x="20" y="18" width="1" height="1" fill="#191c1e" />
          </g>
          <g id="bot-eyes-happy" aria-hidden="true">
            <rect x="11" y="16" width="1" height="1" fill="#191c1e" />
            <rect x="12" y="15" width="2" height="1" fill="#191c1e" />
            <rect x="14" y="16" width="1" height="1" fill="#191c1e" />
            <rect x="18" y="16" width="1" height="1" fill="#191c1e" />
            <rect x="19" y="15" width="2" height="1" fill="#191c1e" />
            <rect x="21" y="16" width="1" height="1" fill="#191c1e" />
          </g>
          <g id="bot-eyes-flat" aria-hidden="true">
            <rect x="11" y="16" width="4" height="1" fill="#191c1e" />
            <rect x="18" y="16" width="4" height="1" fill="#191c1e" />
          </g>

          <!--
            볼터치. 눈 바로 아래 바깥쪽에 둔다 — 가운데를 비워야 얼굴로 읽힌다.
            색을 CSS에 두는 이유: 기한이 다가올수록 붉어지는 것을 나중에 붙일 자리다
            (tasks/backlog.md). 그때 이 변수만 바꾸면 된다.
          -->
          <rect class="blush" x="10" y="18" width="2" height="1" />
          <rect class="blush" x="20" y="18" width="2" height="1" />
          <g id="bot-blush-puffed" aria-hidden="true"><rect x="9" y="18" width="3" height="2" /></g>

          <!--
            땀방울 (ADR-101). 머리 오른쪽 바깥, 말풍선이 뜨는 위쪽은 피한다.
            **색만으로는 색약인 사람에게 아무것도 안 전해진다.**
            모양이 바뀌어야 색과 무관하게 보인다.
          -->
          <g id="bot-sweat" aria-hidden="true">
            <rect x="25" y="8" width="1" height="1" />
            <rect x="24" y="9" width="3" height="2" />
            <rect x="25" y="11" width="1" height="1" />
            <rect class="glint" x="24" y="9" width="1" height="1" />
          </g>

          <!-- 일하는 중에만 보인다 -->
          <g id="bot-laptop">
            <rect x="8" y="24" width="16" height="6" fill="#191c1e" />
            <rect x="9" y="25" width="14" height="4" fill="#444651" />
            <rect x="10" y="26" width="12" height="2" fill="#b6c4ff" />
          </g>
          <!--
            포털에서 나오며 한 손 인사 (ADR-102).
            **등장할 때만** 보인다. 노트북 치는 손(#bot-hands)과 따로 두는 이유는
            그쪽이 working 상태에 묶여 있어서다 — 섞으면 타자 치다 손을 흔든다.
          -->
          <g id="bot-wave" aria-hidden="true">
            <rect x="24" y="18" width="2" height="3" fill="#191c1e" />
            <rect x="23" y="14" width="4" height="4" fill="#191c1e" />
            <rect x="24" y="15" width="2" height="2" fill="#7c90db" />
          </g>

          <g id="bot-hands">
            <g class="hand-l">
              <rect x="8" y="22" width="4" height="3" fill="#191c1e" />
              <rect x="9" y="23" width="2" height="1" fill="#7c90db" />
            </g>
            <g class="hand-r">
              <rect x="20" y="22" width="4" height="3" fill="#191c1e" />
              <rect x="21" y="23" width="2" height="1" fill="#7c90db" />
            </g>
          </g>

          <!--
            반응·기분 부위 (ADR-112). Stitch로 그렸다 — 앱에 맞춰 고친 것:
            "!"를 32칸 안(머리 오른쪽 위)으로, 배트를 정수 좌표로, 삐짐 점을 안테나 옆으로.
            몸 위에 그려져야 해서 맨 끝에 둔다.
          -->
          <g id="bot-hands-up" aria-hidden="true">
            <rect x="6" y="15" width="3" height="3" fill="#191c1e" />
            <rect x="7" y="16" width="1" height="1" fill="#7c90db" />
            <rect x="23" y="15" width="3" height="3" fill="#191c1e" />
            <rect x="24" y="16" width="1" height="1" fill="#7c90db" />
          </g>
          <g id="bot-arms-crossed" aria-hidden="true">
            <rect x="10" y="21" width="12" height="3" fill="#191c1e" />
            <rect x="11" y="22" width="10" height="1" fill="#7c90db" />
          </g>
          <g id="bot-arm-raised" aria-hidden="true">
            <rect x="24" y="11" width="3" height="6" fill="#191c1e" />
            <rect x="24" y="10" width="2" height="2" fill="#7c90db" />
          </g>
          <g id="bot-arms-up" aria-hidden="true">
            <rect x="6" y="10" width="2" height="6" fill="#191c1e" />
            <rect x="6" y="9" width="2" height="2" fill="#7c90db" />
            <rect x="24" y="10" width="2" height="6" fill="#191c1e" />
            <rect x="24" y="9" width="2" height="2" fill="#7c90db" />
          </g>
          <g id="bot-bat" aria-hidden="true">
            <rect x="23" y="10" width="3" height="3" fill="#ffdead" />
            <rect x="24" y="13" width="2" height="10" fill="#af8e5c" />
          </g>
          <g id="bot-ball" aria-hidden="true">
            <rect x="1" y="13" width="2" height="2" fill="#ffffff" />
            <rect x="1" y="13" width="1" height="1" fill="#ba1a1a" />
          </g>
          <g id="bot-heart" aria-hidden="true">
            <rect x="14" y="0" width="2" height="1" />
            <rect x="17" y="0" width="2" height="1" />
            <rect x="13" y="1" width="7" height="1" />
            <rect x="14" y="2" width="5" height="1" />
            <rect x="15" y="3" width="3" height="1" />
            <rect x="16" y="4" width="1" height="1" />
          </g>
          <g id="bot-alert" aria-hidden="true">
            <rect x="26" y="2" width="2" height="4" fill="#465aa1" />
            <rect x="26" y="7" width="2" height="1" fill="#465aa1" />
          </g>
          <g id="bot-zzz" aria-hidden="true">
            <path d="M23 4 h3 v1 l-2 1 h2 v1 h-3 v-1 l2 -1 h-2 z" fill="#7c90db" />
            <path d="M26 1 h3 v1 l-2 1 h2 v1 h-3 v-1 l2 -1 h-2 z" fill="#465aa1" />
          </g>
          <g id="bot-sparkles" aria-hidden="true">
            <path d="M5 6 h1 v-1 h1 v1 h1 v1 h-1 v1 h-1 v-1 h-1 z" fill="#f59e0b" />
            <path d="M26 5 h1 v-1 h1 v1 h1 v1 h-1 v1 h-1 v-1 h-1 z" fill="#ff7a8a" />
            <path d="M4 18 h1 v-1 h1 v1 h1 v1 h-1 v1 h-1 v-1 h-1 z" fill="#7c90db" />
            <path d="M27 20 h1 v-1 h1 v1 h1 v1 h-1 v1 h-1 v-1 h-1 z" fill="#4ade80" />
          </g>
          <g id="bot-dots-sulking" aria-hidden="true">
            <rect x="21" y="3" width="1" height="1" fill="#757682" />
            <rect x="23" y="3" width="1" height="1" fill="#757682" />
            <rect x="25" y="3" width="1" height="1" fill="#757682" />
          </g>
        </svg>
        </div>

        <div id="think-bubble" aria-hidden="true"><span></span><span></span><span></span></div>
      </div>`;function t(t=null){let n=document.createElement(`div`);n.innerHTML=e.trim();let r=n.firstElementChild;return t&&r.classList.add(`state-${t}`),r}function n(e,t){for(let t of[...e.classList])t.startsWith(`state-`)&&e.classList.remove(t);e.classList.add(`state-${t}`)}var r=[{time:`09:00`,pose:`welcome`,say:`좋은 아침이에요! 오늘은 3개 있어요~`,note:`켜면 오늘 일정부터`},{time:`15:10`,pose:`raise-hand`,say:`팀 회의 어떠셨어요? 다음 약속 생기면 말씀해 주세요!`,note:`회의가 끝나면`},{time:`18:30`,pose:`stretch`,say:`오늘 일정 끝! 수고하셨어요!`,note:`일정을 다 마치면`},{time:`23:40`,pose:`dozing`,say:null,note:`밤이 늦으면 아숨도 졸아요`}];function i(e){for(let n of r){let r=document.createElement(`li`);r.innerHTML=`
      <div class="day-time">${n.time}</div>
      <div class="day-pose"></div>
      ${n.say?`<p class="day-say">${n.say}</p>`:`<p class="day-note">${n.note}</p>`}`,r.querySelector(`.day-pose`)?.append(t(n.pose)),e.append(r)}}function a(e,t,n){return t===null||n-t>450?1:e+1}function o(e){return e>=10?`sulking`:e>=5?`tickled`:e>=2?`poked`:null}var s=class{lastX=null;lastAt=0;direction=0;reversals=0;travel=0;feed(e,t){if(this.lastX===null||t-this.lastAt>250)return this.reset(),this.lastX=e,this.lastAt=t,!1;let n=e-this.lastX;if(this.lastX=e,this.lastAt=t,n===0)return!1;let r=Math.sign(n);return this.direction!==0&&r!==this.direction&&(this.reversals+=1),this.direction=r,this.travel+=Math.abs(n),this.reversals>=2&&this.travel>=60&&(this.reset(),!0)}reset(){this.lastX=null,this.direction=0,this.reversals=0,this.travel=0}},c=[`entrance`,`idle`,`thinking`,`working`,`listening`,`baseball`,`raise-hand`,`dozing`,`nervous`,`poked`,`petted`,`tickled`,`sulking`,`welcome`,`stretch`,`cheer`,`goodbye`],l={poked:480,petted:900,welcome:1200,stretch:1200,cheer:1200,goodbye:1600};function u(e){return e in l}var d=5,f=.02,p=.45,m=1,h={min:-1,max:1},g={min:-1,max:2},_=.45,ee=260,te=10,v=24,y=108,b=2700,x=420,ne=15e3,re=4e4,ie=300,S=900,C=5e3,w=1500,ae=5e3,oe=24,T=8,E=[`#4a148c`,`#3f51b5`,`#00bcd4`],se=60,D=180,ce=.5,O=1.5,le=.1,ue=.4,de=1.75,fe=-1.5,pe=-1;function k(e,t){return e+Math.random()*(t-e)}var A=5,j=10,M=8,N=3;function P(e,t,n){return Math.min(Math.max(e,t),n)}var F=class{layer;robot;urgency=0;pupils;particles;callbacks;state=`idle`;stateTimer=null;pressOrigin=null;dragging=!1;observer=null;gazeEnabled=!0;walking=!1;typingSync=!1;typingTimer=null;resting=`idle`;pending=!1;taps=0;lastTapAt=null;rub=new s;constructor(e,t){let n=e.querySelector(`#robot`);if(!n)throw Error(`#robot SVG를 찾지 못했습니다.`);let r=e.querySelector(`#particles`);if(!r)throw Error(`#particles 를 찾지 못했습니다.`);this.layer=e,this.robot=n,this.particles=r,this.pupils=[...n.querySelectorAll(`.pupil`)],this.callbacks=t}start(){this.setState(`entrance`),this.observer=new ResizeObserver(()=>this.publishHitRegion()),this.observer.observe(document.documentElement),this.robot.addEventListener(`pointerdown`,this.handlePointerDown),this.robot.addEventListener(`pointermove`,this.handleHover),this.robot.addEventListener(`pointerleave`,this.handleLeave),window.addEventListener(`pointermove`,this.handlePointerMove),window.addEventListener(`pointerup`,this.handlePointerUp),this.publishHitRegion()}dispose(){this.observer?.disconnect(),this.clearStateTimer(),this.robot.removeEventListener(`pointerdown`,this.handlePointerDown),this.robot.removeEventListener(`pointermove`,this.handleHover),this.robot.removeEventListener(`pointerleave`,this.handleLeave),window.removeEventListener(`pointermove`,this.handlePointerMove),window.removeEventListener(`pointerup`,this.handlePointerUp)}setMenuOpen(e){this.layer.classList.toggle(`menu-open`,e)}get currentState(){return this.state}setState(e){if(this.state!==e){this.state=e,this.clearStateTimer();for(let t of c)this.layer.classList.toggle(`state-${t}`,t===e);switch(this.robot.style.transform=``,e!==`entrance`&&this.clearParticles(),e){case`entrance`:this.spawnParticles(),this.stateTimer=setTimeout(()=>this.rest(),b);break;case`idle`:this.resetPupils();break;case`working`:this.setPupils(0,de),this.stateTimer=setTimeout(()=>this.rest(),k(ne,re));break;case`thinking`:this.setPupils(0,fe);break;case`listening`:this.setPupils(0,pe),this.holdFor(w);break;case`baseball`:this.resetPupils(),this.holdFor(ae);break;case`nervous`:case`raise-hand`:this.resetPupils();break;case`tickled`:this.holdFor(S);break;case`sulking`:this.holdFor(C);break;default:u(e)&&this.holdFor(l[e])}this.publishHitRegion()}}clearStateTimer(){this.stateTimer!==null&&(clearTimeout(this.stateTimer),this.stateTimer=null)}holdFor(e){this.clearStateTimer(),this.stateTimer=setTimeout(()=>this.rest(),e)}rest(){this.setState(this.pending?`raise-hand`:this.resting)}get isResting(){return this.state===`idle`||this.state===`dozing`||this.state===`nervous`||this.state===`raise-hand`}setResting(e){this.resting=e,this.isResting&&this.rest()}setPending(e){this.pending!==e&&(this.pending=e,this.isResting&&this.rest())}get isReacting(){return u(this.state)||this.state===`tickled`||this.state===`sulking`}react(e,t={}){if(this.state===`entrance`||this.state===`thinking`)return!1;let n=this.state===`sulking`;return this.clearTypingTimer(),this.state===e?this.replay():this.setState(e),this.callbacks.onReaction(e,{...t,wasSulking:n}),!0}listen(){this.state===`entrance`||this.state===`thinking`||this.isReacting||(this.state===`listening`?this.holdFor(w):(this.clearTypingTimer(),this.setState(`listening`)))}replay(){let e=`state-${this.state}`;this.layer.classList.remove(e),this.layer.offsetWidth,this.layer.classList.add(e),u(this.state)&&this.holdFor(l[this.state])}get position(){return{left:this.layer.offsetLeft,top:this.layer.offsetTop}}setPosition(e,t){let n=this.layer.offsetParent,r=n?.clientWidth??window.innerWidth,i=n?.clientHeight??window.innerHeight,a=r-this.layer.offsetWidth-v,o=i-this.layer.offsetHeight-v,s=P(e,v,Math.max(v,a)),c=P(t,v,Math.max(v,o));this.layer.style.left=`${s}px`,this.layer.style.top=`${c}px`,this.publishHitRegion(),this.callbacks.onMove(s,c)}walkTo(e,t){let n=this.position,r=e-n.left,i=t-n.top;return Math.hypot(r,i)<1?Promise.resolve():(this.walking=!0,new Promise(e=>{let t=performance.now(),a=()=>{if(!this.walking||this.dragging){this.walking=!1,e();return}let o=Math.min(1,(performance.now()-t)/x),s=o<.5?2*o*o:1-(-2*o+2)**2/2;this.setPosition(n.left+r*s,n.top+i*s),o<1?requestAnimationFrame(a):(this.walking=!1,e())};requestAnimationFrame(a)}))}defaultPosition(){let e=this.layer.offsetParent,t=e?.clientWidth??window.innerWidth,n=e?.clientHeight??window.innerHeight;return this.withMenuRoom(t-this.layer.offsetWidth-v,n-this.layer.offsetHeight-v)}withMenuRoom(e,t){let n=this.layer.offsetParent,r=n?.clientWidth??window.innerWidth,i=n?.clientHeight??window.innerHeight,a=this.layer.offsetWidth/2;return{left:Math.min(e,r-y-a),top:Math.min(t,i-y-this.layer.offsetHeight/2)}}setTypingSync(e){this.typingSync=e,e&&(this.clearTypingTimer(),this.clearStateTimer(),this.state===`working`&&this.rest())}noteTyping(){this.typingSync&&(this.state===`entrance`||this.state===`thinking`||this.isReacting||(this.state!==`working`&&this.setState(`working`),this.clearStateTimer(),this.clearTypingTimer(),this.typingTimer=setTimeout(()=>{this.typingTimer=null,this.state===`working`&&this.rest()},ie)))}clearTypingTimer(){this.typingTimer!==null&&(clearTimeout(this.typingTimer),this.typingTimer=null)}setUrgency(e){let t=Math.min(Math.max(e,0),1);Math.abs(t-this.urgency)<f||(this.urgency=t,this.robot.style.setProperty(`--blush-mix`,`${Math.round(t*100)}%`),this.robot.classList.toggle(`sweating`,t>=p))}setGazeEnabled(e){this.gazeEnabled=e,e||this.resetGaze()}lookAt(e,t){if(!this.gazeEnabled||this.state!==`idle`)return;let n=this.robot.getBoundingClientRect();if(n.width===0)return;let r=e-(n.left+n.width/2),i=t-(n.top+n.height/2),a=Math.max(ee,window.innerWidth*_),o=P(r/a,-1,1),s=P(i/a,-1,1),c=P(o*m,h.min,h.max),l=P(s*m,g.min,g.max);for(let e of this.pupils)e.setAttribute(`transform`,`translate(${c.toFixed(2)} ${l.toFixed(2)})`);this.robot.style.transform=`translate(${(o*A).toFixed(1)}px, ${(s*A).toFixed(1)}px) rotateY(${(o*j).toFixed(1)}deg) rotateX(${(-s*M).toFixed(1)}deg) rotateZ(${(o*N).toFixed(1)}deg)`}resetGaze(){this.resetPupils(),this.robot.style.transform=``}setPupils(e,t){for(let n of this.pupils)n.setAttribute(`transform`,`translate(${e.toFixed(2)} ${t.toFixed(2)})`)}resetPupils(){for(let e of this.pupils)e.removeAttribute(`transform`)}spawnParticles(){this.clearParticles();for(let e=0;e<oe;e+=1){let t=Math.random()*Math.PI*2,n=Math.cos(t),r=Math.sin(t),i=Math.min(k(se,D),this.roomAlong(n,r)),a=document.createElement(`span`);a.className=`particle`,a.style.background=E[e%E.length],a.style.setProperty(`--tx`,`${(n*i).toFixed(1)}px`),a.style.setProperty(`--ty`,`${(r*i).toFixed(1)}px`),a.style.animationDuration=`${k(ce,O).toFixed(2)}s`,a.style.animationDelay=`${k(le,ue).toFixed(2)}s`,this.particles.append(a)}}clearParticles(){this.particles.childElementCount!==0&&this.particles.replaceChildren()}roomAlong(e,t){let n=this.layer.offsetParent,r=n?.clientWidth??window.innerWidth,i=n?.clientHeight??window.innerHeight,a=this.layer.offsetLeft+this.layer.offsetWidth/2,o=this.layer.offsetTop+this.layer.offsetHeight/2,s=[];return e>.001&&s.push((r-T-a)/e),e<-.001&&s.push((a-T)/-e),t>.001&&s.push((i-T-o)/t),t<-.001&&s.push((o-T)/-t),s.length===0?D:Math.max(0,Math.min(...s))}publishHitRegion(){let{offsetLeft:e,offsetTop:t,offsetWidth:n,offsetHeight:r}=this.layer;n!==0&&this.callbacks.onHitRegionChange({centerX:e+n/2,centerY:t+r/2,radius:Math.max(n,r)/2+te})}handlePointerDown=e=>{if(this.state===`entrance`)return;e.preventDefault();let{left:t,top:n}=this.position;this.pressOrigin={x:e.screenX,y:e.screenY,left:t,top:n},this.robot.setPointerCapture(e.pointerId)};handlePointerMove=e=>{let t=this.pressOrigin;if(!t)return;let n=e.screenX-t.x,r=e.screenY-t.y;if(!this.dragging){if(Math.hypot(n,r)<d)return;this.dragging=!0,this.walking=!1,this.callbacks.onDragBegin()}this.setPosition(t.left+n,t.top+r),this.tickleWhileHeld()};tickleWhileHeld(){this.state!==`entrance`&&this.state!==`thinking`&&this.state!==`sulking`&&(this.state===`tickled`?this.holdFor(S):(this.clearTypingTimer(),this.setState(`tickled`)))}handlePointerUp=e=>{if(!this.pressOrigin)return;if(this.pressOrigin=null,this.robot.hasPointerCapture(e.pointerId)&&this.robot.releasePointerCapture(e.pointerId),this.dragging){this.dragging=!1,this.state===`tickled`&&this.rest();let{left:e,top:t}=this.position;this.callbacks.onDragEnd(e,t);return}let t=performance.now();this.taps=a(this.taps,this.lastTapAt,t),this.lastTapAt=t;let n=o(this.taps);n?this.poke(n):(this.state!==`sulking`&&this.setState(`idle`),this.callbacks.onClick())};poke(e){if(this.state===`entrance`||this.state===`thinking`)return;if(this.state===`sulking`){this.holdFor(C);return}let t={taps:this.taps};e===`poked`?this.react(`poked`,t):(this.clearTypingTimer(),this.state===e?this.holdFor(e===`tickled`?S:C):this.setState(e),this.callbacks.onReaction(e,t))}handleHover=e=>{this.pressOrigin||this.dragging||this.rub.feed(e.screenX,performance.now())&&this.state!==`petted`&&this.react(`petted`)};handleLeave=()=>{this.rub.reset()}},I=`<div id="say" class="floating" hidden>
        <div id="say-label" hidden><span class="say-ping" aria-hidden="true"></span><span id="say-label-text"></span></div>
        <span id="say-text" class="body-md"></span>
        <svg class="say-tail" viewBox="0 0 22 11" aria-hidden="true">
          <path class="tail-fill" d="M0 0C4.5 0 7.5 2 9.5 8.5C10.2 10.8 11.8 10.8 12.5 8.5C14.5 2 17.5 0 22 0H0Z" />
          <path class="tail-edge" d="M0 0C4.5 0 7.5 2 9.5 8.5C10.2 10.8 11.8 10.8 12.5 8.5C14.5 2 17.5 0 22 0" />
        </svg>
      </div>`,L=[`안녕하세요! 저는 아숨이에요.`,`저한테 말을 걸면 일정이 저장돼요~`,`평소엔 이렇게 화면 구석에 조용히 있어요.`,`머리 위를 좌우로 쓰다듬어 보세요!`,`잡고 끌어도 돼요. 간지러워하지만요!`];function R(e,t){switch(e){case`poked`:return t.taps===2?`네?`:null;case`tickled`:return t.taps===5?`아, 간지러워요!`:null;case`sulking`:return`…저 지금 삐졌어요.`;case`petted`:return t.wasSulking?`…이번만 봐 드릴게요.`:`헤헤.`;default:return null}}var z=10,B=14,me=3200,he=2600,ge=.72,_e=.5,ve=900,ye=70;function be(e){let n=e.querySelector(`[data-stage]`);if(!n)throw Error(`[data-stage]가 없습니다.`);let r=t();n.append(r);let i=document.createElement(`div`);i.innerHTML=I.trim();let a=i.firstElementChild;n.append(a);let o=a.querySelector(`#say-text`);if(!o)throw Error(`#say-text가 없습니다.`);let s,c=0,l=()=>{if(a.hidden)return;let e=r.offsetLeft+r.offsetWidth/2,t=Math.min(Math.max(e-a.offsetWidth/2,B),n.clientWidth-a.offsetWidth-B),i=Math.max(r.offsetTop-z-a.offsetHeight,B);a.style.left=`${t}px`,a.style.top=`${i}px`,a.style.setProperty(`--tail-x`,`${Math.min(Math.max(e-t,29),a.offsetWidth-29)}px`)},u=e=>{o.textContent=e;let t=a.hidden;a.hidden=!1,l(),t&&requestAnimationFrame(()=>a.classList.add(`shown`)),window.clearTimeout(s),s=window.setTimeout(()=>{a.classList.remove(`shown`),a.hidden=!0},me)},d=t=>e.querySelector(`[data-hint="${t}"]`)?.setAttribute(`data-done`,``),f=new F(r,{onDragBegin:()=>d(`drag`),onMove:()=>l(),onDragEnd:()=>l(),onClick:()=>{d(`poke`),u(L[c%L.length]),c+=1},onHitRegionChange:()=>{},onReaction:(e,t)=>{e===`petted`&&d(`pet`);let n=R(e,t);n&&u(n)}});f.setGazeEnabled(!0),window.addEventListener(`pointermove`,e=>f.lookAt(e.clientX,e.clientY),{passive:!0});let p=n.clientWidth<ve?{left:(n.clientWidth-r.offsetWidth)/2,top:n.clientHeight-r.offsetHeight-ye}:{left:n.clientWidth*ge-r.offsetWidth/2,top:n.clientHeight*_e-r.offsetHeight/2};f.setPosition(p.left,p.top);let m=!1;new IntersectionObserver((e,t)=>{e.some(e=>e.isIntersecting)&&!m&&(m=!0,t.disconnect(),f.start(),window.setTimeout(()=>u(`저를 눌러 보세요!`),he))},{threshold:.3}).observe(e),new ResizeObserver(()=>{let e=f.position;f.setPosition(e.left,e.top),l()}).observe(n)}var V=[{pose:`sulking`,say:`…저 지금 삐졌어요.`,ms:3200},{pose:`petted`,say:`…이번만 봐 드릴게요.`,ms:2600},{pose:`welcome`,say:`헤헤.`,ms:2200}];function xe(e){let r=e.querySelector(`[data-mood-say]`);if(!r)throw Error(`[data-mood-say]가 없습니다.`);let i=t(V[0].pose);if(e.append(i),window.matchMedia(`(prefers-reduced-motion: reduce)`).matches)return;let a=0,o,s=()=>{a=(a+1)%V.length,n(i,V[a].pose),r.textContent=V[a].say,o=window.setTimeout(s,V[a].ms)};new IntersectionObserver(([e])=>{window.clearTimeout(o),e.isIntersecting&&(o=window.setTimeout(s,V[a].ms))}).observe(e)}var Se=`(min-width: 900px) and (min-height: 640px)`,Ce=750,we=180,H=4,Te={PageDown:1,ArrowDown:1," ":1,PageUp:-1,ArrowUp:-1};function Ee(){let e=window.matchMedia(Se),t=window.matchMedia(`(prefers-reduced-motion: reduce)`),n=()=>[...document.querySelectorAll(`.scene, .foot`)],r=0,i=0,a=e=>{let t=0,n=1/0;return e.forEach((e,r)=>{let i=Math.abs(e.getBoundingClientRect().top);i<n&&([t,n]=[r,i])}),t},o=e=>{let i=n(),o=i[Math.min(Math.max(a(i)+e,0),i.length-1)];r=performance.now()+Ce,o.scrollIntoView({behavior:t.matches?`auto`:`smooth`,block:o.classList.contains(`foot`)?`end`:`start`})};window.addEventListener(`wheel`,t=>{if(!e.matches||t.ctrlKey)return;t.preventDefault();let n=performance.now(),a=n-i>we;i=n,!(n<r||!a||Math.abs(t.deltaY)<H)&&o(t.deltaY>0?1:-1)},{passive:!1}),window.addEventListener(`keydown`,t=>{let n=Te[t.key];!e.matches||!n||t.target instanceof HTMLInputElement||(t.preventDefault(),!(performance.now()<r)&&o(t.shiftKey&&t.key===` `?-1:n))})}var U=[{say:`내일 오후 3시에 치과 가`,reply:`오, 치과 가시는군요! 내일 3시에 넣어 뒀어요~`,add:[{key:`dentist`,day:1,time:`15:00`,title:`치과`}]},{say:`내일 업무에 DB 백업 추가, 날씨 agent 만들기 추가`,reply:`네, 내일 업무에 두 가지 모두 종일 일정으로 추가했어요!`,add:[{key:`backup`,day:1,time:null,title:`DB 백업`},{key:`agent`,day:1,time:null,title:`날씨 agent 만들기`}]},{say:`치과 4시로 옮겨줘`,reply:`네, 치과를 내일 4시로 옮겨 뒀어요!`,move:{key:`dentist`,time:`16:00`}}],W=55,G=1500,K=2600,De=[`일`,`월`,`화`,`수`,`목`,`금`,`토`],q=e=>new Promise(t=>window.setTimeout(t,e)),Oe=()=>window.matchMedia(`(prefers-reduced-motion: reduce)`).matches;function ke(e){let r=e.querySelector(`[data-week]`),i=e.querySelector(`[data-talk-adsum]`),a=e.querySelector(`[data-talk-reply]`),o=e.querySelector(`[data-talk-said]`),s=e.querySelector(`[data-talk-typed]`),c=e.querySelector(`[data-talk-steps]`);if(!r||!i||!a||!o||!s||!c)throw Error(`말하는 법 장면의 자리가 모자랍니다.`);let l=Ae(r),u=t(`idle`);i.append(u),c.innerHTML=U.map(()=>`<li><span></span></li>`).join(``);let d=[...c.children],f=new Map,p=e=>{let t=document.createElement(`div`);t.className=`chip`,t.innerHTML=`${e.time?`<time>${e.time}</time>`:`<time>종일</time>`}${e.title}`;let n=[...l[e.day].querySelectorAll(`.chip`)].find(e=>e.querySelector(`time`)?.textContent!==`종일`);!e.time&&n?n.before(t):l[e.day].append(t),f.set(e.key,t)},m=()=>{for(let e of f.values())e.remove();f.clear();for(let e of d)e.removeAttribute(`data-active`),e.removeAttribute(`data-done`);a.hidden=!0,o.hidden=!0,s.textContent=``};if(Oe()){for(let e of U)e.add?.forEach(p);let e=f.get(`dentist`)?.querySelector(`time`);e&&(e.textContent=`16:00`);let t=U[U.length-1];o.textContent=t.say,o.hidden=!1,a.textContent=t.reply,a.hidden=!1,d.forEach(e=>e.setAttribute(`data-done`,``));return}let h=!1,g=!1,_=async()=>{if(!g){for(g=!0;h;){m();for(let[e,t]of U.entries()){if(!h)break;d[e].style.setProperty(`--step-ms`,`${t.say.length*W+G+K}ms`),d[e].setAttribute(`data-active`,``),a.hidden=!0,o.hidden=!0,n(u,`listening`);for(let e of t.say)s.textContent+=e,await q(W);s.textContent=``,o.textContent=t.say,o.hidden=!1,n(u,`thinking`),await q(G),n(u,t.add?`welcome`:`poked`),a.textContent=t.reply,a.hidden=!1,t.add?.forEach(p),t.move&&je(f.get(t.move.key),t.move.time),await q(K),n(u,`idle`),d[e].removeAttribute(`data-active`),d[e].setAttribute(`data-done`,``)}await q(K)}g=!1}};new IntersectionObserver(e=>{h=e.some(e=>e.isIntersecting),h&&_()},{threshold:.35}).observe(e)}function Ae(e){let t=new Date;return e.innerHTML=``,[`오늘`,`내일`,`모레`].map((n,r)=>{let i=new Date(t);i.setDate(t.getDate()+r);let a=document.createElement(`div`);return a.className=`week-day`,r===0&&a.setAttribute(`data-today`,``),a.innerHTML=`<div class="week-head"><span>${De[i.getDay()]}</span><span class="week-num">${i.getDate()}</span><span class="week-tag">${n}</span></div>`,e.append(a),a})}function je(e,t){e&&(e.setAttribute(`data-leaving`,``),window.setTimeout(()=>{let n=e.querySelector(`time`);n&&(n.textContent=t),e.removeAttribute(`data-leaving`),e.style.animation=`none`,e.offsetWidth,e.style.animation=``},350))}var J=e=>{let t=document.querySelector(e);if(!t)throw Error(`${e}가 없습니다.`);return t};be(J(`[data-desk]`)),ke(J(`[data-talk]`)),i(J(`[data-day]`)),xe(J(`[data-mood]`)),Ee();var Y=new Map;document.querySelectorAll(`[data-pose]`).forEach(e=>{let n=e.dataset.pose??`idle`,r=t(`idle`),i=e.classList.contains(`chat-figure`)?document.createElement(`div`):e;i!==e&&(i.className=`pose-slot`,e.append(i)),i.append(r),Y.set(e,{adsum:r,pose:n})});var Me=new IntersectionObserver(e=>{for(let t of e){let e=Y.get(t.target);e&&n(e.adsum,t.isIntersecting?e.pose:`idle`)}},{threshold:.4});Y.forEach((e,t)=>Me.observe(t));var X=[...document.querySelectorAll(`[data-scene]`)],Z=[...document.querySelectorAll(`.scene`)],Q=new IntersectionObserver(e=>{for(let t of e)t.isIntersecting&&(t.target.setAttribute(`data-in`,``),Q.unobserve(t.target))},{threshold:.25});Z.forEach(e=>Q.observe(e));var $=J(`[data-dots]`),Ne=X.map(e=>{let t=document.createElement(`a`);return t.href=`#${e.id}`,t.setAttribute(`aria-label`,e.dataset.scene??e.id),$.append(t),t}),Pe=new IntersectionObserver(e=>{for(let t of e){if(!t.isIntersecting)continue;let e=X.indexOf(t.target);Ne.forEach((t,n)=>t.setAttribute(`aria-current`,String(n===e)))}},{rootMargin:`-50% 0px -50% 0px`});X.forEach(e=>Pe.observe(e));var Fe=J(`.nav`),Ie=new IntersectionObserver(e=>{for(let t of e){if(!t.isIntersecting)continue;let e=t.target.dataset.tone??``;Fe.dataset.tone=e,$.dataset.tone=e}},{rootMargin:`0px 0px -92% 0px`});Z.forEach(e=>Ie.observe(e));