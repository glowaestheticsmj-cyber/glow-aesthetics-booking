import { useState } from "react";

const INIT_TREATMENTS = [
  { id:1, name:"Anti-Wrinkle", duration:45, returnWeeks:12, price:"", description:"Smooth fine lines and wrinkles for a refreshed, natural look.", category:"Injectables" },
  { id:2, name:"Filler Treatment", duration:60, returnWeeks:24, price:"", description:"Restore volume and enhance facial contours with dermal fillers.", category:"Injectables" },
  { id:3, name:"Skin Boosters", duration:45, returnWeeks:4, price:"", description:"Deep hydration treatment to improve skin texture and radiance.", category:"Skin Treatments" },
  { id:4, name:"PRP Hair & Skin", duration:60, returnWeeks:4, price:"", description:"Platelet-rich plasma therapy to rejuvenate skin and stimulate hair growth.", category:"Advanced Treatments" },
  { id:5, name:"LHALA Peel", duration:45, returnWeeks:4, price:"", description:"Advanced chemical peel for skin renewal and improved tone.", category:"Skin Treatments" },
  { id:6, name:"Green Peel", duration:60, returnWeeks:4, price:"", description:"Herbal peeling treatment for deep skin regeneration.", category:"Skin Treatments" },
  { id:7, name:"Facial", duration:60, returnWeeks:4, price:"", description:"Customised facial to cleanse, exfoliate and nourish your skin.", category:"Skin Treatments" },
  { id:8, name:"Eyelash Extensions", duration:90, returnWeeks:3, price:"", description:"Beautiful, natural-looking lash extensions tailored to your style.", category:"Beauty" },
];

const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const DAY_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const STATUS_COLORS = { pending:"#b45309", confirmed:"#166534", cancelled:"#991b1b", completed:"#1e40af" };
const STATUS_BG = { pending:"#fef3c7", confirmed:"#dcfce7", cancelled:"#fee2e2", completed:"#dbeafe" };
const STATUS_DOT = { pending:"#f59e0b", confirmed:"#22c55e", cancelled:"#ef4444", completed:"#3b82f6" };
const CATEGORIES = ["Injectables","Skin Treatments","Advanced Treatments","Beauty"];
const CAT_COLORS = { Injectables:"#f5f3ff", "Skin Treatments":"#f0fdf4", "Advanced Treatments":"#eff6ff", Beauty:"#fdf2f8" };
const CAT_TEXT = { Injectables:"#5b21b6", "Skin Treatments":"#166534", "Advanced Treatments":"#1e40af", Beauty:"#9d174d" };

function formatDate(d) { return new Date(d).toLocaleDateString("en-AU",{weekday:"short",day:"numeric",month:"short",year:"numeric"}); }
function formatTime(t) { const [h,m]=t.split(":"); const hh=parseInt(h); return `${hh>12?hh-12:hh}:${m}${hh>=12?"pm":"am"}`; }
function addWeeks(date,weeks) { const d=new Date(date); d.setDate(d.getDate()+weeks*7); return d; }
function genId() { return Math.random().toString(36).slice(2,9); }
function toDateStr(y,m,d) { return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`; }

const INIT_BOOKINGS = [
  { id:genId(), name:"Sarah J.", phone:"0412 345 678", treatment:"Anti-Wrinkle", date:"2026-06-07", time:"17:00", status:"confirmed", notes:"First visit", createdAt:new Date().toISOString() },
  { id:genId(), name:"Emma T.", phone:"0423 456 789", treatment:"Eyelash Extensions", date:"2026-06-08", time:"10:00", status:"pending", notes:"", createdAt:new Date().toISOString() },
  { id:genId(), name:"Lisa M.", phone:"0434 567 890", treatment:"Facial", date:"2026-06-14", time:"14:00", status:"confirmed", notes:"Loves hydrating facials", createdAt:new Date().toISOString() },
  { id:genId(), name:"Amy K.", phone:"0445 678 901", treatment:"Skin Boosters", date:"2026-06-21", time:"11:00", status:"pending", notes:"", createdAt:new Date().toISOString() },
];

export default function App() {
  const [view, setView] = useState("dashboard");
  const [bookings, setBookings] = useState(INIT_BOOKINGS);
  const [blockedDates, setBlockedDates] = useState(["2026-06-15","2026-06-22"]);
  const [scheduleHours, setScheduleHours] = useState({
    0:{start:"09:00",end:"17:00"}, 1:null, 2:{start:"17:00",end:"20:00"},
    3:{start:"17:00",end:"20:00"}, 4:{start:"17:00",end:"20:00"}, 5:null, 6:{start:"09:00",end:"17:00"}
  });
  const [bookingForm, setBookingForm] = useState({name:"",phone:"",email:"",treatment:"",date:"",time:"",notes:""});
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [blockInput, setBlockInput] = useState("");
  const [smsLog, setSmsLog] = useState([
    { id:1, to:"Sarah J.", phone:"0412 345 678", msg:"Hi Sarah! Reminder: your Anti-Wrinkle appointment is tomorrow at 5:00pm with Glow Aesthetics by MJ. See you then! 💆", sent:new Date(Date.now()-86400000).toISOString(), type:"reminder" },
    { id:2, to:"Lisa M.", phone:"0434 567 890", msg:"Hi Lisa! It's been 4 weeks since your last Facial at Glow Aesthetics by MJ. Time to book your next session? 🌟", sent:new Date().toISOString(), type:"return" },
  ]);
  const [activeTab, setActiveTab] = useState("all");
  const [scheduleEdit, setScheduleEdit] = useState(false);
  const [services, setServices] = useState(INIT_TREATMENTS);
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({});
  const [addingService, setAddingService] = useState(false);
  const [newServiceForm, setNewServiceForm] = useState({name:"",category:"Skin Treatments",duration:45,returnWeeks:4,price:"",description:""});

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);

  const today = now.toISOString().split("T")[0];
  const upcoming = bookings.filter(b=>b.date>=today&&b.status!=="cancelled").sort((a,b)=>a.date.localeCompare(b.date));
  const pending = bookings.filter(b=>b.status==="pending");
  const dueReminders = bookings.filter(b=>{
    if(b.status!=="completed") return false;
    const t=services.find(t=>t.name===b.treatment); if(!t) return false;
    const due=addWeeks(new Date(b.date),t.returnWeeks);
    const diff=(due-new Date())/86400000;
    return diff<=7&&diff>=-7;
  });

  function updateStatus(id,status) {
    setBookings(bs=>bs.map(b=>b.id===id?{...b,status}:b));
    if(status==="confirmed") { const b=bookings.find(b=>b.id===id); if(b) sendSms(b,"confirmation"); }
  }
  function sendSms(b,type) {
    const t=services.find(t=>t.name===b.treatment);
    let msg="";
    if(type==="confirmation") msg=`Hi ${b.name.split(" ")[0]}! Your ${b.treatment} appointment is confirmed for ${formatDate(b.date)} at ${formatTime(b.time)} with Glow Aesthetics by MJ. 💆`;
    if(type==="reminder") msg=`Hi ${b.name.split(" ")[0]}! Reminder: your ${b.treatment} is tomorrow at ${formatTime(b.time)} with Glow Aesthetics by MJ. 💆`;
    if(type==="return") msg=`Hi ${b.name.split(" ")[0]}! It's been ${t?.returnWeeks} weeks since your last ${b.treatment} at Glow Aesthetics by MJ. Time to book? 🌟`;
    setSmsLog(l=>[{id:Date.now(),to:b.name,phone:b.phone,msg,sent:new Date().toISOString(),type},...l]);
  }
  function submitBooking() {
    setBookings(bs=>[...bs,{...bookingForm,id:genId(),status:"pending",createdAt:new Date().toISOString()}]);
    setFormSubmitted(true);
    setBookingForm({name:"",phone:"",email:"",treatment:"",date:"",time:"",notes:""});
  }
  function saveService() {
    setServices(ss=>ss.map(s=>s.id===editingService?{...s,...serviceForm}:s));
    setEditingService(null); setServiceForm({});
  }
  function deleteService(id) { setServices(ss=>ss.filter(s=>s.id!==id)); }
  function addService() {
    setServices(ss=>[...ss,{...newServiceForm,id:Date.now()}]);
    setAddingService(false);
    setNewServiceForm({name:"",category:"Skin Treatments",duration:45,returnWeeks:4,price:"",description:""});
  }

  const filteredBookings = activeTab==="all"?bookings:bookings.filter(b=>b.status===activeTab);

  const navItems = [
    {id:"dashboard",icon:"ti-layout-dashboard",label:"Dashboard"},
    {id:"calendar",icon:"ti-calendar",label:"Calendar"},
    {id:"bookings",icon:"ti-list",label:"Bookings"},
    {id:"clients",icon:"ti-users",label:"Clients"},
    {id:"sms",icon:"ti-message",label:"SMS"},
    {id:"schedule",icon:"ti-clock",label:"Schedule"},
    {id:"services",icon:"ti-sparkles",label:"Services"},
    {id:"booking-page",icon:"ti-link",label:"Booking Page"},
  ];

  // Calendar helpers
  function getDaysInMonth(y,m) { return new Date(y,m+1,0).getDate(); }
  function getFirstDayOfMonth(y,m) { return new Date(y,m,1).getDay(); }
  function prevMonth() { if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else{setCalMonth(m=>m-1);} setSelectedDay(null); }
  function nextMonth() { if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else{setCalMonth(m=>m+1);} setSelectedDay(null); }

  const daysInMonth = getDaysInMonth(calYear,calMonth);
  const firstDay = getFirstDayOfMonth(calYear,calMonth);

  function getBookingsForDay(dateStr) { return bookings.filter(b=>b.date===dateStr&&b.status!=="cancelled"); }
  function isBlocked(dateStr) { return blockedDates.includes(dateStr); }
  function isToday(dateStr) { return dateStr===today; }

  const selectedDateStr = selectedDay ? toDateStr(calYear,calMonth,selectedDay) : null;
  const selectedBookings = selectedDateStr ? bookings.filter(b=>b.date===selectedDateStr) : [];

  return (
    <div style={{fontFamily:"system-ui,sans-serif",minHeight:"100vh",background:"#faf9f7"}}>
      {/* Header */}
      <div style={{background:"#fff",borderBottom:"0.5px solid #e5e3de",padding:"0 1rem",display:"flex",alignItems:"center",justifyContent:"space-between",height:56}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#d4a5c9,#a78b9e)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#fff",fontWeight:500}}>G</div>
          <div>
            <p style={{margin:0,fontSize:14,fontWeight:500,lineHeight:1.2}}>Glow Aesthetics by MJ</p>
            <p style={{margin:0,fontSize:11,color:"#888"}}>Admin Dashboard</p>
          </div>
        </div>
        <div style={{display:"flex",gap:4}}>
          {pending.length>0&&<span style={{background:"#fee2e2",color:"#991b1b",fontSize:11,padding:"2px 8px",borderRadius:20,fontWeight:500}}>{pending.length} pending</span>}
          {dueReminders.length>0&&<span style={{background:"#fef3c7",color:"#92400e",fontSize:11,padding:"2px 8px",borderRadius:20,fontWeight:500}}>{dueReminders.length} reminders</span>}
        </div>
      </div>

      {/* Nav */}
      <div style={{display:"flex",overflowX:"auto",background:"#fff",borderBottom:"0.5px solid #e5e3de",padding:"0 1rem"}}>
        {navItems.map(n=>(
          <button key={n.id} onClick={()=>setView(n.id)} style={{background:"none",border:"none",padding:"10px 12px",cursor:"pointer",fontSize:12,color:view===n.id?"#7c5c8a":"#666",borderBottom:view===n.id?"2px solid #7c5c8a":"2px solid transparent",display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap"}}>
            <i className={`ti ${n.icon}`} style={{fontSize:15}} aria-hidden="true"></i>{n.label}
          </button>
        ))}
      </div>

      <div style={{padding:"1rem",maxWidth:860,margin:"0 auto"}}>

        {/* DASHBOARD */}
        {view==="dashboard"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:20}}>
              {[{label:"Upcoming",value:upcoming.length,color:"#7c5c8a"},{label:"Pending approval",value:pending.length,color:"#b45309"},{label:"Total clients",value:[...new Set(bookings.map(b=>b.phone))].length,color:"#166534"},{label:"Return reminders due",value:dueReminders.length,color:"#1e40af"}].map(m=>(
                <div key={m.label} style={{background:"#fff",border:"0.5px solid #e5e3de",borderRadius:12,padding:"1rem"}}>
                  <p style={{margin:"0 0 4px",fontSize:12,color:"#888"}}>{m.label}</p>
                  <p style={{margin:0,fontSize:26,fontWeight:500,color:m.color}}>{m.value}</p>
                </div>
              ))}
            </div>
            {pending.length>0&&(
              <div style={{background:"#fff",border:"0.5px solid #e5e3de",borderRadius:12,padding:"1rem",marginBottom:16}}>
                <p style={{margin:"0 0 12px",fontSize:14,fontWeight:500}}>Pending requests</p>
                {pending.map(b=>(
                  <div key={b.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"0.5px solid #f0ede8"}}>
                    <div><p style={{margin:"0 0 2px",fontSize:14,fontWeight:500}}>{b.name}</p><p style={{margin:0,fontSize:12,color:"#888"}}>{b.treatment} · {formatDate(b.date)} at {formatTime(b.time)}</p></div>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>updateStatus(b.id,"confirmed")} style={{background:"#dcfce7",color:"#166534",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,cursor:"pointer",fontWeight:500}}>Confirm</button>
                      <button onClick={()=>updateStatus(b.id,"cancelled")} style={{background:"#fee2e2",color:"#991b1b",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,cursor:"pointer",fontWeight:500}}>Decline</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{background:"#fff",border:"0.5px solid #e5e3de",borderRadius:12,padding:"1rem"}}>
              <p style={{margin:"0 0 12px",fontSize:14,fontWeight:500}}>Upcoming appointments</p>
              {upcoming.length===0&&<p style={{color:"#aaa",fontSize:13}}>No upcoming appointments.</p>}
              {upcoming.slice(0,5).map(b=>(
                <div key={b.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"0.5px solid #f0ede8"}}>
                  <div><p style={{margin:"0 0 2px",fontSize:14,fontWeight:500}}>{b.name}</p><p style={{margin:0,fontSize:12,color:"#888"}}>{b.treatment} · {formatDate(b.date)} at {formatTime(b.time)}</p></div>
                  <span style={{background:STATUS_BG[b.status],color:STATUS_COLORS[b.status],fontSize:11,padding:"3px 10px",borderRadius:20,fontWeight:500}}>{b.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CALENDAR */}
        {view==="calendar"&&(
          <div>
            <div style={{background:"#fff",border:"0.5px solid #e5e3de",borderRadius:12,padding:"1rem",marginBottom:16}}>
              {/* Month nav */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                <button onClick={prevMonth} style={{background:"none",border:"0.5px solid #e5e3de",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:16,color:"#555"}}>‹</button>
                <p style={{margin:0,fontSize:16,fontWeight:500}}>{MONTH_NAMES[calMonth]} {calYear}</p>
                <button onClick={nextMonth} style={{background:"none",border:"0.5px solid #e5e3de",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:16,color:"#555"}}>›</button>
              </div>

              {/* Legend */}
              <div style={{display:"flex",gap:12,marginBottom:12,flexWrap:"wrap"}}>
                {[{label:"Confirmed",color:STATUS_DOT.confirmed},{label:"Pending",color:STATUS_DOT.pending},{label:"Completed",color:STATUS_DOT.completed},{label:"Blocked",color:"#e5e3de"}].map(l=>(
                  <span key={l.label} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#888"}}>
                    <span style={{width:8,height:8,borderRadius:"50%",background:l.color,display:"inline-block"}}></span>{l.label}
                  </span>
                ))}
              </div>

              {/* Day headers */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
                {DAY_SHORT.map(d=>(
                  <div key={d} style={{textAlign:"center",fontSize:11,color:"#aaa",fontWeight:500,padding:"4px 0"}}>{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
                {Array.from({length:firstDay}).map((_,i)=>(
                  <div key={`e${i}`} style={{minHeight:52}}></div>
                ))}
                {Array.from({length:daysInMonth}).map((_,i)=>{
                  const day=i+1;
                  const dateStr=toDateStr(calYear,calMonth,day);
                  const dayBookings=getBookingsForDay(dateStr);
                  const blocked=isBlocked(dateStr);
                  const todayCell=isToday(dateStr);
                  const selected=selectedDay===day;
                  return (
                    <div key={day} onClick={()=>setSelectedDay(selected?null:day)}
                      style={{minHeight:52,borderRadius:8,padding:"4px",cursor:"pointer",background:selected?"#f3e8ff":blocked?"#fef2f2":todayCell?"#faf5ff":"#fafaf9",border:selected?"1.5px solid #a855f7":todayCell?"1.5px solid #d8b4fe":"0.5px solid #f0ede8",position:"relative",transition:"background 0.1s"}}>
                      <div style={{fontSize:12,fontWeight:todayCell?500:400,color:blocked?"#fca5a5":todayCell?"#7c5c8a":"#444",marginBottom:2}}>{day}</div>
                      {blocked&&<div style={{fontSize:9,color:"#ef4444",fontWeight:500,lineHeight:1.2}}>blocked</div>}
                      <div style={{display:"flex",flexWrap:"wrap",gap:2}}>
                        {dayBookings.slice(0,3).map(b=>(
                          <span key={b.id} style={{width:7,height:7,borderRadius:"50%",background:STATUS_DOT[b.status],display:"inline-block"}}></span>
                        ))}
                        {dayBookings.length>3&&<span style={{fontSize:9,color:"#888"}}>+{dayBookings.length-3}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected day detail */}
            {selectedDay&&(
              <div style={{background:"#fff",border:"0.5px solid #e5e3de",borderRadius:12,padding:"1rem"}}>
                <p style={{margin:"0 0 12px",fontSize:14,fontWeight:500}}>
                  {formatDate(selectedDateStr)}
                  {isBlocked(selectedDateStr)&&<span style={{marginLeft:8,background:"#fee2e2",color:"#991b1b",fontSize:11,padding:"2px 8px",borderRadius:20}}>Blocked — nursing shift</span>}
                </p>
                {selectedBookings.length===0&&!isBlocked(selectedDateStr)&&<p style={{color:"#aaa",fontSize:13}}>No appointments on this day.</p>}
                {isBlocked(selectedDateStr)&&selectedBookings.length===0&&<p style={{color:"#aaa",fontSize:13}}>This date is blocked. No aesthetic appointments.</p>}
                {selectedBookings.map(b=>(
                  <div key={b.id} style={{background:"#faf9f7",borderRadius:10,padding:"10px 12px",marginBottom:8,borderLeft:`3px solid ${STATUS_DOT[b.status]}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div>
                        <p style={{margin:"0 0 2px",fontSize:14,fontWeight:500}}>{b.name}</p>
                        <p style={{margin:"0 0 4px",fontSize:12,color:"#888"}}>{b.treatment} · {formatTime(b.time)}</p>
                        <p style={{margin:0,fontSize:11,color:"#aaa"}}>{b.phone}</p>
                      </div>
                      <span style={{background:STATUS_BG[b.status],color:STATUS_COLORS[b.status],fontSize:11,padding:"3px 10px",borderRadius:20,fontWeight:500}}>{b.status}</span>
                    </div>
                    <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
                      {b.status==="pending"&&<>
                        <button onClick={()=>updateStatus(b.id,"confirmed")} style={{background:"#dcfce7",color:"#166534",border:"none",borderRadius:8,padding:"5px 10px",fontSize:12,cursor:"pointer"}}>Confirm</button>
                        <button onClick={()=>updateStatus(b.id,"cancelled")} style={{background:"#fee2e2",color:"#991b1b",border:"none",borderRadius:8,padding:"5px 10px",fontSize:12,cursor:"pointer"}}>Decline</button>
                      </>}
                      {b.status==="confirmed"&&<>
                        <button onClick={()=>updateStatus(b.id,"completed")} style={{background:"#dbeafe",color:"#1e40af",border:"none",borderRadius:8,padding:"5px 10px",fontSize:12,cursor:"pointer"}}>Mark complete</button>
                        <button onClick={()=>sendSms(b,"reminder")} style={{background:"#f5f3ff",color:"#5b21b6",border:"none",borderRadius:8,padding:"5px 10px",fontSize:12,cursor:"pointer"}}>Send reminder</button>
                      </>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BOOKINGS */}
        {view==="bookings"&&(
          <div>
            <div style={{display:"flex",gap:8,marginBottom:16,overflowX:"auto"}}>
              {["all","pending","confirmed","completed","cancelled"].map(t=>(
                <button key={t} onClick={()=>setActiveTab(t)} style={{background:activeTab===t?"#7c5c8a":"#fff",color:activeTab===t?"#fff":"#666",border:"0.5px solid #e5e3de",borderRadius:20,padding:"6px 14px",fontSize:12,cursor:"pointer",whiteSpace:"nowrap"}}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
              ))}
            </div>
            {filteredBookings.length===0&&<p style={{color:"#aaa",fontSize:13}}>No bookings found.</p>}
            {filteredBookings.sort((a,b)=>b.date.localeCompare(a.date)).map(b=>(
              <div key={b.id} style={{background:"#fff",border:"0.5px solid #e5e3de",borderRadius:12,padding:"1rem",marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div><p style={{margin:"0 0 2px",fontSize:15,fontWeight:500}}>{b.name}</p><p style={{margin:0,fontSize:12,color:"#888"}}>{b.phone}</p></div>
                  <span style={{background:STATUS_BG[b.status],color:STATUS_COLORS[b.status],fontSize:11,padding:"3px 10px",borderRadius:20,fontWeight:500}}>{b.status}</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,fontSize:13,color:"#555",marginBottom:10}}>
                  <span><i className="ti ti-needle" style={{fontSize:14,marginRight:4}} aria-hidden="true"></i>{b.treatment}</span>
                  <span><i className="ti ti-calendar" style={{fontSize:14,marginRight:4}} aria-hidden="true"></i>{formatDate(b.date)}</span>
                  <span><i className="ti ti-clock" style={{fontSize:14,marginRight:4}} aria-hidden="true"></i>{formatTime(b.time)}</span>
                  {b.notes&&<span><i className="ti ti-notes" style={{fontSize:14,marginRight:4}} aria-hidden="true"></i>{b.notes}</span>}
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {b.status==="pending"&&<><button onClick={()=>updateStatus(b.id,"confirmed")} style={{background:"#dcfce7",color:"#166534",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,cursor:"pointer"}}>Confirm</button><button onClick={()=>updateStatus(b.id,"cancelled")} style={{background:"#fee2e2",color:"#991b1b",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,cursor:"pointer"}}>Decline</button></>}
                  {b.status==="confirmed"&&<><button onClick={()=>updateStatus(b.id,"completed")} style={{background:"#dbeafe",color:"#1e40af",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,cursor:"pointer"}}>Mark complete</button><button onClick={()=>sendSms(b,"reminder")} style={{background:"#f5f3ff",color:"#5b21b6",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,cursor:"pointer"}}>Send reminder SMS</button></>}
                  {b.status==="completed"&&<button onClick={()=>sendSms(b,"return")} style={{background:"#fef3c7",color:"#92400e",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,cursor:"pointer"}}>Send return reminder</button>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CLIENTS */}
        {view==="clients"&&(
          <div>
            <p style={{fontSize:13,color:"#888",marginBottom:16}}>All clients — 100% your data, never shared.</p>
            {[...new Map(bookings.map(b=>[b.phone,b])).values()].map(b=>{
              const cb=bookings.filter(bk=>bk.phone===b.phone);
              const last=cb.filter(bk=>bk.status==="completed").sort((a,c)=>c.date.localeCompare(a.date))[0];
              const t=last&&services.find(t=>t.name===last.treatment);
              const nextDue=last&&t&&addWeeks(new Date(last.date),t.returnWeeks);
              return (
                <div key={b.phone} style={{background:"#fff",border:"0.5px solid #e5e3de",borderRadius:12,padding:"1rem",marginBottom:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                    <div style={{width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,#d4a5c9,#a78b9e)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#fff",fontWeight:500}}>{b.name.split(" ").map(n=>n[0]).join("").slice(0,2)}</div>
                    <div><p style={{margin:"0 0 2px",fontSize:15,fontWeight:500}}>{b.name}</p><p style={{margin:0,fontSize:12,color:"#888"}}>{b.phone}</p></div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,fontSize:12,color:"#666"}}>
                    <span>Visits: {cb.filter(bk=>bk.status==="completed").length}</span>
                    <span>Last: {last?last.treatment:"—"}</span>
                    {nextDue&&<span style={{color:nextDue<new Date()?"#991b1b":"#166534"}}>Next due: {formatDate(nextDue.toISOString())}</span>}
                  </div>
                  {last&&<button onClick={()=>sendSms(last,"return")} style={{marginTop:10,background:"#fef3c7",color:"#92400e",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,cursor:"pointer"}}>Send return reminder</button>}
                </div>
              );
            })}
          </div>
        )}

        {/* SMS */}
        {view==="sms"&&(
          <div>
            <div style={{background:"#fff",border:"0.5px solid #e5e3de",borderRadius:12,padding:"1rem",marginBottom:16}}>
              <p style={{margin:"0 0 4px",fontSize:14,fontWeight:500}}>SMS centre</p>
              <p style={{margin:0,fontSize:12,color:"#888"}}>All messages sent via Twilio. Connect your Twilio account to activate live sending.</p>
            </div>
            {smsLog.length===0&&<p style={{color:"#aaa",fontSize:13}}>No messages sent yet.</p>}
            {smsLog.map(s=>(
              <div key={s.id} style={{background:"#fff",border:"0.5px solid #e5e3de",borderRadius:12,padding:"1rem",marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontSize:13,fontWeight:500}}>{s.to} · {s.phone}</span>
                  <span style={{background:s.type==="return"?"#fef3c7":s.type==="confirmation"?"#dcfce7":"#f5f3ff",color:s.type==="return"?"#92400e":s.type==="confirmation"?"#166534":"#5b21b6",fontSize:11,padding:"2px 8px",borderRadius:20}}>{s.type}</span>
                </div>
                <p style={{margin:"0 0 6px",fontSize:13,color:"#555",lineHeight:1.5}}>{s.msg}</p>
                <p style={{margin:0,fontSize:11,color:"#aaa"}}>{new Date(s.sent).toLocaleString("en-AU")}</p>
              </div>
            ))}
          </div>
        )}

        {/* SCHEDULE */}
        {view==="schedule"&&(
          <div>
            <div style={{background:"#fff",border:"0.5px solid #e5e3de",borderRadius:12,padding:"1rem",marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <p style={{margin:0,fontSize:14,fontWeight:500}}>Weekly schedule</p>
                <button onClick={()=>setScheduleEdit(!scheduleEdit)} style={{background:"#f5f3ff",color:"#5b21b6",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,cursor:"pointer"}}>{scheduleEdit?"Save":"Edit hours"}</button>
              </div>
              {DAY_NAMES.map((day,i)=>{
                const h=scheduleHours[i];
                return (
                  <div key={day} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:"0.5px solid #f0ede8"}}>
                    <span style={{fontSize:13,fontWeight:500,width:100}}>{day}</span>
                    {scheduleEdit?(
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <input type="checkbox" checked={!!h} onChange={e=>setScheduleHours(sh=>({...sh,[i]:e.target.checked?{start:"09:00",end:"17:00"}:null}))} />
                        {h&&<><input type="time" value={h.start} onChange={e=>setScheduleHours(sh=>({...sh,[i]:{...sh[i],start:e.target.value}}))} style={{fontSize:12,padding:"4px 6px",border:"0.5px solid #e5e3de",borderRadius:6}} /><span style={{fontSize:12}}>to</span><input type="time" value={h.end} onChange={e=>setScheduleHours(sh=>({...sh,[i]:{...sh[i],end:e.target.value}}))} style={{fontSize:12,padding:"4px 6px",border:"0.5px solid #e5e3de",borderRadius:6}} /></>}
                      </div>
                    ):(
                      <span style={{fontSize:13,color:h?"#166534":"#aaa"}}>{h?`${formatTime(h.start)} – ${formatTime(h.end)}`:"Unavailable"}</span>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{background:"#fff",border:"0.5px solid #e5e3de",borderRadius:12,padding:"1rem"}}>
              <p style={{margin:"0 0 12px",fontSize:14,fontWeight:500}}>Block off dates</p>
              <p style={{margin:"0 0 12px",fontSize:12,color:"#888"}}>Block specific dates when covering a nursing shift or unavailable.</p>
              <div style={{display:"flex",gap:8,marginBottom:12}}>
                <input type="date" value={blockInput} onChange={e=>setBlockInput(e.target.value)} style={{fontSize:13,padding:"6px 10px",border:"0.5px solid #e5e3de",borderRadius:8,flex:1}} />
                <button onClick={()=>{if(blockInput){setBlockedDates(bd=>bd.includes(blockInput)?bd.filter(d=>d!==blockInput):[...bd,blockInput]);setBlockInput("");}}} style={{background:"#7c5c8a",color:"#fff",border:"none",borderRadius:8,padding:"6px 14px",fontSize:13,cursor:"pointer"}}>Block</button>
              </div>
              {blockedDates.length===0&&<p style={{color:"#aaa",fontSize:13}}>No dates blocked.</p>}
              {blockedDates.map(d=>(
                <div key={d} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"0.5px solid #f0ede8"}}>
                  <span style={{fontSize:13}}>{formatDate(d)} — <span style={{color:"#991b1b"}}>blocked</span></span>
                  <button onClick={()=>setBlockedDates(bd=>bd.filter(x=>x!==d))} style={{background:"#fee2e2",color:"#991b1b",border:"none",borderRadius:8,padding:"4px 10px",fontSize:12,cursor:"pointer"}}>Unblock</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SERVICES */}
        {view==="services"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <p style={{margin:0,fontSize:13,color:"#888"}}>{services.length} treatments</p>
              <button onClick={()=>setAddingService(true)} style={{background:"#7c5c8a",color:"#fff",border:"none",borderRadius:8,padding:"8px 14px",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                <i className="ti ti-plus" style={{fontSize:15}} aria-hidden="true"></i>Add treatment
              </button>
            </div>
            {addingService&&(
              <div style={{background:"#fff",border:"2px solid #d8b4fe",borderRadius:12,padding:"1.25rem",marginBottom:16}}>
                <p style={{margin:"0 0 12px",fontSize:14,fontWeight:500}}>New treatment</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                  <div><label style={{fontSize:12,color:"#888",display:"block",marginBottom:4}}>Treatment name</label><input value={newServiceForm.name} onChange={e=>setNewServiceForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Hydra Facial" style={{width:"100%",fontSize:13,padding:"7px 10px",border:"0.5px solid #e5e3de",borderRadius:8,boxSizing:"border-box"}} /></div>
                  <div><label style={{fontSize:12,color:"#888",display:"block",marginBottom:4}}>Category</label><select value={newServiceForm.category} onChange={e=>setNewServiceForm(f=>({...f,category:e.target.value}))} style={{width:"100%",fontSize:13,padding:"7px 10px",border:"0.5px solid #e5e3de",borderRadius:8,background:"#fff",boxSizing:"border-box"}}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div>
                  <div><label style={{fontSize:12,color:"#888",display:"block",marginBottom:4}}>Duration (mins)</label><input type="number" value={newServiceForm.duration} onChange={e=>setNewServiceForm(f=>({...f,duration:parseInt(e.target.value)}))} style={{width:"100%",fontSize:13,padding:"7px 10px",border:"0.5px solid #e5e3de",borderRadius:8,boxSizing:"border-box"}} /></div>
                  <div><label style={{fontSize:12,color:"#888",display:"block",marginBottom:4}}>Return reminder (weeks)</label><input type="number" value={newServiceForm.returnWeeks} onChange={e=>setNewServiceForm(f=>({...f,returnWeeks:parseInt(e.target.value)}))} style={{width:"100%",fontSize:13,padding:"7px 10px",border:"0.5px solid #e5e3de",borderRadius:8,boxSizing:"border-box"}} /></div>
                  <div><label style={{fontSize:12,color:"#888",display:"block",marginBottom:4}}>Price (optional)</label><input value={newServiceForm.price} onChange={e=>setNewServiceForm(f=>({...f,price:e.target.value}))} placeholder="e.g. From $250" style={{width:"100%",fontSize:13,padding:"7px 10px",border:"0.5px solid #e5e3de",borderRadius:8,boxSizing:"border-box"}} /></div>
                </div>
                <div style={{marginBottom:10}}><label style={{fontSize:12,color:"#888",display:"block",marginBottom:4}}>Description</label><textarea value={newServiceForm.description} onChange={e=>setNewServiceForm(f=>({...f,description:e.target.value}))} rows={2} style={{width:"100%",fontSize:13,padding:"7px 10px",border:"0.5px solid #e5e3de",borderRadius:8,boxSizing:"border-box",resize:"vertical"}} /></div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={addService} disabled={!newServiceForm.name} style={{background:newServiceForm.name?"#7c5c8a":"#ccc",color:"#fff",border:"none",borderRadius:8,padding:"7px 16px",fontSize:13,cursor:"pointer"}}>Add treatment</button>
                  <button onClick={()=>setAddingService(false)} style={{background:"#f0ede8",color:"#666",border:"none",borderRadius:8,padding:"7px 16px",fontSize:13,cursor:"pointer"}}>Cancel</button>
                </div>
              </div>
            )}
            {CATEGORIES.map(cat=>{
              const cs=services.filter(s=>s.category===cat);
              if(cs.length===0) return null;
              return (
                <div key={cat} style={{marginBottom:20}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                    <span style={{background:CAT_COLORS[cat],color:CAT_TEXT[cat],fontSize:12,padding:"3px 12px",borderRadius:20,fontWeight:500}}>{cat}</span>
                    <span style={{fontSize:12,color:"#aaa"}}>{cs.length} treatment{cs.length!==1?"s":""}</span>
                  </div>
                  {cs.map(s=>(
                    <div key={s.id} style={{background:"#fff",border:"0.5px solid #e5e3de",borderRadius:12,padding:"1rem",marginBottom:10}}>
                      {editingService===s.id?(
                        <div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                            <div><label style={{fontSize:12,color:"#888",display:"block",marginBottom:4}}>Name</label><input value={serviceForm.name??s.name} onChange={e=>setServiceForm(f=>({...f,name:e.target.value}))} style={{width:"100%",fontSize:13,padding:"7px 10px",border:"0.5px solid #e5e3de",borderRadius:8,boxSizing:"border-box"}} /></div>
                            <div><label style={{fontSize:12,color:"#888",display:"block",marginBottom:4}}>Category</label><select value={serviceForm.category??s.category} onChange={e=>setServiceForm(f=>({...f,category:e.target.value}))} style={{width:"100%",fontSize:13,padding:"7px 10px",border:"0.5px solid #e5e3de",borderRadius:8,background:"#fff",boxSizing:"border-box"}}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div>
                            <div><label style={{fontSize:12,color:"#888",display:"block",marginBottom:4}}>Duration (mins)</label><input type="number" value={serviceForm.duration??s.duration} onChange={e=>setServiceForm(f=>({...f,duration:parseInt(e.target.value)}))} style={{width:"100%",fontSize:13,padding:"7px 10px",border:"0.5px solid #e5e3de",borderRadius:8,boxSizing:"border-box"}} /></div>
                            <div><label style={{fontSize:12,color:"#888",display:"block",marginBottom:4}}>Return reminder (weeks)</label><input type="number" value={serviceForm.returnWeeks??s.returnWeeks} onChange={e=>setServiceForm(f=>({...f,returnWeeks:parseInt(e.target.value)}))} style={{width:"100%",fontSize:13,padding:"7px 10px",border:"0.5px solid #e5e3de",borderRadius:8,boxSizing:"border-box"}} /></div>
                            <div><label style={{fontSize:12,color:"#888",display:"block",marginBottom:4}}>Price</label><input value={serviceForm.price??s.price} onChange={e=>setServiceForm(f=>({...f,price:e.target.value}))} placeholder="e.g. From $250" style={{width:"100%",fontSize:13,padding:"7px 10px",border:"0.5px solid #e5e3de",borderRadius:8,boxSizing:"border-box"}} /></div>
                          </div>
                          <div style={{marginBottom:10}}><label style={{fontSize:12,color:"#888",display:"block",marginBottom:4}}>Description</label><textarea value={serviceForm.description??s.description} onChange={e=>setServiceForm(f=>({...f,description:e.target.value}))} rows={2} style={{width:"100%",fontSize:13,padding:"7px 10px",border:"0.5px solid #e5e3de",borderRadius:8,boxSizing:"border-box",resize:"vertical"}} /></div>
                          <div style={{display:"flex",gap:8}}>
                            <button onClick={saveService} style={{background:"#7c5c8a",color:"#fff",border:"none",borderRadius:8,padding:"7px 16px",fontSize:13,cursor:"pointer"}}>Save</button>
                            <button onClick={()=>{setEditingService(null);setServiceForm({});}} style={{background:"#f0ede8",color:"#666",border:"none",borderRadius:8,padding:"7px 16px",fontSize:13,cursor:"pointer"}}>Cancel</button>
                          </div>
                        </div>
                      ):(
                        <div>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                            <div>
                              <p style={{margin:"0 0 2px",fontSize:15,fontWeight:500}}>{s.name}</p>
                              {s.price&&<p style={{margin:"0 0 4px",fontSize:13,color:"#7c5c8a",fontWeight:500}}>{s.price}</p>}
                              <p style={{margin:0,fontSize:13,color:"#666",lineHeight:1.5}}>{s.description}</p>
                            </div>
                            <div style={{display:"flex",gap:6,flexShrink:0,marginLeft:12}}>
                              <button onClick={()=>{setEditingService(s.id);setServiceForm({});}} style={{background:"#f5f3ff",color:"#5b21b6",border:"none",borderRadius:8,padding:"5px 10px",fontSize:12,cursor:"pointer"}}><i className="ti ti-edit" style={{fontSize:14}} aria-hidden="true"></i></button>
                              <button onClick={()=>deleteService(s.id)} style={{background:"#fee2e2",color:"#991b1b",border:"none",borderRadius:8,padding:"5px 10px",fontSize:12,cursor:"pointer"}}><i className="ti ti-trash" style={{fontSize:14}} aria-hidden="true"></i></button>
                            </div>
                          </div>
                          <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
                            <span style={{background:"#f5f3ff",color:"#5b21b6",fontSize:11,padding:"3px 10px",borderRadius:20}}><i className="ti ti-clock" style={{fontSize:12,marginRight:3}} aria-hidden="true"></i>{s.duration} mins</span>
                            <span style={{background:"#fef3c7",color:"#92400e",fontSize:11,padding:"3px 10px",borderRadius:20}}><i className="ti ti-refresh" style={{fontSize:12,marginRight:3}} aria-hidden="true"></i>Return in {s.returnWeeks>=24?`${Math.round(s.returnWeeks/4)} months`:`${s.returnWeeks} weeks`}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* BOOKING PAGE */}
        {view==="booking-page"&&(
          <div>
            <div style={{background:"#fff",border:"0.5px solid #e5e3de",borderRadius:12,padding:"1rem",marginBottom:16}}>
              <p style={{margin:"0 0 4px",fontSize:14,fontWeight:500}}>Your Instagram booking link</p>
              <p style={{margin:"0 0 12px",fontSize:12,color:"#888"}}>Share this link in your Instagram bio so clients can request appointments.</p>
              <div style={{display:"flex",gap:8}}>
                <div style={{flex:1,background:"#f5f3ff",border:"0.5px solid #d8b4fe",borderRadius:8,padding:"8px 12px",fontSize:13,color:"#5b21b6"}}>glowaestheticsbymj.app/book</div>
                <button style={{background:"#7c5c8a",color:"#fff",border:"none",borderRadius:8,padding:"8px 14px",fontSize:13,cursor:"pointer"}}>Copy</button>
              </div>
            </div>
            <div style={{background:"#fff",border:"2px solid #e9d5f5",borderRadius:12,overflow:"hidden"}}>
              <div style={{background:"linear-gradient(135deg,#d4a5c9,#a78b9e)",padding:"1.5rem",textAlign:"center"}}>
                <p style={{margin:"0 0 4px",fontSize:20,fontWeight:500,color:"#fff"}}>Glow Aesthetics by MJ</p>
                <p style={{margin:0,fontSize:13,color:"rgba(255,255,255,0.85)"}}>Book your appointment</p>
              </div>
              {formSubmitted?(
                <div style={{padding:"2rem",textAlign:"center"}}>
                  <div style={{fontSize:40,marginBottom:12}}>✨</div>
                  <p style={{fontSize:16,fontWeight:500,margin:"0 0 8px"}}>Request received!</p>
                  <p style={{fontSize:13,color:"#888",margin:"0 0 16px"}}>MJ will confirm your appointment shortly via SMS.</p>
                  <button onClick={()=>setFormSubmitted(false)} style={{background:"#7c5c8a",color:"#fff",border:"none",borderRadius:8,padding:"8px 20px",fontSize:13,cursor:"pointer"}}>Book another</button>
                </div>
              ):(
                <div style={{padding:"1.5rem"}}>
                  <div style={{display:"flex",flexDirection:"column",gap:12}}>
                    {[{key:"name",label:"Full name",type:"text",placeholder:"Your name"},{key:"phone",label:"Mobile number",type:"tel",placeholder:"04XX XXX XXX"},{key:"email",label:"Email (optional)",type:"email",placeholder:"your@email.com"}].map(f=>(
                      <div key={f.key}><label style={{fontSize:12,color:"#888",display:"block",marginBottom:4}}>{f.label}</label><input type={f.type} placeholder={f.placeholder} value={bookingForm[f.key]} onChange={e=>setBookingForm(bf=>({...bf,[f.key]:e.target.value}))} style={{width:"100%",fontSize:14,padding:"8px 12px",border:"0.5px solid #e5e3de",borderRadius:8,boxSizing:"border-box"}} /></div>
                    ))}
                    <div><label style={{fontSize:12,color:"#888",display:"block",marginBottom:4}}>Treatment</label>
                      <select value={bookingForm.treatment} onChange={e=>setBookingForm(bf=>({...bf,treatment:e.target.value}))} style={{width:"100%",fontSize:14,padding:"8px 12px",border:"0.5px solid #e5e3de",borderRadius:8,boxSizing:"border-box",background:"#fff"}}>
                        <option value="">Select a treatment</option>
                        {CATEGORIES.map(cat=>{const cs=services.filter(s=>s.category===cat);if(cs.length===0)return null;return <optgroup key={cat} label={cat}>{cs.map(s=><option key={s.id} value={s.name}>{s.name}{s.price?` — ${s.price}`:""}</option>)}</optgroup>;})}
                      </select>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                      <div><label style={{fontSize:12,color:"#888",display:"block",marginBottom:4}}>Preferred date</label><input type="date" value={bookingForm.date} min={today} onChange={e=>setBookingForm(bf=>({...bf,date:e.target.value}))} style={{width:"100%",fontSize:14,padding:"8px 12px",border:"0.5px solid #e5e3de",borderRadius:8,boxSizing:"border-box"}} /></div>
                      <div><label style={{fontSize:12,color:"#888",display:"block",marginBottom:4}}>Preferred time</label><input type="time" value={bookingForm.time} onChange={e=>setBookingForm(bf=>({...bf,time:e.target.value}))} style={{width:"100%",fontSize:14,padding:"8px 12px",border:"0.5px solid #e5e3de",borderRadius:8,boxSizing:"border-box"}} /></div>
                    </div>
                    <div><label style={{fontSize:12,color:"#888",display:"block",marginBottom:4}}>Notes (optional)</label><textarea placeholder="Any questions or special requests..." value={bookingForm.notes} onChange={e=>setBookingForm(bf=>({...bf,notes:e.target.value}))} rows={3} style={{width:"100%",fontSize:14,padding:"8px 12px",border:"0.5px solid #e5e3de",borderRadius:8,boxSizing:"border-box",resize:"vertical"}} /></div>
                    <button onClick={submitBooking} disabled={!bookingForm.name||!bookingForm.phone||!bookingForm.treatment||!bookingForm.date} style={{background:bookingForm.name&&bookingForm.phone&&bookingForm.treatment&&bookingForm.date?"#7c5c8a":"#ccc",color:"#fff",border:"none",borderRadius:8,padding:"12px",fontSize:14,cursor:"pointer",fontWeight:500}}>Request appointment</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
