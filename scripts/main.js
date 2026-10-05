const CARD_VALUES = [
  { id: "apple", symbol: "🍎" },
  { id: "banana", symbol: "🍌" },
  { id: "cherry", symbol: "🍒" },
  { id: "grapes", symbol: "🍇" },
  { id: "lemon", symbol: "🍋" },
  { id: "orange", symbol: "🍊" },
  { id: "strawberry", symbol: "🍓" },
  { id: "watermelon", symbol: "🍉" },
];
const STORAGE_KEY = "memory-game-results";
const MISMATCH_DELAY = 1000;
const state = {
  deck: [],
  firstCard: null,
  secondCard: null,
  moves: 0,
  pairs: 0,
  isLocked: false,
  isGameOver: false,
  mismatchTimer: null,
  resultSaved: false,
};
const elements = {};

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
function createButton(text, className = "button") {
  const button = createElement("button", className, text);
  button.type = "button";
  return button;
}
function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function createDeck() {
  const pairs = CARD_VALUES.flatMap((card) => [{ ...card }, { ...card }]);
  return shuffle(pairs).map((card, index) => ({
    ...card,
    uniqueId: `${card.id}-${index}`,
    isOpen: false,
    isMatched: false,
  }));
}

function createHeader() {
  const header = createElement("header", "header");
  const title = createElement("h1", "logo", "Memory Game");
  const actions = createElement("div", "header__actions");
  const newGameButton = createButton("New Game");
  const leaderboardButton = createButton("Leaderboard");
  newGameButton.addEventListener("click", startNewGame);
  leaderboardButton.addEventListener("click", openLeaderboard);
  actions.append(newGameButton, leaderboardButton);
  header.append(title, actions);
  elements.newGameButton = newGameButton;
  return header;
}
function createStats() {
  const stats = createElement("section", "stats");
  stats.setAttribute("aria-label", "Game statistics");
  const moves = createElement("div", "stat");
  moves.append(
    createElement("span", "stat__label", "Moves"),
    createElement("strong", "stat__value", "0"),
  );
  const pairs = createElement("div", "stat");
  pairs.append(
    createElement("span", "stat__label", "Pairs"),
    createElement("strong", "stat__value", "0 / 8"),
  );
  stats.append(moves, pairs);
  elements.movesValue = moves.lastChild;
  elements.pairsValue = pairs.lastChild;
  return stats;
}
function createModal() {
  const modal = createElement("div", "modal");
  modal.hidden = true;
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  const content = createElement("div", "modal__content");
  const close = createButton("×", "modal__close");
  close.setAttribute("aria-label", "Close");
  const title = createElement("h2", "modal__title");
  const body = createElement("div");
  close.addEventListener("click", closeModal);
  content.append(close, title, body);
  modal.append(content);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
  elements.modal = modal;
  elements.modalTitle = title;
  elements.modalBody = body;
  elements.modalClose = close;
  return modal;
}
function createApp() {
  const app = createElement("div", "app");
  app.append(
    createHeader(),
    createStats(),
    createGameBoard(),
    createElement("p", "hint", "Find all 8 pairs in as few moves as possible."),
    createModal(),
  );
  document.body.append(app);
}

function createGameBoard() {
  const board = createElement("main", "game-board");
  board.setAttribute("aria-label", "Memory game board");
  elements.board = board;
  return board;
}
function renderBoard() {
  elements.board.replaceChildren();
  state.deck.forEach((card) => {
    const button = createElement("button", "card");
    button.type = "button";
    button.dataset.cardId = card.uniqueId;
    button.setAttribute(
      "aria-label",
      card.isOpen || card.isMatched ? `Card: ${card.id}` : "Hidden card",
    );
    if (card.isOpen) button.classList.add("is-open");
    if (card.isMatched) {
      button.classList.add("is-matched");
      button.disabled = true;
    }
    const inner = createElement("span", "card__inner");
    const back = createElement("span", "card__face card__back");
    const front = createElement("span", "card__face card__front");
    const image = createElement("span", "card__image", card.symbol);
    image.setAttribute("aria-hidden", "true");
    front.append(image);
    inner.append(back, front);
    button.append(inner);
    button.addEventListener("click", () => handleCardClick(card.uniqueId));
    elements.board.append(button);
  });
}
function updateStats() {
  elements.movesValue.textContent = String(state.moves);
  elements.pairsValue.textContent = `${state.pairs} / 8`;
}
function getCardById(id) {
  return state.deck.find((card) => card.uniqueId === id);
}
function handleCardClick(id) {
  if (state.isLocked || state.isGameOver) return;
  const card = getCardById(id);
  if (!card || card.isOpen || card.isMatched) return;
  if (state.firstCard && state.firstCard.uniqueId === id) return;
  card.isOpen = true;
  if (!state.firstCard) {
    state.firstCard = card;
    renderBoard();
    return;
  }
  state.secondCard = card;
  state.moves += 1;
  updateStats();
  renderBoard();
  checkPair();
}
function checkPair() {
  const first = state.firstCard;
  const second = state.secondCard;
  if (!first || !second) return;
  if (first.id === second.id) {
    first.isMatched = true;
    second.isMatched = true;
    state.pairs += 1;
    state.firstCard = null;
    state.secondCard = null;
    updateStats();
    renderBoard();
    if (state.pairs === CARD_VALUES.length) finishGame();
    return;
  }
  state.isLocked = true;
  state.mismatchTimer = window.setTimeout(() => {
    first.isOpen = false;
    second.isOpen = false;
    state.firstCard = null;
    state.secondCard = null;
    state.isLocked = false;
    state.mismatchTimer = null;
    renderBoard();
  }, MISMATCH_DELAY);
}
function startNewGame() {
  if (state.mismatchTimer !== null) {
    window.clearTimeout(state.mismatchTimer);
    state.mismatchTimer = null;
  }
  state.deck = createDeck();
  state.firstCard = null;
  state.secondCard = null;
  state.moves = 0;
  state.pairs = 0;
  state.isLocked = false;
  state.isGameOver = false;
  state.resultSaved = false;
  closeModal();
  updateStats();
  renderBoard();
}
function finishGame() {
  state.isGameOver = true;
  if (!state.resultSaved) {
    saveResult(state.moves);
    state.resultSaved = true;
  }
  openVictoryModal();
}
function getResults() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function saveResult(moves) {
  const results = getResults();
  results.push({ moves, date: new Date().toISOString() });
  results.sort(
    (a, b) => a.moves - b.moves || new Date(a.date) - new Date(b.date),
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(results.slice(0, 10)));
}
function formatDate(iso) {
  const date = new Date(iso);
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;
}
function openModal(title, body) {
  elements.modalTitle.textContent = title;
  elements.modalBody.replaceChildren(body);
  elements.modal.hidden = false;
  document.body.style.overflow = "hidden";
  elements.modalClose.focus();
}
function closeModal() {
  if (!elements.modal) return;
  elements.modal.hidden = true;
  document.body.style.overflow = "";
}
function openVictoryModal() {
  const wrapper = createElement("div");
  wrapper.append(
    createElement(
      "p",
      "modal__message",
      `Congratulations! You found all 8 pairs in ${state.moves} moves.`,
    ),
  );
  const actions = createElement("div", "modal__actions");
  const newGame = createButton("New Game");
  const close = createButton("Close");
  newGame.addEventListener("click", startNewGame);
  close.addEventListener("click", closeModal);
  actions.append(newGame, close);
  wrapper.append(actions);
  openModal("You Win!", wrapper);
}
function openLeaderboard() {
  const results = getResults();
  const wrapper = createElement("div");
  if (results.length === 0) {
    wrapper.append(createElement("p", "empty", "No results yet."));
    openModal("Leaderboard", wrapper);
    return;
  }
  const table = createElement("table", "results");
  const caption = createElement("caption", "visually-hidden", "Best results");
  const thead = createElement("thead");
  const row = createElement("tr");
  ["Place", "Moves", "Date"].forEach((text) =>
    row.append(createElement("th", "", text)),
  );
  thead.append(row);
  const tbody = createElement("tbody");
  results.slice(0, 10).forEach((result, index) => {
    const resultRow = createElement("tr");
    resultRow.append(
      createElement("td", "", String(index + 1)),
      createElement("td", "", String(result.moves)),
      createElement("td", "", formatDate(result.date)),
    );
    tbody.append(resultRow);
  });
  table.append(caption, thead, tbody);
  wrapper.append(table);
  openModal("Leaderboard", wrapper);
}
function handleEscape(event) {
  if (event.key === "Escape" && !elements.modal.hidden) closeModal();
}
function init() {
  createApp();
  document.addEventListener("keydown", handleEscape);
  startNewGame();
}
init();
