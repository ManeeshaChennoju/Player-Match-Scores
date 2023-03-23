// tables : match_details, player_details, player_match_score
const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const convertPlayerDetails = (obj) => {
  return {
    playerId: obj.player_id,
    playerName: obj.player_name,
  };
};

const convertMatchDetails = (db_obj) => {
  return {
    matchId: db_obj.match_id,
    match: db_obj.match,
    year: db_obj.year,
  };
};

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server running at http://localhost:3001/");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `SELECT * FROM player_details;`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(playersArray.map(convertPlayerDetails));
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPLayerQuery = `SELECT * FROM player_details 
                        WHERE player_id = ${playerId};`;
  const player = await db.get(getPLayerQuery);
  response.send(convertPlayerDetails(player));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerQuery = `UPDATE player_details
  SET(player_name) = '${playerName}'
  WHERE player_id = ${playerId};`;
  const player = await db.get(updatePlayerQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `SELECT * FROM match_details
                        WHERE match_id = ${matchId};`;
  const match = await db.get(getMatchQuery);
  const newMatch = convertMatchDetails(match);
  response.send(newMatch);
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesOfPlayerQuery = `SELECT match_details.match_id,match_details.match,match_details.year
                                     FROM match_details 
                                    INNER JOIN player_match_score
                                    ON match_details.match_id = player_match_score.match_id
                                WHERE player_id = ${playerId};
                          `;
  const matchesArray = await db.all(getMatchesOfPlayerQuery);
  const newMatchesArray = matchesArray.map(convertMatchDetails);
  response.send(newMatchesArray);
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersOfMatchQuery = `SELECT 
                                    player_details.player_id as playerId,
                                    player_details.player_name as playerName
                                    FROM player_details INNER JOIN player_match_score 
                                    ON
                                    player_details.player_id = player_match_score.player_id
                                    WHERE match_id = ${matchId};`;
  const playersArray = await db.all(getPlayersOfMatchQuery);
  response.send(playersArray);
});
// player_details

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getStatsOfPlayer = `SELECT 
                              player_details.player_id as playerId,
                              player_details.player_name as playerName,
                    SUM(player_match_score.score) as totalScore,
                    SUM(player_match_score.fours) as totalFours,
                    SUM(player_match_score.sixes) as totalSixes
                    FROM player_details INNER JOIN player_match_score
                    ON player_details.player_id = player_match_score.player_id
                    WHERE player_details.player_id = ${playerId};`;
  const statistics = await db.get(getStatsOfPlayer);
  response.send(statistics);
});

module.exports = app;
