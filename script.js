const taskinp=document.getElementById("taskinput");
const duedate=document.getElementById("duedate");
const addbtn=document.getElementById("addTaskbtn");
const darkToggle = document.getElementById("darkmodetoggle");
const prioritySelect = document.getElementById("priority");

const pendinglist=document.querySelector('#pending .task-list');
const inprogresslist=document.querySelector('#inprogress .task-list');
const completedlist=document.querySelector('#completed .task-list');
const boards = document.querySelectorAll(".task-list");
const priorityBtn = document.getElementById("priorityBtn");
const priorityMenu = document.querySelector(".priority-menu");

let draggedtaskid=null;
let currentFilter = "all";
let tasklist=[]
let priorityFilter = null;
let searchQuery = "";

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search");

  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    renderTasks();
  });
});


function loadTasks() {
  const storedTasks = localStorage.getItem("tasks");
  if (storedTasks) {
    tasklist = JSON.parse(storedTasks);
    renderTasks();
  }
}

loadTasks(); 

const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
  document.body.classList.add("dark");
  darkToggle.checked = true;
}

darkToggle.addEventListener("change", () => {
  if (darkToggle.checked) {
    document.body.classList.add("dark");
    localStorage.setItem("theme", "dark");
  } else {
    document.body.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }
});

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasklist));
}

addbtn.addEventListener("click",()=>{
  const inp=taskinp.value.trim();
  const due=duedate.value;
  if(!inp || !due) return alert("Please fill the appropriate fields");

  const task={
    id:Date.now(),
    inp,
    due,
    priority: prioritySelect.value,
    status:"pending",
    completed:false  
  };
  tasklist.push(task);
  saveTasks();
  renderTasks();
  taskinp.value="";
  duedate.value="";
  prioritySelect.value = "medium";

  
});

function renderTasks(){
    pendinglist.innerHTML="";
    inprogresslist.innerHTML="";
    completedlist.innerHTML="";
    let filteredTasks = [...tasklist];

    if (currentFilter === "completed") {
    filteredTasks = filteredTasks.filter(task => task.completed);
  }
  if (searchQuery) {
    filteredTasks = filteredTasks.filter(task =>
      task.inp.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
if (priorityFilter) {
  const priorityRank = {
    high: 1,
    medium: 2,
    low: 3
  };

  filteredTasks.sort((a, b) => {
    if (priorityFilter === "high") {
      return priorityRank[a.priority] - priorityRank[b.priority];
    }

    if (priorityFilter === "medium") {
      return Math.abs(priorityRank[a.priority] - 2) -
             Math.abs(priorityRank[b.priority] - 2);
    }

    if (priorityFilter === "low") {
      return priorityRank[b.priority] - priorityRank[a.priority];
    }
  });
}


    filteredTasks.forEach(task => {
    const taskEl = createTaskElement(task);

    if (task.status === "pending") {
      pendinglist.appendChild(taskEl);
    } 
    else if (task.status === "inprogress") {
      inprogresslist.appendChild(taskEl);
    } 
    else {
      completedlist.appendChild(taskEl);
    }
        
    });
}

function createTaskElement(task){
    const div=document.createElement("div");
    div.className="task";
    div.setAttribute("draggable","true");
    div.dataset.id=task.id;

    div.innerHTML=`
    <div class="task-header">
    <label class="task-check">
    <input type="checkbox" class="complete-checkbox" ${task.completed ? "checked" : ""}>
     <span class="task-title">${task.inp}</span>
    </label> 
     <div class="task-actions">
        <i class="uil uil-edit edit-btn"></i>
        <i class="uil uil-trash delete-btn"></i>
      </div>
     </div> 
     
    <div class="task-meta">
  ${task.due ? `<small class="task-date">Due: ${task.due}</small>` : ""}
  <span class="priority ${task.priority}">
    ${task.priority}
  </span>
</div>
`;
    if(task.completed){
        div.classList.add("completed");
    }
  div.addEventListener("dragstart", () => {
  draggedtaskid = task.id;
  div.classList.add("dragging");
});

div.addEventListener("dragend", () => {
  draggedtaskid = null;
  div.classList.remove("dragging");
});

if (task.due&& !task.completed){
  const today=new Date().setHours(0,0,0,0);
  const due_date=new Date(task.due).setHours(0,0,0,0);

  if(due_date<today){
    div.classList.add("overdue");
  }
}
    return div;
}

document.addEventListener("click",function(e){
    const taskEl=e.target.closest(".task");
    if(!taskEl) return;

    const taskid=Number(taskEl.dataset.id);

    if(e.target.classList.contains("delete-btn")){
        tasklist=tasklist.filter(task=>task.id!==taskid);
        saveTasks();
        renderTasks();
    }

    if(e.target.classList.contains("edit-btn")){
        const task=tasklist.find(task=>task.id===taskid);
        const titleSpan = taskEl.querySelector(".task-title");
        
        if (taskEl.querySelector(".inline-edit")) return;

        const input = document.createElement("input");
        input.type = "text";
        input.value = task.inp;
        input.className = "inline-edit";
  
        titleSpan.replaceWith(input);
        input.focus();

        function saveEdit(commit=true) {
            if(commit){
            const newTitle = input.value.trim();
            if (newTitle) task.inp = newTitle;
    }
    saveTasks();        
    renderTasks();
}

  input.addEventListener("blur", saveEdit);
   input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") saveEdit(false);
  });
}

    if(e.target.classList.contains("complete-checkbox")) {
        const task = tasklist.find(task => task.id === taskid);
        task.completed = e.target.checked;
        task.status = task.completed ? "completed" : "pending";
        saveTasks();
        renderTasks();
    
  }
    
});

boards.forEach(board=>{
    board.addEventListener("dragover",(e)=>{
        e.preventDefault();
    });
 board.addEventListener("drop", (e) => {
    if (!draggedtaskid) return;

    const task = tasklist.find(t => t.id === draggedtaskid);
    const boardId = board.parentElement.id;

    task.status = boardId;

    if (boardId === "completed") {
      task.completed = true;
    } else {
      task.completed = false;
    }
    saveTasks();
    renderTasks();
  });    
})

document.querySelector(".filters").addEventListener("click", (e) => {
  if (!e.target.classList.contains("filter-btn")) return;

  currentFilter = e.target.dataset.filter;

  document.querySelectorAll(".filter-btn").forEach(btn =>
    btn.classList.remove("active")
  );

  e.target.classList.add("active");

  renderTasks();
});

priorityBtn.addEventListener("click", () => {
  priorityMenu.classList.toggle("hidden");
});
document.addEventListener("click", (e) => {
  if (!priorityBtn.contains(e.target) && !priorityMenu.contains(e.target)) {
    priorityMenu.classList.add("hidden");
  }
});

priorityMenu.addEventListener("click", (e) => {
  if (!("priority" in e.target.dataset)) return;

  priorityFilter = e.target.dataset.priority || null;

  priorityBtn.textContent = priorityFilter
    ? `Priority: ${priorityFilter} `
    : "Priority ";

  priorityMenu.classList.add("hidden");
  renderTasks();
});

