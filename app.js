import {
  getPlayers,
  getPlayerWarnings,
  createPlayer,
  createWarning,
  updateWarning,
  deleteWarning
} from "./api.js";

const officer = JSON.parse(localStorage.getItem("officer") || "null");
const token = localStorage.getItem("token");

if (!token || !officer) {
  window.location.href = "index.html";
}

const officerLabel = document.getElementById("officerLabel");
const searchInput = document.getElementById("searchInput");
const playersTableBody = document.getElementById("playersTableBody");
const addWarningButton = document.getElementById("addWarningButton");
const logoutButton = document.getElementById("logoutButton");

const warningModal = document.getElementById("warningModal");
const modalTitle = document.getElementById("modalTitle");
const playerPseudoInput = document.getElementById("playerPseudoInput");
const warningReasonInput = document.getElementById("warningReasonInput");
const saveWarningButton = document.getElementById("saveWarningButton");
const cancelWarningButton = document.getElementById("cancelWarningButton");

let playersData = [];
let modalMode = "create";
let editingWarningId = null;
let editingOriginalDate = null;

officerLabel.textContent = `Connecté : ${officer.pseudo}`;

searchInput.addEventListener("input", renderPlayersTable);
addWarningButton.addEventListener("click", () => openCreateModal());
logoutButton.addEventListener("click", logout);
cancelWarningButton.addEventListener("click", closeModal);
saveWarningButton.addEventListener("click", handleSaveWarning);

warningModal.addEventListener("click", (event) => {
  if (event.target === warningModal) {
    closeModal();
  }
});

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("officer");
  window.location.href = "index.html";
}

function getNowDateTimeString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

async function loadData() {
  try {
    const players = await getPlayers();
    const playersWithWarnings = [];

    for (const player of players) {
      const warnings = await getPlayerWarnings(player.id);

      if (warnings && warnings.length > 0) {
        playersWithWarnings.push({
          id: player.id,
          pseudo: player.pseudo,
          warnings: warnings
        });
      }
    }

    playersData = playersWithWarnings;
    renderPlayersTable();
  } catch (error) {
    alert("Impossible de charger les données.\n\n" + error.message);
  }
}

function renderPlayersTable() {
  const filterText = searchInput.value.trim().toLowerCase();
  playersTableBody.innerHTML = "";

  const visiblePlayers = playersData.filter((player) =>
    player.pseudo.toLowerCase().includes(filterText)
  );

  if (visiblePlayers.length === 0) {
    playersTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state-cell">Aucun joueur avec avertissement trouvé.</td>
      </tr>
    `;
    return;
  }

  for (const player of visiblePlayers) {
    const warnings = player.warnings || [];

    warnings.forEach((warning, index) => {
      const tr = document.createElement("tr");

      let pseudoCell = "";
      if (index === 0) {
        pseudoCell = `
          <td class="col-pseudo" rowspan="${warnings.length}">
            ${escapeHtml(player.pseudo)}
          </td>
        `;
      }

      tr.innerHTML = `
        ${pseudoCell}
        <td class="col-reason">${escapeHtml(warning.reason)}</td>
        <td class="col-date">${escapeHtml(warning.date)}</td>
        <td class="col-officer">${escapeHtml(warning.officer)}</td>
        <td class="col-actions">
          <div class="row-actions">
            <button
              class="small-button"
              data-action="edit"
              data-warning-id="${warning.id}"
              data-player-pseudo="${escapeHtmlAttr(player.pseudo)}"
              data-reason="${escapeHtmlAttr(warning.reason)}"
              data-date="${escapeHtmlAttr(warning.date)}"
            >
              Modifier
            </button>
            <button
              class="small-button danger-button"
              data-action="delete"
              data-warning-id="${warning.id}"
            >
              Supprimer
            </button>
          </div>
        </td>
      `;

      playersTableBody.appendChild(tr);
    });
  }

  bindRowActions();
}

function bindRowActions() {
  document.querySelectorAll("[data-action='edit']").forEach((button) => {
    button.addEventListener("click", () => {
      openEditModal(
        Number(button.dataset.warningId),
        button.dataset.playerPseudo,
        button.dataset.reason,
        button.dataset.date
      );
    });
  });

  document.querySelectorAll("[data-action='delete']").forEach((button) => {
    button.addEventListener("click", async () => {
      const warningId = Number(button.dataset.warningId);
      await handleDeleteWarning(warningId);
    });
  });
}

function openCreateModal(defaultPseudo = "") {
  modalMode = "create";
  editingWarningId = null;
  editingOriginalDate = null;
  modalTitle.textContent = "Ajouter un avertissement";
  playerPseudoInput.value = defaultPseudo;
  playerPseudoInput.readOnly = false;
  warningReasonInput.value = "";
  warningModal.classList.remove("hidden");
}

function openEditModal(warningId, pseudo, reason, date) {
  modalMode = "edit";
  editingWarningId = warningId;
  editingOriginalDate = date;
  modalTitle.textContent = "Modifier un avertissement";
  playerPseudoInput.value = pseudo;
  playerPseudoInput.readOnly = true;
  warningReasonInput.value = reason;
  warningModal.classList.remove("hidden");
}

function closeModal() {
  warningModal.classList.add("hidden");
}

async function handleSaveWarning() {
  const pseudo = playerPseudoInput.value.trim();
  const reason = warningReasonInput.value.trim();

  if (!pseudo) {
    alert("Le pseudo du joueur est requis.");
    return;
  }

  if (!reason) {
    alert("La raison est requise.");
    return;
  }

  try {
    if (modalMode === "create") {
      let player = playersData.find(
        (p) => p.pseudo.toLowerCase() === pseudo.toLowerCase()
      );

      if (!player) {
        player = await createPlayer(pseudo);
      }

      await createWarning(player.id, reason, getNowDateTimeString());
    } else {
      await updateWarning(
        editingWarningId,
        reason,
        editingOriginalDate || getNowDateTimeString()
      );
    }

    closeModal();
    await loadData();
  } catch (error) {
    alert("Impossible d'enregistrer l'avertissement.\n\n" + error.message);
  }
}

async function handleDeleteWarning(warningId) {
  const confirmed = window.confirm("Supprimer cet avertissement ?");
  if (!confirmed) {
    return;
  }

  try {
    await deleteWarning(warningId);
    await loadData();
  } catch (error) {
    alert("Impossible de supprimer l'avertissement.\n\n" + error.message);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeHtmlAttr(value) {
  return escapeHtml(value);
}

loadData();