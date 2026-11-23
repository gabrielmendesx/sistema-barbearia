const UK='bh_users',BK='bh_bookings',ADMIN='000-000',ADMINPASS='AUG123';

let current=null;

const $=id=>document.getElementById(id),
users=()=>JSON.parse(localStorage.getItem(UK)||'[]'),
bookings=()=>JSON.parse(localStorage.getItem(BK)||'[]'),
saveBookings=x=>localStorage.setItem(BK,JSON.stringify(x));

function show(which){
['access','client','admin'].forEach(id=>$(id).classList.toggle('hidden',id!==which));
$('headerText').textContent=which==='admin'?'Painel administrativo':which==='client'?'Área do cliente':'Agende seu horário com facilidade';
}

function msg(id,text,error=false){
$(id).textContent=text;
$(id).style.color=error?'#ff8585':'#e5bd73';
}

function esc(s){
return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// CADASTRO

$('register').addEventListener('submit',e=>{
e.preventDefault();

let name=$('regName').value.trim(),
email=$('regEmail').value.trim().toLowerCase(),
password=$('regPass').value,
u=users();

if(email===ADMIN||u.some(x=>(x.phone||x.email)===email)){
msg('regMsg','Este telefone já está cadastrado.',true);
return;
}

u.push({name,phone:email,password});

localStorage.setItem(UK,JSON.stringify(u));

e.target.reset();

msg('regMsg','Cadastro realizado! Agora você pode entrar.');
});

// LOGIN

$('login').addEventListener('submit',e=>{
e.preventDefault();

let email=$('emailLogin').value.trim().toLowerCase(),
password=$('passLogin').value;

if(email===ADMIN&&password===ADMINPASS){
current={role:'admin'};
e.target.reset();
show('admin');
renderAdmin();
return;
}

let u=users().find(x=>(x.phone||x.email)===email&&x.password===password);

if(!u){
msg('loginMsg','Telefone/usuário ou senha incorretos.',true);
return;
}

current={role:'client',name:u.name,phone:u.phone||u.email};

e.target.reset();

$('clientName').textContent=u.name;

show('client');
renderMine();
updateTimes();
});

// SAIR

function logout(){
current=null;
show('access');
}

$('clientOut').onclick=logout;
$('adminOut').onclick=logout;

// DATA ATUAL

function today(){
let d=new Date();
return new Date(d-d.getTimezoneOffset()*60000).toISOString().slice(0,10);
}

$('date').min=today();

// DURAÇÃO DOS SERVIÇOS

function serviceDuration(service){
return service==='Cabelo + Barba'?60:30;
}

function toMinutes(time){
let [h,m]=time.split(':').map(Number);
return h*60+m;
}

function overlaps(startA,endA,startB,endB){
return startA<endB&&startB<endA;
}

// HORÁRIOS DISPONÍVEIS

function updateTimes(){

let d=$('date').value,
s=$('time'),
service=$('service').value;

s.innerHTML='<option value="">Escolha um horário</option>';

if(!d)return;

let day=new Date(d+'T12:00:00').getDay();

if(day===0){
s.innerHTML='<option value="">Fechado aos domingos</option>';
return;
}

let closing=day===6?15*60:17*60;
let duration=service?serviceDuration(service):30;

let existing=bookings().filter(x=>x.date===d);

for(let start=9*60;start+duration<=closing;start+=30){

let end=start+duration;

let t=String(Math.floor(start/60)).padStart(2,'0')+':'+String(start%60).padStart(2,'0');

let conflict=existing.some(x=>{
let oldStart=toMinutes(x.time),
oldDuration=serviceDuration(x.service);

return overlaps(start,end,oldStart,oldStart+oldDuration);
});

if(!conflict&&(d!==today()||t>new Date().toTimeString().slice(0,5))){

let o=document.createElement('option');
o.value=t;
o.textContent=t;
s.appendChild(o);

}

}

if(s.options.length===1){
s.innerHTML='<option value="">Sem horários disponíveis</option>';
}

}

$('date').addEventListener('change',updateTimes);
$('service').addEventListener('change',updateTimes);

// AGENDAMENTO

$('booking').addEventListener('submit',e=>{

e.preventDefault();

let date=$('date').value,
time=$('time').value,
service=$('service').value;

if(!date||!time||!service){
msg('bookMsg','Preencha todos os campos.',true);
return;
}

if(date<today()){
msg('bookMsg','Escolha uma data atual ou futura.',true);
return;
}

let all=bookings(),
start=toMinutes(time),
end=start+serviceDuration(service);

if(all.some(x=>{

if(x.date!==date)return false;

let oldStart=toMinutes(x.time),
oldEnd=oldStart+serviceDuration(x.service);

return overlaps(start,end,oldStart,oldEnd);

})){

msg('bookMsg','Esse horário conflita com outro agendamento. Escolha outro.',true);
updateTimes();
return;

}

all.push({
id:Date.now(),
name:current.name,
phone:current.phone,
service,
date,
time
});

saveBookings(all);

e.target.reset();

updateTimes();
renderMine();

msg('bookMsg','Agendamento confirmado!');

});

// AGENDAMENTOS DO CLIENTE

function renderMine(){

let box=$('myList'),
mine=bookings().filter(x=>(x.phone||x.email)===current.phone).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));

box.innerHTML='';
box.className=mine.length?'':'empty';

if(!mine.length){
box.textContent='Você ainda não possui agendamentos.';
return;
}

mine.forEach(x=>{

let row=document.createElement('div');
row.className='item';

let info=document.createElement('div');

info.innerHTML='<strong>'+esc(x.service)+'</strong><small>'+x.date.split('-').reverse().join('/')+' às '+esc(x.time)+'</small>';

let b=document.createElement('button');

b.className='dark';
b.textContent='Cancelar';

b.onclick=()=>{
saveBookings(bookings().filter(y=>y.id!==x.id));
renderMine();
updateTimes();
};

row.append(info,b);
box.append(row);

});

}

// PAINEL DO ADMINISTRADOR

function renderAdmin(){

let u=users(),
all=bookings().sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));

$('clientsCount').textContent=u.length;
$('bookCount').textContent=all.length;
$('todayCount').textContent=all.filter(x=>x.date===today()).length;

let cl=$('clientList');

cl.innerHTML='';
cl.className=u.length?'':'empty';

if(!u.length){
cl.textContent='Nenhum cliente cadastrado.';
}

u.forEach(x=>{

let r=document.createElement('div');
r.className='item';

r.innerHTML='<div><strong>'+esc(x.name)+'</strong><small>'+esc(x.phone||x.email)+'</small></div>';

cl.append(r);

});

let list=$('allList');

list.innerHTML='';
list.className=all.length?'':'empty';

if(!all.length){
list.textContent='Nenhum agendamento ainda.';
}

all.forEach(x=>{

let r=document.createElement('div');
r.className='item';

let info=document.createElement('div');

info.innerHTML='<strong>'+esc(x.name)+' — '+esc(x.service)+'</strong><small>'+x.date.split('-').reverse().join('/')+' às '+esc(x.time)+' | '+esc(x.phone||x.email)+'</small>';

let b=document.createElement('button');

b.className='red';
b.textContent='Cancelar';

b.onclick=()=>{
saveBookings(bookings().filter(y=>y.id!==x.id));
renderAdmin();
};

r.append(info,b);
list.append(r);

});

}

show('access');
