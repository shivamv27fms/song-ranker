// Standard chess ELO formula
// K-factor: 24
// Expected score: E_A = 1 / (1 + 10^((R_B - R_A) / 400))
// Rating update: R_A_new = R_A + K * (S_A - E_A)

const K_FACTOR = 24;

/**
 * Calculate expected score for player A against player B
 */
export function expectedScore(ratingA, ratingB) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calculate new ELO ratings after a match
 * @param {number} winnerRating - Current ELO of winner
 * @param {number} loserRating - Current ELO of loser
 * @returns {{ winnerNew: number, loserNew: number }}
 */
export function calculateNewRatings(winnerRating, loserRating) {
  const eWinner = expectedScore(winnerRating, loserRating);
  const eLoser = expectedScore(loserRating, winnerRating);

  const winnerNew = Math.round((winnerRating + K_FACTOR * (1 - eWinner)) * 10) / 10;
  const loserNew = Math.round((loserRating + K_FACTOR * (0 - eLoser)) * 10) / 10;

  return { winnerNew, loserNew };
}
