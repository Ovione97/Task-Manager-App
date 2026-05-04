const TASKS_API_URL = "/api/tasks";
const AUTH_API_URL = "/api/auth";
const TOKEN_STORAGE_KEY = "task_manager_token";

document.addEventListener("DOMContentLoaded", () => {
    /* =========================================================
       1. Frontend state
       Tracks the signed-in user, edit mode, and pagination
       ========================================================= */

    let currentUser = null;
    let editingTaskId = null;
    let currentPage = 1;
    let totalPages = 1;

    /* =========================================================
       2. DOM element references
       Cache elements once so they can be reused throughout the file
       ========================================================= */

    const authSection = document.getElementById("authSection");
    const accountSection = document.getElementById("accountSection");
    const appLayout = document.getElementById("appLayout");

    const loginView = document.getElementById("loginView");
    const registerView = document.getElementById("registerView");
    const showRegisterButton = document.getElementById("showRegisterButton");
    const showLoginButton = document.getElementById("showLoginButton");

    const currentUserText = document.getElementById("currentUserText");
    const showAccountButton = document.getElementById("showAccountButton");
    const backToTasksButton = document.getElementById("backToTasksButton");
    const logoutButton = document.getElementById("logoutButton");

    const toggleCreateButton = document.getElementById("toggleCreateButton");
    const toggleFiltersButton = document.getElementById("toggleFiltersButton");

    const createPanel = document.getElementById("createPanel");
    const filtersPanel = document.getElementById("filtersPanel");

    const messageBox = document.getElementById("messageBox");
    const taskList = document.getElementById("taskList");
    const pageInfo = document.getElementById("pageInfo");
    const prevPageButton = document.getElementById("prevPageButton");
    const nextPageButton = document.getElementById("nextPageButton");

    const registerForm = document.getElementById("registerForm");
    const loginForm = document.getElementById("loginForm");

    const registerNameInput = document.getElementById("registerName");
    const registerEmailInput = document.getElementById("registerEmail");
    const registerPasswordInput = document.getElementById("registerPassword");

    const loginEmailInput = document.getElementById("loginEmail");
    const loginPasswordInput = document.getElementById("loginPassword");

    const profileForm = document.getElementById("profileForm");
    const passwordForm = document.getElementById("passwordForm");
    const deleteAccountForm = document.getElementById("deleteAccountForm");

    const profileNameInput = document.getElementById("profileName");
    const profileEmailInput = document.getElementById("profileEmail");
    const currentPasswordInput = document.getElementById("currentPassword");
    const newPasswordInput = document.getElementById("newPassword");
    const deleteAccountPasswordInput = document.getElementById("deleteAccountPassword");

    const taskForm = document.getElementById("taskForm");
    const formTitle = document.getElementById("formTitle");
    const submitButton = document.getElementById("submitButton");
    const cancelEditButton = document.getElementById("cancelEditButton");

    const titleInput = document.getElementById("title");
    const priorityInput = document.getElementById("priority");
    const dueDateInput = document.getElementById("dueDate");
    const completedInput = document.getElementById("completed");

    const filterCompleted = document.getElementById("filterCompleted");
    const filterPriority = document.getElementById("filterPriority");
    const sortBy = document.getElementById("sortBy");
    const order = document.getElementById("order");
    const limit = document.getElementById("limit");
    const applyFiltersButton = document.getElementById("applyFiltersButton");
    const resetFiltersButton = document.getElementById("resetFiltersButton");

    /* =========================================================
       3. Small UI helper functions
       Handle messages, form reset, view switching, and panel state
       ========================================================= */

    // Show or hide an element using the shared utility class
    function setHidden(element, shouldHide) {
        if (!element) {
            return;
        }

        element.classList.toggle("is-hidden", shouldHide);
    }

    // Render a success or error message as plain text for safer DOM output
    function showMessage(text, type = "success") {
        const messageElement = document.createElement("div");
        messageElement.className = `message ${type}`;
        messageElement.textContent = text;

        messageBox.replaceChildren(messageElement);

        setTimeout(() => {
            messageBox.replaceChildren();
        }, 3500);
    }

    // Read the saved JWT from localStorage
    function getStoredToken() {
        return localStorage.getItem(TOKEN_STORAGE_KEY);
    }

    // Save the JWT after login, registration, or profile update
    function saveToken(token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }

    // Remove the JWT when the user logs out or the session expires
    function clearToken() {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
    }

    // Reset the task form back to create mode
    function resetTaskForm() {
        editingTaskId = null;

        if (!taskForm) {
            return;
        }

        taskForm.reset();
        priorityInput.value = "medium";
        completedInput.value = "false";

        formTitle.textContent = "Create Task";
        submitButton.textContent = "Create Task";
        setHidden(cancelEditButton, true);
    }

    // Reset login and register forms
    function resetAuthForms() {
        if (registerForm) registerForm.reset();
        if (loginForm) loginForm.reset();
    }

    // Reset password and delete-account forms
    function resetAccountForms() {
        if (passwordForm) passwordForm.reset();
        if (deleteAccountForm) deleteAccountForm.reset();
    }

    // Fill the account profile form with the latest signed-in user data
    function populateAccountForm() {
        if (!profileNameInput || !profileEmailInput) {
            return;
        }

        if (!currentUser) {
            profileNameInput.value = "";
            profileEmailInput.value = "";
            return;
        }

        profileNameInput.value = currentUser.name || "";
        profileEmailInput.value = currentUser.email || "";
    }

    // Show the login screen and hide the register screen
    function showLoginView() {
        setHidden(loginView, false);
        setHidden(registerView, true);
    }

    // Show the register screen and hide the login screen
    function showRegisterView() {
        setHidden(loginView, true);
        setHidden(registerView, false);
    }

    // Update the Create / Filters toggle button labels
    function updatePanelButtonsText() {
        if (!createPanel || !filtersPanel) {
            return;
        }

        toggleCreateButton.textContent = createPanel.classList.contains("panel-hidden")
            ? "Show Create"
            : "Hide Create";

        toggleFiltersButton.textContent = filtersPanel.classList.contains("panel-hidden")
            ? "Show Filters"
            : "Hide Filters";
    }

    // Collapse the sidebar only when both panels are hidden
    function updateLayoutState() {
        if (!createPanel || !filtersPanel || !appLayout) {
            return;
        }

        const areBothPanelsHidden =
            createPanel.classList.contains("panel-hidden") &&
            filtersPanel.classList.contains("panel-hidden");

        appLayout.classList.toggle("sidebar-collapsed", areBothPanelsHidden);
    }

    function showCreatePanel() {
        if (!createPanel) return;

        createPanel.classList.remove("panel-hidden");
        updatePanelButtonsText();
        updateLayoutState();
    }

    function hideCreatePanel() {
        if (!createPanel) return;

        createPanel.classList.add("panel-hidden");
        updatePanelButtonsText();
        updateLayoutState();
    }

    function showFiltersPanel() {
        if (!filtersPanel) return;

        filtersPanel.classList.remove("panel-hidden");
        updatePanelButtonsText();
        updateLayoutState();
    }

    function hideFiltersPanel() {
        if (!filtersPanel) return;

        filtersPanel.classList.add("panel-hidden");
        updatePanelButtonsText();
        updateLayoutState();
    }

    // Show the logged-out auth view and hide all signed-in sections
    function showAuthView() {
        setHidden(authSection, false);
        setHidden(accountSection, true);
        setHidden(appLayout, true);

        setHidden(showAccountButton, true);
        setHidden(logoutButton, true);
        setHidden(toggleCreateButton, true);
        setHidden(toggleFiltersButton, true);

        if (currentUserText) {
            currentUserText.textContent = "Please log in to continue.";
        }

        showLoginView();
    }

    // Show the main task app for the signed-in user
    function showTaskAppView() {
        setHidden(authSection, true);
        setHidden(accountSection, true);
        setHidden(appLayout, false);

        setHidden(showAccountButton, false);
        setHidden(logoutButton, false);
        setHidden(toggleCreateButton, false);
        setHidden(toggleFiltersButton, false);

        if (currentUserText && currentUser) {
            currentUserText.textContent = `Signed in as ${currentUser.name} (${currentUser.email})`;
        }
    }

    // Show the account settings page for the signed-in user
    function showAccountView() {
        if (!accountSection) {
            return;
        }

        setHidden(authSection, true);
        setHidden(accountSection, false);
        setHidden(appLayout, true);

        setHidden(showAccountButton, false);
        setHidden(logoutButton, false);
        setHidden(toggleCreateButton, true);
        setHidden(toggleFiltersButton, true);

        if (currentUserText && currentUser) {
            currentUserText.textContent = `Signed in as ${currentUser.name} (${currentUser.email})`;
        }

        populateAccountForm();
    }

    // Build the query string for filtering, sorting, and pagination
    function buildQueryString() {
        const params = new URLSearchParams();

        if (filterCompleted?.value !== "") {
            params.set("completed", filterCompleted.value);
        }

        if (filterPriority?.value !== "") {
            params.set("priority", filterPriority.value);
        }

        if (sortBy?.value) {
            params.set("sortBy", sortBy.value);
        }

        if (order?.value) {
            params.set("order", order.value);
        }

        if (limit?.value) {
            params.set("limit", limit.value);
        }

        params.set("page", currentPage);
        return params.toString();
    }

    /* =========================================================
       4. Safe task rendering
       Build task cards with DOM methods so user text is not injected
       as raw HTML
       ========================================================= */

    function createTaskCard(task) {
        const taskItem = document.createElement("div");
        taskItem.className = `task-item ${task.completed ? "task-item-completed" : ""}`;

        const taskHeader = document.createElement("div");
        taskHeader.className = "task-header";

        const headerContent = document.createElement("div");

        const taskTitle = document.createElement("div");
        taskTitle.className = `task-title ${task.completed ? "task-title-completed" : ""}`;
        taskTitle.textContent = task.title;

        headerContent.appendChild(taskTitle);
        taskHeader.appendChild(headerContent);

        const badgeRow = document.createElement("div");
        badgeRow.className = "badge-row";

        const priorityBadge = document.createElement("span");
        priorityBadge.className = `badge ${task.priority}`;
        priorityBadge.textContent = task.priority;

        const dueDateBadge = document.createElement("span");
        dueDateBadge.className = "badge";
        dueDateBadge.textContent = task.dueDate ? `Due: ${task.dueDate}` : "No due date";

        badgeRow.appendChild(priorityBadge);
        badgeRow.appendChild(dueDateBadge);

        const taskButtons = document.createElement("div");
        taskButtons.className = "task-buttons";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", () => {
            startEdit(task);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "danger";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => {
            deleteTask(task.id);
        });

        taskButtons.appendChild(editButton);
        taskButtons.appendChild(deleteButton);

        taskItem.appendChild(taskHeader);
        taskItem.appendChild(badgeRow);
        taskItem.appendChild(taskButtons);

        return taskItem;
    }

    function renderTasks(tasks) {
        if (!taskList) {
            return;
        }

        taskList.replaceChildren();

        if (!tasks.length) {
            const emptyState = document.createElement("div");
            emptyState.className = "empty";
            emptyState.textContent = "No tasks found.";
            taskList.appendChild(emptyState);
            return;
        }

        tasks.forEach((task) => {
            taskList.appendChild(createTaskCard(task));
        });
    }

    /* =========================================================
       5. Generic API helpers
       Handle JSON responses and authenticated requests
       ========================================================= */

    async function parseJsonResponse(response) {
        const contentType = response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
            return null;
        }

        return response.json();
    }

    async function requestJson(url, options = {}) {
        const response = await fetch(url, options);
        const data = await parseJsonResponse(response);

        if (!response.ok) {
            throw new Error(data?.message || "Request failed");
        }

        return data;
    }

    // Any true 401 here is treated as a session failure, so the user is logged out
    async function requestJsonWithAuth(url, options = {}) {
        const token = getStoredToken();

        const response = await fetch(url, {
            ...options,
            headers: {
                ...(options.headers || {}),
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await parseJsonResponse(response);

        if (response.status === 401) {
            logout(false);
            throw new Error(data?.message || "Your session has expired. Please log in again.");
        }

        if (!response.ok) {
            throw new Error(data?.message || "Request failed");
        }

        return data;
    }

    /* =========================================================
       6. Auth and account API functions
       Connect the frontend to auth-related backend routes
       ========================================================= */

    async function registerUser(payload) {
        return requestJson(`${AUTH_API_URL}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    }

    async function loginUser(payload) {
        return requestJson(`${AUTH_API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    }

    async function loadCurrentUser() {
        return requestJsonWithAuth(`${AUTH_API_URL}/me`);
    }

    async function updateProfile(payload) {
        return requestJsonWithAuth(`${AUTH_API_URL}/profile`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    }

    async function changePassword(payload) {
        return requestJsonWithAuth(`${AUTH_API_URL}/password`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    }

    async function deleteAccount(payload) {
        return requestJsonWithAuth(`${AUTH_API_URL}/account`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    }

    // Shared success flow for register and login
    async function handleAuthSuccess(data, successMessage) {
        saveToken(data.token);
        currentUser = data.user;

        resetAuthForms();
        resetAccountForms();
        resetTaskForm();
        currentPage = 1;

        showTaskAppView();
        await loadTasks();
        showMessage(successMessage);
    }

    // Reset frontend auth state and return to the login screen
    function logout(showNotice = true) {
        clearToken();
        currentUser = null;
        currentPage = 1;
        totalPages = 1;
        editingTaskId = null;

        resetAuthForms();
        resetAccountForms();
        resetTaskForm();

        hideCreatePanel();
        hideFiltersPanel();

        if (taskList) taskList.replaceChildren();
        if (pageInfo) pageInfo.textContent = "";
        if (prevPageButton) prevPageButton.disabled = true;
        if (nextPageButton) nextPageButton.disabled = true;

        showAuthView();

        if (showNotice) {
            showMessage("Logged out successfully");
        }
    }

    // Restore the user's session on refresh if a valid token exists
    async function restoreSession() {
        const token = getStoredToken();

        if (!token) {
            showAuthView();
            return;
        }

        try {
            const data = await loadCurrentUser();
            currentUser = data.user;

            showTaskAppView();
            await loadTasks();
        } catch (error) {
            clearToken();
            showAuthView();
            showMessage(error.message, "error");
        }
    }

    /* =========================================================
       7. Task API functions
       Connect the frontend to protected task routes
       ========================================================= */

    async function loadTasks() {
        try {
            const data = await requestJsonWithAuth(
                `${TASKS_API_URL}?${buildQueryString()}`
            );

            totalPages = data.totalPages || 1;

            if (pageInfo) {
                pageInfo.textContent = `Page ${data.page} of ${Math.max(totalPages, 1)} | Total tasks: ${data.total}`;
            }

            if (prevPageButton) {
                prevPageButton.disabled = data.page <= 1;
            }

            if (nextPageButton) {
                nextPageButton.disabled = data.page >= totalPages || totalPages === 0;
            }

            renderTasks(data.tasks || []);
        } catch (error) {
            showMessage(error.message, "error");
        }
    }

    async function createTask(payload) {
        return requestJsonWithAuth(TASKS_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    }

    async function updateTask(id, payload) {
        return requestJsonWithAuth(`${TASKS_API_URL}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    }

    async function deleteTask(id) {
        const confirmed = window.confirm("Delete this task?");

        if (!confirmed) {
            return;
        }

        try {
            await requestJsonWithAuth(`${TASKS_API_URL}/${id}`, {
                method: "DELETE",
            });

            showMessage("Task deleted successfully");

            if (currentPage > 1) {
                currentPage = 1;
            }

            await loadTasks();
        } catch (error) {
            showMessage(error.message, "error");
        }
    }

    /* =========================================================
       8. Edit mode
       Switch the task form from create mode into update mode
       ========================================================= */

    function startEdit(task) {
        editingTaskId = task.id;

        showCreatePanel();

        formTitle.textContent = "Edit Task";
        submitButton.textContent = "Update Task";
        setHidden(cancelEditButton, false);

        titleInput.value = task.title || "";
        priorityInput.value = task.priority || "medium";
        completedInput.value = String(Boolean(task.completed));
        dueDateInput.value = task.dueDate || "";

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    /* =========================================================
       9. Form event handlers
       Handle registration, login, account changes, and task changes
       ========================================================= */

    if (registerForm) {
        registerForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const payload = {
                name: registerNameInput.value,
                email: registerEmailInput.value,
                password: registerPasswordInput.value,
            };

            try {
                const data = await registerUser(payload);
                await handleAuthSuccess(data, "Account created successfully");
            } catch (error) {
                showMessage(error.message, "error");
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const payload = {
                email: loginEmailInput.value,
                password: loginPasswordInput.value,
            };

            try {
                const data = await loginUser(payload);
                await handleAuthSuccess(data, "Login successful");
            } catch (error) {
                showMessage(error.message, "error");
            }
        });
    }

    if (profileForm) {
        profileForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const payload = {
                name: profileNameInput.value,
                email: profileEmailInput.value,
            };

            try {
                const data = await updateProfile(payload);

                // Save the fresh token in case the email changed
                saveToken(data.token);
                currentUser = data.user;
                populateAccountForm();
                showTaskAppView();
                showMessage("Profile updated successfully");
            } catch (error) {
                showMessage(error.message, "error");
            }
        });
    }

    if (passwordForm) {
        passwordForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const payload = {
                currentPassword: currentPasswordInput.value,
                newPassword: newPasswordInput.value,
            };

            try {
                await changePassword(payload);
                passwordForm.reset();
                showMessage("Password updated successfully");
            } catch (error) {
                showMessage(error.message, "error");
            }
        });
    }

    if (deleteAccountForm) {
        deleteAccountForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const confirmed = window.confirm(
                "Delete your account permanently? This will also delete all your tasks."
            );

            if (!confirmed) {
                return;
            }

            const payload = {
                password: deleteAccountPasswordInput.value,
            };

            try {
                await deleteAccount(payload);
                logout(false);
                showMessage("Account deleted successfully");
            } catch (error) {
                showMessage(error.message, "error");
            }
        });
    }

    if (taskForm) {
        taskForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const payload = {
                title: titleInput.value,
                priority: priorityInput.value,
                completed: completedInput.value === "true",
            };

            if (dueDateInput.value) {
                payload.dueDate = dueDateInput.value;
            }

            try {
                if (editingTaskId) {
                    await updateTask(editingTaskId, payload);
                    showMessage("Task updated successfully");
                } else {
                    await createTask(payload);
                    showMessage("Task created successfully");
                }

                resetTaskForm();
                currentPage = 1;
                await loadTasks();
            } catch (error) {
                showMessage(error.message, "error");
            }
        });
    }

    /* =========================================================
       10. Button event handlers
       Handle view switching, logout, panel toggles, and pagination
       ========================================================= */

    if (showRegisterButton) {
        showRegisterButton.addEventListener("click", () => {
            showRegisterView();
        });
    }

    if (showLoginButton) {
        showLoginButton.addEventListener("click", () => {
            showLoginView();
        });
    }

    if (showAccountButton) {
        showAccountButton.addEventListener("click", () => {
            showAccountView();
        });
    }

    if (backToTasksButton) {
        backToTasksButton.addEventListener("click", () => {
            showTaskAppView();
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            logout(true);
        });
    }

    if (cancelEditButton) {
        cancelEditButton.addEventListener("click", () => {
            resetTaskForm();
            hideCreatePanel();
        });
    }

    if (toggleCreateButton) {
        toggleCreateButton.addEventListener("click", () => {
            createPanel.classList.toggle("panel-hidden");
            updatePanelButtonsText();
            updateLayoutState();
        });
    }

    if (toggleFiltersButton) {
        toggleFiltersButton.addEventListener("click", () => {
            filtersPanel.classList.toggle("panel-hidden");
            updatePanelButtonsText();
            updateLayoutState();
        });
    }

    if (applyFiltersButton) {
        applyFiltersButton.addEventListener("click", async () => {
            currentPage = 1;
            await loadTasks();
        });
    }

    if (resetFiltersButton) {
        resetFiltersButton.addEventListener("click", async () => {
            filterCompleted.value = "";
            filterPriority.value = "";
            sortBy.value = "id";
            order.value = "asc";
            limit.value = "10";
            currentPage = 1;

            await loadTasks();
        });
    }

    if (prevPageButton) {
        prevPageButton.addEventListener("click", async () => {
            if (currentPage > 1) {
                currentPage -= 1;
                await loadTasks();
            }
        });
    }

    if (nextPageButton) {
        nextPageButton.addEventListener("click", async () => {
            if (currentPage < totalPages) {
                currentPage += 1;
                await loadTasks();
            }
        });
    }

    /* =========================================================
       11. Initial page setup
       Start hidden panels and restore the session if possible
       ========================================================= */

    hideCreatePanel();
    hideFiltersPanel();
    resetTaskForm();
    showAuthView();
    void restoreSession();
});