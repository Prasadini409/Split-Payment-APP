

document.addEventListener("DOMContentLoaded", () => {
  // --- Your existing variable declarations remain unchanged ---
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
  const closeLoginModal = document.getElementById("closeLoginModal");
  const userIcon = document.getElementById("userIcon");
  const usernameDisplay = document.getElementById("usernameDisplay");

  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const showSignupLink = document.getElementById("showSignup");
  const showLoginLink = document.getElementById("showLogin");

  let editingGroupId = null;

  // Check current user
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) {
    showLoginForm();
    loginModal.classList.add("show");
  }

  userIcon.addEventListener("click", () => {
    showLoginForm();
    loginModal.classList.add("show");
  });

  closeLoginModal.addEventListener("click", () => {
    loginModal.classList.remove("show");
  });

  showSignupLink.addEventListener("click", (e) => {
    e.preventDefault();
    showSignupForm();
  });

  showLoginLink.addEventListener("click", (e) => {
    e.preventDefault();
    showLoginForm();
  });

  function showLoginForm() {
    loginForm.classList.add("active");
    signupForm.classList.remove("active");
  }

  function showSignupForm() {
    signupForm.classList.add("active");
    loginForm.classList.remove("active");
  }

  // --- API CALLS ---
  async function signUp(username, email, password) {
    try {
      const res = await fetch("http://10.196.53.165:8000/api/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Signup failed");
      }

      const data = await res.json();
      alert("Signup successful! Please login.");
      signupForm.reset();
      showLoginForm();
      return data;
    } catch (err) {
      alert("Signup Failed: " + err.message);
    }
  }

  async function login(username, password) {
    try {
      const res = await fetch("http://10.196.53.165:8000/api/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Login failed");
      }

      const data = await res.json();

      // Save user info & token
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("currentUser", JSON.stringify({ name: username, email: data.email || "" }));

      alert(`Welcome back, ${username}!`);
      loginModal.classList.remove("show");
      updateUIForUser();
      updateGroupButtonsState();
      loginForm.reset();
      return data;
    } catch (err) {
      alert("Login Failed: " + err.message);
    }
  }

  // --- FORM SUBMISSIONS ---
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (!username || !password) {
      alert("Please enter username and password.");
      return;
    }

    // Call backend login
    login(username, password);
  });

  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("signupUsername").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value.trim();

    if (!username || !email || !password) {
      alert("Please fill all fields.");
      return;
    }

    // Call backend signup
    signUp(username, email, password);
  });

  function updateUIForUser() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (currentUser) {
      usernameDisplay.textContent = currentUser.name;
    } else {
      usernameDisplay.textContent = "";
    }
  }

  function updateGroupButtonsState() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) {
      openModalBtn?.setAttribute("disabled", true);
      openCreateGroupIcon?.classList.add("disabled");
    } else {
      openModalBtn?.removeAttribute("disabled");
      openCreateGroupIcon?.classList.remove("disabled");
    }
  }

  function handleCreateGroupClick() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) {
      alert("Please log in first.");
      loginModal.classList.add("show");
      showLoginForm();
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

  // --- The rest of your create group, activities, and UI functions remain unchanged ---
  // ... [KEEP YOUR ORIGINAL FUNCTIONS FROM HERE ON] ...
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

  // Initialize UI
  renderGroups();
  renderActivities();
  updateUIForUser();
  updateGroupButtonsState();
});

