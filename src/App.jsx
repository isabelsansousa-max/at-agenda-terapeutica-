import React, { useState, useMemo, useEffect } from "react";
import {
  Home, CalendarDays, PencilLine, LineChart as LineChartIcon, MoreHorizontal,
  Plus, X, Target, Clock, Smile, Frown, Angry, CloudRain, Sparkles,
  Brain, Zap, ChevronLeft, ChevronRight, BookOpen, Settings, Flame, Award,
  Pill, Lightbulb, ArrowLeft, FileText, LogOut,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie,
} from "recharts";
import { supabase } from "./lib/supabaseClient";

// ---------- Design tokens (paleta definida no briefing) ----------
const C = {
  blue: "#AFD8E8",
  green: "#BEE3C4",
  lilac: "#D8CBEF",
  peach: "#F6D3C0",
  yellow: "#F7EDB0",
  white: "#FFFFFF",
  greyBg: "#F4F5F7",
  text: "#3A3D46",
  textSoft: "#767B87",
  accent: "#8B9DC7", // azul-lilás — ação primária
  accentDark: "#7387B8",
};

const card = {
  background: C.white,
  borderRadius: 20,
  boxShadow: "0 2px 14px rgba(58,61,70,0.06)",
};

const priorityStyles = {
  alta: { label: "alta", color: C.peach },
  media: { label: "média", color: C.yellow },
  baixa: { label: "baixa", color: C.greyBg },
};

const feelings = [
  { key: "alegria", label: "Alegria", icon: Smile, color: C.yellow },
  { key: "raiva", label: "Raiva", icon: Angry, color: C.peach },
  { key: "tristeza", label: "Tristeza", icon: Frown, color: C.blue },
  { key: "medo", label: "Medo", icon: CloudRain, color: C.lilac },
  { key: "outro", label: "Outro", icon: Sparkles, color: C.green },
];

const quickLogTypes = [
  { key: "humor", label: "Humor" },
  { key: "ansiedade", label: "Ansiedade" },
  { key: "foco", label: "Foco" },
  { key: "procrastinacao", label: "Procrastinação" },
  { key: "sono", label: "Sono" },
  { key: "cafeina", label: "Cafeína" },
];

const evidenceTips = [
  { title: "Regra dos 2 minutos", tema: "Procrastinação", texto: "Se uma tarefa leva menos de 2 minutos, faça-a imediatamente em vez de adiar." },
  { title: "Body doubling", tema: "Foco", texto: "Trabalhar perto de outra pessoa (presencial ou por vídeo) ajuda a manter o foco em tarefas chatas." },
  { title: "Implementation intentions", tema: "Planejamento", texto: "Definir 'quando X acontecer, farei Y' aumenta a chance de concluir a tarefa (Gollwitzer, 1999)." },
  { title: "Pausa de 10 segundos", tema: "Impulsividade", texto: "Contar até 10 antes de responder ou agir reduz decisões impulsivas em momentos de tensão." },
  { title: "Ambiente sem estímulos", tema: "Distração", texto: "Reduzir notificações e itens visuais na mesa de trabalho diminui a troca involuntária de foco." },
];

const libraryCards = [
  { title: "Regra dos 2 minutos", tema: "Procrastinação" },
  { title: "Divida em micro-tarefas", tema: "Organização" },
  { title: "Externalize a memória", tema: "Memória" },
  { title: "Pausa antes de responder", tema: "Impulsividade" },
];

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (authLoading) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.textSoft }}>Carregando...</div>;
  }
  if (!session) {
    return <AuthScreen />;
  }
  return <MainApp userId={session.user.id} userEmail={session.user.email} onSignOut={() => supabase.auth.signOut()} />;
}

// ---------- Tela de login/cadastro ----------
function AuthScreen() {
  const [mode, setMode] = useState("login"); // 'login' | 'cadastro'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setMessage(null);
    setLoading(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMessage(error.message);
      else setMessage("Conta criada! Verifique seu e-mail para confirmar (ou entre direto, se a confirmação estiver desativada).");
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: C.greyBg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ ...card, padding: 24, width: "100%", maxWidth: 380 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>AT Agenda Terapêutica</h1>
        <p style={{ fontSize: 13, color: C.textSoft, marginBottom: 20 }}>
          {mode === "login" ? "Entre na sua conta" : "Crie sua conta"}
        </p>

        <Field label="E-mail">
          <input style={input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@email.com" autoCapitalize="none" />
        </Field>
        <Field label="Senha">
          <input style={input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="mínimo 6 caracteres" />
        </Field>

        {message && <div style={{ fontSize: 12, color: C.accentDark, marginBottom: 12 }}>{message}</div>}

        <button style={btnPrimary} disabled={loading || !email || !password} onClick={handleSubmit}>
          {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Cadastrar"}
        </button>

        <button
          onClick={() => { setMode(mode === "login" ? "cadastro" : "login"); setMessage(null); }}
          style={{ width: "100%", background: "none", border: "none", cursor: "pointer", color: C.accentDark, fontSize: 13, marginTop: 14 }}
        >
          {mode === "login" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
        </button>
      </div>
    </div>
  );
}

// ---------- App principal (usuário autenticado) ----------
function MainApp({ userId, userEmail, onSignOut }) {
  const [tab, setTab] = useState("inicio");
  const [agendaSub, setAgendaSub] = useState("calendario");
  const [calView, setCalView] = useState("mes");
  const [goals, setGoals] = useState([]);
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [personalTips, setPersonalTips] = useState([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showQuickLog, setShowQuickLog] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [diaryStep, setDiaryStep] = useState(null); // 'sentimento' | 'desatencao' | 'impulsividade' | null
  const [logFilter, setLogFilter] = useState("todos");
  const [goalStack, setGoalStack] = useState([]); // pilha de ids para navegar entre os níveis (anual → mensal → semanal → diário)
  const [editingLog, setEditingLog] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [settingsPanel, setSettingsPanel] = useState(null); // 'notificacoes' | 'privacidade' | 'conta' | null

  const today = new Date();

  // Busca todos os dados do usuário no Supabase assim que ele entra no app.
  useEffect(() => {
    let cancelled = false;
    async function loadAll() {
      const [g, t, a, q, s, m, p] = await Promise.all([
        supabase.from("goals").select("*").order("deadline"),
        supabase.from("tasks").select("*").order("created_at", { ascending: false }),
        supabase.from("appointments").select("*").order("date"),
        supabase.from("quick_logs").select("*"),
        supabase.from("symptom_emotion_logs").select("*"),
        supabase.from("medication_logs").select("*"),
        supabase.from("personal_tips").select("*").order("created_at", { ascending: false }),
      ]);
      if (cancelled) return;

      const palette = [C.blue, C.green, C.peach, C.lilac, C.yellow];
      setGoals((g.data || []).map((row, i) => ({ ...row, color: palette[i % palette.length] })));
      setTasks(t.data || []);
      setEvents(a.data || []);
      setPersonalTips(p.data || []);

      const quick = (q.data || []).map(r => ({ ...r, timestamp: new Date(r.timestamp) }));
      const symptom = (s.data || []).map(r => ({ ...r, timestamp: new Date(r.timestamp) }));
      const medication = (m.data || []).map(r => ({ ...r, category: "medicacao", timestamp: new Date(r.timestamp) }));
      setLogs([...quick, ...symptom, ...medication].sort((x, y) => y.timestamp - x.timestamp));
    }
    loadAll();
    return () => { cancelled = true; };
  }, [userId]);

  // Helpers genéricos de leitura/escrita no Supabase
  async function insertRow(table, row) {
    const { data, error } = await supabase.from(table).insert({ ...row, user_id: userId }).select().single();
    if (error) { alert("Erro ao salvar: " + error.message); return null; }
    return data;
  }
  async function updateRow(table, id, patch) {
    const { error } = await supabase.from(table).update(patch).eq("id", id);
    if (error) alert("Erro ao atualizar: " + error.message);
  }

  return (
    <div style={{ background: C.greyBg, minHeight: "100vh", fontFamily: "'Segoe UI', Roboto, -apple-system, sans-serif", color: C.text }}>
      <div style={{ maxWidth: 480, margin: "0 auto", paddingBottom: (showReport || settingsPanel) ? 0 : 88, position: "relative" }}>
        {showReport ? (
          <ReportView logs={logs} onBack={() => setShowReport(false)} />
        ) : settingsPanel ? (
          <SettingsPanel
            panel={settingsPanel}
            userId={userId}
            userEmail={userEmail}
            onBack={() => setSettingsPanel(null)}
            onSignOut={onSignOut}
            onDataWiped={() => { setGoals([]); setEvents([]); setTasks([]); setLogs([]); setPersonalTips([]); }}
          />
        ) : (
          <>
            {tab === "inicio" && (
              <Dashboard
                tasks={tasks} events={events} today={today}
                onNewTask={() => setShowTaskModal(true)}
                onToggleTask={(t) => { setTasks(tasks.map(x => x.id === t.id ? { ...x, done: !x.done } : x)); updateRow("tasks", t.id, { done: !t.done }); }}
                onEditTask={(t) => setEditingTask(t)}
              />
            )}
            {tab === "agenda" && (
              <Agenda
                sub={agendaSub} setSub={setAgendaSub}
                calView={calView} setCalView={setCalView}
                goals={goals} events={events} tasks={tasks} today={today}
                onNewGoal={() => setShowGoalModal(true)}
                onNewEvent={() => setShowEventModal(true)}
                onOpenGoal={(id) => setGoalStack([id])}
                onToggleEvent={(e) => { setEvents(events.map(x => x.id === e.id ? { ...x, done: !x.done } : x)); updateRow("appointments", e.id, { done: !e.done }); }}
                onToggleTask={(t) => { setTasks(tasks.map(x => x.id === t.id ? { ...x, done: !x.done } : x)); updateRow("tasks", t.id, { done: !t.done }); }}
                onEditTask={(t) => setEditingTask(t)}
              />
            )}
            {tab === "registro" && (
              <Registro
                onQuickLog={(t) => setShowQuickLog(t)}
                onDiary={(step) => setDiaryStep(step)}
                onMedication={() => setShowMedicationModal(true)}
                onEditLog={(log) => setEditingLog(log)}
                logs={logs} logFilter={logFilter} setLogFilter={setLogFilter}
              />
            )}
            {tab === "progresso" && <Progresso logs={logs} />}
            {tab === "solucoes" && (
              <Solucoes personalTips={personalTips} onNewTip={() => setShowTipModal(true)} />
            )}
            {tab === "mais" && <Mais onGenerateReport={() => setShowReport(true)} onSignOut={onSignOut} onOpenSettings={(p) => setSettingsPanel(p)} />}

            <TabBar tab={tab} setTab={setTab} />
          </>
        )}

        {showGoalModal && (
          <GoalModal
            onClose={() => setShowGoalModal(false)}
            onSave={async (g) => {
              const row = await insertRow("goals", { title: g.title, deadline: g.deadline, nivel: "anual", parent_goal_id: null });
              if (row) setGoals([...goals, { ...row, color: C.lilac }]);
              setShowGoalModal(false);
            }}
          />
        )}
        {showQuickLog && (
          <QuickLogModal type={showQuickLog} onClose={() => setShowQuickLog(null)}
            onSave={async (val) => {
              const row = await insertRow("quick_logs", { type: showQuickLog, value: val });
              if (row) setLogs([{ ...row, timestamp: new Date(row.timestamp) }, ...logs]);
              setShowQuickLog(null);
            }}
          />
        )}
        {diaryStep && (
          <DiaryModal
            step={diaryStep}
            onClose={() => setDiaryStep(null)}
            onSave={async (entry) => {
              const row = await insertRow("symptom_emotion_logs", entry);
              if (row) setLogs([{ ...row, timestamp: new Date(row.timestamp) }, ...logs]);
              setDiaryStep(null);
            }}
          />
        )}
        {showEventModal && (
          <EventModal
            onClose={() => setShowEventModal(false)}
            onSave={async (ev) => {
              const row = await insertRow("appointments", ev);
              if (row) setEvents([...events, row]);
              setShowEventModal(false);
            }}
          />
        )}
        {showTaskModal && (
          <TaskModal
            onClose={() => setShowTaskModal(false)}
            onSave={async (t) => {
              const row = await insertRow("tasks", { ...t, date: t.date || null, time: t.time || null });
              if (row) setTasks([...tasks, row]);
              setShowTaskModal(false);
            }}
          />
        )}
        {editingTask && (
          <TaskEditModal
            initial={editingTask}
            onClose={() => setEditingTask(null)}
            onSave={async (patch) => {
              await updateRow("tasks", editingTask.id, patch);
              setTasks(tasks.map(x => x.id === editingTask.id ? { ...x, ...patch } : x));
              setEditingTask(null);
            }}
            onDelete={async () => {
              await supabase.from("tasks").delete().eq("id", editingTask.id);
              setTasks(tasks.filter(x => x.id !== editingTask.id));
              setEditingTask(null);
            }}
          />
        )}
        {showMedicationModal && (
          <MedicationModal
            onClose={() => setShowMedicationModal(false)}
            onSave={async (entry) => {
              const row = await insertRow("medication_logs", entry);
              if (row) setLogs([{ ...row, category: "medicacao", timestamp: new Date(row.timestamp) }, ...logs]);
              setShowMedicationModal(false);
            }}
          />
        )}
        {showTipModal && (
          <TipModal
            onClose={() => setShowTipModal(false)}
            onSave={async (tip) => {
              const row = await insertRow("personal_tips", tip);
              if (row) setPersonalTips([row, ...personalTips]);
              setShowTipModal(false);
            }}
          />
        )}
        {goalStack.length > 0 && (() => {
          const currentId = goalStack[goalStack.length - 1];
          const goal = goals.find(g => g.id === currentId);
          if (!goal) return null;
          return (
            <GoalLevelModal
              goal={goal}
              allGoals={goals}
              canGoBack={goalStack.length > 1}
              onBack={() => setGoalStack(goalStack.slice(0, -1))}
              onClose={() => setGoalStack([])}
              onDrill={(childId) => setGoalStack([...goalStack, childId])}
              onUpdateDeadline={async (deadline) => {
                setGoals(goals.map(g => g.id === goal.id ? { ...g, deadline } : g));
                await updateRow("goals", goal.id, { deadline });
              }}
              onAddChild={async ({ title, deadline, nivel }) => {
                const row = await insertRow("goals", { title, deadline, nivel, parent_goal_id: goal.id });
                if (row) setGoals([...goals, { ...row, color: C.lilac }]);
              }}
              onToggleDiario={async (child) => {
                const newDone = !child.done;
                setGoals(goals.map(g => g.id === child.id ? { ...g, done: newDone } : g));
                await updateRow("goals", child.id, { done: newDone });
              }}
              onDeleteGoal={async () => {
                await supabase.from("goals").delete().eq("id", goal.id);
                const idsToRemove = new Set();
                const collect = (id) => {
                  idsToRemove.add(id);
                  goals.filter(g => g.parent_goal_id === id).forEach(c => collect(c.id));
                };
                collect(goal.id);
                setGoals(goals.filter(g => !idsToRemove.has(g.id)));
                setGoalStack(goalStack.slice(0, -1));
              }}
            />          );
        })()}
        {editingLog && !editingLog.category && (
          <QuickLogModal
            type={editingLog.type}
            initial={editingLog}
            onClose={() => setEditingLog(null)}
            onSave={async (val) => {
              await updateRow("quick_logs", editingLog.id, { value: val });
              setLogs(logs.map(l => l.id === editingLog.id ? { ...l, value: val } : l));
              setEditingLog(null);
            }}
          />
        )}
        {editingLog && ["sentimento", "desatencao", "impulsividade"].includes(editingLog.category) && (
          <DiaryModal
            step={editingLog.category}
            initial={editingLog}
            onClose={() => setEditingLog(null)}
            onSave={async (entry) => {
              await updateRow("symptom_emotion_logs", editingLog.id, entry);
              setLogs(logs.map(l => l.id === editingLog.id ? { ...l, ...entry } : l));
              setEditingLog(null);
            }}
          />
        )}
        {editingLog && editingLog.category === "medicacao" && (
          <MedicationModal
            initial={editingLog}
            onClose={() => setEditingLog(null)}
            onSave={async (entry) => {
              await updateRow("medication_logs", editingLog.id, entry);
              setLogs(logs.map(l => l.id === editingLog.id ? { ...l, ...entry } : l));
              setEditingLog(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

// ---------- Tab bar ----------
function TabBar({ tab, setTab }) {
  const items = [
    { key: "inicio", label: "Início", icon: Home },
    { key: "agenda", label: "Agenda", icon: CalendarDays },
    { key: "registro", label: "Registro", icon: PencilLine },
    { key: "progresso", label: "Progresso", icon: LineChartIcon },
    { key: "solucoes", label: "Soluções", icon: Lightbulb },
    { key: "mais", label: "Mais", icon: MoreHorizontal },
  ];
  return (
    <div style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 480, background: C.white, borderTop: "1px solid #ECEDF0",
      display: "flex", justifyContent: "space-around", padding: "10px 4px 14px", zIndex: 20,
    }}>
      {items.map(({ key, label, icon: Icon }) => {
        const active = tab === key;
        return (
          <button key={key} onClick={() => setTab(key)}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: active ? C.accentDark : C.textSoft }}>
            <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
            <span style={{ fontSize: 11, fontWeight: active ? 600 : 400 }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ---------- Dashboard ----------
function Dashboard({ tasks, events, today, onNewTask, onToggleTask, onEditTask }) {
  const [phrase, setPhrase] = useState("");
  const [phraseSaved, setPhraseSaved] = useState(false);
  const [selectedSlice, setSelectedSlice] = useState(null);
  const next = events
    .map(e => ({ ...e, dt: new Date(`${e.date}T${e.time}`) }))
    .filter(e => e.dt > today)
    .sort((a, b) => a.dt - b.dt)[0];

  const hoursLeft = next ? Math.max(0, Math.round((next.dt - today) / 36e5)) : null;

  // Monta o "relógio" do dia: uma fatia por tarefa de hoje com duração definida.
  const todayKey = today.toISOString().slice(0, 10);
  // Só mostramos aqui as tarefas de hoje (ou sem data definida) — as de outros dias aparecem no Calendário.
  const priorityTasks = tasks.filter(t => !t.date || t.date === todayKey);
  const todaysTasks = tasks.filter(t => t.date === todayKey && t.duration_minutes);
  const scheduledMinutes = todaysTasks.reduce((sum, t) => sum + t.duration_minutes, 0);
  const freeMinutes = Math.max(0, 1440 - scheduledMinutes);
  const palette = [C.blue, C.green, C.peach, C.lilac, C.yellow];
  const pieData = [
    ...todaysTasks.map((t, i) => ({
      id: t.id, name: t.title, value: t.duration_minutes,
      color: t.done ? "#D7DAE0" : palette[i % palette.length],
    })),
    { id: "livre", name: "Livre", value: freeMinutes, color: "#F2F3F5" },
  ];

  function formatDuration(mins) {
    const h = Math.floor(mins / 60), m = mins % 60;
    if (h && m) return `${h}h${m}min`;
    if (h) return `${h}h`;
    return `${m}min`;
  }

  return (
    <div style={{ padding: "24px 20px 12px" }}>
      <p style={{ color: C.textSoft, fontSize: 14, marginBottom: 2 }}>{today.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</p>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 16px" }}>Como vai ser o seu dia?</h1>

      <div style={{ ...card, padding: 16, marginBottom: 18, background: C.yellow }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <Sparkles size={16} />
          <span style={{ fontSize: 13, fontWeight: 700 }}>Frase positiva do dia</span>
        </div>
        {phraseSaved ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 15, fontStyle: "italic" }}>"{phrase}"</span>
            <button onClick={() => setPhraseSaved(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.accentDark, fontWeight: 700, whiteSpace: "nowrap" }}>editar</button>
          </div>
        ) : (
          <div>
            <input
              value={phrase}
              onChange={e => setPhrase(e.target.value)}
              placeholder="Escreva algo que te motive hoje..."
              style={{ ...input, background: C.white, marginBottom: 8 }}
              maxLength={120}
            />
            <button
              disabled={!phrase.trim()}
              onClick={() => setPhraseSaved(true)}
              style={{ ...btnPrimary, opacity: phrase.trim() ? 1 : 0.5, padding: "8px 0", fontSize: 13 }}
            >
              Salvar frase
            </button>
          </div>
        )}
      </div>

      {next && (
        <div style={{ ...card, padding: 16, marginBottom: 18, display: "flex", alignItems: "center", gap: 12, background: C.accent, color: C.white, boxShadow: "none" }}>
          <Clock size={22} />
          <div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>Próximo compromisso em {hoursLeft}h</div>
            <div style={{ fontWeight: 700 }}>{next.title}</div>
          </div>
        </div>
      )}

      <div style={{ ...card, padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Relógio do dia</div>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={95}
              startAngle={90}
              endAngle={-270}
              onClick={(_, index) => setSelectedSlice(pieData[index])}
            >
              {pieData.map((d, i) => (
                <Cell key={d.id} fill={d.color} stroke={C.white} strokeWidth={2} style={{ cursor: "pointer" }} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {selectedSlice ? (
          <div style={{ textAlign: "center", fontSize: 14 }}>
            <strong>{selectedSlice.name}</strong> — {formatDuration(selectedSlice.value)}
          </div>
        ) : (
          <div style={{ textAlign: "center", fontSize: 12, color: C.textSoft }}>Toque numa fatia para ver os detalhes</div>
        )}
        {todaysTasks.length === 0 && (
          <div style={{ fontSize: 12, color: C.textSoft, textAlign: "center", marginTop: 8 }}>
            Defina a duração das tarefas de hoje (botão "+" abaixo) para preencher o relógio.
          </div>
        )}
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        Prioridades de hoje
        <IconButton onClick={onNewTask} title="Nova tarefa" />
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {priorityTasks.length === 0 && <div style={{ fontSize: 13, color: C.textSoft }}>Nenhuma tarefa para hoje ainda.</div>}
        {priorityTasks.map(t => {
          const p = priorityStyles[t.priority] || priorityStyles.baixa;
          return (
            <div key={t.id} style={{ ...card, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
              <input type="checkbox" checked={t.done} onChange={() => onToggleTask(t)} style={{ cursor: "pointer" }} />
              <div style={{ flex: 1, cursor: "pointer" }} onClick={() => onEditTask(t)}>
                <div style={{ textDecoration: t.done ? "line-through" : "none", color: t.done ? C.textSoft : C.text, fontSize: 14 }}>{t.title}</div>
                {(t.date || t.time || t.duration_minutes) && (
                  <div style={{ fontSize: 11, color: C.textSoft, marginTop: 2 }}>
                    {t.date && new Date(t.date + "T00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                    {t.date && t.time && " · "}
                    {t.time}
                    {t.duration_minutes && ` · ${Math.floor(t.duration_minutes / 60) ? Math.floor(t.duration_minutes / 60) + "h" : ""}${t.duration_minutes % 60 ? (t.duration_minutes % 60) + "min" : ""}`}
                  </div>
                )}
              </div>
              <span onClick={() => onEditTask(t)} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: p.color, color: C.text, whiteSpace: "nowrap", cursor: "pointer" }}>{p.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Agenda (Calendário + Metas) ----------
function Agenda({ sub, setSub, calView, setCalView, goals, events, tasks, today, onNewGoal, onNewEvent, onOpenGoal, onToggleEvent, onToggleTask, onEditTask }) {
  const items = [
    ...events.map(e => ({ ...e, kind: "event" })),
    ...tasks.filter(t => t.date).map(t => ({ ...t, kind: "task" })),
  ];
  const handleToggleItem = (item) => (item.kind === "event" ? onToggleEvent(item) : onToggleTask(item));
  const handleEditItem = (item) => { if (item.kind === "task") onEditTask(item); };

  return (
    <div style={{ padding: "24px 20px 12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Agenda</h1>
        <IconButton onClick={sub === "calendario" ? onNewEvent : onNewGoal} title={sub === "calendario" ? "Novo compromisso/tarefa" : "Nova meta anual"} />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {[{ k: "calendario", l: "Calendário", i: CalendarDays }, { k: "metas", l: "Metas e prazos", i: Target }].map(({ k, l, i: Icon }) => (
          <button key={k} onClick={() => setSub(k)}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 14, border: "none", cursor: "pointer",
              background: sub === k ? C.accent : C.white, color: sub === k ? C.white : C.text,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 600, fontSize: 13,
            }}>
            <Icon size={16} /> {l}
          </button>
        ))}
      </div>

      {sub === "calendario" ? (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {["dia", "semana", "mes"].map(v => (
              <button key={v} onClick={() => setCalView(v)}
                style={{
                  padding: "6px 14px", borderRadius: 999, border: "none", cursor: "pointer", fontSize: 13,
                  background: calView === v ? C.lilac : C.white, fontWeight: calView === v ? 700 : 400,
                }}>
                {v === "dia" ? "Dia" : v === "semana" ? "Semana" : "Mês"}
              </button>
            ))}
          </div>
          {calView === "mes" && <MonthView events={items} today={today} />}
          {calView === "semana" && <WeekView events={items} today={today} onToggleEvent={handleToggleItem} onEditEvent={handleEditItem} />}
          {calView === "dia" && <DayView events={items} today={today} onToggleEvent={handleToggleItem} onEditEvent={handleEditItem} />}
        </>
      ) : (
        <GoalsView goals={goals} onNewGoal={onNewGoal} onOpenGoal={onOpenGoal} />
      )}
    </div>
  );
}

function IconButton({ onClick, title }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 36, height: 36, borderRadius: 12, border: "none", cursor: "pointer",
      background: C.accentDark, color: C.white, display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Plus size={18} />
    </button>
  );
}

function MonthView({ events, today }) {
  const y = today.getFullYear(), m = today.getMonth();
  const total = daysInMonth(y, m);
  const firstWeekday = new Date(y, m, 1).getDay();
  const cells = [...Array(firstWeekday).fill(null), ...Array(total).keys()].map(d => d === null ? null : d + 1);
  const eventDays = new Set(events.map(e => new Date(e.date + "T00:00").getDate()));

  return (
    <div style={{ ...card, padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <ChevronLeft size={18} color={C.textSoft} />
        <strong style={{ fontSize: 14 }}>{today.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</strong>
        <ChevronRight size={18} color={C.textSoft} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, fontSize: 11, color: C.textSoft, marginBottom: 6, textAlign: "center" }}>
        {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => <div key={i}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
        {cells.map((d, i) => (
          <div key={i} style={{
            aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            borderRadius: 10, fontSize: 12,
            background: d === today.getDate() ? C.accent : "transparent",
            color: d === today.getDate() ? C.white : C.text,
          }}>
            {d || ""}
            {d && eventDays.has(d) && <div style={{ width: 4, height: 4, borderRadius: 4, background: d === today.getDate() ? C.white : C.accent, marginTop: 2 }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function WeekView({ events, today, onToggleEvent, onEditEvent }) {
  const start = new Date(today); start.setDate(today.getDate() - today.getDay());
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {days.map((d, i) => {
        const dayEvents = events.filter(e => new Date(e.date + "T00:00").toDateString() === d.toDateString());
        const isToday = d.toDateString() === today.toDateString();
        return (
          <div key={i} style={{ ...card, padding: 12, display: "flex", gap: 12, alignItems: "flex-start", border: isToday ? `2px solid ${C.accent}` : "none" }}>
            <div style={{ minWidth: 42, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: C.textSoft }}>{["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][d.getDay()]}</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{d.getDate()}</div>
            </div>
            <div style={{ flex: 1 }}>
              {dayEvents.length === 0 ? <span style={{ fontSize: 12, color: C.textSoft }}>Sem compromissos</span> :
                dayEvents.map(e => (
                  <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 4 }}>
                    <input type="checkbox" checked={!!e.done} onChange={() => onToggleEvent(e)} style={{ cursor: "pointer" }} />
                    <span
                      onClick={() => onEditEvent(e)}
                      style={{ textDecoration: e.done ? "line-through" : "none", color: e.done ? C.textSoft : C.text, cursor: e.kind === "task" ? "pointer" : "default" }}
                    >
                      {e.time ? `🕒 ${e.time} — ` : ""}{e.title}{e.kind === "task" ? " · tarefa" : ""}
                    </span>
                    {e.priority && <PriorityBadge priority={e.priority} />}
                  </div>
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayView({ events, today, onToggleEvent, onEditEvent }) {
  const dayEvents = events.filter(e => new Date(e.date + "T00:00").toDateString() === today.toDateString());
  return (
    <div style={{ ...card, padding: 16 }}>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>Hoje, {today.toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}</div>
      {dayEvents.length === 0 && <div style={{ color: C.textSoft, fontSize: 13 }}>Nenhum compromisso hoje.</div>}
      {dayEvents.map(e => (
        <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: "1px solid #EEE" }}>
          <input type="checkbox" checked={!!e.done} onChange={() => onToggleEvent(e)} style={{ cursor: "pointer" }} />
          <div style={{ fontSize: 13, color: C.accentDark, fontWeight: 700, minWidth: 46 }}>{e.time}</div>
          <div
            onClick={() => onEditEvent(e)}
            style={{ fontSize: 14, flex: 1, textDecoration: e.done ? "line-through" : "none", color: e.done ? C.textSoft : C.text, cursor: e.kind === "task" ? "pointer" : "default" }}
          >
            {e.title}{e.kind === "task" ? <span style={{ fontSize: 11, color: C.textSoft }}> · tarefa</span> : ""}
          </div>
          {e.priority && <PriorityBadge priority={e.priority} />}
        </div>
      ))}
    </div>
  );
}

function PriorityBadge({ priority }) {
  const p = priorityStyles[priority] || priorityStyles.baixa;
  return <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: p.color, whiteSpace: "nowrap" }}>{p.label}</span>;
}

function GoalProgressBar({ progress, microGoals }) {
  return (
    <div style={{ position: "relative", height: 16 }}>
      <div style={{ position: "absolute", top: 4, left: 0, right: 0, background: C.greyBg, borderRadius: 999, height: 8, overflow: "hidden" }}>
        <div style={{ width: `${progress}%`, background: C.accentDark, height: "100%" }} />
      </div>
      {microGoals.map((mg, i) => {
        const left = microGoals.length === 1 ? 50 : (i / (microGoals.length - 1)) * 100;
        return (
          <div key={mg.id} title={mg.title} style={{
            position: "absolute", top: 0, left: `${left}%`, transform: "translateX(-50%)",
            width: 16, height: 16, borderRadius: "50%",
            background: mg.done ? C.accentDark : C.white,
            border: `2px solid ${C.accentDark}`, boxSizing: "border-box",
          }} />
        );
      })}
    </div>
  );
}

// ---------- Hierarquia de metas: anual → mensal → semanal → diária ----------
const GOAL_LEVELS = ["anual", "mensal", "semanal", "diario"];
const GOAL_LEVEL_LABELS = { anual: "Meta anual", mensal: "Meta mensal", semanal: "Meta semanal", diario: "Ação diária" };
const GOAL_CHILD_LABEL = { anual: "meta mensal", mensal: "meta semanal", semanal: "ação diária" };
const GOAL_CHILD_LABEL_PLURAL = { anual: "Metas mensais", mensal: "Metas semanais", semanal: "Ações diárias" };
function nextGoalLevel(level) { return GOAL_LEVELS[GOAL_LEVELS.indexOf(level) + 1]; }

// Considera "concluída" qualquer meta sem filhos (uma ação diária, ou uma meta antiga sem sub-níveis),
// usando o próprio campo "done" dela — isso deixa o cálculo funcionar em qualquer profundidade da árvore.
function countGoalLeaves(goalId, allGoals) {
  const direct = allGoals.filter(g => g.parent_goal_id === goalId);
  if (direct.length === 0) return { done: 0, total: 0 };
  return direct.reduce((acc, child) => {
    const grandchildren = allGoals.filter(g => g.parent_goal_id === child.id);
    if (grandchildren.length === 0) {
      return { done: acc.done + (child.done ? 1 : 0), total: acc.total + 1 };
    }
    const r = countGoalLeaves(child.id, allGoals);
    return { done: acc.done + r.done, total: acc.total + r.total };
  }, { done: 0, total: 0 });
}
function goalProgress(goalId, allGoals) {
  const { done, total } = countGoalLeaves(goalId, allGoals);
  return total ? Math.round((done / total) * 100) : 0;
}

function GoalsView({ goals, onNewGoal, onOpenGoal }) {
  const topGoals = goals.filter(g => !g.parent_goal_id);
  return (
    <div>
      <button style={btnPrimary} onClick={onNewGoal}><Plus size={16} /> Nova meta anual</button>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
        {topGoals.map(g => {
          const children = goals.filter(c => c.parent_goal_id === g.id);
          const dotSource = children.map(c => ({ ...c, done: goals.some(x => x.parent_goal_id === c.id) ? goalProgress(c.id, goals) === 100 : !!c.done }));
          const progress = goalProgress(g.id, goals);
          const days = Math.ceil((new Date(g.deadline + "T00:00") - new Date()) / 864e5);
          return (
            <div key={g.id} onClick={() => onOpenGoal(g.id)} style={{ ...card, padding: 16, cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <strong style={{ fontSize: 14 }}>{g.title}</strong>
                <span style={{ fontSize: 12, color: C.textSoft }}>{days > 0 ? `${days}d restantes` : "Prazo vencido"}</span>
              </div>
              <GoalProgressBar progress={progress} microGoals={dotSource} />
              <div style={{ fontSize: 12, color: C.textSoft, marginTop: 8 }}>
                {progress}% concluído{children.length ? ` · ${children.length} meta${children.length > 1 ? "s" : ""} mensa${children.length > 1 ? "is" : "l"}` : ""}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GoalLevelModal({ goal, allGoals, canGoBack, onBack, onClose, onDrill, onUpdateDeadline, onAddChild, onToggleDiario, onDeleteGoal }) {
  const [deadline, setDeadline] = useState(goal.deadline);
  const [newTitle, setNewTitle] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const childLevel = nextGoalLevel(goal.nivel) || "diario";
  const children = allGoals.filter(g => g.parent_goal_id === goal.id);
  const progress = goalProgress(goal.id, allGoals);
  const dotSource = children.map(c => ({ ...c, done: childLevel === "diario" ? !!c.done : goalProgress(c.id, allGoals) === 100 }));

  return (
    <Modal onClose={onClose} title={goal.title}>
      {canGoBack && (
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: C.accentDark, fontSize: 13, marginBottom: 10, padding: 0 }}>
          <ArrowLeft size={14} /> Voltar
        </button>
      )}
      <div style={{ fontSize: 11, color: C.textSoft, textTransform: "uppercase", fontWeight: 700, marginBottom: 10 }}>{GOAL_LEVEL_LABELS[goal.nivel] || "Meta"}</div>

      <Field label="Prazo">
        <input type="date" style={input} value={deadline} onChange={e => { setDeadline(e.target.value); onUpdateDeadline(e.target.value); }} />
      </Field>

      <GoalProgressBar progress={progress} microGoals={dotSource} />
      <div style={{ fontSize: 12, color: C.textSoft, margin: "10px 0 20px" }}>{progress}% concluído</div>

      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{GOAL_CHILD_LABEL_PLURAL[goal.nivel] || "Itens"}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
        {children.length === 0 && <div style={{ fontSize: 12, color: C.textSoft }}>Nenhuma ainda — adicione abaixo.</div>}
        {children.map(child => (
          childLevel === "diario" ? (
            <label key={child.id} style={{ ...card, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input type="checkbox" checked={!!child.done} onChange={() => onToggleDiario(child)} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, textDecoration: child.done ? "line-through" : "none", color: child.done ? C.textSoft : C.text }}>{child.title}</div>
                <div style={{ fontSize: 11, color: C.textSoft }}>{new Date(child.deadline + "T00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</div>
              </div>
            </label>
          ) : (
            <div key={child.id} onClick={() => onDrill(child.id)} style={{ ...card, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{child.title}</div>
                <div style={{ fontSize: 11, color: C.textSoft }}>
                  {new Date(child.deadline + "T00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} · {goalProgress(child.id, allGoals)}%
                </div>
              </div>
              <ChevronRight size={16} color={C.textSoft} />
            </div>
          )
        ))}
      </div>

      <Field label={`Nova ${GOAL_CHILD_LABEL[goal.nivel] || "meta"}`}><input style={input} value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Título" /></Field>
      <Field label="Prazo"><input type="date" style={input} value={newDeadline} onChange={e => setNewDeadline(e.target.value)} /></Field>
      <button
        style={{ ...btnPrimary, marginBottom: 16 }}
        disabled={!newTitle || !newDeadline}
        onClick={() => { onAddChild({ title: newTitle, deadline: newDeadline, nivel: childLevel }); setNewTitle(""); setNewDeadline(""); }}
      >
        <Plus size={16} /> Adicionar {GOAL_CHILD_LABEL[goal.nivel] || "meta"}
      </button>

      {confirmingDelete ? (
        <div style={{ ...card, padding: 14, background: "#FBEAE8" }}>
          <div style={{ fontSize: 13, marginBottom: 10 }}>Excluir "{goal.title}" e tudo o que está dentro dela?</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setConfirmingDelete(false)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer", background: C.white, fontSize: 13, fontWeight: 600 }}>Cancelar</button>
            <button onClick={onDeleteGoal} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer", background: "#B3413B", color: C.white, fontSize: 13, fontWeight: 600 }}>Excluir</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setConfirmingDelete(true)} style={{ ...btnPrimary, background: C.white, color: "#B3413B", border: "1px solid #E2C4C1" }}>
          Excluir {GOAL_LEVEL_LABELS[goal.nivel]?.toLowerCase() || "meta"}
        </button>
      )}
    </Modal>
  );
}

function GoalModal({ onClose, onSave }) {
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  return (
    <Modal onClose={onClose} title="Nova meta">
      <Field label="Título da meta"><input style={input} value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Melhorar o sono" /></Field>
      <Field label="Prazo"><input type="date" style={input} value={deadline} onChange={e => setDeadline(e.target.value)} /></Field>
      <button style={btnPrimary} onClick={() => title && deadline && onSave({ title, deadline })}>Salvar meta</button>
    </Modal>
  );
}

function TaskModal({ onClose, onSave }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("media");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [durH, setDurH] = useState(0);
  const [durM, setDurM] = useState(0);
  return (
    <Modal onClose={onClose} title="Nova tarefa">
      <Field label="Título da tarefa"><input style={input} value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Revisar relatório" /></Field>
      <Field label="Prioridade">
        <div style={{ display: "flex", gap: 8 }}>
          {["alta", "media", "baixa"].map(p => (
            <button key={p} onClick={() => setPriority(p)} style={{
              flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: priority === p ? priorityStyles[p].color : C.greyBg,
            }}>{priorityStyles[p].label}</button>
          ))}
        </div>
      </Field>
      <Field label="Data (opcional)"><input type="date" style={input} value={date} onChange={e => setDate(e.target.value)} /></Field>
      <Field label="Horário (opcional)"><input type="time" style={input} value={time} onChange={e => setTime(e.target.value)} /></Field>
      <Field label="Duração prevista (opcional — preenche o relógio do dia)">
        <div style={{ display: "flex", gap: 8 }}>
          <select value={durH} onChange={e => setDurH(Number(e.target.value))} style={{ ...input, flex: 1 }}>
            {Array.from({ length: 13 }, (_, h) => <option key={h} value={h}>{h}h</option>)}
          </select>
          <select value={durM} onChange={e => setDurM(Number(e.target.value))} style={{ ...input, flex: 1 }}>
            {[0, 15, 30, 45].map(m => <option key={m} value={m}>{m}min</option>)}
          </select>
        </div>
      </Field>
      <button
        style={btnPrimary}
        disabled={!title}
        onClick={() => title && onSave({ title, priority, date, time, duration_minutes: (durH * 60 + durM) || null })}
      >
        Salvar tarefa
      </button>
    </Modal>
  );
}

function TaskEditModal({ initial, onClose, onSave, onDelete }) {
  const [title, setTitle] = useState(initial.title);
  const [priority, setPriority] = useState(initial.priority || "media");
  const [date, setDate] = useState(initial.date || "");
  const [time, setTime] = useState(initial.time || "");
  const [durH, setDurH] = useState(initial.duration_minutes ? Math.floor(initial.duration_minutes / 60) : 0);
  const [durM, setDurM] = useState(initial.duration_minutes ? initial.duration_minutes % 60 : 0);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <Modal onClose={onClose} title="Editar tarefa">
      <Field label="Título da tarefa"><input style={input} value={title} onChange={e => setTitle(e.target.value)} /></Field>
      <Field label="Prioridade">
        <div style={{ display: "flex", gap: 8 }}>
          {["alta", "media", "baixa"].map(p => (
            <button key={p} onClick={() => setPriority(p)} style={{
              flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: priority === p ? priorityStyles[p].color : C.greyBg,
            }}>{priorityStyles[p].label}</button>
          ))}
        </div>
      </Field>
      <Field label="Data (opcional)"><input type="date" style={input} value={date} onChange={e => setDate(e.target.value)} /></Field>
      <Field label="Horário (opcional)"><input type="time" style={input} value={time} onChange={e => setTime(e.target.value)} /></Field>
      <Field label="Duração prevista (opcional)">
        <div style={{ display: "flex", gap: 8 }}>
          <select value={durH} onChange={e => setDurH(Number(e.target.value))} style={{ ...input, flex: 1 }}>
            {Array.from({ length: 13 }, (_, h) => <option key={h} value={h}>{h}h</option>)}
          </select>
          <select value={durM} onChange={e => setDurM(Number(e.target.value))} style={{ ...input, flex: 1 }}>
            {[0, 15, 30, 45].map(m => <option key={m} value={m}>{m}min</option>)}
          </select>
        </div>
      </Field>

      <button
        style={{ ...btnPrimary, marginBottom: 10 }}
        disabled={!title}
        onClick={() => title && onSave({
          title, priority, date: date || null, time: time || null,
          duration_minutes: (durH * 60 + durM) || null,
        })}
      >
        Salvar alterações
      </button>

      {confirmingDelete ? (
        <div style={{ ...card, padding: 14, background: "#FBEAE8" }}>
          <div style={{ fontSize: 13, marginBottom: 10 }}>Excluir esta tarefa permanentemente?</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setConfirmingDelete(false)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer", background: C.white, fontSize: 13, fontWeight: 600 }}>Cancelar</button>
            <button onClick={onDelete} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer", background: "#B3413B", color: C.white, fontSize: 13, fontWeight: 600 }}>Excluir</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setConfirmingDelete(true)}
          style={{ ...btnPrimary, background: C.white, color: "#B3413B", border: "1px solid #E2C4C1" }}
        >
          Excluir tarefa
        </button>
      )}
    </Modal>
  );
}

function EventModal({ onClose, onSave }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("");
  const [priority, setPriority] = useState("media");
  return (
    <Modal onClose={onClose} title="Novo compromisso ou tarefa">
      <Field label="Título"><input style={input} value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Consulta médica" /></Field>
      <Field label="Prioridade">
        <div style={{ display: "flex", gap: 8 }}>
          {["alta", "media", "baixa"].map(p => (
            <button key={p} onClick={() => setPriority(p)} style={{
              flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: priority === p ? priorityStyles[p].color : C.greyBg,
            }}>{priorityStyles[p].label}</button>
          ))}
        </div>
      </Field>
      <Field label="Data"><input type="date" style={input} value={date} onChange={e => setDate(e.target.value)} /></Field>
      <Field label="Horário"><input type="time" style={input} value={time} onChange={e => setTime(e.target.value)} /></Field>
      <button style={btnPrimary} disabled={!title || !time} onClick={() => title && time && onSave({ title, date, time, priority })}>Salvar</button>
    </Modal>
  );
}

// ---------- Registro ----------
function Registro({ onQuickLog, onDiary, onMedication, onEditLog, logs, logFilter, setLogFilter }) {
  const filtered = logFilter === "todos" ? logs : logs.filter(l => l.type === logFilter || l.category === logFilter);
  return (
    <div style={{ padding: "24px 20px 12px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Registro</h1>

      <h2 style={sectionTitle}>Registro rápido</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 10 }}>
        {quickLogTypes.map(q => (
          <button key={q.key} onClick={() => onQuickLog(q.key)} style={{ ...card, padding: "14px 6px", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            {q.label}
          </button>
        ))}
      </div>
      <button onClick={onMedication} style={{ ...card, width: "100%", border: "none", cursor: "pointer", padding: "14px 6px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, fontWeight: 700, background: C.green, marginBottom: 22 }}>
        <Pill size={16} /> Medicação
      </button>

      <h2 style={sectionTitle}>Diário de sintomas e emoções</h2>
      <p style={{ fontSize: 12, color: C.textSoft, marginTop: -6, marginBottom: 10 }}>Registre o que sentiu, o que gerou e como agiu — útil para revisar sozinho ou levar à terapia.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
        <button onClick={() => onDiary("sentimento")} style={{ ...btnPrimary, background: C.accent }}>
          <Sparkles size={16} /> Registrar um sentimento
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onDiary("desatencao")} style={{ ...card, flex: 1, border: "none", cursor: "pointer", padding: "12px 8px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13, fontWeight: 600, background: C.blue }}>
            <Brain size={16} /> Desatenção
          </button>
          <button onClick={() => onDiary("impulsividade")} style={{ ...card, flex: 1, border: "none", cursor: "pointer", padding: "12px 8px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13, fontWeight: 600, background: C.peach }}>
            <Zap size={16} /> Impulsividade
          </button>
        </div>
      </div>

      <h2 style={sectionTitle}>Histórico</h2>
      <p style={{ fontSize: 12, color: C.textSoft, marginTop: -6, marginBottom: 10 }}>Toque em um registro para corrigir algo que digitou errado.</p>
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {["todos", "sentimento", "desatencao", "impulsividade", "medicacao", ...quickLogTypes.map(q => q.key)].map(f => (
          <button key={f} onClick={() => setLogFilter(f)} style={{
            fontSize: 11, padding: "4px 10px", borderRadius: 999, border: "none", cursor: "pointer",
            background: logFilter === f ? C.accentDark : C.white, color: logFilter === f ? C.white : C.text,
          }}>{f}</button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.length === 0 && <div style={{ fontSize: 13, color: C.textSoft }}>Nenhum registro ainda hoje.</div>}
        {filtered.map(l => <LogItem key={l.id} log={l} onEdit={onEditLog} />)}
      </div>
    </div>
  );
}

function LogItem({ log, onEdit }) {
  const time = log.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (log.category === "sentimento") {
    const f = feelings.find(f => f.key === log.sentimento);
    return (
      <div onClick={() => onEdit(log)} style={{ ...card, padding: 12, cursor: "pointer" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.textSoft }}>
          <span>{f?.label || log.sentimento}</span><span>{time}</span>
        </div>
        <div style={{ fontSize: 13, marginTop: 4 }}><strong>Gatilho:</strong> {log.gatilho}</div>
        <div style={{ fontSize: 13 }}><strong>Reação:</strong> {log.reacao}</div>
      </div>
    );
  }
  if (log.category === "desatencao" || log.category === "impulsividade") {
    return (
      <div onClick={() => onEdit(log)} style={{ ...card, padding: 12, cursor: "pointer" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.textSoft }}>
          <span>{log.category === "desatencao" ? "Desatenção" : "Impulsividade"}</span><span>{time}</span>
        </div>
        <div style={{ fontSize: 13, marginTop: 4 }}><strong>Contexto:</strong> {log.contexto}</div>
        <div style={{ fontSize: 13 }}><strong>Impacto:</strong> {log.impacto}</div>
      </div>
    );
  }
  if (log.category === "medicacao") {
    return (
      <div onClick={() => onEdit(log)} style={{ ...card, padding: 12, cursor: "pointer" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.textSoft }}>
          <span>Medicação — {log.nome}</span><span>{log.horario}</span>
        </div>
        <div style={{ fontSize: 13, marginTop: 4 }}><strong>Como se sentiu:</strong> {log.sensacao === "bem" ? "Bem" : "Efeito colateral"}{log.detalhe ? ` — ${log.detalhe}` : ""}</div>
      </div>
    );
  }
  return (
    <div onClick={() => onEdit(log)} style={{ ...card, padding: 12, display: "flex", justifyContent: "space-between", fontSize: 13, cursor: "pointer" }}>
      <span>{quickLogTypes.find(q => q.key === log.type)?.label}: {log.value}/10</span>
      <span style={{ color: C.textSoft, fontSize: 12 }}>{time}</span>
    </div>
  );
}

function QuickLogModal({ type, initial, onClose, onSave }) {
  const [val, setVal] = useState(initial ? initial.value : 5);
  const label = quickLogTypes.find(q => q.key === type)?.label;
  return (
    <Modal onClose={onClose} title={initial ? `Editar ${label}` : label}>
      <input type="range" min={0} max={10} value={val} onChange={e => setVal(Number(e.target.value))} style={{ width: "100%", accentColor: C.accent }} />
      <div style={{ textAlign: "center", fontWeight: 700, fontSize: 20, margin: "8px 0 16px" }}>{val}/10</div>
      <button style={btnPrimary} onClick={() => onSave(val)}>{initial ? "Salvar alterações" : "Salvar"}</button>
    </Modal>
  );
}

function DiaryModal({ step, initial, onClose, onSave }) {
  const [sentimento, setSentimento] = useState(initial ? initial.sentimento : null);
  const [gatilho, setGatilho] = useState(initial ? initial.gatilho || "" : "");
  const [reacao, setReacao] = useState(initial ? initial.reacao || "" : "");
  const [contexto, setContexto] = useState(initial ? initial.contexto || "" : "");
  const [impacto, setImpacto] = useState(initial ? initial.impacto || "" : "");

  if (step === "sentimento") {
    return (
      <Modal onClose={onClose} title={initial ? "Editar sentimento" : "Como você se sentiu?"}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 14 }}>
          {feelings.map(f => (
            <button key={f.key} onClick={() => setSentimento(f.key)} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "12px 4px",
              borderRadius: 14, border: sentimento === f.key ? `2px solid ${C.accent}` : "1px solid #ECEDF0",
              background: f.color, cursor: "pointer",
            }}>
              <f.icon size={20} /><span style={{ fontSize: 11, fontWeight: 600 }}>{f.label}</span>
            </button>
          ))}
        </div>
        <Field label="O que gerou esse sentimento?"><input style={input} value={gatilho} onChange={e => setGatilho(e.target.value)} placeholder="Ex: comentário de um colega" /></Field>
        <Field label="Como você agiu em seguida?"><input style={input} value={reacao} onChange={e => setReacao(e.target.value)} placeholder="Ex: saí para respirar" /></Field>
        <button style={btnPrimary} disabled={!sentimento} onClick={() => sentimento && onSave({ category: "sentimento", sentimento, gatilho, reacao })}>{initial ? "Salvar alterações" : "Salvar registro"}</button>
      </Modal>
    );
  }

  const isImp = step === "impulsividade";
  return (
    <Modal onClose={onClose} title={initial ? "Editar registro" : (isImp ? "Registrar impulsividade" : "Registrar desatenção")}>
      <Field label="Quando você percebeu isso? (contexto)"><input style={input} value={contexto} onChange={e => setContexto(e.target.value)} placeholder={isImp ? "Ex: no meio de uma reunião" : "Ex: estudando para a prova"} /></Field>
      <Field label="Como isso afetou seu dia?"><input style={input} value={impacto} onChange={e => setImpacto(e.target.value)} placeholder="Ex: perdi o fio do que estava fazendo" /></Field>
      <button style={btnPrimary} onClick={() => onSave({ category: step, contexto, impacto })}>{initial ? "Salvar alterações" : "Salvar registro"}</button>
    </Modal>
  );
}

function MedicationModal({ initial, onClose, onSave }) {
  const [nome, setNome] = useState(initial ? initial.nome : "");
  const [horario, setHorario] = useState(initial ? initial.horario : "");
  const [sensacao, setSensacao] = useState(initial ? initial.sensacao : "bem");
  const [detalhe, setDetalhe] = useState(initial ? initial.detalhe || "" : "");
  return (
    <Modal onClose={onClose} title={initial ? "Editar medicação" : "Registrar medicação"}>
      <Field label="Nome da medicação"><input style={input} value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Ritalina 10mg" /></Field>
      <Field label="Horário que tomou"><input type="time" style={input} value={horario} onChange={e => setHorario(e.target.value)} /></Field>
      <Field label="Como se sentiu depois?">
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          {[{ k: "bem", l: "Bem" }, { k: "efeito", l: "Efeito colateral" }].map(o => (
            <button key={o.k} onClick={() => setSensacao(o.k)} style={{
              flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: sensacao === o.k ? C.green : C.greyBg,
            }}>{o.l}</button>
          ))}
        </div>
        <input style={input} value={detalhe} onChange={e => setDetalhe(e.target.value)} placeholder="Detalhes (opcional): ex. sonolência, boca seca..." />
      </Field>
      <button style={btnPrimary} disabled={!nome || !horario} onClick={() => nome && horario && onSave({ nome, horario, sensacao, detalhe })}>{initial ? "Salvar alterações" : "Salvar"}</button>
    </Modal>
  );
}

function TipModal({ onClose, onSave }) {
  const [origem, setOrigem] = useState("terapeuta");
  const [situacao, setSituacao] = useState("");
  const [dica, setDica] = useState("");
  return (
    <Modal onClose={onClose} title="Nova dica de apoio">
      <Field label="De onde veio essa dica?">
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          {[{ k: "terapeuta", l: "Psicólogo/terapeuta" }, { k: "propria", l: "Insight próprio" }].map(o => (
            <button key={o.k} onClick={() => setOrigem(o.k)} style={{
              flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
              background: origem === o.k ? C.lilac : C.greyBg,
            }}>{o.l}</button>
          ))}
        </div>
      </Field>
      <Field label="Quando usar essa dica? (situação/sentimento)"><input style={input} value={situacao} onChange={e => setSituacao(e.target.value)} placeholder="Ex: quando eu sentir ansiedade antes de provas" /></Field>
      <Field label="A dica em si"><input style={input} value={dica} onChange={e => setDica(e.target.value)} placeholder="Ex: respirar fundo 4x e escrever 3 próximos passos" /></Field>
      <button style={btnPrimary} disabled={!dica} onClick={() => dica && onSave({ origem, situacao, dica })}>Salvar dica</button>
    </Modal>
  );
}

// ---------- Soluções ----------
function Solucoes({ personalTips, onNewTip }) {
  return (
    <div style={{ padding: "24px 20px 12px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Soluções</h1>

      <h2 style={sectionTitle}>Baseadas em evidências (MBE)</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
        {evidenceTips.map((t, i) => (
          <div key={i} style={{ ...card, padding: 14 }}>
            <div style={{ fontSize: 11, color: C.accentDark, fontWeight: 700, marginBottom: 4 }}>{t.tema}</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{t.title}</div>
            <div style={{ fontSize: 13, color: C.textSoft }}>{t.texto}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <h2 style={{ ...sectionTitle, marginBottom: 0 }}>Minha agenda de apoio</h2>
        <IconButton onClick={onNewTip} title="Nova dica" />
      </div>
      <p style={{ fontSize: 12, color: C.textSoft, marginTop: 4, marginBottom: 10 }}>Dicas do seu psicólogo/terapeuta ou insights que funcionaram para você — para consultar quando precisar.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {personalTips.length === 0 && <div style={{ fontSize: 13, color: C.textSoft }}>Nenhuma dica registrada ainda.</div>}
        {personalTips.map(t => (
          <div key={t.id} style={{ ...card, padding: 14, background: t.origem === "terapeuta" ? C.lilac : C.peach }}>
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{t.origem === "terapeuta" ? "Dica do psicólogo/terapeuta" : "Insight próprio"}</div>
            {t.situacao && <div style={{ fontSize: 12, marginBottom: 4 }}><strong>Quando usar:</strong> {t.situacao}</div>}
            <div style={{ fontSize: 14 }}>{t.dica}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Progresso ----------
function Progresso({ logs }) {
  const weekChart = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const dayLogs = logs.filter(l => !l.category && l.timestamp.toISOString().slice(0, 10) === key);
      const avg = (type) => {
        const vals = dayLogs.filter(l => l.type === type).map(l => l.value);
        return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
      };
      days.push({ dia: d.toLocaleDateString("pt-BR", { weekday: "short" }), humor: avg("humor"), foco: avg("foco") });
    }
    return days;
  }, [logs]);

  const hasQuickLogs = logs.some(l => !l.category);
  const diasComRegistro = new Set(logs.map(l => l.timestamp.toISOString().slice(0, 10))).size;

  return (
    <div style={{ padding: "24px 20px 12px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Progresso</h1>

      <div style={{ ...card, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Humor e foco — últimos 7 dias</div>
        {hasQuickLogs ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={weekChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEE" />
              <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="humor" stroke={C.accent} strokeWidth={2} connectNulls dot={{ r: 3 }} />
              <Line type="monotone" dataKey="foco" stroke={C.green} strokeWidth={2} connectNulls dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ fontSize: 13, color: C.textSoft, padding: "20px 0", textAlign: "center" }}>
            Ainda sem registros de humor ou foco. Use o Registro rápido para começar a ver seu gráfico aqui.
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ ...card, flex: 1, padding: 14, textAlign: "center" }}>
          <Flame color={C.peach} style={{ margin: "0 auto 4px" }} />
          <div style={{ fontWeight: 700 }}>{diasComRegistro}</div>
          <div style={{ fontSize: 11, color: C.textSoft }}>dias com registro</div>
        </div>
        <div style={{ ...card, flex: 1, padding: 14, textAlign: "center" }}>
          <Award color={C.lilac} style={{ margin: "0 auto 4px" }} />
          <div style={{ fontWeight: 700 }}>{logs.length}</div>
          <div style={{ fontSize: 11, color: C.textSoft }}>registros no total</div>
        </div>
      </div>
    </div>
  );
}

// ---------- Mais ----------
function Mais({ onGenerateReport, onSignOut, onOpenSettings }) {
  const settingsItems = [
    { key: "notificacoes", label: "Notificações" },
    { key: "privacidade", label: "Privacidade e dados" },
    { key: "conta", label: "Conta" },
  ];
  return (
    <div style={{ padding: "24px 20px 12px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Mais</h1>

      <h2 style={sectionTitle}><BookOpen size={14} style={{ verticalAlign: -2 }} /> Biblioteca</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {libraryCards.map((c, i) => (
          <div key={i} style={{ ...card, padding: 14 }}>
            <div style={{ fontSize: 11, color: C.accentDark, fontWeight: 700, marginBottom: 4 }}>{c.tema}</div>
            <div style={{ fontSize: 13 }}>{c.title}</div>
          </div>
        ))}
      </div>

      <h2 style={sectionTitle}>Terapia</h2>
      <div style={{ ...card, padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 13, marginBottom: 10 }}>Gere um relatório com seus dados para levar à sessão.</div>
        <button style={btnPrimary} onClick={onGenerateReport}><FileText size={16} /> Gerar relatório</button>
      </div>

      <h2 style={sectionTitle}><Settings size={14} style={{ verticalAlign: -2 }} /> Configurações</h2>
      <div style={{ ...card, padding: 4, marginBottom: 20 }}>
        {settingsItems.map((s, i) => (
          <button
            key={s.key}
            onClick={() => onOpenSettings(s.key)}
            style={{
              width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer",
              padding: "12px 14px", fontSize: 14, borderTop: i ? "1px solid #F0F0F2" : "none",
              display: "flex", justifyContent: "space-between", alignItems: "center", color: C.text,
            }}
          >
            {s.label} <ChevronRight size={16} color={C.textSoft} />
          </button>
        ))}
      </div>

      <button onClick={onSignOut} style={{ ...btnPrimary, background: C.white, color: C.text, border: "1px solid #E2E4E8" }}>
        <LogOut size={16} /> Sair da conta
      </button>
    </div>
  );
}

// ---------- Configurações (Notificações, Privacidade, Conta) ----------
const USER_TABLES = ["goals", "tasks", "appointments", "quick_logs", "symptom_emotion_logs", "medication_logs", "personal_tips"];

function SettingsPanel({ panel, userId, userEmail, onBack, onSignOut, onDataWiped }) {
  const titles = { notificacoes: "Notificações", privacidade: "Privacidade e dados", conta: "Conta" };
  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "24px 20px 16px" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><ArrowLeft size={20} /></button>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{titles[panel]}</h1>
      </div>
      <div style={{ padding: "0 20px" }}>
        {panel === "notificacoes" && <NotificationsSettings />}
        {panel === "privacidade" && <PrivacySettings userId={userId} onDataWiped={onDataWiped} onSignOut={onSignOut} />}
        {panel === "conta" && <AccountSettings userEmail={userEmail} />}
      </div>
    </div>
  );
}

function NotificationsSettings() {
  const [permission, setPermission] = useState(typeof Notification !== "undefined" ? Notification.permission : "unsupported");
  const [enabled, setEnabled] = useState(localStorage.getItem("at_notifications_enabled") === "true");

  async function handleToggle() {
    if (permission === "unsupported") return;
    if (!enabled) {
      let perm = permission;
      if (perm !== "granted") {
        perm = await Notification.requestPermission();
        setPermission(perm);
      }
      if (perm === "granted") {
        setEnabled(true);
        localStorage.setItem("at_notifications_enabled", "true");
        new Notification("AT Agenda Terapêutica", { body: "Notificações ativadas! Você será avisado sobre compromissos e lembretes." });
      }
    } else {
      setEnabled(false);
      localStorage.setItem("at_notifications_enabled", "false");
    }
  }

  return (
    <div>
      <div style={{ ...card, padding: 16, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ paddingRight: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Lembretes e notificações</div>
          <div style={{ fontSize: 12, color: C.textSoft }}>
            {permission === "unsupported" ? "Seu navegador não suporta notificações." :
              permission === "denied" ? "Bloqueadas nas configurações do navegador/celular — permita o acesso para ativar." :
                enabled ? "Ativadas neste dispositivo." : "Desativadas."}
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={permission === "unsupported" || permission === "denied"}
          style={{
            width: 50, height: 30, borderRadius: 999, border: "none", cursor: "pointer", flexShrink: 0,
            background: enabled ? C.accentDark : C.greyBg, position: "relative", opacity: (permission === "unsupported" || permission === "denied") ? 0.5 : 1,
          }}
        >
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: C.white, position: "absolute", top: 3, left: enabled ? 23 : 3, transition: "left 0.15s" }} />
        </button>
      </div>
      <p style={{ fontSize: 12, color: C.textSoft }}>
        As notificações funcionam enquanto o AT Agenda Terapêutica estiver aberto neste navegador. Avisos automáticos mesmo com o app fechado ainda não estão disponíveis nesta versão.
      </p>
    </div>
  );
}

function PrivacySettings({ userId, onDataWiped, onSignOut }) {
  const [exporting, setExporting] = useState(false);
  const [wiping, setWiping] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleExport() {
    setExporting(true);
    const results = {};
    for (const table of USER_TABLES) {
      const { data } = await supabase.from(table).select("*");
      results[table] = data || [];
    }
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "meus-dados-at-agenda-terapeutica.json";
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  async function handleWipe() {
    if (!window.confirm("Isso apaga todas as suas metas, tarefas, compromissos e registros permanentemente. Sua conta de login continua existindo. Tem certeza?")) return;
    setWiping(true);
    for (const table of USER_TABLES) {
      await supabase.from(table).delete().eq("user_id", userId);
    }
    setWiping(false);
    onDataWiped();
    setMessage("Todos os seus dados foram apagados.");
  }

  return (
    <div>
      <div style={{ ...card, padding: 16, marginBottom: 16 }}>
        <p style={{ fontSize: 13, marginBottom: 0 }}>
          Seus dados (metas, tarefas, registros, diário e medicações) ficam guardados com segurança e só você tem acesso a eles — nenhum outro usuário consegue ver ou editar suas informações. Você pode baixar uma cópia completa ou apagar tudo a qualquer momento.
        </p>
      </div>

      <button style={{ ...btnPrimary, marginBottom: 10 }} disabled={exporting} onClick={handleExport}>
        {exporting ? "Preparando..." : "Exportar meus dados (.json)"}
      </button>

      <button
        style={{ ...btnPrimary, background: C.white, color: "#B3413B", border: "1px solid #E2C4C1" }}
        disabled={wiping}
        onClick={handleWipe}
      >
        {wiping ? "Apagando..." : "Excluir meus dados"}
      </button>

      {message && <div style={{ fontSize: 12, color: C.textSoft, marginTop: 10 }}>{message}</div>}

      <p style={{ fontSize: 11, color: C.textSoft, marginTop: 16 }}>
        Excluir seus dados remove o conteúdo que você registrou no app, mas não apaga a conta de login em si. Para encerrar também a conta, use "Sair da conta" e entre em contato para solicitar a remoção completa.
      </p>
    </div>
  );
}

function AccountSettings({ userEmail }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleChangePassword() {
    setMessage(null);
    if (newPassword.length < 6) { setMessage("A senha precisa ter pelo menos 6 caracteres."); return; }
    if (newPassword !== confirmPassword) { setMessage("As senhas não coincidem."); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (error) setMessage(error.message);
    else { setMessage("Senha alterada com sucesso."); setNewPassword(""); setConfirmPassword(""); }
  }

  return (
    <div>
      <Field label="E-mail da conta">
        <input style={{ ...input, background: C.greyBg, color: C.textSoft }} value={userEmail || ""} disabled />
      </Field>

      <div style={{ fontSize: 13, fontWeight: 700, margin: "16px 0 8px" }}>Alterar senha</div>
      <Field label="Nova senha"><input type="password" style={input} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="mínimo 6 caracteres" /></Field>
      <Field label="Confirmar nova senha"><input type="password" style={input} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="repita a nova senha" /></Field>

      {message && <div style={{ fontSize: 12, color: C.accentDark, marginBottom: 10 }}>{message}</div>}

      <button style={btnPrimary} disabled={saving || !newPassword} onClick={handleChangePassword}>
        {saving ? "Salvando..." : "Salvar nova senha"}
      </button>
    </div>
  );
}

// ---------- Relatório para terapia ----------
function dateKey(d) { return d.toISOString().slice(0, 10); }
function isQuickLog(l) { return !l.category; }

function groupSituations(logs, category) {
  const map = {};
  logs.filter(l => l.category === category).forEach(l => {
    const situacao = l.contexto || "Situação não especificada";
    if (!map[situacao]) map[situacao] = [];
    map[situacao].push(dateKey(l.timestamp));
  });
  // ordena por situações mais recorrentes primeiro
  return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
}

function SymptomBreakdown({ label, color, situacoes }) {
  if (situacoes.length === 0) return null;
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {situacoes.map(([situacao, dias]) => (
          <div key={situacao} style={{ background: C.greyBg, borderRadius: 10, padding: "8px 10px", borderLeft: `3px solid ${color}` }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{situacao}</div>
            <div style={{ fontSize: 11, color: C.textSoft, marginTop: 2 }}>
              {dias.length > 1 ? `Recorrente em ${dias.length} dias: ` : "Ocorreu em: "}
              {dias.map(d => new Date(d + "T00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })).join(", ")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportView({ logs, onBack }) {
  // Agrupa por dia (mais recente primeiro)
  const byDay = useMemo(() => {
    const map = {};
    logs.forEach(l => {
      const k = dateKey(l.timestamp);
      if (!map[k]) map[k] = [];
      map[k].push(l);
    });
    Object.values(map).forEach(arr => arr.sort((a, b) => a.timestamp - b.timestamp));
    return Object.entries(map).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [logs]);

  // Emoções predominantes na semana
  const emotionData = feelings.map(f => ({
    name: f.label, key: f.key, color: f.color,
    total: logs.filter(l => l.category === "sentimento" && l.sentimento === f.key).length,
  }));

  // % desatenção x hiperatividade/impulsividade
  const desatencaoCount = logs.filter(l => l.category === "desatencao").length;
  const impulsividadeCount = logs.filter(l => l.category === "impulsividade").length;
  const totalSintomas = desatencaoCount + impulsividadeCount || 1;
  const desatencaoPct = Math.round((desatencaoCount / totalSintomas) * 100);
  const impulsividadePct = 100 - desatencaoPct;

  // Situações e dias de recorrência de cada sintoma
  const desatencaoSituacoes = groupSituations(logs, "desatencao");
  const impulsividadeSituacoes = groupSituations(logs, "impulsividade");

  // Medicações
  const medLogs = logs.filter(l => l.category === "medicacao");
  const medBem = medLogs.filter(l => l.sensacao === "bem").length;
  const medEfeito = medLogs.length - medBem;
  const medPctBem = medLogs.length ? Math.round((medBem / medLogs.length) * 100) : 0;
  const medByName = {};
  medLogs.forEach(l => { medByName[l.nome] = (medByName[l.nome] || 0) + 1; });

  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "24px 20px 4px" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><ArrowLeft size={20} /></button>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Relatório para a terapia</h1>
      </div>
      <p style={{ fontSize: 12, color: C.textSoft, padding: "0 20px", marginBottom: 20 }}>Últimos 7 dias · gerado a partir dos seus registros</p>

      <div style={{ padding: "0 20px" }}>
        {/* Emoções predominantes */}
        <div style={{ ...card, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Emoções predominantes na semana</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={emotionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEE" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                {emotionData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Desatenção x hiperatividade/impulsividade */}
        <div style={{ ...card, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Sintomas de TDAH</div>
          <div style={{ display: "flex", borderRadius: 999, overflow: "hidden", height: 14, marginBottom: 8 }}>
            <div style={{ width: `${desatencaoPct}%`, background: C.blue }} />
            <div style={{ width: `${impulsividadePct}%`, background: C.peach }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span><span style={{ color: C.blue, fontWeight: 700 }}>●</span> Desatenção — {desatencaoPct}% ({desatencaoCount} registros)</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span><span style={{ color: C.peach, fontWeight: 700 }}>●</span> Hiperatividade/Impulsividade — {impulsividadePct}% ({impulsividadeCount} registros)</span>
          </div>

          <SymptomBreakdown label="Situações de desatenção" color={C.blue} situacoes={desatencaoSituacoes} />
          <SymptomBreakdown label="Situações de hiperatividade/impulsividade" color={C.peach} situacoes={impulsividadeSituacoes} />
        </div>

        {/* Medicações */}
        <div style={{ ...card, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Relatório de medicações</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1, textAlign: "center", background: C.green, borderRadius: 12, padding: 10 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{medLogs.length}</div>
              <div style={{ fontSize: 11 }}>doses registradas</div>
            </div>
            <div style={{ flex: 1, textAlign: "center", background: C.yellow, borderRadius: 12, padding: 10 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{medPctBem}%</div>
              <div style={{ fontSize: 11 }}>se sentiu bem</div>
            </div>
          </div>
          <div style={{ display: "flex", borderRadius: 999, overflow: "hidden", height: 10, marginBottom: 12 }}>
            <div style={{ width: `${medPctBem}%`, background: C.green }} />
            <div style={{ width: `${100 - medPctBem}%`, background: C.peach }} />
          </div>
          {Object.entries(medByName).map(([nome, count]) => (
            <div key={nome} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderTop: "1px solid #F0F0F2" }}>
              <span><Pill size={13} style={{ verticalAlign: -2, marginRight: 4 }} />{nome}</span>
              <span style={{ color: C.textSoft }}>{count}x na semana</span>
            </div>
          ))}
          {medLogs.filter(l => l.sensacao === "efeito").map(l => (
            <div key={l.id} style={{ fontSize: 12, color: C.textSoft, marginTop: 6 }}>
              ⚠️ {dateKey(l.timestamp).split("-").reverse().join("/")} às {l.horario}: {l.detalhe || "efeito colateral relatado"}
            </div>
          ))}
        </div>

        {/* Registros por dia */}
        <div style={{ fontSize: 13, fontWeight: 700, margin: "6px 0 10px" }}>Registros por dia</div>
        {byDay.map(([day, entries]) => (
          <div key={day} style={{ ...card, padding: 14, marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: C.accentDark }}>
              {new Date(day + "T00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" })}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {entries.map(l => <ReportLogLine key={l.id} log={l} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportLogLine({ log }) {
  const time = log.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (isQuickLog(log)) {
    return (
      <div style={{ fontSize: 12, display: "flex", justifyContent: "space-between" }}>
        <span>{quickLogTypes.find(q => q.key === log.type)?.label || log.type}: {log.value}/10</span>
        <span style={{ color: C.textSoft }}>{time}</span>
      </div>
    );
  }
  if (log.category === "sentimento") {
    const f = feelings.find(f => f.key === log.sentimento);
    return (
      <div style={{ fontSize: 12, borderLeft: `3px solid ${f?.color || C.lilac}`, paddingLeft: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}><strong>{f?.label}</strong><span style={{ color: C.textSoft }}>{time}</span></div>
        <div>Gatilho: {log.gatilho}</div>
        <div>Reação: {log.reacao}</div>
      </div>
    );
  }
  if (log.category === "desatencao" || log.category === "impulsividade") {
    return (
      <div style={{ fontSize: 12, borderLeft: `3px solid ${log.category === "desatencao" ? C.blue : C.peach}`, paddingLeft: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <strong>{log.category === "desatencao" ? "Desatenção" : "Hiperatividade/Impulsividade"}</strong>
          <span style={{ color: C.textSoft }}>{time}</span>
        </div>
        <div>Contexto: {log.contexto}</div>
        <div>Impacto: {log.impacto}</div>
      </div>
    );
  }
  if (log.category === "medicacao") {
    return (
      <div style={{ fontSize: 12, borderLeft: `3px solid ${C.green}`, paddingLeft: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <strong>Medicação — {log.nome}</strong><span style={{ color: C.textSoft }}>{log.horario}</span>
        </div>
        <div>Como se sentiu: {log.sensacao === "bem" ? "Bem" : `Efeito colateral${log.detalhe ? " — " + log.detalhe : ""}`}</div>
      </div>
    );
  }
  return null;
}

// ---------- UI helpers ----------
const sectionTitle = { fontSize: 14, fontWeight: 700, marginBottom: 10, color: C.text };
const input = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #E2E4E8", fontSize: 14, marginBottom: 4, boxSizing: "border-box" };
const btnPrimary = {
  width: "100%", background: C.accentDark, color: C.white, border: "none", borderRadius: 12,
  padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
};

function Field({ label, children }) {
  return <div style={{ marginBottom: 14 }}><div style={{ fontSize: 12, color: C.textSoft, marginBottom: 4 }}>{label}</div>{children}</div>;
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(58,61,70,0.4)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 }}>
      <div style={{ background: C.white, width: "100%", maxWidth: 480, borderRadius: "24px 24px 0 0", padding: 20, maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <strong style={{ fontSize: 16 }}>{title}</strong>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
