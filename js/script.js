const app = document.createElement("main");
app.className = "app";

const header = document.createElement("header");
header.className = "header";

const title = document.createElement("h1");
title.textContent = "Memory Game";

const newGameButton = document.createElement("button");
newGameButton.className = "new-game-btn";
newGameButton.textContent = "New Game";

const leaderboardButton = document.createElement("button");
leaderboardButton.className = "leaderboard-btn";
leaderboardButton.textContent = "Leaderboard";

header.append(title, newGameButton, leaderboardButton);

const gameInfo = document.createElement("section");
gameInfo.className = "game-info";

const moves = document.createElement("p");
moves.className = "moves";
moves.textContent = "Moves: 0";

const pairs = document.createElement("p");
pairs.className = "pairs";
pairs.textContent = "Pairs: 0 / 8";

gameInfo.append(moves, pairs);

const gameBoard = document.createElement("section");
gameBoard.className = "game-board";

app.append(header, gameInfo, gameBoard);
document.body.append(app);

const cardData = [
  { id: 1, symbol: "🍎" },
  { id: 2, symbol: "🍋" },
  { id: 3, symbol: "🍓" },
  { id: 4, symbol: "🍉" },
  { id: 5, symbol: "🍇" },
  { id: 6, symbol: "🍊" },
  { id: 7, symbol: "🥝" },
  { id: 8, symbol: "🍒" },
];

const resultsStorageKey = "memoryGameResults";

function shuffle(cardsToShuffle) {
  for (let index = cardsToShuffle.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const temporaryCard = cardsToShuffle[index];
    cardsToShuffle[index] = cardsToShuffle[randomIndex];
    cardsToShuffle[randomIndex] = temporaryCard;
  }
}

function createCard(cardData) {
  const card = document.createElement("button");
  card.className = "card";
  card.dataset.id = cardData.id;

  const cardFront = document.createElement("div");
  cardFront.className = "card-front";
  cardFront.textContent = "?";

  const cardBack = document.createElement("div");
  cardBack.className = "card-back";
  cardBack.textContent = cardData.symbol;

  card.append(cardFront, cardBack);
  card.addEventListener("click", handleCardClick);
  return card;
}

let firstCard = null;
let secondCard = null;
let movesCount = 0;
let matchedPairs = 0;
let lockBoard = false;
let mismatchTimer = null;
let gameFinished = false;
let modalOverlay = null;
let escapeHandler = null;

function closeModal() {
  if (modalOverlay !== null) {
    modalOverlay.remove();
    modalOverlay = null;
  }

  if (escapeHandler !== null) {
    document.removeEventListener("keydown", escapeHandler);
    escapeHandler = null;
  }
}

function openModal(modalTitleText, modalContentText) {
  closeModal();

  modalOverlay = document.createElement("div");
  modalOverlay.className = "modal-overlay";

  const modal = document.createElement("div");
  modal.className = "modal";

  const modalTitle = document.createElement("h2");
  modalTitle.className = "modal-title";
  modalTitle.textContent = modalTitleText;

  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";

  if (typeof modalContentText === "string") {
    modalContent.textContent = modalContentText;
  } else {
    modalContent.append(modalContentText);
  }

  const modalClose = document.createElement("button");
  modalClose.className = "modal-close";
  modalClose.textContent = "Close";

  modal.append(modalTitle, modalContent, modalClose);
  modalOverlay.append(modal);
  document.body.append(modalOverlay);

  modalClose.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", (event) => {
    if (event.target === modalOverlay) {
      closeModal();
    }
  });

  escapeHandler = (event) => {
    if (event.key === "Escape") {
      closeModal();
    }
  };
  document.addEventListener("keydown", escapeHandler);
}

function getResults() {
  const savedResults = localStorage.getItem(resultsStorageKey);

  if (savedResults === null) {
    return [];
  }

  try {
    const results = JSON.parse(savedResults);
    return Array.isArray(results) ? results : [];
  } catch {
    return [];
  }
}

function saveResult(moves) {
  const results = getResults();

  results.push({
    moves: moves,
    date: new Date().toLocaleDateString(),
  });

  results.sort(
    (firstResult, secondResult) => firstResult.moves - secondResult.moves,
  );

  const bestResults = results.slice(0, 10);
  localStorage.setItem(resultsStorageKey, JSON.stringify(bestResults));
}

function showLeaderboard() {
  const results = getResults();
  const leaderboardContent = document.createElement("div");

  if (results.length === 0) {
    const noResults = document.createElement("p");
    noResults.textContent = "No results yet.";
    leaderboardContent.append(noResults);
  } else {
    const resultList = document.createElement("ol");

    results.forEach((result) => {
      const resultItem = document.createElement("li");
      resultItem.textContent = `${result.moves} moves - ${result.date}`;
      resultList.append(resultItem);
    });

    leaderboardContent.append(resultList);
  }

  openModal("Leaderboard", leaderboardContent);
}

function handleCardClick(event) {
  const clickedCard = event.currentTarget;

  if (lockBoard || clickedCard.classList.contains("matched")) {
    return;
  }

  if (clickedCard === firstCard) {
    return;
  }

  clickedCard.classList.add("flipped");

  if (firstCard === null) {
    firstCard = clickedCard;
    return;
  }

  secondCard = clickedCard;
  movesCount += 1;
  moves.textContent = `Moves: ${movesCount}`;

  if (firstCard.dataset.id === secondCard.dataset.id) {
    firstCard.classList.add("matched");
    secondCard.classList.add("matched");
    matchedPairs += 1;
    pairs.textContent = `Pairs: ${matchedPairs} / 8`;
    firstCard = null;
    secondCard = null;

    if (matchedPairs === 8 && !gameFinished) {
      gameFinished = true;
      saveResult(movesCount);
      openModal("You won!", `Moves: ${movesCount}`);
    }

    return;
  }

  lockBoard = true;

  mismatchTimer = setTimeout(() => {
    firstCard.classList.remove("flipped");
    secondCard.classList.remove("flipped");
    firstCard = null;
    secondCard = null;
    lockBoard = false;
    mismatchTimer = null;
  }, 1000);
}

function startNewGame() {
  closeModal();

  if (mismatchTimer !== null) {
    clearTimeout(mismatchTimer);
  }

  mismatchTimer = null;
  firstCard = null;
  secondCard = null;
  movesCount = 0;
  matchedPairs = 0;
  lockBoard = false;
  gameFinished = false;

  moves.textContent = "Moves: 0";
  pairs.textContent = "Pairs: 0 / 8";

  gameBoard.replaceChildren();

  const newCards = cardData.concat(cardData);
  shuffle(newCards);

  newCards.forEach((cardData) => {
    gameBoard.append(createCard(cardData));
  });
}

newGameButton.addEventListener("click", startNewGame);
leaderboardButton.addEventListener("click", showLeaderboard);

const initialCards = cardData.concat(cardData);
shuffle(initialCards);

initialCards.forEach((cardData) => {
  gameBoard.append(createCard(cardData));
});
