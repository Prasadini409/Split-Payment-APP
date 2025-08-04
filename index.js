document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("create-group-modal");
  const openModalBtn = document.getElementById("create-group-btn");
  const openCreateGroupIcon = document.getElementById("openCreateGroup");
  const closeModalBtn = document.getElementById("close-modal");
  const addMoreBtn = document.getElementById("addMoreMembers");
  const membersContainer = document.getElementById("membersContainer");
  const createGroupBtn = document.getElementById("createGroupBtn");
  const groupList = document.getElementById("group-list");
  const activityList = document.getElementById("activity-list");

  const loginModal = document.getElementById("loginModal");
  const loginBtn = document.getElementById("loginBtn");
  const userIcon = document.getElementById("userIcon");
  const closeLoginModal = document.getElementById("closeLoginModal");

  let editingGroupId = null;


// GET request
fetch('https://6866093989803950dbb10192.mockapi.io/api/groups/')
  .then(response => response.json()) // Convert to JSON
  .then(data => console.log(data))   // Handle the data
  .catch(error => console.error('Error:', error)); // Error handling



  // POST request
fetch('https://jsonplaceholder.typicode.com/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Hello API',
    body: 'This is a test',
    userId: 1
  })
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));





  // Show login modal on load if no user
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) {
    loginModal.classList.add("show");
  }

  function updateGroupButtonsState() {
    const loggedIn = JSON.parse(localStorage.getItem("currentUser"));
    if (!loggedIn) {
      openModalBtn?.setAttribute("disabled", true);
      openCreateGroupIcon?.classList.add("disabled");
    } else {
      openModalBtn?.removeAttribute("disabled");
      openCreateGroupIcon?.classList.remove("disabled");
    }
  }

  updateGroupButtonsState();

  userIcon.addEventListener("click", () => {
    loginModal.classList.add("show");
  });

  closeLoginModal.addEventListener("click", () => {
    loginModal.classList.remove("show");
  });

  loginBtn.addEventListener("click", () => {
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    if (!username || !email) {
      alert("Please enter your username and email.");
      return;
    }
    localStorage.setItem("currentUser", JSON.stringify({ name: username, email }));
    loginModal.classList.remove("show");
    alert(`Welcome, ${username}!`);
    updateGroupButtonsState();
  });

  function handleCreateGroupClick() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) {
      alert("Please log in first.");
      loginModal.classList.add("show");
      return;
    }
    showModal();
  }

  openModalBtn?.addEventListener("click", handleCreateGroupClick);
  openCreateGroupIcon?.addEventListener("click", handleCreateGroupClick);

  closeModalBtn?.addEventListener("click", () => {
    modal.classList.remove("show");
    editingGroupId = null;
    createGroupBtn.textContent = "Create Group";
  });

  addMoreBtn?.addEventListener("click", () => {
    addMemberRow();
  });

  createGroupBtn.addEventListener("click", () => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) return alert("Please login first.");

    const name = document.getElementById("groupName").value.trim();
    const category = document.getElementById("groupCategory").value;
    const description = document.getElementById("groupDescription").value;

    const memberNames = Array.from(document.querySelectorAll(".member-name")).map(i => i.value.trim());
    const memberEmails = Array.from(document.querySelectorAll(".member-email")).map(i => i.value.trim());

    const members = [{ name: currentUser.name, email: currentUser.email }];

    memberNames.forEach((name, i) => {
      const email = memberEmails[i];
      if (name && email && email !== currentUser.email) {
        members.push({ name, email });
      }
    });

    if (!name || members.length < 1) {
      return alert("Please enter group name and at least one valid member.");
    }

    let groups = JSON.parse(localStorage.getItem("groups") || "[]");

    if (editingGroupId) {
      const idx = groups.findIndex(g => g.id === editingGroupId);
      if (idx !== -1) {
        groups[idx] = { ...groups[idx], name, category, description, members };
        addActivity({ type: "group", text: `Edited group "${name}"` });
      }
    } else {
      const group = {
        id: Date.now(),
        name,
        category,
        description,
        members,
        expenses: [],
        payments: [],
        createdBy: currentUser.name,
        createdAt: new Date().toISOString()
      };
      groups.push(group);
      addActivity({ type: "group", text: `Created group "${name}"` });
    }

    localStorage.setItem("groups", JSON.stringify(groups));
    renderGroups();
    resetForm();
    modal.classList.remove("show");
  });

  function addMemberRow(name = "", email = "") {
    const row = document.createElement("div");
    row.className = "member-row";
    row.innerHTML = `
      <input type="text" placeholder="Name" class="member-name" value="${name}">
      <input type="email" placeholder="Email" class="member-email" value="${email}">
    `;
    membersContainer.appendChild(row);
  }

  function renderGroups() {
    const groups = JSON.parse(localStorage.getItem("groups") || "[]");
    groupList.innerHTML = "";

    groups.forEach(group => {
      const div = document.createElement("div");
      div.className = "group-card";
      div.innerHTML = `
        <h4>${group.name}</h4>
        <div class="meta">${group.members.length} members</div>
        <div class="status settled">Settled</div>
        <div class="group-actions">
          <i class="fas fa-edit" data-id="${group.id}"></i>
          <i class="fas fa-trash-alt" data-id="${group.id}"></i>
        </div>
      `;

      div.addEventListener("click", (e) => {
        if (e.target.closest(".group-actions")) return;
        localStorage.setItem("selectedGroup", JSON.stringify(group));
        window.location.href = "group.html";
      });

      div.querySelector(".fa-trash-alt").onclick = (e) => {
        e.stopPropagation();
        const id = e.target.dataset.id;
        const updatedGroups = groups.filter(g => g.id != id);
        localStorage.setItem("groups", JSON.stringify(updatedGroups));
        addActivity({ type: "group", text: `Deleted group "${group.name}"` });
        renderGroups();
      };

      div.querySelector(".fa-edit").onclick = (e) => {
        e.stopPropagation();
        editingGroupId = group.id;
        document.getElementById("groupName").value = group.name;
        document.getElementById("groupDescription").value = group.description;
        document.getElementById("groupCategory").value = group.category;

        membersContainer.innerHTML = "";
        group.members.forEach(m => {
          const currentUser = JSON.parse(localStorage.getItem("currentUser"));
          if (m.email !== currentUser.email) {
            addMemberRow(m.name, m.email);
          }
        });

        createGroupBtn.textContent = "Update Group";
        showModal();
      };

      groupList.appendChild(div);
    });
  }

  function renderActivities() {
    const activityList = document.getElementById("activity-list");
    const log = JSON.parse(localStorage.getItem("activityLog") || "[]");
    activityList.innerHTML = "";

    log.forEach((entry, index) => {
      let text = "";
      if (entry.type === "group") {
        text = entry.text;
      } else if (entry.type === "expense") {
        text = `${entry.paidBy} added expense "$${entry.amount}" in "${entry.group}"`;
      } else if (entry.type === "payment") {
        text = `${entry.from} paid $${entry.amount} to ${entry.to} in "${entry.group}"`;
      }

      const li = document.createElement("li");
      li.classList.add("activity-item");
      li.innerHTML = `
        <span>${text}</span>
        <i class="fas fa-trash delete-activity" data-index="${index}"></i>
      `;

      li.querySelector(".delete-activity").addEventListener("click", (e) => {
        e.stopPropagation();
        log.splice(index, 1);
        localStorage.setItem("activityLog", JSON.stringify(log));
        renderActivities();
      });

      activityList.appendChild(li);
    });
  }

  function addActivity(entry) {
    const log = JSON.parse(localStorage.getItem("activityLog") || "[]");
    log.unshift({
      ...entry,
      date: new Date().toISOString()
    });
    localStorage.setItem("activityLog", JSON.stringify(log));
    renderActivities();
  }

  function resetForm() {
    document.getElementById("groupName").value = "";
    document.getElementById("groupDescription").value = "";
    document.getElementById("groupCategory").value = "Trip";
    membersContainer.innerHTML = "";
    addMemberRow();
  }

  function showModal() {
    modal.classList.add("show");
    resetForm();
  }

  // Init
  renderGroups();
  renderActivities();
});